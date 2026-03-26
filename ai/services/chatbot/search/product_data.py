"""Shared product data access for chatbot retrieval/indexing."""

from dataclasses import dataclass
import re
from typing import Iterable, Sequence

import pymysql

from core.settings import get_settings


_ANTI_AGING_IDS = {5, 6}
_PIGMENTATION_ID = 4
_HYDRATION_ID = 9


@dataclass
class ProductSearchDataRow:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    description: str | None
    top_skin_type: str | None
    top2_skin_type: str | None
    concern_names: list[str]
    ingredient_text_ko: str | None
    ingredient_text_en: str | None

@dataclass
class ProductNameIndexRow:
    product_id: int
    name: str
    brand_name: str | None


def normalize_whitespace(text: str | None) -> str:
    if not text:
        return ""
    return " ".join(str(text).split())


def truncate_text(text: str | None, limit: int) -> str | None:
    normalized = normalize_whitespace(text)
    if not normalized:
        return None
    if len(normalized) <= limit:
        return normalized
    return normalized[: max(0, limit - 1)].rstrip() + "..."


def build_ingredient_preview(
    ingredient_text_ko: str | None,
    ingredient_text_en: str | None = None,
    limit: int = 8,
) -> str | None:
    source = ingredient_text_ko or ingredient_text_en
    normalized = normalize_whitespace(source)
    if not normalized:
        return None

    parts = [
        part.strip()
        for part in re.split(r"[,/\n;]+", normalized)
        if part.strip()
    ]
    if not parts:
        return truncate_text(normalized, 120)

    preview = parts[: max(1, limit)]
    suffix = " 등" if len(parts) > len(preview) else ""
    return ", ".join(preview) + suffix


def build_evidence_snippets(row: ProductSearchDataRow) -> list[str]:
    settings = get_settings()
    snippets: list[str] = []

    description = truncate_text(row.description, settings.chatbot_description_max_chars)
    if description:
        snippets.append(f"설명: {description}")

    if row.concern_names:
        snippets.append(
            "관련 고민: "
            + ", ".join(row.concern_names[: max(1, settings.chatbot_concern_limit)])
        )

    ingredient_preview = build_ingredient_preview(
        row.ingredient_text_ko,
        row.ingredient_text_en,
        limit=settings.chatbot_ingredient_limit,
    )
    if ingredient_preview:
        snippets.append(f"전성분 메모: {ingredient_preview}")

    return snippets


def build_product_document(row: ProductSearchDataRow) -> str:
    settings = get_settings()
    parts = [f"상품명: {row.name}"]
    if row.brand_name:
        parts.append(f"브랜드: {row.brand_name}")
    if row.category_name:
        parts.append(f"카테고리: {row.category_name}")

    description = truncate_text(row.description, settings.chatbot_description_max_chars)
    if description:
        parts.append(f"설명: {description}")

    if row.concern_names:
        parts.append(
            "관련 고민: "
            + ", ".join(row.concern_names[: max(1, settings.chatbot_concern_limit)])
        )

    ingredient_preview = build_ingredient_preview(
        row.ingredient_text_ko,
        row.ingredient_text_en,
        limit=settings.chatbot_ingredient_limit,
    )
    if ingredient_preview:
        parts.append(f"전성분 메모: {ingredient_preview}")

    skin_types = [item for item in (row.top_skin_type, row.top2_skin_type) if item]
    if skin_types:
        parts.append(f"피부타입 힌트: {', '.join(skin_types)}")

    return "\n".join(parts)


