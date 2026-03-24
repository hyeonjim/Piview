from __future__ import annotations

import re
from dataclasses import dataclass

import pymysql

from core.settings import get_settings
from services.chatbot.product_vector_service import ProductSearchResult


@dataclass
class KeywordCandidateRow:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    description: str | None
    top_skin_type: str | None
    top2_skin_type: str | None
    concern_names: list[str]
    keyword_score: float


class ProductKeywordService:
    _STOPWORDS = {
        "추천",
        "제품",
        "상품",
        "화장품",
        "피부",
        "사용",
        "좋은",
        "해주세요",
        "해줘",
        "싶어",
        "위한",
        "관련",
        "있는",
        "없는",
        "고민",
        "타입",
        "강한",
    }

    def search(self, query_text: str, limit: int) -> list[ProductSearchResult]:
        terms = self._extract_terms(query_text)
        if not terms:
            return []

        rows = self._fetch_candidates()
        scored_rows = [self._score_row(row, terms) for row in rows]
        filtered_rows = [row for row in scored_rows if row.keyword_score > 0]
        filtered_rows.sort(key=lambda row: (-row.keyword_score, row.product_id))

        return [
            ProductSearchResult(
                product_id=row.product_id,
                name=row.name,
                brand_name=row.brand_name,
                category_name=row.category_name,
                concern_names=row.concern_names,
                top_skin_type=row.top_skin_type,
                top2_skin_type=row.top2_skin_type,
                document=self._build_document_text(row),
                distance=None,
            )
            for row in filtered_rows[:limit]
        ]

    def _extract_terms(self, query_text: str) -> list[str]:
        raw_terms = re.findall(r"[0-9A-Za-z가-힣]+", query_text.lower())
        unique_terms: list[str] = []
        seen: set[str] = set()
        for term in raw_terms:
            normalized = term.strip()
            if len(normalized) < 2 or normalized in self._STOPWORDS or normalized in seen:
                continue
            seen.add(normalized)
            unique_terms.append(normalized)
        return unique_terms[:8]

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

    def _fetch_candidates(self) -> list[KeywordCandidateRow]:
        sql = """
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
            ORDER BY p.product_id
        """

        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql)
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

    def _score_row(self, row: KeywordCandidateRow, terms: list[str]) -> KeywordCandidateRow:
        fields = {
            "name": row.name.lower(),
            "brand": (row.brand_name or "").lower(),
            "category": (row.category_name or "").lower(),
            "description": (row.description or "").lower(),
        }

        score = 0.0
        for term in terms:
            if term in fields["name"]:
                score += 10.0
            if term in fields["category"]:
                score += 8.0
            if term in fields["brand"]:
                score += 6.0
            if term in fields["description"]:
                score += 2.0

        row.keyword_score = score
        return row

    def _build_document_text(self, row: KeywordCandidateRow) -> str:
        parts = [f"상품명: {row.name}"]
        if row.brand_name:
            parts.append(f"브랜드: {row.brand_name}")
        if row.category_name:
            parts.append(f"카테고리: {row.category_name}")
        if row.description:
            parts.append(f"설명: {' '.join(str(row.description).split())}")
        return "\n".join(parts)


product_keyword_service = ProductKeywordService()
