"""Chatbot answer generation orchestration.

이 모듈은 "검색 결과를 바탕으로 실제 답변 문자열을 만든다"는 책임만 가집니다.
검색 품질 로직은 retrieval 쪽에 두고, 여기서는 응답 타입별 분기와
LLM 실패 시 복구 전략만 관리합니다.
"""

import asyncio
from uuid import uuid4

from schemas.chatbot import ChatbotQueryRequest, ChatbotQueryResponse
from services.chatbot.generation.helpers import model_to_dict
from services.chatbot.generation.postprocess import postprocess_answer
from services.chatbot.generation.templates import (
    build_clarifying_answer,
    build_fallback_answer,
    build_grounded_template_answer,
)
from services.chatbot.generation.llm import chatbot_llm_service
from services.chatbot.retrieval import RetrievalBundle, chatbot_retrieval_service


class ChatbotService:
    async def query(self, request: ChatbotQueryRequest) -> ChatbotQueryResponse:
        """API 요청 하나를 최종 챗봇 응답으로 변환합니다.

        흐름은 고정입니다.
        1. retrieval 단계에서 후보와 응답 타입을 만든다.
        2. clarifying이면 LLM 없이 바로 짧은 질문을 만든다.
        3. 그 외에는 LLM 생성 -> 템플릿 fallback 순으로 답변을 만든다.
        4. 마지막에 후처리와 응답 스키마 변환을 한다.
        """
        # 검색 결과와 생성 단계를 분리해 두면 추천 규칙이 바뀌어도 API 계약은 안정적으로 유지됩니다.
        retrieval_bundle = await chatbot_retrieval_service.retrieve(request)
        response_type = retrieval_bundle.response_type

        if response_type == "clarifying_question":
            answer = build_clarifying_answer(request.message)
        else:
            answer, response_type = await self._build_answer(request, retrieval_bundle, response_type)

        return ChatbotQueryResponse(
            sessionId=request.sessionId or str(uuid4()),
            responseType=response_type,
            answer=postprocess_answer(answer),
            products=retrieval_bundle.products,
            appliedFilters=retrieval_bundle.applied_filters,
            citations=retrieval_bundle.citations,
        )

    async def _build_answer(
        self,
        request: ChatbotQueryRequest,
        retrieval_bundle: RetrievalBundle,
        response_type: str,
    ) -> tuple[str, str]:
        """LLM 생성 실패까지 포함해 최종 answer/response_type 조합을 결정합니다."""
        try:
            return await self._generate_answer_with_retry(request, retrieval_bundle), response_type
        except RuntimeError:
            # 후보 상품이 있으면 최소한 카드와 모순되지 않는 템플릿 답변은 만들 수 있습니다.
            if retrieval_bundle.products:
                return build_grounded_template_answer(request, retrieval_bundle), response_type
            # 후보도 없으면 검색 문맥을 활용할 수 없으므로 fallback 타입으로 내려 보냅니다.
            return build_fallback_answer(request, retrieval_bundle), "fallback"

    async def _generate_answer_with_retry(
        self,
        request: ChatbotQueryRequest,
        retrieval_bundle: RetrievalBundle,
    ) -> str:
        """외부 LLM 호출을 감싸는 얇은 래퍼입니다.

        userContext는 pydantic 모델이라, 하위 LLM 서비스에는 dict 형태로 넘깁니다.
        """
        user_context = model_to_dict(request.userContext) if request.userContext else None

        try:
            return await chatbot_llm_service.generate_answer(
                message=request.message,
                user_context=user_context,
                retrieval_context=retrieval_bundle.retrieval_context,
            )
        except RuntimeError:
            # 외부 LLM 응답이 일시적으로 흔들릴 때만 짧게 한 번 더 시도합니다.
            await asyncio.sleep(1.5)
            return await chatbot_llm_service.generate_answer(
                message=request.message,
                user_context=user_context,
                retrieval_context=retrieval_bundle.retrieval_context,
            )


chatbot_service = ChatbotService()
