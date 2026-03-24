from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

import httpx
import pymysql

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.settings import get_settings
from scripts.index_products import build_document, fetch_rows


@dataclass
class EmbeddingProbeResult:
    product_id: int
    name: str
    char_count: int
    prompt_tokens: int
    embedding_dimensions: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Probe embedding token usage with real product documents"
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Embedding model to use. Defaults to EMBEDDING_MODEL/text-embedding-3-small.",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=10,
        help="Number of product documents to probe",
    )
    parser.add_argument(
        "--offset",
        type=int,
        default=0,
        help="Skip the first N product documents before probing",
    )
    parser.add_argument(
        "--show-docs",
        type=int,
        default=2,
        help="How many sampled documents to print in the summary",
    )
    return parser.parse_args()


def get_db_connection():
    settings = get_settings()
    return pymysql.connect(
        host=settings.chatbot_db_host,
        port=settings.chatbot_db_port,
        user=settings.chatbot_db_user,
        password=settings.chatbot_db_password,
        database=settings.chatbot_db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def fetch_total_product_count() -> int:
    sql = "SELECT COUNT(*) AS cnt FROM products WHERE name IS NOT NULL"
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            row = cursor.fetchone()
    return int(row["cnt"])


def embed_document(document: str, model: str) -> tuple[int, int]:
    settings = get_settings()
    if not settings.gms_key:
        raise RuntimeError("GMS_KEY is not set in ai/.env")

    payload = {
        "model": model,
        "input": document,
    }
    url = f"{settings.embedding_api_base_url}/v1/embeddings"

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            url,
            headers={
                "Authorization": f"Bearer {settings.gms_key}",
                "Content-Type": "application/json; charset=utf-8",
            },
            content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        )
        response.raise_for_status()

    body = response.json()
    return int(body["usage"]["prompt_tokens"]), len(body["data"][0]["embedding"])


def main() -> None:
    args = parse_args()
    settings = get_settings()
    model = args.model or settings.embedding_model

    rows = fetch_rows(limit=None)
    total_products = len(rows)
    sampled_rows = rows[args.offset : args.offset + args.sample_size]
    documents = [build_document(row) for row in sampled_rows]

    if not documents:
        raise RuntimeError("No product documents found for the requested sample range.")

    print(
        f"Probing {len(documents)} documents with model={model!r} "
        f"(offset={args.offset}, total_products={total_products})."
    )

    results: list[EmbeddingProbeResult] = []
    for index, document in enumerate(documents, start=1):
        prompt_tokens, embedding_dimensions = embed_document(document.document, model=model)
        result = EmbeddingProbeResult(
            product_id=document.product_id,
            name=document.name,
            char_count=len(document.document),
            prompt_tokens=prompt_tokens,
            embedding_dimensions=embedding_dimensions,
        )
        results.append(result)
        print(
            f"[{index}/{len(documents)}] product_id={result.product_id} "
            f"chars={result.char_count} prompt_tokens={result.prompt_tokens} "
            f"dims={result.embedding_dimensions}"
        )

    total_sample_tokens = sum(item.prompt_tokens for item in results)
    avg_sample_tokens = total_sample_tokens / len(results)
    avg_sample_chars = sum(item.char_count for item in results) / len(results)
    estimated_total_tokens = round(avg_sample_tokens * total_products)

    print("\nSummary")
    print(f"- model: {model}")
    print(f"- sampled_documents: {len(results)}")
    print(f"- total_products: {total_products}")
    print(f"- avg_chars_per_doc: {avg_sample_chars:.1f}")
    print(f"- avg_prompt_tokens_per_doc: {avg_sample_tokens:.1f}")
    print(f"- min_prompt_tokens: {min(item.prompt_tokens for item in results)}")
    print(f"- max_prompt_tokens: {max(item.prompt_tokens for item in results)}")
    print(f"- estimated_total_tokens_for_full_index: {estimated_total_tokens}")
    print(f"- embedding_dimensions: {results[0].embedding_dimensions}")

    preview_count = min(args.show_docs, len(documents))
    if preview_count > 0:
        print("\nDocument previews")
        for document in documents[:preview_count]:
            print(f"\n[product_id={document.product_id}] {document.name}")
            print(document.document)


if __name__ == "__main__":
    main()
