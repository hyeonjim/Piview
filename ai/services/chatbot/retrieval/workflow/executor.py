import asyncio
import logging

from core.settings import Settings
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
    return SearchExecutionResult(
        vector_results=list(vector_results),
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
