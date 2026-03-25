"""Hybrid retrieval ranking.

벡터/키워드 source score를 먼저 결합하고,
도메인 휴리스틱은 product별로 한 번만 약하게 적용합니다.
"""

from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.retrieval.scoring.category import (
    category_priority,
    category_score_bonus,
    existing_category_penalty,
    missing_category_bonus,
)
from services.chatbot.retrieval.scoring.filters import (
    avoid_term_penalty,
    matches_avoid_term,
    strict_filter_penalty,
)
from services.chatbot.retrieval.scoring.heuristics import (
    brightening_bonus,
    care_gap_bonus,
    care_gap_penalty,
    context_mismatch_penalty,
    generic_query_bonus,
    heavy_texture_penalty,
    hydration_gap_adjustment,
    non_skincare_penalty,
    oil_feel_penalty,
    sensitivity_dryness_bonus,
    similar_candidate_adjustment,
    specialized_mismatch_penalty,
    should_demote_existing_categories_for_gap,
)


_VECTOR_SIGNAL_WEIGHT = 0.05
_KEYWORD_SIGNAL_WEIGHT = 0.08
_HEURISTIC_SCALES = {
    "category_bonus": 0.12,
    "generic_bonus": 0.12,
    "missing_category_bonus": 0.12,
    "existing_category_penalty": 0.08,
    "care_gap_bonus": 0.12,
    "care_gap_penalty": 0.10,
    "hydration_gap_adjustment": 0.12,
    "avoid_term_penalty": 0.06,
    "strict_filter_penalty": 0.08,
    "oil_feel_penalty": 0.10,
    "context_mismatch_penalty": 0.10,
    "non_skincare_penalty": 0.12,
    "heavy_texture_penalty": 0.10,
    "specialized_mismatch_penalty": 0.10,
    "brightening_bonus": 0.12,
    "sensitivity_dryness_bonus": 0.12,
    "similar_candidate_adjustment": 0.12,
}


def fuse_results(
    message: str,
    vector_results: list[ProductSearchResult],
    keyword_results: list[ProductSearchResult],
    limit: int,
    preferred_categories: set[str],
    avoid_terms: set[str],
    existing_categories: set[str],
    missing_categories: set[str],
) -> list[ProductSearchResult]:
    """벡터 결과와 키워드 결과를 최종 추천 순서로 합칩니다."""
    if not vector_results and not keyword_results:
        return []

    reciprocal_rank_base = 10
    result_map: dict[int, ProductSearchResult] = {}
    base_scores: dict[int, float] = {}
    score_breakdowns: dict[int, dict[str, float]] = {}

    _accumulate_source_scores(
        source_name="vector",
        results=vector_results,
        base_weight=0.7,
        signal_weight=_VECTOR_SIGNAL_WEIGHT,
        reciprocal_rank_base=reciprocal_rank_base,
        result_map=result_map,
        base_scores=base_scores,
        score_breakdowns=score_breakdowns,
    )
    _accumulate_source_scores(
        source_name="keyword",
        results=keyword_results,
        base_weight=0.3,
        signal_weight=_KEYWORD_SIGNAL_WEIGHT,
        reciprocal_rank_base=reciprocal_rank_base,
        result_map=result_map,
        base_scores=base_scores,
        score_breakdowns=score_breakdowns,
    )

    final_scores: dict[int, float] = {}
    for product_id, result in result_map.items():
        score = base_scores.get(product_id, 0.0)
        breakdown = score_breakdowns.setdefault(product_id, {})

        heuristics = {
            "category_bonus": category_score_bonus(result, preferred_categories),
            "generic_bonus": generic_query_bonus(result, message, preferred_categories),
            "missing_category_bonus": missing_category_bonus(result, missing_categories),
            "existing_category_penalty": -existing_category_penalty(result, existing_categories),
            "care_gap_bonus": care_gap_bonus(result, message, existing_categories, missing_categories),
            "care_gap_penalty": -care_gap_penalty(result, message, existing_categories, missing_categories),
            "hydration_gap_adjustment": hydration_gap_adjustment(
                result,
                message,
                existing_categories,
                missing_categories,
            ),
            "avoid_term_penalty": -avoid_term_penalty(result, avoid_terms),
            "strict_filter_penalty": -strict_filter_penalty(result, message, avoid_terms),
            "oil_feel_penalty": -oil_feel_penalty(result, message),
            "context_mismatch_penalty": -context_mismatch_penalty(result, message),
            "non_skincare_penalty": -non_skincare_penalty(result, message),
            "heavy_texture_penalty": -heavy_texture_penalty(result, message),
            "specialized_mismatch_penalty": -specialized_mismatch_penalty(
                result,
                message,
                preferred_categories,
            ),
            "brightening_bonus": brightening_bonus(result, message),
            "sensitivity_dryness_bonus": sensitivity_dryness_bonus(
                result,
                message,
                preferred_categories,
            ),
            "similar_candidate_adjustment": similar_candidate_adjustment(
                result,
                message,
                preferred_categories,
            ),
        }

        for key, value in heuristics.items():
            scaled_value = value * _HEURISTIC_SCALES[key]
            if scaled_value:
                breakdown[key] = scaled_value
                score += scaled_value

        result.hybrid_score = score
        result.score_breakdown = breakdown
        final_scores[product_id] = score

    matched_product_ids = [
        product_id
        for product_id in final_scores
        if category_priority(result_map[product_id], preferred_categories) > 0
    ]
    unmatched_product_ids = [
        product_id
        for product_id in final_scores
        if category_priority(result_map[product_id], preferred_categories) == 0
    ]

    matched_product_ids.sort(
        key=lambda product_id: (
            category_priority(result_map[product_id], preferred_categories),
            final_scores[product_id],
        ),
        reverse=True,
    )
    unmatched_product_ids.sort(key=lambda product_id: final_scores[product_id], reverse=True)

    ranked_product_ids = matched_product_ids + unmatched_product_ids
    if should_demote_existing_categories_for_gap(message, existing_categories, missing_categories):
        promoted_product_ids = [
            product_id
            for product_id in ranked_product_ids
            if category_priority(result_map[product_id], existing_categories) == 0
        ]
        demoted_product_ids = [
            product_id
            for product_id in ranked_product_ids
            if category_priority(result_map[product_id], existing_categories) > 0
        ]
        ranked_product_ids = promoted_product_ids + demoted_product_ids

    if avoid_terms:
        safe_product_ids = [
            product_id
            for product_id in ranked_product_ids
            if not matches_avoid_term(result_map[product_id], avoid_terms)
        ]
        unsafe_product_ids = [
            product_id
            for product_id in ranked_product_ids
            if matches_avoid_term(result_map[product_id], avoid_terms)
        ]
        ranked_product_ids = safe_product_ids + unsafe_product_ids

    return [result_map[product_id] for product_id in ranked_product_ids[:limit]]


