"""Rebuild the chatbot product vector index from MySQL product data."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chatbot.search import product_vector_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Reindex chatbot product vectors.")
    parser.add_argument(
        "--product-id",
        dest="product_ids",
        type=int,
        action="append",
        help="Only reindex the specified product_id. Repeat for multiple products.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the current Chroma collection before indexing.",
    )
    args = parser.parse_args()

    indexed_count = product_vector_service.reindex_from_db(
        product_ids=args.product_ids,
        reset=args.reset,
    )
    print(f"Indexed {indexed_count} product documents.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
