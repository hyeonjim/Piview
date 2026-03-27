from dataclasses import dataclass

from services.chatbot.search.entity.service import product_exact_search_service
from services.chatbot.search.query_normalizer import compact_text, normalize_text, NormalizedQuery
from services.chatbot.search.product_data import product_search_data_repository
from services.chatbot.search.vector.models import ProductSearchResult


@dataclass
class FuzzyCandidate:
    product_id: int
    score: float


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr = [i]
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            curr.append(min(curr[-1] + 1, prev[j] + 1, prev[j - 1] + cost))
        prev = curr
    return prev[-1]


class ProductFuzzySearchService:
    def search(
        self,
        query: NormalizedQuery,
        limit: int,
        exclude_ids: set[int] | None = None,
        category_ids: tuple[int, ...] | None = None,
        big_category_id: int | None = None,
        min_score: float = 0.72,
    ) -> list[ProductSearchResult]:
        if not query.compact:
            return []

        exclude_ids = exclude_ids or set()
        index_rows = product_search_data_repository.fetch_name_index_rows(
            category_ids=category_ids,
            big_category_id=big_category_id,
        )
        candidates: list[FuzzyCandidate] = []

        for row in index_rows:
            if row.product_id in exclude_ids:
                continue

            brand = normalize_text(row.brand_name)
            name = normalize_text(row.name)
            full = normalize_text(f"{brand} {name}")
            compact_full = compact_text(full)

            dist = levenshtein(query.compact, compact_full)
            max_len = max(len(query.compact), len(compact_full), 1)
            sim = 1.0 - (dist / max_len)

            if sim >= min_score:
                # fuzzy는 exact보다 낮은 tier 점수
                candidates.append(FuzzyCandidate(row.product_id, 300.0 + sim * 100.0))

        candidates.sort(key=lambda x: (-x.score, x.product_id))
        top = candidates[: max(limit, 1)]

        # exact service hydrate 재사용
        exact_like = [type("Tmp", (), {"product_id": c.product_id, "score": c.score}) for c in top]
        return product_exact_search_service._hydrate(
            exact_like,
            source="fuzzy",
            category_ids=category_ids,
            big_category_id=big_category_id,
        )


product_fuzzy_search_service = ProductFuzzySearchService()