class ProductSearchDataRepository:
    def fetch_products_for_indexing(
        self,
        product_ids: Sequence[int] | None = None,
    ) -> list[ProductSearchDataRow]:
        rows = self._fetch_products_base(product_ids=product_ids)
        return self._attach_concerns(rows)

    def search_products_by_terms(
        self,
        terms: Sequence[str],
        limit: int,
    ) -> list[ProductSearchDataRow]:
        normalized_terms = [term.strip().lower() for term in terms if term.strip()]
        if not normalized_terms:
            return []
        rows = self._fetch_products_base(search_terms=normalized_terms, limit=limit)
        return self._attach_concerns(rows)

    def _attach_concerns(self, rows: list[ProductSearchDataRow]) -> list[ProductSearchDataRow]:
        if not rows:
            return []

        concerns_by_product_id = self._fetch_concerns_by_product_ids(
            [row.product_id for row in rows]
        )
        return [
            ProductSearchDataRow(
                product_id=row.product_id,
                name=row.name,
                brand_name=row.brand_name,
                category_name=row.category_name,
                description=row.description,
                top_skin_type=row.top_skin_type,
                top2_skin_type=row.top2_skin_type,
                concern_names=concerns_by_product_id.get(row.product_id, []),
                ingredient_text_ko=row.ingredient_text_ko,
                ingredient_text_en=row.ingredient_text_en,
            )
            for row in rows
        ]

    def _fetch_products_base(
        self,
        product_ids: Sequence[int] | None = None,
        search_terms: Sequence[str] | None = None,
        limit: int | None = None,
    ) -> list[ProductSearchDataRow]:
        sql = """
            SELECT
                p.product_id,
                p.name,
                p.description,
                p.top_skin_type,
                p.top2_skin_type,
                b.brand_name,
                c.category_name,
                pi.product_ingredients_ko,
                pi.product_ingredients_en
            FROM products p
            LEFT JOIN brand b
                ON b.brand_id = p.brand_id
            LEFT JOIN category c
                ON c.category_id = p.category_id
            LEFT JOIN product_ingredients pi
                ON pi.product_id = p.product_id
            WHERE p.name IS NOT NULL
        """
        params: list[object] = []

        if product_ids:
            placeholders = ", ".join(["%s"] * len(product_ids))
            sql += f" AND p.product_id IN ({placeholders})"
            params.extend(product_ids)

        if search_terms:
            term_clauses: list[str] = []
            for term in search_terms:
                like_pattern = f"%{term}%"
                term_clauses.append(
                    """
                    (
                        p.name LIKE %s
                        OR COALESCE(p.description, '') LIKE %s
                        OR COALESCE(b.brand_name, '') LIKE %s
                        OR COALESCE(c.category_name, '') LIKE %s
                        OR COALESCE(pi.product_ingredients_ko, '') LIKE %s
                        OR COALESCE(pi.product_ingredients_en, '') LIKE %s
                    )
                    """.strip()
                )
                params.extend(
                    [
                        like_pattern,
                        like_pattern,
                        like_pattern,
                        like_pattern,
                        like_pattern,
                        like_pattern,
                    ]
                )
            sql += " AND (" + " OR ".join(term_clauses) + ")"

        sql += " ORDER BY p.product_id"
        if limit is not None:
            sql += " LIMIT %s"
            params.append(limit)

        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                rows = cursor.fetchall()

        return [
            ProductSearchDataRow(
                product_id=int(row["product_id"]),
                name=str(row["name"]),
                brand_name=row["brand_name"],
                category_name=row["category_name"],
                description=row["description"],
                top_skin_type=row["top_skin_type"],
                top2_skin_type=row["top2_skin_type"],
                concern_names=[],
                ingredient_text_ko=row["product_ingredients_ko"],
                ingredient_text_en=row["product_ingredients_en"],
            )
            for row in rows
        ]

    def _fetch_concerns_by_product_ids(
        self,
        product_ids: Sequence[int],
    ) -> dict[int, list[str]]:
        concerns_by_product_id: dict[int, list[str]] = {}
        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                for chunk in _chunked(product_ids, 500):
                    placeholders = ", ".join(["%s"] * len(chunk))
                    cursor.execute(
                        f"""
                        SELECT
                            pcc.product_id,
                            pcc.skin_concern_id,
                            sc.concern_name,
                            pcc.total_concern_score
                        FROM product_concern_cache pcc
                        JOIN skin_concerns sc
                            ON sc.skin_concern_id = pcc.skin_concern_id
                        WHERE pcc.product_id IN ({placeholders})
                        ORDER BY pcc.product_id ASC, pcc.total_concern_score DESC, sc.skin_concern_id ASC
                        """,
                        list(chunk),
                    )
                    for row in cursor.fetchall():
                        product_id = int(row["product_id"])
                        concern_name = normalize_concern_name(
                            int(row["skin_concern_id"]),
                            str(row["concern_name"]),
                        )
                        if not concern_name:
                            continue
                        bucket = concerns_by_product_id.setdefault(product_id, [])
                        if concern_name not in bucket:
                            bucket.append(concern_name)
        return concerns_by_product_id

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
                "Missing DB settings for chatbot product data: "
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
    
    def fetch_name_index_rows(self) -> list[ProductNameIndexRow]:
        sql = """
            SELECT p.product_id, p.name, b.brand_name
            FROM products p
            LEFT JOIN brand b ON b.brand_id = p.brand_id
            WHERE p.name IS NOT NULL
            ORDER BY p.product_id
        """
        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql)
                rows = cursor.fetchall()

        return [
            ProductNameIndexRow(
                product_id=int(row["product_id"]),
                name=str(row["name"]),
                brand_name=row["brand_name"],
            )
            for row in rows
        ]



def normalize_concern_name(concern_id: int, concern_name: str) -> str:
    if concern_id in _ANTI_AGING_IDS or concern_name in {"주름/탄력", "노화방지-40대이상", "안티에이징"}:
        return "안티에이징"
    if concern_id == _PIGMENTATION_ID or concern_name in {"기미/주근깨/잡티", "색소침착"}:
        return "색소침착"
    if concern_id == _HYDRATION_ID or concern_name in {"속건조", "수분"}:
        return "수분"
    return concern_name.strip()


def _chunked(values: Sequence[int], size: int) -> Iterable[list[int]]:
    for start in range(0, len(values), size):
        yield list(values[start : start + size])


product_search_data_repository = ProductSearchDataRepository()
