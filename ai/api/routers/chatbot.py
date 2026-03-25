"""
api/routers/chatbot.py
──────────────────────
POST /chat/query  ← 사용자 질문 → 챗봇 응답
"""

import logging

from fastapi import APIRouter, HTTPException

from schemas.chatbot import ChatbotQueryRequest, ChatbotQueryResponse
from services.chatbot.generation import chatbot_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=ChatbotQueryResponse)
async def query_chatbot(request: ChatbotQueryRequest):
    """챗봇 질문을 받아 모델 응답과 후속 확장용 메타데이터를 반환한다."""
    try:
        # 라우터는 HTTP 예외 변환만 맡고, 실제 오케스트레이션은 서비스로 넘깁니다.
        return await chatbot_service.query(request)
    except RuntimeError as exc:
        logger.warning("Chatbot request failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="챗봇 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ) from exc
