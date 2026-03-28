import logging
import asyncio

from fastapi import APIRouter, HTTPException, Query

from schemas.product_search import (
    ProductSearchDictionaryStatusResponse,
    ProductSearchQueryResponse,
    ProductSearchResultItem,
)
from services.product_search import product_search_service
from services.product_search.parser import product_search_query_parser
from services.product_search.planning import build_product_search_execution_plan
from services.product_search.registry import product_search_dictionary_registry

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/search", response_model=ProductSearchQueryResponse)
async def search_products(
    q: str = Query(..., min_length=1, max_length=500),
    candidateLimit: int = Query(200, ge=1, le=500),
    bigCategoryId: int | None = Query(None, ge=1),
    categoryId: list[int] | None = Query(None),
):
    try:
        normalized_category_ids = tuple(categoryId or ())
        normalized_big_category_id = None if normalized_category_ids else bigCategoryId
        snapshot = product_search_dictionary_registry.get_snapshot()
        parsed_query = product_search_query_parser.parse(q, snapshot)
        plan = build_product_search_execution_plan(parsed_query)
        results = await product_search_service.search(
            query_text=q,
            limit=candidateLimit,
            exclude_product_ids=set(),
            category_ids=normalized_category_ids,
            big_category_id=normalized_big_category_id,
        )
        return ProductSearchQueryResponse(
            query=q,
            queryShape=plan.query_shape,
            queryBucket=plan.query_bucket,
            results=[
                ProductSearchResultItem(
                    productId=result.product_id,
                    rawScore=result.raw_score,
                    distance=result.distance,
                    matchedSources=result.matched_sources,
                )
                for result in results
            ],
        )
    except RuntimeError as exc:
        logger.warning("Product search failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="상품 검색 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ) from exc


@router.get("/dictionaries", response_model=ProductSearchDictionaryStatusResponse)
async def get_product_search_dictionaries():
    try:
        return ProductSearchDictionaryStatusResponse.model_validate(
            product_search_service.dictionary_status()
        )
    except RuntimeError as exc:
        logger.warning("Product search dictionaries status failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="상품 검색 사전 상태 조회에 실패했습니다.",
        ) from exc


@router.post("/dictionaries/refresh", response_model=ProductSearchDictionaryStatusResponse)
async def refresh_product_search_dictionaries():
    try:
        status = await asyncio.to_thread(product_search_service.refresh_dictionaries)
        return ProductSearchDictionaryStatusResponse.model_validate(status)
    except RuntimeError as exc:
        logger.warning("Product search dictionary refresh failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="상품 검색 사전 갱신에 실패했습니다.",
        ) from exc
