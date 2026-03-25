from dataclasses import dataclass, field
import math
import re
from typing import Iterable

from schemas.chatbot import ChatbotCitation
from services.chatbot.search.vector import ProductSearchResult


@dataclass
class EvalCase:
    query: str
    relevant_product_ids: list[int]
    expected_keywords: list[str] = field(default_factory=list)


def evaluate_retrieval_results(
    results: list[ProductSearchResult],
    relevant_product_ids: list[int],
) -> dict[str, float]:
    retrieved_ids = [result.product_id for result in results]
    relevant_set = set(relevant_product_ids)
    retrieved_relevant = [product_id for product_id in retrieved_ids if product_id in relevant_set]

    precision = len(retrieved_relevant) / len(retrieved_ids) if retrieved_ids else 0.0
    recall = len(retrieved_relevant) / len(relevant_set) if relevant_set else 0.0
    hit_rate = 1.0 if retrieved_relevant else 0.0

    reciprocal_rank = 0.0
    dcg = 0.0
    for rank, product_id in enumerate(retrieved_ids, start=1):
        if product_id in relevant_set:
            if reciprocal_rank == 0.0:
                reciprocal_rank = 1.0 / rank
            dcg += 1.0 / math.log2(rank + 1)

    ideal_hits = min(len(relevant_set), len(retrieved_ids))
    ideal_dcg = sum(1.0 / math.log2(rank + 1) for rank in range(1, ideal_hits + 1))
    ndcg = dcg / ideal_dcg if ideal_dcg else 0.0

    return {
        "retrieval_precision": precision,
        "retrieval_recall": recall,
        "retrieval_hit_rate": hit_rate,
        "retrieval_mrr": reciprocal_rank,
        "retrieval_ndcg": ndcg,
    }


def evaluate_answer_grounding(
    answer: str,
    citations: list[ChatbotCitation],
    expected_keywords: list[str] | None = None,
) -> dict[str, float]:
    normalized_answer = _normalize(answer)
    snippets = [_normalize(citation.snippet or citation.text or "") for citation in citations]
    coverage_hits = 0
    for sentence in _split_sentences(normalized_answer):
        if not sentence:
            continue
        if any(_overlap_ratio(sentence, snippet) >= 0.4 for snippet in snippets if snippet):
            coverage_hits += 1

    answer_sentences = [sentence for sentence in _split_sentences(normalized_answer) if sentence]
    citation_coverage = (
        coverage_hits / len(answer_sentences) if answer_sentences else 0.0
    )

    expected_keywords = expected_keywords or []
    keyword_hits = sum(1 for keyword in expected_keywords if _normalize(keyword) in normalized_answer)
    keyword_recall = keyword_hits / len(expected_keywords) if expected_keywords else 1.0

    return {
        "citation_coverage": citation_coverage,
        "keyword_recall": keyword_recall,
        "citation_count": float(len(citations)),
    }


def evaluate_case(
    case: EvalCase,
    results: list[ProductSearchResult],
    answer: str,
    citations: list[ChatbotCitation],
) -> dict[str, float]:
    metrics = evaluate_retrieval_results(results, case.relevant_product_ids)
    metrics.update(
        evaluate_answer_grounding(
            answer=answer,
            citations=citations,
            expected_keywords=case.expected_keywords,
        )
    )
    return metrics


def aggregate_metrics(metric_rows: Iterable[dict[str, float]]) -> dict[str, float]:
    rows = list(metric_rows)
    if not rows:
        return {}

    metric_names = sorted({metric_name for row in rows for metric_name in row})
    return {
        metric_name: sum(row.get(metric_name, 0.0) for row in rows) / len(rows)
        for metric_name in metric_names
    }


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _split_sentences(text: str) -> list[str]:
    return [chunk.strip() for chunk in re.split(r"[.!?\n]+", text) if chunk.strip()]


def _overlap_ratio(left: str, right: str) -> float:
    left_tokens = set(left.split())
    right_tokens = set(right.split())
    if not left_tokens or not right_tokens:
        return 0.0
    return len(left_tokens & right_tokens) / len(left_tokens)
