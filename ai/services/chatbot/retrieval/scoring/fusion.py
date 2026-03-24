from core.settings import get_settings
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
    if not vector_results and not keyword_results:
        return []

    settings = get_settings()
    k = max(1, settings.chatbot_hybrid_rrf_k)
    fused_scores: dict[int, float] = {}
    result_map: dict[int, ProductSearchResult] = {}

    _accumulate_scores(
        results=vector_results,
        base_weight=settings.chatbot_vector_weight,
        reciprocal_rank_base=k,
        fused_scores=fused_scores,
        result_map=result_map,
        message=message,
        preferred_categories=preferred_categories,
        avoid_terms=avoid_terms,
        existing_categories=existing_categories,
        missing_categories=missing_categories,
    )
    _accumulate_scores(
        results=keyword_results,
        base_weight=settings.chatbot_keyword_weight,
        reciprocal_rank_base=k,
        fused_scores=fused_scores,
        result_map=result_map,
        message=message,
        preferred_categories=preferred_categories,
        avoid_terms=avoid_terms,
        existing_categories=existing_categories,
        missing_categories=missing_categories,
    )

    matched_product_ids = [
        product_id
        for product_id in fused_scores
        if category_priority(result_map[product_id], preferred_categories) > 0
    ]
    unmatched_product_ids = [
        product_id
        for product_id in fused_scores
        if category_priority(result_map[product_id], preferred_categories) == 0
    ]

    matched_product_ids.sort(
        key=lambda product_id: (
            category_priority(result_map[product_id], preferred_categories),
            fused_scores[product_id],
        ),
        reverse=True,
    )
    unmatched_product_ids.sort(key=lambda product_id: fused_scores[product_id], reverse=True)

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


def _accumulate_scores(
    results: list[ProductSearchResult],
    base_weight: float,
    reciprocal_rank_base: int,
    fused_scores: dict[int, float],
    result_map: dict[int, ProductSearchResult],
    message: str,
    preferred_categories: set[str],
    avoid_terms: set[str],
    existing_categories: set[str],
    missing_categories: set[str],
) -> None:
    # 실제 랭킹 조정은 여기서만 모아 계산해, 규칙 파일들은 개별 점수 함수만 가지게 둡니다.
    for rank, result in enumerate(results, start=1):
        score = base_weight / (reciprocal_rank_base + rank)
        score += category_score_bonus(result, preferred_categories)
        score += generic_query_bonus(result, message, preferred_categories)
        score += missing_category_bonus(result, missing_categories)
        score -= existing_category_penalty(result, existing_categories)
        score += care_gap_bonus(result, message, existing_categories, missing_categories)
        score -= care_gap_penalty(result, message, existing_categories, missing_categories)
        score += hydration_gap_adjustment(result, message, existing_categories, missing_categories)
        score -= avoid_term_penalty(result, avoid_terms)
        score -= strict_filter_penalty(result, message, avoid_terms)
        score -= oil_feel_penalty(result, message)
        score -= context_mismatch_penalty(result, message)
        score -= non_skincare_penalty(result, message)
        score -= heavy_texture_penalty(result, message)
        score -= specialized_mismatch_penalty(result, message, preferred_categories)
        score += brightening_bonus(result, message)
        score += sensitivity_dryness_bonus(result, message, preferred_categories)
        score += similar_candidate_adjustment(result, message, preferred_categories)

        fused_scores[result.product_id] = fused_scores.get(result.product_id, 0.0) + score
        result_map.setdefault(result.product_id, result)
