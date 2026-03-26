import time
from threading import Lock

from core.settings import get_settings
from services.chatbot.retrieval.constants import CATEGORY_HINTS
from services.chatbot.search.keyword.models import KeywordCandidateRow
from services.chatbot.search.product_data import product_search_data_repository


class ProductKeywordRepository:
    def __init__(self) -> None:
        self._cache: dict[tuple[tuple[str, ...], int], tuple[float, list[KeywordCandidateRow]]] = {}
        self._lock = Lock()

    def get_candidates(
        self,
        terms: list[str],
        candidate_limit: int | None = None,
        preferred_categories: set[str] | None = None,
    ) -> list[KeywordCandidateRow]:
        normalized_terms = self._normalize_terms(terms)
        if not normalized_terms:
            return []
        normalized_limit = self._normalize_candidate_limit(candidate_limit)
        normalized_categories = self._normalize_categories(preferred_categories)
        cache_key = (normalized_terms, normalized_limit, normalized_categories)

        cached_rows = self._get_cached(cache_key)
        if cached_rows is not None:
            return cached_rows

        rows = self._fetch_candidates(normalized_terms, normalized_limit, normalized_categories)
        self._set_cached(cache_key, rows)
        return rows

    def _fetch_candidates(
        self,
        terms: tuple[str, ...],
        candidate_limit: int,
        preferred_categories: tuple[str, ...],
    ) -> list[KeywordCandidateRow]:
        product_rows = product_search_data_repository.search_products_by_terms(
            terms=terms,
            limit=candidate_limit,
            preferred_category_aliases=preferred_categories,
        )

        return [
            KeywordCandidateRow(
                product_id=row.product_id,
                name=row.name,
                brand_name=row.brand_name,
                category_name=row.category_name,
                description=row.description,
                top_skin_type=row.top_skin_type,
                top2_skin_type=row.top2_skin_type,
                concern_names=row.concern_names,
                ingredient_text_ko=row.ingredient_text_ko,
                ingredient_text_en=row.ingredient_text_en,
                keyword_score=0.0,
            )
            for row in product_rows
        ]

    def _get_cached(
        self,
        cache_key: tuple[tuple[str, ...], int, tuple[str, ...]],
    ) -> list[KeywordCandidateRow] | None:
        settings = get_settings()
        ttl_sec = max(10, settings.chatbot_keyword_cache_ttl_sec)
        now = time.time()

        with self._lock:
            self._purge_expired(now)
            cached = self._cache.get(cache_key)
            if cached is None:
                return None
            expires_at, rows = cached
            if expires_at <= now:
                self._cache.pop(cache_key, None)
                return None
            return rows

    def _set_cached(
        self,
        cache_key: tuple[tuple[str, ...], int, tuple[str, ...]],
        rows: list[KeywordCandidateRow],
    ) -> None:
        settings = get_settings()
        ttl_sec = max(10, settings.chatbot_keyword_cache_ttl_sec)
        expires_at = time.time() + ttl_sec
        with self._lock:
            self._purge_expired(time.time())
            self._cache[cache_key] = (expires_at, rows)

    def _purge_expired(self, now: float) -> None:
        expired_keys = [key for key, (expires_at, _) in self._cache.items() if expires_at <= now]
        for key in expired_keys:
            self._cache.pop(key, None)

    def _normalize_terms(self, terms: list[str]) -> tuple[str, ...]:
        normalized: list[str] = []
        seen: set[str] = set()
        for term in terms:
            lowered = term.strip().lower()
            if not lowered or lowered in seen:
                continue
            seen.add(lowered)
            normalized.append(lowered)
        return tuple(normalized[:8])

    def _normalize_candidate_limit(self, candidate_limit: int | None) -> int:
        settings = get_settings()
        fallback_limit = max(10, settings.chatbot_keyword_prefilter_limit)
        if candidate_limit is None:
            return fallback_limit
        return max(10, candidate_limit, fallback_limit)

    def _normalize_categories(self, preferred_categories: set[str] | None) -> tuple[str, ...]:
        if not preferred_categories:
            return ()
        aliases: list[str] = []
        seen: set[str] = set()
        for category_key in preferred_categories:
            for alias in CATEGORY_HINTS.get(category_key, ()):
                lowered = alias.strip().lower()
                if not lowered or lowered in seen:
                    continue
                seen.add(lowered)
                aliases.append(lowered)
        return tuple(aliases)


product_keyword_repository = ProductKeywordRepository()
