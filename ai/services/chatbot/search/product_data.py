"""Shared product data access for chatbot retrieval/indexing."""

from dataclasses import dataclass
import logging
import re
import time
from typing import Iterable, Sequence

import pymysql

from core.settings import get_settings

logger = logging.getLogger("uvicorn.error")


@dataclass
class ProductSearchDataRow:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    category_id: int | None
    big_category_id: int | None
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
    category_id: int | None
    big_category_id: int | None


@dataclass
class ProductCategoryRow:
    category_id: int
    big_category_id: int | None
    category_name: str


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
        category_ids: Sequence[int] | None = None,
        big_category_id: int | None = None,
    ) -> list[ProductSearchDataRow]:
        rows = self._fetch_products_base(
            product_ids=product_ids,
            category_ids=category_ids,
            big_category_id=big_category_id,
        )
        return self._attach_concerns(rows)

    def search_products_by_terms(
        self,
        terms: Sequence[str],
        limit: int,
        preferred_category_aliases: Sequence[str] | None = None,
        category_ids: Sequence[int] | None = None,
        big_category_id: int | None = None,
        include_ingredient_text_in_prefilter: bool = True,
        ingredient_must_terms: Sequence[str] | None = None,
        trace_label: str | None = None,
    ) -> list[ProductSearchDataRow]:
        normalized_terms = [term.strip().lower() for term in terms if term.strip()]
        normalized_ingredient_must_terms = [
            term.strip().lower() for term in (ingredient_must_terms or ()) if term and term.strip()
        ]
        if not normalized_terms and not normalized_ingredient_must_terms:
            return []
        started_at = time.perf_counter()
        base_rows = self._fetch_products_base(
            search_terms=normalized_terms,
            limit=limit,
            preferred_category_aliases=preferred_category_aliases,
            category_ids=category_ids,
            big_category_id=big_category_id,
            include_ingredient_text_in_prefilter=include_ingredient_text_in_prefilter,
            ingredient_must_terms=normalized_ingredient_must_terms,
        )
        base_elapsed_ms = (time.perf_counter() - started_at) * 1000.0

        attach_started_at = time.perf_counter()
        rows = self._attach_concerns(base_rows)
        concern_elapsed_ms = (time.perf_counter() - attach_started_at) * 1000.0

        if trace_label:
            logger.info(
                "Product search data fetch [%s]: base_query_ms=%.1f concern_attach_ms=%.1f row_count=%d",
                trace_label,
                base_elapsed_ms,
                concern_elapsed_ms,
                len(rows),
            )
        return rows

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
                category_id=row.category_id,
                big_category_id=row.big_category_id,
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
        preferred_category_aliases: Sequence[str] | None = None,
        category_ids: Sequence[int] | None = None,
        big_category_id: int | None = None,
        limit: int | None = None,
        include_ingredient_text_in_prefilter: bool = True,
        ingredient_must_terms: Sequence[str] | None = None,
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
                p.category_id,
                c.big_category_id,
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

        if category_ids:
            placeholders = ", ".join(["%s"] * len(category_ids))
            sql += f" AND p.category_id IN ({placeholders})"
            params.extend(category_ids)

        if big_category_id is not None:
            sql += " AND c.big_category_id = %s"
            params.append(big_category_id)

        if search_terms:
            term_clauses: list[str] = []
            for term in search_terms:
                like_pattern = f"%{term}%"
                clause_parts = [
                    "p.name LIKE %s",
                    "COALESCE(p.description, '') LIKE %s",
                    "COALESCE(b.brand_name, '') LIKE %s",
                    "COALESCE(c.category_name, '') LIKE %s",
                ]
                params.extend(
                    [
                        like_pattern,
                        like_pattern,
                        like_pattern,
                        like_pattern,
                    ]
                )
                if include_ingredient_text_in_prefilter:
                    clause_parts.extend(
                        [
                            "COALESCE(pi.product_ingredients_ko, '') LIKE %s",
                            "COALESCE(pi.product_ingredients_en, '') LIKE %s",
                        ]
                    )
                    params.extend([like_pattern, like_pattern])
                term_clauses.append("(\n                        " + "\n                        OR ".join(clause_parts) + "\n                    )")
            sql += " AND (" + " OR ".join(term_clauses) + ")"

        if ingredient_must_terms:
            ingredient_clauses: list[str] = []
            for term in ingredient_must_terms:
                like_pattern = f"%{term}%"
                ingredient_clauses.append(
                    "(\n                        COALESCE(pi.product_ingredients_ko, '') LIKE %s\n"
                    "                        OR COALESCE(pi.product_ingredients_en, '') LIKE %s\n                    )"
                )
                params.extend([like_pattern, like_pattern])
            sql += " AND (" + " OR ".join(ingredient_clauses) + ")"

        if preferred_category_aliases:
            category_clauses: list[str] = []
            for alias in preferred_category_aliases:
                category_clauses.append("COALESCE(c.category_name, '') LIKE %s")
                params.append(f"%{alias}%")
            sql += " AND (" + " OR ".join(category_clauses) + ")"

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
                category_id=int(row["category_id"]) if row["category_id"] is not None else None,
                big_category_id=int(row["big_category_id"]) if row["big_category_id"] is not None else None,
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
                        concern_name = normalize_concern_name(str(row["concern_name"]))
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

    def fetch_name_index_rows(
        self,
        category_ids: Sequence[int] | None = None,
        big_category_id: int | None = None,
    ) -> list[ProductNameIndexRow]:
        sql = """
            SELECT p.product_id, p.name, b.brand_name, p.category_id, c.big_category_id
            FROM products p
            LEFT JOIN brand b ON b.brand_id = p.brand_id
            LEFT JOIN category c ON c.category_id = p.category_id
            WHERE p.name IS NOT NULL
        """
        params: list[object] = []

        if category_ids:
            placeholders = ", ".join(["%s"] * len(category_ids))
            sql += f" AND p.category_id IN ({placeholders})"
            params.extend(category_ids)

        if big_category_id is not None:
            sql += " AND c.big_category_id = %s"
            params.append(big_category_id)

        sql += " ORDER BY p.product_id"

        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                rows = cursor.fetchall()

        return [
            ProductNameIndexRow(
                product_id=int(row["product_id"]),
                name=str(row["name"]),
                brand_name=row["brand_name"],
                category_id=int(row["category_id"]) if row["category_id"] is not None else None,
                big_category_id=int(row["big_category_id"]) if row["big_category_id"] is not None else None,
            )
            for row in rows
        ]

    def fetch_category_rows(self) -> list[ProductCategoryRow]:
        sql = """
            SELECT c.category_id, c.big_category_id, c.category_name
            FROM category c
            WHERE c.category_name IS NOT NULL
            ORDER BY c.big_category_id ASC, c.category_id ASC
        """
        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql)
                rows = cursor.fetchall()

        return [
            ProductCategoryRow(
                category_id=int(row["category_id"]),
                big_category_id=int(row["big_category_id"]) if row["big_category_id"] is not None else None,
                category_name=str(row["category_name"]),
            )
            for row in rows
        ]



def normalize_concern_name(concern_name: str) -> str:
    normalized = concern_name.strip()
    if normalized in {"주름/탄력", "노화방지-40대이상", "안티에이징"}:
        return "안티에이징"
    if normalized in {"기미/주근깨/잡티", "색소침착"}:
        return "색소침착"
    if normalized in {"속건조", "수분"}:
        return "수분"
    return normalized


def _chunked(values: Sequence[int], size: int) -> Iterable[list[int]]:
    for start in range(0, len(values), size):
        yield list(values[start : start + size])


product_search_data_repository = ProductSearchDataRepository()
