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
    vector_task = product_vector_service.query_async(
        query_text=plan.search_query,
        limit=max(settings.chatbot_top_k, settings.chatbot_candidate_pool),
        exclude_product_ids=plan.excluded_product_ids,
    )
    keyword_task = product_keyword_service.search_async(
        query_text=plan.search_query,
        limit=max(settings.chatbot_top_k, settings.chatbot_keyword_top_k),
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
        vector_results=vector_results,
        keyword_results=filtered_keyword_results,
        had_search_error=had_search_error,
    )
