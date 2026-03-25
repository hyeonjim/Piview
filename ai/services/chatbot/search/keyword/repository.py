"""Keyword candidate repository.

벡터 검색 전부를 대체하려는 계층이 아니라,
질문에 직접 드러난 단어를 빠르게 잡아내는 prefilter 용도로 사용합니다.
"""

import time
from threading import Lock

import pymysql

from core.settings import get_settings
from services.chatbot.search.keyword.models import KeywordCandidateRow


class ProductKeywordRepository:
    def __init__(self) -> None:
        # 같은 토큰 조합의 반복 질문은 DB를 다시 치지 않도록 짧은 TTL 캐시를 둡니다.
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
        term_clauses: list[str] = []
        params: list[object] = []

        for term in terms:
            like_pattern = f"%{term}%"
            term_clauses.append(
                """
                (
                    p.name LIKE %s
                    OR COALESCE(p.description, '') LIKE %s
                    OR COALESCE(b.brand_name, '') LIKE %s
                    OR COALESCE(c.category_name, '') LIKE %s
                )
                """.strip()
            )
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        # DB에서 1차로 후보를 줄인 뒤, Python 쪽 scorer가 더 세밀한 가중치를 매깁니다.
        sql = f"""
            SELECT
                p.product_id,
                p.name,
                p.description,
                p.top_skin_type,
                p.top2_skin_type,
                b.brand_name,
                c.category_name
            FROM products p
            LEFT JOIN brand b
                ON b.brand_id = p.brand_id
            LEFT JOIN category c
                ON c.category_id = p.category_id
            WHERE p.name IS NOT NULL
              AND (
                {" OR ".join(term_clauses)}
              )
            ORDER BY p.product_id
            LIMIT %s
        """
        params.append(max(10, settings.chatbot_keyword_prefilter_limit))

        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                product_rows = cursor.fetchall()

        return [
            KeywordCandidateRow(
                product_id=int(row["product_id"]),
                name=str(row["name"]),
                brand_name=row["brand_name"],
                category_name=row["category_name"],
                description=row["description"],
                top_skin_type=row["top_skin_type"],
                top2_skin_type=row["top2_skin_type"],
                concern_names=[],
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
        # 캐시 키와 SQL 절 길이가 과하게 커지지 않도록 term 수를 제한합니다.
        return tuple(normalized[:8])

    def _get_db_connection(self):
        settings = get_settings()
        missing = [
            name
            for name, value in (
                ("CHATBOT_DB_USER", settings.chatbot_db_user),
                ("CHATBOT_DB_NAME", settings.chatbot_db_name),
            )
            if not value
        ]
        if missing:
            raise RuntimeError(
                "Missing DB settings for keyword search: "
                + ", ".join(missing)
                + ". Set them in ai/.env or the current shell."
            )

        return pymysql.connect(
            host=settings.chatbot_db_host,
            port=settings.chatbot_db_port,
            user=settings.chatbot_db_user,
            password=settings.chatbot_db_password,
            database=settings.chatbot_db_name,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )


product_keyword_repository = ProductKeywordRepository()
