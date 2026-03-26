import logging

from fastapi import APIRouter, HTTPException, Query

from schemas.product_search import (
    ProductSearchQueryResponse,
    ProductSearchResultItem,
)
from services.chatbot.search.product_query_search import search_products_hybrid

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/search", response_model=ProductSearchQueryResponse)
async def search_products(
    q: str = Query(..., min_length=1, max_length=500),
    candidateLimit: int = Query(200, ge=1, le=500),
):
    try:
        results = await search_products_hybrid(
            query_text=q,
            limit=candidateLimit,
            exclude_product_ids=set(),
        )
        return ProductSearchQueryResponse(
            query=q,
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