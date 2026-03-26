from dataclasses import dataclass
from typing import Iterable

from services.chatbot.search.query_normalizer import compact_text, normalize_text, NormalizedQuery
from services.chatbot.search.product_data import (
    ProductSearchDataRow,
    build_evidence_snippets,
    build_ingredient_preview,
    build_product_document,
    product_search_data_repository,
)
from services.chatbot.search.vector.models import ProductSearchResult


@dataclass
class ExactCandidate:
    product_id: int
    score: float


class ProductExactSearchService:
    def search(self, query: NormalizedQuery, limit: int) -> list[ProductSearchResult]:
        if not query.spaced:
            return []

        index_rows = product_search_data_repository.fetch_name_index_rows()
        scored: list[ExactCandidate] = []

        for row in index_rows:
            brand = normalize_text(row.brand_name)
            name = normalize_text(row.name)
            full = normalize_text(f"{brand} {name}")
            compact_full = compact_text(full)

            score = 0.0

            # 1) 완전일치 (brand+name 또는 name)
            if query.spaced == full or query.spaced == name or query.compact == compact_full:
                score = 1000.0
            # 2) 포함일치
            elif query.spaced in full or query.spaced in name or query.compact in compact_full:
                score = 700.0
            # 3) 토큰 전부 포함
            elif query.tokens and all(token in full for token in query.tokens):
                score = 500.0

            if score > 0:
                scored.append(ExactCandidate(product_id=row.product_id, score=score))

        scored.sort(key=lambda x: (-x.score, x.product_id))
        top = scored[: max(limit, 1)]
        return self._hydrate(top, source="exact")

    def _hydrate(self, candidates: Iterable[ExactCandidate], source: str) -> list[ProductSearchResult]:
        ranked = list(candidates)
        if not ranked:
            return []

        ids = [c.product_id for c in ranked]
        rows = product_search_data_repository.fetch_products_for_indexing(product_ids=ids)
        by_id = {row.product_id: row for row in rows}
        score_by_id = {c.product_id: c.score for c in ranked}

        results: list[ProductSearchResult] = []
        for product_id in ids:
            row = by_id.get(product_id)
            if row is None:
                continue
            results.append(self._to_result(row, source, score_by_id.get(product_id, 0.0)))
        return results

    @staticmethod
    def _to_result(row: ProductSearchDataRow, source: str, raw_score: float) -> ProductSearchResult:
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


product_exact_search_service = ProductExactSearchService()
