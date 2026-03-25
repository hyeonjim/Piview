import asyncio
import logging

from core.settings import get_settings
from services.chatbot.retrieval.scoring.config import HybridScoringConfig
from services.chatbot.retrieval.scoring.fusion import fuse_results
from services.chatbot.search.keyword import product_keyword_service
from services.chatbot.search.vector import ProductSearchResult, product_vector_service

logger = logging.getLogger(__name__)


async def search_products_hybrid(
    query_text: str,
    limit: int,
    exclude_product_ids: set[int] | None = None,
) -> list[ProductSearchResult]:
    normalized_query = " ".join(query_text.split())
    if not normalized_query:
        return []

    settings = get_settings()
    exclude_ids = exclude_product_ids or set()
    search_limit = max(1, min(limit, 500))
    keyword_prefilter_limit = max(settings.chatbot_keyword_prefilter_limit, search_limit * 12)

    # vector/keyword 병렬 실행
    vector_task = product_vector_service.query_async(
        query_text=normalized_query,
        limit=search_limit,
        exclude_product_ids=exclude_ids,
    )
    keyword_task = product_keyword_service.search_async(
        query_text=normalized_query,
        limit=search_limit,
        candidate_limit=keyword_prefilter_limit,
    )

    vector_results, keyword_results = await asyncio.gather(
        vector_task,
        keyword_task,
        return_exceptions=True,
    )

    if isinstance(vector_results, Exception):
        logger.warning("Product search vector failed: %s", vector_results)
        vector_results = []
    if isinstance(keyword_results, Exception):
        logger.warning("Product search keyword failed: %s", keyword_results)
        keyword_results = []

    # keyword 결과에서도 exclude ID 제거
    keyword_results = [
        result for result in keyword_results
        if result.product_id not in exclude_ids
    ]

    config = HybridScoringConfig.from_settings(settings)

    # 챗봇 문맥 휴리스틱 없이 순수 검색형 fusion
    fused = fuse_results(
        message=normalized_query,
        vector_results=list(vector_results),
        keyword_results=list(keyword_results),
        limit=search_limit,
        preferred_categories=set(),
        avoid_terms=set(),
        existing_categories=set(),
        missing_categories=set(),
        config=config,
    )

    return fused