def _accumulate_source_scores(
    source_name: str,
    results: list[ProductSearchResult],
    base_weight: float,
    signal_weight: float,
    reciprocal_rank_base: int,
    result_map: dict[int, ProductSearchResult],
    base_scores: dict[int, float],
    score_breakdowns: dict[int, dict[str, float]],
) -> None:
    max_raw_score = max((result.raw_score or 0.0 for result in results), default=0.0)

    for rank, result in enumerate(results, start=1):
        existing = result_map.get(result.product_id)
        if existing is None:
            result_map[result.product_id] = result
            existing = result
        else:
            _merge_result(existing, result)

        rank_score = base_weight / (reciprocal_rank_base + rank)
        normalized_signal = 0.0
        if max_raw_score > 0 and result.raw_score is not None:
            normalized_signal = max(0.0, result.raw_score) / max_raw_score
        signal_score = normalized_signal * signal_weight

        total = rank_score + signal_score
        base_scores[result.product_id] = base_scores.get(result.product_id, 0.0) + total

        breakdown = score_breakdowns.setdefault(result.product_id, {})
        breakdown[f"{source_name}_rank"] = breakdown.get(f"{source_name}_rank", 0.0) + rank_score
        breakdown[f"{source_name}_signal"] = (
            breakdown.get(f"{source_name}_signal", 0.0) + signal_score
        )


def _merge_result(existing: ProductSearchResult, incoming: ProductSearchResult) -> None:
    if incoming.description and not existing.description:
        existing.description = incoming.description
    if incoming.ingredient_preview and not existing.ingredient_preview:
        existing.ingredient_preview = incoming.ingredient_preview
    if incoming.distance is not None and existing.distance is None:
        existing.distance = incoming.distance
    if incoming.raw_score is not None and (existing.raw_score is None or incoming.raw_score > existing.raw_score):
        existing.raw_score = incoming.raw_score

    for evidence in incoming.evidence_snippets:
        if evidence not in existing.evidence_snippets:
            existing.evidence_snippets.append(evidence)
    for source_name in incoming.matched_sources:
        if source_name not in existing.matched_sources:
            existing.matched_sources.append(source_name)
