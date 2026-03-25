"""Evaluate saved chatbot cases with deterministic retrieval/grounding metrics."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas.chatbot import ChatbotCitation
from services.chatbot.eval import EvalCase, aggregate_metrics, evaluate_case
from services.chatbot.search.vector import ProductSearchResult


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate chatbot retrieval/grounding cases.")
    parser.add_argument("dataset", help="Path to a JSON file containing evaluation cases.")
    args = parser.parse_args()

    payload = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    rows = []
    for item in payload:
        case = EvalCase(
            query=item["query"],
            relevant_product_ids=item.get("relevant_product_ids", []),
            expected_keywords=item.get("expected_keywords", []),
        )
        results = [
            ProductSearchResult(
                product_id=entry["product_id"],
                name=entry.get("name", ""),
                brand_name=entry.get("brand_name"),
                category_name=entry.get("category_name"),
                concern_names=entry.get("concern_names", []),
                top_skin_type=entry.get("top_skin_type"),
                top2_skin_type=entry.get("top2_skin_type"),
                document=entry.get("document", ""),
            )
            for entry in item.get("results", [])
        ]
        citations = [ChatbotCitation(**entry) for entry in item.get("citations", [])]
        rows.append(
            evaluate_case(
                case=case,
                results=results,
                answer=item.get("answer", ""),
                citations=citations,
            )
        )

    print(json.dumps(aggregate_metrics(rows), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
