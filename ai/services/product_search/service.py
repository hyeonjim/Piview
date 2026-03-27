"""Product search application service."""

from __future__ import annotations

import asyncio
from collections import deque

from core.settings import get_settings
from services.chatbot.retrieval.scoring.config import HybridScoringConfig
from services.chatbot.retrieval.scoring.fusion import fuse_results
from services.chatbot.search.entity.service import product_exact_search_service
from services.chatbot.search.fuzzy.service import product_fuzzy_search_service
from services.chatbot.search.keyword.service import product_keyword_service
from services.chatbot.search.product_data import (
    ProductSearchDataRow,
    build_evidence_snippets,
    build_ingredient_preview,
    build_product_document,
    product_search_data_repository,
)
from services.chatbot.search.query_normalizer import normalize_query, normalize_text, tokenize_text
from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.search.vector.service import product_vector_service
from services.product_search.models import ProductSearchDictionarySnapshot
from services.product_search.parser import product_search_query_parser
from services.product_search.registry import product_search_dictionary_registry
from services.product_search.scorer import rerank_results


class ProductSearchService:
    def initialize(self) -> dict[str, object]:
        product_search_dictionary_registry.initialize()
        return self.dictionary_status()

    def refresh_dictionaries(self) -> dict[str, object]:
        product_search_dictionary_registry.refresh()
        return self.dictionary_status()

    def dictionary_status(self) -> dict[str, object]:
        return product_search_dictionary_registry.status()

    async def search(
        self,
        query_text: str,
        limit: int,
        exclude_product_ids: set[int] | None = None,
        category_ids: tuple[int, ...] | None = None,
        big_category_id: int | None = None,
    ) -> list[ProductSearchResult]:
        snapshot = product_search_dictionary_registry.get_snapshot()
        parsed_query = product_search_query_parser.parse(query_text, snapshot)
        attribute_group_terms = self._expand_attribute_group_terms(parsed_query, snapshot)

        normalized = normalize_query(query_text)
        base_search_terms = parsed_query.search_terms()
        search_terms = base_search_terms + [
            term for term in attribute_group_terms if term not in base_search_terms
        ][:4]
        search_text = " ".join(search_terms) if search_terms else normalized.spaced
        if not search_text:
            return []

        search_query = normalize_query(search_text)
        search_limit = max(1, min(limit, 500))
        candidate_limit = self._resolve_candidate_limit(search_limit, parsed_query)
        exclude_ids = exclude_product_ids or set()
        settings = get_settings()
        structured_seed_results: list[ProductSearchResult] = []

        exact_results: list[ProductSearchResult] = []
        fuzzy_results: list[ProductSearchResult] = []
        if self._should_run_exact(parsed_query):
            exact_results = await asyncio.to_thread(
                product_exact_search_service.search,
                search_query,
                candidate_limit,
                category_ids,
                big_category_id,
            )
            if exact_results and not parsed_query.is_structured:
                return exact_results[:search_limit]

            exact_ids = {result.product_id for result in exact_results}
            fuzzy_results = await asyncio.to_thread(
                product_fuzzy_search_service.search,
                search_query,
                candidate_limit,
                exact_ids | exclude_ids,
                category_ids,
                big_category_id,
            )
            if fuzzy_results and not parsed_query.is_structured:
                return fuzzy_results[:search_limit]

        if parsed_query.is_structured:
            structured_seed_results = await asyncio.to_thread(
                self._search_structured_seed_results,
                parsed_query,
                snapshot,
                candidate_limit,
                exclude_ids,
                category_ids,
                big_category_id,
            )

        keyword_prefilter_limit = min(
            max(settings.chatbot_keyword_prefilter_limit, candidate_limit * 8),
            1200,
        )
        vector_results: list[ProductSearchResult] = []
        keyword_results: list[ProductSearchResult] = []

        if self._should_run_vector(parsed_query):
            vector_task = product_vector_service.query_async(
                query_text=search_query.spaced,
                limit=candidate_limit,
                exclude_product_ids=exclude_ids,
            )
            keyword_task = product_keyword_service.search_async(
                query_text=search_query.spaced,
                limit=candidate_limit,
                candidate_limit=keyword_prefilter_limit,
                preferred_categories=set(parsed_query.category_terms),
                category_ids=category_ids,
                big_category_id=big_category_id,
            )
            vector_results, keyword_results = await asyncio.gather(
                vector_task,
                keyword_task,
                return_exceptions=True,
            )
        else:
            keyword_results = await product_keyword_service.search_async(
                query_text=search_query.spaced,
                limit=candidate_limit,
                candidate_limit=keyword_prefilter_limit,
                preferred_categories=set(parsed_query.category_terms),
                category_ids=category_ids,
                big_category_id=big_category_id,
            )

        if isinstance(vector_results, Exception):
            vector_results = []
        if isinstance(keyword_results, Exception):
            keyword_results = []

        merged_keyword = self._merge_keyword_tier(
            seed_results=[*structured_seed_results, *exact_results, *fuzzy_results],
            keyword_results=list(keyword_results),
            exclude_ids=exclude_ids,
        )
        config = self._resolve_scoring_config(parsed_query)
        fused = fuse_results(
            message=search_query.spaced,
            vector_results=list(vector_results),
            keyword_results=merged_keyword,
            limit=candidate_limit,
            preferred_categories=set(parsed_query.category_terms),
            avoid_terms=set(),
            existing_categories=set(),
            missing_categories=set(),
            config=config,
        )
        reranked = rerank_results(fused, parsed_query, snapshot.attribute_groups)
        constrained = self._apply_structured_constraints(reranked, parsed_query, snapshot)
        return constrained[:search_limit]

    def _should_run_exact(self, parsed_query) -> bool:
        if len(parsed_query.brand_terms) > 1:
            return False
        if len(parsed_query.category_terms) + len(parsed_query.product_type_terms) > 1:
            return False
        return len(parsed_query.keyword_terms) <= 4

    def _resolve_scoring_config(self, parsed_query) -> HybridScoringConfig:
        settings = get_settings()
        config = HybridScoringConfig.from_settings(settings)
        if not parsed_query.is_structured:
            return config
        if len(parsed_query.brand_terms) > 1:
            return HybridScoringConfig(
                reciprocal_rank_base=config.reciprocal_rank_base,
                vector_weight=0.0,
                keyword_weight=max(config.keyword_weight, 1.0),
                vector_signal_weight=0.0,
                keyword_signal_weight=config.keyword_signal_weight,
            )
        if parsed_query.brand_terms and (
            parsed_query.category_terms
            or parsed_query.product_type_terms
            or parsed_query.line_terms
        ):
            return HybridScoringConfig(
                reciprocal_rank_base=config.reciprocal_rank_base,
                vector_weight=min(config.vector_weight, 0.12),
                keyword_weight=max(config.keyword_weight, 0.88),
                vector_signal_weight=min(config.vector_signal_weight, 0.02),
                keyword_signal_weight=config.keyword_signal_weight,
            )
        return HybridScoringConfig(
            reciprocal_rank_base=config.reciprocal_rank_base,
            vector_weight=min(config.vector_weight, 0.25),
            keyword_weight=max(config.keyword_weight, 0.75),
            vector_signal_weight=min(config.vector_signal_weight, 0.03),
            keyword_signal_weight=config.keyword_signal_weight,
        )

    def _merge_keyword_tier(
        self,
        seed_results: list[ProductSearchResult],
        keyword_results: list[ProductSearchResult],
        exclude_ids: set[int],
    ) -> list[ProductSearchResult]:
        merged: list[ProductSearchResult] = []
        seen: set[int] = set()

        for item in seed_results:
            if item.product_id in exclude_ids or item.product_id in seen:
                continue
            seen.add(item.product_id)
            merged.append(item)

        for item in keyword_results:
            if item.product_id in exclude_ids or item.product_id in seen:
                continue
            seen.add(item.product_id)
            merged.append(item)
        return merged

    def _resolve_candidate_limit(self, search_limit: int, parsed_query) -> int:
        if not parsed_query.is_structured:
            return min(max(search_limit * 3, 30), 180)

        candidate_limit = max(search_limit * 6, 60)
        if parsed_query.brand_terms and (
            parsed_query.category_terms
            or parsed_query.product_type_terms
            or parsed_query.line_terms
            or parsed_query.attribute_terms
        ):
            candidate_limit = max(candidate_limit, 90)
        if len(parsed_query.brand_terms) > 1:
            candidate_limit = max(candidate_limit, 120)
        return min(candidate_limit, 240)

    def _should_run_vector(self, parsed_query) -> bool:
        return False

    def _apply_structured_constraints(
        self,
        results: list[ProductSearchResult],
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> list[ProductSearchResult]:
        if not results or not parsed_query.is_structured:
            return results

        primary_terms = (
            parsed_query.category_terms
            + parsed_query.product_type_terms
            + parsed_query.line_terms
        )
        secondary_terms = (
            parsed_query.attribute_terms
            + tuple(self._expand_attribute_group_terms(parsed_query, snapshot))
            + parsed_query.keyword_terms
        )

        scored: list[tuple[tuple[float, ...], int, ProductSearchResult]] = []
        for index, result in enumerate(results):
            searchable_text = self._searchable_text(result)
            brand_match = 1.0 if self._matches_brand(result, parsed_query.brand_terms) else 0.0
            primary_match_count = float(self._match_term_count(searchable_text, primary_terms))
            secondary_match_count = float(self._match_term_count(searchable_text, secondary_terms))
            lexical_source_count = float(
                sum(source in {"exact", "fuzzy", "keyword", "structured"} for source in result.matched_sources)
            )
            match_key = (
                1.0 if brand_match and primary_match_count > 0 else 0.0,
                brand_match,
                primary_match_count,
                1.0 if brand_match and secondary_match_count > 0 else 0.0,
                secondary_match_count,
                lexical_source_count,
                float(result.hybrid_score or result.raw_score or 0.0),
            )
            scored.append((match_key, index, result))

        scored.sort(key=lambda item: (item[0], -item[1]), reverse=True)
        ordered = [item[2] for item in scored]

        if len(parsed_query.brand_terms) > 1:
            ordered = self._interleave_brand_groups(ordered, parsed_query.brand_terms)

        return ordered

    def _interleave_brand_groups(
        self,
        results: list[ProductSearchResult],
        brand_terms: tuple[str, ...],
    ) -> list[ProductSearchResult]:
        groups: dict[str, deque[ProductSearchResult]] = {
            brand: deque() for brand in brand_terms
        }
        unmatched: list[ProductSearchResult] = []

        for result in results:
            matched_brand = next(
                (brand for brand in brand_terms if self._matches_brand(result, (brand,))),
                None,
            )
            if matched_brand is None:
                unmatched.append(result)
                continue
            groups[matched_brand].append(result)

        if not any(groups.values()):
            return results

        interleaved: list[ProductSearchResult] = []
        while any(groups.values()):
            for brand in brand_terms:
                if groups[brand]:
                    interleaved.append(groups[brand].popleft())

        return interleaved + unmatched

    def _matches_brand(self, result: ProductSearchResult, brand_terms: tuple[str, ...]) -> bool:
        if not brand_terms:
            return False
        brand_text = normalize_text(result.brand_name)
        return any(self._matches_brand_text(brand_text, term) for term in brand_terms)

    def _matches_brand_text(self, brand_text: str, brand_term: str) -> bool:
        if not brand_text or not brand_term:
            return False
        normalized_term = normalize_text(brand_term)
        if not normalized_term:
            return False
        if brand_text == normalized_term:
            return True
        if normalized_term in tokenize_text(brand_text):
            return True
        return brand_text.replace(" ", "") == normalized_term.replace(" ", "")

    def _match_term_count(self, searchable_text: str, terms: tuple[str, ...]) -> int:
        if not searchable_text or not terms:
            return 0
        return sum(1 for term in terms if term and term in searchable_text)

    def _searchable_text(self, result: ProductSearchResult) -> str:
        parts = [
            result.name,
            result.brand_name,
            result.category_name,
            result.description,
            result.ingredient_preview,
            " ".join(result.concern_names),
            " ".join(result.evidence_snippets),
        ]
        return normalize_text(" ".join(part for part in parts if part))

    def _search_structured_seed_results(
        self,
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
        candidate_limit: int,
        exclude_ids: set[int],
        category_ids: tuple[int, ...] | None,
        big_category_id: int | None,
    ) -> list[ProductSearchResult]:
        preferred_category_aliases = tuple(
            dict.fromkeys(parsed_query.category_terms + parsed_query.product_type_terms)
        )
        attribute_group_terms = tuple(self._expand_attribute_group_terms(parsed_query, snapshot))
        rows: list[ProductSearchDataRow] = []

        if parsed_query.brand_terms:
            seen_ids: set[int] = set()
            per_brand_limit = min(max(candidate_limit * 2, 60), 180)
            for brand in parsed_query.brand_terms:
                brand_rows = product_search_data_repository.search_products_by_terms(
                    terms=[brand],
                    limit=per_brand_limit,
                    preferred_category_aliases=preferred_category_aliases or None,
                    category_ids=category_ids,
                    big_category_id=big_category_id,
                )
                for row in brand_rows:
                    if row.product_id in seen_ids:
                        continue
                    seen_ids.add(row.product_id)
                    rows.append(row)
        else:
            focus_terms = tuple(
                dict.fromkeys(
                    parsed_query.attribute_terms
                    + attribute_group_terms
                    + parsed_query.line_terms
                    + parsed_query.keyword_terms
                )
            )
            terms = list(focus_terms or parsed_query.search_terms())
            if not terms:
                return []
            rows = product_search_data_repository.search_products_by_terms(
                terms=terms,
                limit=min(max(candidate_limit * 2, 80), 240),
                preferred_category_aliases=preferred_category_aliases or None,
                category_ids=category_ids,
                big_category_id=big_category_id,
            )

        scored_rows: list[tuple[float, ProductSearchDataRow]] = []
        for row in rows:
            if row.product_id in exclude_ids:
                continue
            score = self._score_structured_seed_row(row, parsed_query, attribute_group_terms)
            if score <= 0:
                continue
            scored_rows.append((score, row))

        scored_rows.sort(key=lambda item: (-item[0], item[1].product_id))
        return [
            self._row_to_search_result(row, score, source="structured")
            for score, row in scored_rows[:candidate_limit]
        ]

    def _score_structured_seed_row(
        self,
        row: ProductSearchDataRow,
        parsed_query,
        attribute_group_terms: tuple[str, ...],
    ) -> float:
        searchable_text = normalize_text(
            " ".join(
                part
                for part in (
                    row.name,
                    row.brand_name,
                    row.category_name,
                    row.description,
                    " ".join(row.concern_names),
                )
                if part
            )
        )
        brand_text = normalize_text(row.brand_name)
        category_text = normalize_text(row.category_name)

        score = 0.0
        brand_match = any(self._matches_brand_text(brand_text, term) for term in parsed_query.brand_terms)
        if parsed_query.brand_terms:
            score += 80.0 if brand_match else -30.0
        if parsed_query.category_terms:
            score += 36.0 * sum(term in category_text or term in searchable_text for term in parsed_query.category_terms)
        if parsed_query.product_type_terms:
            score += 28.0 * sum(term in searchable_text for term in parsed_query.product_type_terms)
        if parsed_query.line_terms:
            score += 20.0 * sum(term in searchable_text for term in parsed_query.line_terms)
        if attribute_group_terms:
            score += 18.0 * sum(term in searchable_text for term in attribute_group_terms)
        if parsed_query.attribute_terms:
            score += 12.0 * sum(term in searchable_text for term in parsed_query.attribute_terms)
        if parsed_query.keyword_terms:
            score += 6.0 * sum(term in searchable_text for term in parsed_query.keyword_terms)

        return score

    def _row_to_search_result(
        self,
        row: ProductSearchDataRow,
        raw_score: float,
        source: str,
    ) -> ProductSearchResult:
        return ProductSearchResult(
            product_id=row.product_id,
            name=row.name,
            brand_name=row.brand_name,
            category_name=row.category_name,
            concern_names=row.concern_names,
            top_skin_type=row.top_skin_type,
            top2_skin_type=row.top2_skin_type,
            document=build_product_document(row),
            description=row.description,
            ingredient_preview=build_ingredient_preview(row.ingredient_text_ko, row.ingredient_text_en),
            evidence_snippets=build_evidence_snippets(row),
            matched_sources=[source],
            raw_score=raw_score,
            distance=None,
        )

    def _expand_attribute_group_terms(
        self,
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> list[str]:
        expanded_terms: list[str] = []
        seen: set[str] = set()

        for group_key in parsed_query.attribute_group_terms:
            for term in snapshot.attribute_groups.get(group_key, ()):
                normalized_term = normalize_text(term)
                if not normalized_term or normalized_term in seen:
                    continue
                seen.add(normalized_term)
                expanded_terms.append(normalized_term)

        return expanded_terms


product_search_service = ProductSearchService()
