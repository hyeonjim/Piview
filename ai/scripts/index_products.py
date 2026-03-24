from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from io import StringIO
from pathlib import Path

import pymysql

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.settings import get_settings
from services.chatbot.product_vector_service import IndexedProductDocument, product_vector_service


@dataclass
class RawProductRow:
    product_id: int
    name: str
    description: str | None
    top_skin_type: str | None
    top2_skin_type: str | None
    brand_name: str | None
    category_name: str | None
    product_ingredients_ko: str | None
    product_ingredients_en: str | None
    concern_scores: list[tuple[str, int]]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Index product documents into Chroma")
    parser.add_argument("--limit", type=int, default=None, help="Only index the first N products")
    parser.add_argument("--reset", action="store_true", help="Delete the existing Chroma collection before indexing")
    parser.add_argument("--dry-run", action="store_true", help="Print sample documents without writing to Chroma")
    return parser.parse_args()


def get_db_connection():
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
            "Missing DB settings for product indexing: "
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


def fetch_rows(limit: int | None) -> list[RawProductRow]:
    product_sql = """
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
        ORDER BY p.product_id
    """
    if limit:
        product_sql += f" LIMIT {int(limit)}"

    concern_sql = """
        SELECT
            pcc.product_id,
            sc.concern_name,
            pcc.total_concern_score
        FROM product_concern_cache pcc
        JOIN skin_concerns sc
            ON sc.skin_concern_id = pcc.skin_concern_id
        ORDER BY pcc.product_id, pcc.total_concern_score DESC, sc.concern_name
    """

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(product_sql)
            product_rows = cursor.fetchall()
            cursor.execute(concern_sql)
            concern_rows = cursor.fetchall()

    concern_map: dict[int, list[tuple[str, int]]] = {}
    for row in concern_rows:
        concern_map.setdefault(int(row["product_id"]), []).append(
            (str(row["concern_name"]), int(row["total_concern_score"]))
        )

    return [
        RawProductRow(
            product_id=int(row["product_id"]),
            name=row["name"],
            description=row["description"],
            top_skin_type=row["top_skin_type"],
            top2_skin_type=row["top2_skin_type"],
            brand_name=row["brand_name"],
            category_name=row["category_name"],
            product_ingredients_ko=row["product_ingredients_ko"],
            product_ingredients_en=row["product_ingredients_en"],
            concern_scores=concern_map.get(int(row["product_id"]), []),
        )
        for row in product_rows
    ]


def clean_text(value: str | None) -> str | None:
    if not value:
        return None
    return " ".join(value.split()).strip()


def shorten_text(value: str | None, max_chars: int) -> str | None:
    value = clean_text(value)
    if not value or len(value) <= max_chars:
        return value

    shortened = value[:max_chars].rsplit(" ", 1)[0].rstrip(" ,-")
    if not shortened:
        shortened = value[:max_chars]
    return shortened + "..."


def parse_ingredient_list(raw: str | None) -> list[str]:
    raw = clean_text(raw)
    if not raw:
        return []

    reader = csv.reader(StringIO(raw), delimiter=",", quotechar="'", skipinitialspace=True)
    ingredients = next(reader, [])
    cleaned = []
    for ingredient in ingredients:
        normalized = ingredient.strip().strip("'").strip('"')
        if normalized:
            cleaned.append(normalized)
    return cleaned


def normalize_skin_type(value: str | None) -> str:
    return (value or "").strip().lower()


def resolved_skin_type_hints(top_skin_type: str | None, top2_skin_type: str | None) -> list[str]:
    primary = normalize_skin_type(top_skin_type)
    secondary = normalize_skin_type(top2_skin_type)
    if not primary:
        return [secondary] if secondary else []
    if not secondary:
        return [primary]

    opposite_pairs = {
        ("dry", "oily"),
        ("oily", "dry"),
    }
    if (primary, secondary) in opposite_pairs:
        return [primary]
    return [primary, secondary]


def build_document(row: RawProductRow) -> IndexedProductDocument:
    settings = get_settings()
    description = shorten_text(row.description, settings.chatbot_description_max_chars)
    ingredients = parse_ingredient_list(row.product_ingredients_ko) or parse_ingredient_list(row.product_ingredients_en)
    concern_scores = row.concern_scores
    concern_names = [name for name, _ in concern_scores[: settings.chatbot_concern_limit]]

    parts = [f"상품명: {row.name}"]
    if row.brand_name:
        parts.append(f"브랜드: {row.brand_name}")
    if row.category_name:
        parts.append(f"카테고리: {row.category_name}")
    if description:
        parts.append(f"설명: {description}")

    skin_type_hints = resolved_skin_type_hints(row.top_skin_type, row.top2_skin_type)
    if skin_type_hints:
        parts.append(f"피부타입 힌트: {', '.join(skin_type_hints)}")

    if concern_scores:
        concerns_text = ", ".join(
            f"{name}({score})" if score else name
            for name, score in concern_scores[: settings.chatbot_concern_limit]
        )
        parts.append(f"관련 고민: {concerns_text}")

    if ingredients:
        parts.append(f"성분: {', '.join(ingredients[: settings.chatbot_ingredient_limit])}")

    metadata = {
        "productId": row.product_id,
        "name": row.name,
        "brandName": row.brand_name or "",
        "categoryName": row.category_name or "",
        "topSkinType": row.top_skin_type or "",
        "top2SkinType": skin_type_hints[1] if len(skin_type_hints) > 1 else "",
        "concernNames": ",".join(concern_names),
    }

    return IndexedProductDocument(
        product_id=row.product_id,
        document="\n".join(parts),
        metadata=metadata,
        name=row.name,
    )


def main() -> None:
    args = parse_args()
    rows = fetch_rows(limit=args.limit)
    documents = [build_document(row) for row in rows]

    print(f"Fetched {len(documents)} product rows from MySQL.")
    if documents:
        print("\nSample document:\n")
        print(documents[0].document)
        print("\nSample metadata:\n")
        print(documents[0].metadata)

    if args.dry_run:
        return

    if args.reset:
        product_vector_service.reset_collection()

    indexed_count = product_vector_service.upsert_documents(documents)
    print(f"\nIndexed {indexed_count} products into Chroma.")
    print(f"Collection size: {product_vector_service.count()}")


if __name__ == "__main__":
    main()
