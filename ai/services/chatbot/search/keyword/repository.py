import time
from threading import Lock

from core.settings import get_settings
from services.chatbot.search.keyword.models import KeywordCandidateRow
from services.chatbot.search.product_data import product_search_data_repository


class ProductKeywordRepository:
    def __init__(self) -> None:
        self._cache: dict[tuple[str, ...], tuple[float, list[KeywordCandidateRow]]] = {}
        self._lock = Lock()

    def get_candidates(self, terms: list[str]) -> list[KeywordCandidateRow]:
        normalized_terms = self._normalize_terms(terms)
        if not normalized_terms:
            return []

        cached_rows = self._get_cached(normalized_terms)
        if cached_rows is not None:
            return cached_rows

        rows = self._fetch_candidates(normalized_terms)
        self._set_cached(normalized_terms, rows)
        return rows

    def _fetch_candidates(self, terms: tuple[str, ...]) -> list[KeywordCandidateRow]:
        settings = get_settings()
        product_rows = product_search_data_repository.search_products_by_terms(
            terms=terms,
            limit=max(10, settings.chatbot_keyword_prefilter_limit),
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

    def _get_cached(self, terms: tuple[str, ...]) -> list[KeywordCandidateRow] | None:
        settings = get_settings()
        ttl_sec = max(10, settings.chatbot_keyword_cache_ttl_sec)
        now = time.time()

        with self._lock:
            self._purge_expired(now)
            cached = self._cache.get(terms)
            if cached is None:
                return None
            expires_at, rows = cached
            if expires_at <= now:
                self._cache.pop(terms, None)
                return None
            return rows

    def _set_cached(self, terms: tuple[str, ...], rows: list[KeywordCandidateRow]) -> None:
        settings = get_settings()
        ttl_sec = max(10, settings.chatbot_keyword_cache_ttl_sec)
        expires_at = time.time() + ttl_sec
        with self._lock:
            self._purge_expired(time.time())
            self._cache[terms] = (expires_at, rows)

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


product_keyword_repository = ProductKeywordRepository()
