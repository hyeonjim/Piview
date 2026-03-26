import asyncio
import logging

from core.settings import get_settings
from services.chatbot.retrieval.scoring.config import HybridScoringConfig
from services.chatbot.retrieval.scoring.fusion import fuse_results
from services.chatbot.search.keyword import product_keyword_service
from services.chatbot.search.vector import ProductSearchResult, product_vector_service
from services.chatbot.search.query_normalizer import normalize_query
from services.chatbot.search.entity.service import product_exact_search_service
from services.chatbot.search.fuzzy.service import product_fuzzy_search_service


logger = logging.getLogger(__name__)


async def search_products_hybrid(
    query_text: str,
    limit: int,
    exclude_product_ids: set[int] | None = None,
) -> list[ProductSearchResult]:
    query = normalize_query(query_text)
    if not query.spaced:
        return []

    settings = get_settings()
    exclude_ids = exclude_product_ids or set()
    search_limit = max(1, min(limit, 500))
    keyword_prefilter_limit = max(settings.chatbot_keyword_prefilter_limit, search_limit * 12)

    # 0) exact/fuzzy는 MySQL 기반 앵커다.
    # 상품검색 API는 정확한 상품명이 있으면 먼저 보여주는 것이 목적이므로,
    # exact 또는 fuzzy 결과가 나오면 vector/keyword fusion보다 우선 반환한다.
    exact_results = await asyncio.to_thread(
        product_exact_search_service.search,
        query,
        max(search_limit * 2, 40),
    )
    if exact_results:
        return exact_results[:search_limit]

    exact_ids = {r.product_id for r in exact_results}
    fuzzy_results = await asyncio.to_thread(
        product_fuzzy_search_service.search,
        query,
        max(search_limit * 2, 40),
        exact_ids | exclude_ids,
    )
    if fuzzy_results:
        return fuzzy_results[:search_limit]

    # 1) vector/keyword 병렬 실행 (기존 유지)
    vector_task = product_vector_service.query_async(
        query_text=query.spaced,
        limit=search_limit,
        exclude_product_ids=exclude_ids,
    )
    keyword_task = product_keyword_service.search_async(
        query_text=query.spaced,
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

    # 2) keyword source 앞쪽에 exact/fuzzy를 주입해 우선순위 보장
    merged_keyword = _merge_keyword_tier(
        seed_results=[*exact_results, *fuzzy_results],
        keyword_results=list(keyword_results),
        exclude_ids=exclude_ids,
    )

    config = HybridScoringConfig.from_settings(settings)
    fused = fuse_results(
        message=query.spaced,
        vector_results=list(vector_results),
        keyword_results=merged_keyword,
        limit=search_limit,
        preferred_categories=set(),
        avoid_terms=set(),
        existing_categories=set(),
        missing_categories=set(),
        config=config,
    )
    return fused

def _merge_keyword_tier(
    seed_results: list[ProductSearchResult],
    keyword_results: list[ProductSearchResult],
    exclude_ids: set[int],
) -> list[ProductSearchResult]:
    merged: list[ProductSearchResult] = []
    seen: set[int] = set()

    # exact/fuzzy 우선
    for item in seed_results:
        if item.product_id in exclude_ids or item.product_id in seen:
            continue
        seen.add(item.product_id)
        merged.append(item)

    # 일반 keyword 뒤에
    for item in keyword_results:
        if item.product_id in exclude_ids or item.product_id in seen:
            continue
        seen.add(item.product_id)
        merged.append(item)

    return merged
