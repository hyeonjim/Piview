"""
api/routers/chatbot.py
──────────────────────
POST /chat/query  ← 사용자 질문 → 챗봇 응답
"""

import logging

from fastapi import APIRouter, Body, HTTPException

from schemas.chatbot import (
    ChatbotQueryRequest,
    ChatbotQueryResponse,
    ChatbotRetrieveRequest,
    ChatbotRetrieveResponse,
)
from services.chatbot.domain import (
    to_api_response,
    to_api_retrieve_response,
    to_domain_request,
    to_domain_retrieve_request,
)
from services.chatbot.generation import chatbot_service
from services.chatbot.retrieval_query import chatbot_retrieve_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=ChatbotQueryResponse)
async def query_chatbot(request: ChatbotQueryRequest):
    """챗봇 질문을 받아 모델 응답과 후속 확장용 메타데이터를 반환한다."""
    try:
        # 라우터는 HTTP 예외 변환만 맡고, 실제 오케스트레이션은 서비스로 넘깁니다.
        response = await chatbot_service.query(to_domain_request(request))
        return to_api_response(response)
    except RuntimeError as exc:
        logger.warning("Chatbot request failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="챗봇 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ) from exc


@router.post(
    "/retrieve",
    response_model=ChatbotRetrieveResponse,
    summary="상품 retrieval 전용 검색",
    description=(
        "자연어 질의를 상품 검색용으로만 해석해 최대 100개의 랭킹된 상품 후보를 반환합니다. "
        "이 엔드포인트는 챗봇 답변 생성을 하지 않으며, intent 분기 없이 바로 retrieval을 수행합니다. "
        "검색 결과 소비 주체가 backend나 추천 파이프라인일 때 사용하는 것을 전제로 합니다."
    ),
    responses={
        200: {
            "description": (
                "검색이 성공적으로 수행된 경우입니다. "
                "vector 또는 keyword source 중 일부가 실패해도, 다른 source 결과가 있으면 200으로 응답할 수 있습니다."
            )
        },
        502: {
            "description": "retrieval 내부 처리 자체가 실패해 결과를 만들 수 없는 경우입니다."
        },
    },
)
async def retrieve_products(
    request: ChatbotRetrieveRequest = Body(
        ...,
        examples={
            "search_screen": {
                "summary": "검색 화면에서 일반 검색",
                "description": "사용자 문맥을 포함해 최대 100개의 상품 후보를 받는 예시입니다.",
                "value": {
                    "message": "속건조인데 끈적이지 않는 진정 수분크림 추천해줘.",
                    "sessionId": None,
                    "context": {
                        "screen": "search",
                        "currentProductId": None,
                    },
                    "userContext": {
                        "userId": 101,
                        "mySkinType": "combination",
                        "skinProblems": ["수분", "진정"],
                        "myCosProductIds": [12, 34],
                        "dislikedIngredientNames": ["향료"],
                        "dislikedProductIds": [9999],
                    },
                    "limit": 100,
                },
            },
            "detail_followup": {
                "summary": "상세 화면 anchor 검색",
                "description": "현재 보고 있는 상품을 anchor로 삼아 비슷하거나 보완적인 상품을 찾는 예시입니다.",
                "value": {
                    "message": "이 제품보다 더 가볍고 진정 위주인 제품으로 찾아줘.",
                    "sessionId": "retrieve-session-id",
                    "context": {
                        "screen": "detail",
                        "currentProductId": 161485,
                    },
                    "userContext": {
                        "mySkinType": "combination",
                        "skinProblems": ["진정", "피지"],
                        "dislikedIngredientNames": ["에탄올"],
                    },
                    "limit": 100,
                },
            },
        },
    )
):
    """검색 전용 API. generation 없이 retrieval 결과만 구조화해 반환한다."""
    try:
        response = await chatbot_retrieve_service.retrieve(
            to_domain_retrieve_request(request),
            limit=request.limit,
        )
        return to_api_retrieve_response(response)
    except RuntimeError as exc:
        logger.warning("Chatbot retrieve request failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="상품 retrieval 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ) from exc
