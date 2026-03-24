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
        try:
            return await self._generate_answer_with_retry(request, retrieval_bundle), response_type
        except RuntimeError:
            if retrieval_bundle.products:
                return build_grounded_template_answer(request, retrieval_bundle), response_type
            return build_fallback_answer(request, retrieval_bundle), "fallback"

    async def _generate_answer_with_retry(
        self,
        request: ChatbotQueryRequest,
        retrieval_bundle: RetrievalBundle,
    ) -> str:
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
