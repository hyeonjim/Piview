"""상품 검색 애플리케이션 서비스."""

from __future__ import annotations

import asyncio
import logging

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
from services.product_search.filters import product_search_category_resolver
from services.product_search.models import ProductSearchDictionarySnapshot
from services.product_search.negative_rules import has_negative_safe_pattern
from services.product_search.observability import ProductSearchTiming
from services.product_search.parser import product_search_query_parser
from services.product_search.planning import build_product_search_execution_plan
from services.product_search.registry import product_search_dictionary_registry
from services.product_search.scorer import rerank_results


logger = logging.getLogger("uvicorn.error")


class ProductSearchService:
    def initialize(self) -> dict[str, object]:
        product_search_dictionary_registry.initialize()
        product_search_category_resolver.refresh()
        return self.dictionary_status()

    def refresh_dictionaries(self) -> dict[str, object]:
        product_search_dictionary_registry.refresh()
        product_search_category_resolver.refresh()
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
        # 전체 흐름:
        # 1. query를 structured intent로 파싱
        # 2. execution plan과 category scope 결정
        # 3. exact/fuzzy/structured seed/keyword 후보 수집
        # 4. hybrid fuse 후 structured rerank 적용
        # product_search는 "자유어 검색"보다 "문서화된 contract를 따르는 구조화 검색"이 우선이라
        # plan과 parsed_query가 뒤 단계 거의 모든 판단의 기준이 된다.
        timing = ProductSearchTiming()
        with timing.phase("parse"):
            snapshot = product_search_dictionary_registry.get_snapshot()
            parsed_query = product_search_query_parser.parse(query_text, snapshot)
            plan = build_product_search_execution_plan(parsed_query)
            resolved_scope = product_search_category_resolver.resolve(
                parsed_query,
                category_ids,
                big_category_id,
            )
            attribute_group_terms = self._expand_attribute_group_terms(parsed_query, snapshot)
            observability_terms = self._build_observability_terms(parsed_query, snapshot)

        if resolved_scope.force_empty:
            timing.log_summary(
                logger,
                query_text=query_text,
                query_shape=plan.query_shape,
                query_bucket=plan.query_bucket,
                result_count=0,
                category_ids=resolved_scope.category_ids,
                big_category_id=resolved_scope.big_category_id,
                observability_terms=observability_terms,
            )
            return []

        normalized = normalize_query(query_text)
        base_search_terms = parsed_query.search_terms()
        # attribute_group 확장어는 retrieval recall 보조용으로만 search term 뒤에 얹는다.
        # 원 질의의 핵심 entity를 덮어쓰지 않도록 base_search_terms를 앞에 유지한다.
        search_terms = base_search_terms + [
            term for term in attribute_group_terms if term not in base_search_terms
        ][:4]
        search_text = " ".join(search_terms) if search_terms else normalized.spaced
        if not search_text:
            timing.log_summary(
                logger,
                query_text=query_text,
                query_shape=plan.query_shape,
                query_bucket=plan.query_bucket,
                result_count=0,
                category_ids=resolved_scope.category_ids,
                big_category_id=resolved_scope.big_category_id,
                observability_terms=observability_terms,
            )
            return []

        search_query = normalize_query(search_text)
        search_limit = max(1, min(limit, 500))
        candidate_limit = self._resolve_candidate_limit(search_limit, parsed_query)
        exclude_ids = exclude_product_ids or set()
        settings = get_settings()
        structured_seed_results: list[ProductSearchResult] = []
        exact_results: list[ProductSearchResult] = []
        fuzzy_results: list[ProductSearchResult] = []

        effective_category_ids = resolved_scope.category_ids
        effective_big_category_id = resolved_scope.big_category_id

        if plan.run_exact:
            with timing.phase("exact"):
                # exact는 상품명 직접 탐색 경로다.
                # structured가 아닌 순수 자유어 이름 검색이라면 exact 결과를 즉시 반환해
                # 불필요한 hybrid 단계가 relevance를 흐리지 않게 한다.
                exact_results = await asyncio.to_thread(
                    product_exact_search_service.search,
                    search_query,
                    candidate_limit,
                    effective_category_ids,
                    effective_big_category_id,
                )
            if exact_results and not parsed_query.is_structured:
                final_results = exact_results[:search_limit]
                timing.log_summary(
                    logger,
                    query_text=query_text,
                    query_shape=plan.query_shape,
                    query_bucket=plan.query_bucket,
                    result_count=len(final_results),
                    category_ids=effective_category_ids,
                    big_category_id=effective_big_category_id,
                    observability_terms=observability_terms,
                )
                return final_results

        if plan.run_fuzzy:
            with timing.phase("fuzzy"):
                # fuzzy도 exact와 같은 이유로 비구조화 질의에서는 조기 반환 가능하다.
                # 다만 structured query에서는 보조 후보군으로만 남긴다.
                exact_ids = {result.product_id for result in exact_results}
                fuzzy_results = await asyncio.to_thread(
                    product_fuzzy_search_service.search,
                    search_query,
                    candidate_limit,
                    exact_ids | exclude_ids,
                    effective_category_ids,
                    effective_big_category_id,
                )
            if fuzzy_results and not parsed_query.is_structured:
                final_results = fuzzy_results[:search_limit]
                timing.log_summary(
                    logger,
                    query_text=query_text,
                    query_shape=plan.query_shape,
                    query_bucket=plan.query_bucket,
                    result_count=len(final_results),
                    category_ids=effective_category_ids,
                    big_category_id=effective_big_category_id,
                    observability_terms=observability_terms,
                )
                return final_results

        if parsed_query.is_structured:
            with timing.phase("structured_seed"):
                # structured seed는 product_search 전용 retrieval contract 핵심이다.
                # vector에 맡기지 않고, brand/category/ingredient 같은 명시적 조건을 먼저 만족하는
                # lexical candidate pool을 별도로 만든다.
                structured_seed_results = await asyncio.to_thread(
                    self._search_structured_seed_results,
                    parsed_query,
                    plan,
                    snapshot,
                    candidate_limit,
                    exclude_ids,
                    effective_category_ids,
                    effective_big_category_id,
                    resolved_scope.preferred_category_aliases,
                    plan.include_ingredient_text_in_prefilter,
                )

        keyword_prefilter_limit = min(
            max(settings.chatbot_keyword_prefilter_limit, candidate_limit * 8),
            1200,
        )
        vector_results: list[ProductSearchResult] = []
        keyword_results: list[ProductSearchResult] = []

        if self._should_run_vector(parsed_query):
            with timing.phase("vector_keyword"):
                vector_task = product_vector_service.query_async(
                    query_text=search_query.spaced,
                    limit=candidate_limit,
                    exclude_product_ids=exclude_ids,
                )
                keyword_task = product_keyword_service.search_async(
                    query_text=search_query.spaced,
                    limit=candidate_limit,
                    candidate_limit=keyword_prefilter_limit,
                    preferred_categories=set(resolved_scope.preferred_category_aliases),
                    category_ids=effective_category_ids,
                    big_category_id=effective_big_category_id,
                )
                vector_results, keyword_results = await asyncio.gather(
                    vector_task,
                    keyword_task,
                    return_exceptions=True,
                )
        else:
            with timing.phase("keyword"):
                keyword_results = await product_keyword_service.search_async(
                    query_text=search_query.spaced,
                    limit=candidate_limit,
                    candidate_limit=keyword_prefilter_limit,
                    preferred_categories=set(resolved_scope.preferred_category_aliases),
                    category_ids=effective_category_ids,
                    big_category_id=effective_big_category_id,
                )

        if isinstance(vector_results, Exception):
            logger.warning("Product search vector step failed: %s", vector_results)
            vector_results = []
        if isinstance(keyword_results, Exception):
            logger.warning("Product search keyword step failed: %s", keyword_results)
            keyword_results = []

        merged_keyword = self._merge_keyword_tier(
            seed_results=[*structured_seed_results, *exact_results, *fuzzy_results],
            keyword_results=list(keyword_results),
            exclude_ids=exclude_ids,
        )
        config = self._resolve_scoring_config(parsed_query)

        with timing.phase("rerank"):
            # fuse_results는 공용 hybrid fusion을 쓰지만,
            # 그 뒤 rerank/constraint는 product_search 문서 규칙에 맞춘 전용 로직을 다시 적용한다.
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

        final_results = constrained[:search_limit]
        timing.log_summary(
            logger,
            query_text=query_text,
            query_shape=plan.query_shape,
            query_bucket=plan.query_bucket,
            result_count=len(final_results),
            category_ids=effective_category_ids,
            big_category_id=effective_big_category_id,
            observability_terms=observability_terms,
        )
        return final_results

    def _resolve_scoring_config(self, parsed_query) -> HybridScoringConfig:
        # structured query일수록 vector 비중을 낮추고 lexical/keyword 비중을 높인다.
        # 특히 brand + category/ingredient 조합은 사용자가 의도한 entity 제약이 강하므로
        # semantic 근사치보다 literal match를 우선한다.
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
            or parsed_query.ingredient_terms
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
        # structured seed를 keyword tier 앞에 붙여 "먼저 찾아온 정확 후보"를 보전한다.
        # 이후 hybrid fuse에서 source signal은 다시 계산되지만, candidate set 자체는 이 순서 영향을 받는다.
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
        # structured query는 조건을 많이 만족해야 하므로 넉넉한 후보군이 필요하다.
        # ingredient나 long query는 prefilter에서 많이 잘릴 수 있어 candidate_limit을 더 크게 잡는다.
        if not parsed_query.is_structured:
            return min(max(search_limit * 3, 30), 180)

        candidate_limit = max(search_limit * 6, 60)
        if parsed_query.brand_terms and (
            parsed_query.category_terms
            or parsed_query.product_type_terms
            or parsed_query.ingredient_terms
            or parsed_query.attribute_terms
        ):
            candidate_limit = max(candidate_limit, 90)
        if parsed_query.ingredient_terms or parsed_query.token_count >= 4:
            candidate_limit = max(candidate_limit, 120)
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
        # fuse 이후 점수가 높더라도, 구조화된 의도를 충분히 못 맞춘 결과는 뒤로 밀어야 한다.
        # 여기서는 brand/category/strong keyword/negative ingredient를 다시 한 번 명시적으로 본다.
        # long query는 strong keyword 1개 이상을 사실상 must처럼 다루는 게 핵심이다.
        if not results or not parsed_query.is_structured:
            return results

        primary_terms = parsed_query.category_terms + parsed_query.product_type_terms
        strong_terms = self._resolve_strong_keyword_terms(parsed_query, snapshot)
        weak_terms = self._resolve_weak_keyword_terms(parsed_query, snapshot)
        require_strong_match = self._requires_strong_keyword_match(parsed_query, snapshot)

        scored: list[tuple[tuple[float, ...], int, ProductSearchResult]] = []
        for index, result in enumerate(results):
            searchable_text = self._searchable_text(result)
            brand_match = 1.0 if self._matches_brand(result, parsed_query.brand_terms) else 0.0
            primary_match_count = float(self._match_term_count(searchable_text, primary_terms))
            strong_match_count = float(self._match_term_count(searchable_text, strong_terms))
            weak_match_count = float(self._match_term_count(searchable_text, weak_terms))
            lexical_source_count = float(
                sum(source in {"exact", "fuzzy", "keyword", "structured"} for source in result.matched_sources)
            )
            match_key = (
                1.0 if brand_match and primary_match_count > 0 else 0.0,
                brand_match,
                primary_match_count,
                1.0 if strong_match_count > 0 else 0.0 if require_strong_match else 1.0,
                strong_match_count,
                weak_match_count,
                self._negative_ingredient_rank_signal(searchable_text, parsed_query.negative_ingredient_terms),
                lexical_source_count,
                float(result.hybrid_score or result.raw_score or 0.0),
            )
            scored.append((match_key, index, result))

        scored.sort(key=lambda item: (item[0], -item[1]), reverse=True)
        ordered = [item[2] for item in scored]

        if require_strong_match:
            matching = [
                item for item in ordered
                if self._match_term_count(self._searchable_text(item), strong_terms) > 0
            ]
            if matching:
                others = [item for item in ordered if item not in matching]
                ordered = matching + others

        return ordered

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
        plan,
        snapshot: ProductSearchDictionarySnapshot,
        candidate_limit: int,
        exclude_ids: set[int],
        category_ids: tuple[int, ...] | None,
        big_category_id: int | None,
        preferred_category_aliases: tuple[str, ...],
        include_ingredient_text_in_prefilter: bool,
    ) -> list[ProductSearchResult]:
        # structured seed는 DB lexical prefilter 단계다.
        # brand query는 브랜드별로 따로 seed를 모아 multi-brand query도 버틸 수 있게 하고,
        # non-brand structured query는 ingredient/attribute/strong keyword 중심으로 seed를 만든다.
        attribute_group_terms = tuple(self._expand_attribute_group_terms(parsed_query, snapshot))
        strong_keyword_terms = self._resolve_strong_keyword_terms(parsed_query, snapshot)
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
                    include_ingredient_text_in_prefilter=include_ingredient_text_in_prefilter,
                    ingredient_must_terms=parsed_query.ingredient_terms if parsed_query.ingredient_terms else None,
                    trace_label="structured.brand_seed",
                )
                for row in brand_rows:
                    if row.product_id in seen_ids:
                        continue
                    seen_ids.add(row.product_id)
                    rows.append(row)
        else:
            if plan.query_bucket in {"ingredient_only", "ingredient_category", "long_query"}:
                # ingredient_only / ingredient_category / long_query는 strong keyword recall이 가장 중요하다.
                focus_terms = strong_keyword_terms
            else:
                focus_terms = tuple(
                    dict.fromkeys(
                        parsed_query.attribute_terms
                        + attribute_group_terms
                        + strong_keyword_terms
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
                include_ingredient_text_in_prefilter=include_ingredient_text_in_prefilter,
                ingredient_must_terms=parsed_query.ingredient_terms if parsed_query.ingredient_terms else None,
                trace_label="structured.generic_seed",
            )

        scored_rows: list[tuple[float, ProductSearchDataRow]] = []
        for row in rows:
            if row.product_id in exclude_ids:
                continue
            score = self._score_structured_seed_row(
                row,
                parsed_query,
                snapshot,
                attribute_group_terms,
                strong_keyword_terms,
                plan.query_bucket,
            )
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
        snapshot: ProductSearchDictionarySnapshot,
        attribute_group_terms: tuple[str, ...],
        strong_keyword_terms: tuple[str, ...],
        query_bucket: str,
    ) -> float:
        # structured seed score는 "후보를 남길지"를 판단하는 1차 게이트 성격이 강하다.
        # 따라서 ingredient query에서는 ingredient field match를 강하게 보고,
        # long query에서는 strong keyword 부재 시 아예 탈락시킬 수 있다.
        searchable_text = normalize_text(
            " ".join(
                part
                for part in (
                    row.name,
                    row.brand_name,
                    row.category_name,
                    row.description,
                    " ".join(row.concern_names),
                    row.ingredient_text_ko,
                    row.ingredient_text_en,
                )
                if part
            )
        )
        brand_text = normalize_text(row.brand_name)
        category_text = normalize_text(row.category_name)
        ingredient_text = normalize_text(
            " ".join(part for part in (row.ingredient_text_ko, row.ingredient_text_en) if part)
        )
        weak_keyword_terms = self._resolve_weak_keyword_terms(parsed_query, snapshot)
        require_strong_match = self._requires_strong_keyword_match(parsed_query, snapshot)
        strong_match_count = self._match_term_count(searchable_text, strong_keyword_terms)
        ingredient_field_match_count = self._match_term_count(ingredient_text, parsed_query.ingredient_terms)

        score = 0.0
        brand_match = any(self._matches_brand_text(brand_text, term) for term in parsed_query.brand_terms)
        if parsed_query.brand_terms:
            score += 80.0 if brand_match else -30.0
        if parsed_query.category_terms:
            score += 36.0 * sum(term in category_text or term in searchable_text for term in parsed_query.category_terms)
        if parsed_query.product_type_terms:
            score += 28.0 * sum(term in searchable_text for term in parsed_query.product_type_terms)
        if parsed_query.ingredient_terms:
            score += 28.0 * ingredient_field_match_count
            score += 12.0 * sum(term in searchable_text for term in parsed_query.ingredient_terms)
        if attribute_group_terms:
            score += 18.0 * sum(term in searchable_text for term in attribute_group_terms)
        if parsed_query.attribute_terms:
            score += 12.0 * sum(term in searchable_text for term in parsed_query.attribute_terms)
        if strong_keyword_terms:
            score += 14.0 * strong_match_count
        if weak_keyword_terms:
            score += 6.0 * self._match_term_count(searchable_text, weak_keyword_terms)
        score += self._negative_ingredient_score_adjustment(searchable_text, parsed_query.negative_ingredient_terms)
        if require_strong_match and strong_match_count <= 0:
            return 0.0
        if query_bucket in {"ingredient_only", "ingredient_category"} and ingredient_field_match_count <= 0:
            return 0.0

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

    def _resolve_strong_keyword_terms(
        self,
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> tuple[str, ...]:
        # strong keyword는 long query에서 사실상 must에 가까운 신호다.
        # ingredient는 항상 strong으로 승격하고,
        # 나머지 keyword는 weak term으로 빠지지 않은 것만 strong으로 남긴다.
        weak_terms = set(self._resolve_weak_keyword_terms(parsed_query, snapshot))
        strong_terms: list[str] = []
        seen: set[str] = set()

        for term in parsed_query.ingredient_terms:
            normalized_term = normalize_text(term)
            if not normalized_term or normalized_term in seen:
                continue
            seen.add(normalized_term)
            strong_terms.append(normalized_term)
        for term in parsed_query.keyword_terms:
            normalized_term = normalize_text(term)
            if not normalized_term or normalized_term in weak_terms or normalized_term in seen:
                continue
            seen.add(normalized_term)
            strong_terms.append(normalized_term)
        return tuple(strong_terms)

    def _resolve_weak_keyword_terms(
        self,
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> tuple[str, ...]:
        # weak keyword는 attribute/attribute-group 성격의 보조 신호다.
        # ranking 보정에는 쓰되, ingredient처럼 hard gate로 다루지는 않는다.
        weak_terms: list[str] = []
        seen: set[str] = set()
        lookup_terms = parsed_query.attribute_terms + tuple(
            term
            for term in parsed_query.keyword_terms
            if normalize_text(term) in snapshot.attribute_group_lookup
            or normalize_text(term) in snapshot.attribute_lookup
        )

        for term in lookup_terms:
            normalized_term = normalize_text(term)
            if (
                not normalized_term
                or normalized_term in seen
                or normalized_term in parsed_query.ingredient_terms
            ):
                continue
            seen.add(normalized_term)
            weak_terms.append(normalized_term)
        return tuple(weak_terms)

    def _requires_strong_keyword_match(
        self,
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> bool:
        if parsed_query.ingredient_terms:
            return True
        return parsed_query.token_count >= 4 and bool(self._resolve_strong_keyword_terms(parsed_query, snapshot))

    def _build_observability_terms(
        self,
        parsed_query,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> dict[str, tuple[str, ...]]:
        # observability payload는 "왜 이 bucket으로 해석됐는지"를 로그에서 역추적하기 위한 최소 단위다.
        # line은 now structured intent에는 직접 쓰지 않지만, 관찰용으로는 남긴다.
        return {
            "brands": parsed_query.brand_terms,
            "categories": parsed_query.category_terms + parsed_query.product_type_terms,
            "ingredients": parsed_query.ingredient_terms,
            "negativeIngredients": parsed_query.negative_ingredient_terms,
            "strongKeywords": self._resolve_strong_keyword_terms(parsed_query, snapshot),
            "weakKeywords": self._resolve_weak_keyword_terms(parsed_query, snapshot),
            "observedLineTerms": parsed_query.line_terms,
        }

    def _negative_ingredient_rank_signal(
        self,
        searchable_text: str,
        negative_terms: tuple[str, ...],
    ) -> float:
        if not negative_terms or not searchable_text:
            return 0.0
        signal = 0.0
        for term in negative_terms:
            signal += self._negative_ingredient_score_adjustment(searchable_text, (term,))
        return signal

    def _negative_ingredient_score_adjustment(
        self,
        searchable_text: str,
        negative_terms: tuple[str, ...],
    ) -> float:
        # negative ingredient는 polarity가 중요하다.
        # 먼저 "무향료/향료 프리" 같은 safe pattern을 찾아 가산하고,
        # 그런 문맥 없이 term만 등장하면 오히려 회피 대상 포함으로 보고 감점한다.
        if not negative_terms or not searchable_text:
            return 0.0

        adjustment = 0.0
        for term in negative_terms:
            if has_negative_safe_pattern(searchable_text, term):
                adjustment += 18.0
                continue
            if normalize_text(term) in searchable_text:
                adjustment -= 20.0
        return adjustment

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
