import asyncio
import logging

from core.settings import Settings
from services.chatbot.retrieval.scoring.category import category_priority
from services.chatbot.retrieval.scoring.filters import matches_avoid_term
from services.chatbot.search.keyword import product_keyword_service
from services.chatbot.search.vector import product_vector_service
from services.chatbot.retrieval.workflow.models import RetrievalPlan, SearchExecutionResult


logger = logging.getLogger(__name__)


async def execute_retrieval_searches(
    plan: RetrievalPlan,
    settings: Settings,
) -> SearchExecutionResult:
    search_limit = _resolve_search_limit(plan, settings)
    keyword_prefilter_limit = _resolve_keyword_prefilter_limit(search_limit, settings)
    vector_task = product_vector_service.query_async(
        query_text=plan.search_query,
        limit=search_limit,
        exclude_product_ids=plan.excluded_product_ids,
    )
    keyword_task = product_keyword_service.search_async(
        query_text=plan.search_query,
        limit=search_limit,
        candidate_limit=keyword_prefilter_limit,
    )
    vector_results, keyword_results = await asyncio.gather(
        vector_task,
        keyword_task,
        return_exceptions=True,
    )

    had_search_error = False
    if isinstance(vector_results, Exception):
        had_search_error = True
        logger.warning("Vector search failed: %s", vector_results)
        vector_results = []
    if isinstance(keyword_results, Exception):
        had_search_error = True
        logger.warning("Keyword search failed: %s", keyword_results)
        keyword_results = []

    filtered_keyword_results = [
        result
        for result in keyword_results
        if result.product_id not in plan.excluded_product_ids
    ]
    filtered_vector_results = _apply_retrieval_constraints(vector_results, plan)
    filtered_keyword_results = _apply_retrieval_constraints(filtered_keyword_results, plan)
    return SearchExecutionResult(
        vector_results=filtered_vector_results,
        keyword_results=filtered_keyword_results,
        had_search_error=had_search_error,
    )


def _resolve_search_limit(plan: RetrievalPlan, settings: Settings) -> int:
    base_limit = max(
        settings.chatbot_top_k,
        settings.chatbot_candidate_pool,
        settings.chatbot_keyword_top_k,
    )
    multiplier = 1
    if plan.preferred_categories or plan.missing_categories:
        multiplier += 2
    if plan.avoid_terms:
        multiplier += 1
    if plan.used_session_memory or plan.used_anchor_products:
        multiplier += 1
    return min(base_limit * multiplier, 80)


def _resolve_keyword_prefilter_limit(search_limit: int, settings: Settings) -> int:
    return max(settings.chatbot_keyword_prefilter_limit, search_limit * 12)


def _apply_retrieval_constraints(
    results,
    plan: RetrievalPlan,
):
    if not results:
        return []

    filtered_results = list(results)
    required_categories = plan.preferred_categories or plan.missing_categories
    if required_categories:
        category_matched = [
            result for result in filtered_results if category_priority(result, required_categories) > 0
        ]
        filtered_results = category_matched

    if plan.avoid_terms:
        filtered_results = [
            result
            for result in filtered_results
            if not matches_avoid_term(result, plan.avoid_terms)
        ]

    return filtered_results
