"""Chatbot answer generation orchestration.

이 모듈은 "검색 결과를 바탕으로 실제 답변 문자열을 만든다"는 책임만 가집니다.
검색 품질 로직은 retrieval 쪽에 두고, 여기서는 응답 타입별 분기와
LLM 실패 시 복구 전략만 관리합니다.
"""

import logging
from uuid import uuid4

from services.chatbot.domain import ClientContext, QueryRequest, QueryResponse
from services.chatbot.intent import chatbot_intent_router
from services.chatbot.generation.helpers import build_effective_client_context
from services.chatbot.generation.postprocess import postprocess_answer
from services.chatbot.generation.templates import (
    build_fallback_answer,
    build_greeting_answer,
    build_grounded_template_answer,
    build_informational_template_answer,
)
from services.chatbot.generation.llm import chatbot_llm_service
from services.chatbot.retrieval import RetrievalBundle, chatbot_retrieval_service
from services.chatbot.session import chat_session_store


logger = logging.getLogger(__name__)


class ChatbotService:
    async def query(self, request: QueryRequest) -> QueryResponse:
        """API 요청 하나를 최종 챗봇 응답으로 변환합니다.

        흐름은 고정입니다.
        1. intent 단계에서 no-retrieval 여부를 먼저 판단한다.
        2. retrieval이 필요한 경우에만 검색 후보와 응답 타입을 만든다.
        3. 그 외에는 LLM 생성 -> 템플릿 fallback 순으로 답변을 만든다.
        4. 마지막에 후처리와 응답 스키마 변환을 한다.
        """
        # 검색 결과와 생성 단계를 분리해 두면 추천 규칙이 바뀌어도 API 계약은 안정적으로 유지됩니다.
        session_id = request.session_id or str(uuid4())
        session_snapshot = chat_session_store.get_snapshot(
            session_id=session_id,
            user_id=request.user_context.user_id if request.user_context else None,
        )
        session_context = session_snapshot.to_prompt_payload()
        prompt_session_context = session_snapshot.to_llm_payload()
        client_context = build_effective_client_context(request, session_context)
        intent_decision = chatbot_intent_router.route(
            request,
            session_context=session_context,
        )
        if intent_decision.intent_type == "greeting_chitchat":
            retrieval_bundle = self._build_no_retrieval_bundle(intent_decision)
            answer = build_greeting_answer()
            response_type = retrieval_bundle.response_type
        else:
            retrieval_bundle = await self._retrieve_bundle(
                request,
                intent_decision=intent_decision,
                session_context=session_context,
            )
        response_type = retrieval_bundle.response_type
        if intent_decision.intent_type != "greeting_chitchat":
            answer, response_type = await self._build_answer(
                request,
                retrieval_bundle,
                response_type,
                client_context=client_context,
                session_context=prompt_session_context,
            )

        final_answer = postprocess_answer(answer)
        chat_session_store.remember_turn(
            session_id=session_id,
            request=request,
            answer=final_answer,
            product_ids=[
                product.product_id
                for product in retrieval_bundle.products
                if product.product_id is not None
            ],
        )

        return QueryResponse(
            session_id=session_id,
            response_type=response_type,
            answer=final_answer,
            products=retrieval_bundle.products,
            applied_filters=retrieval_bundle.applied_filters,
            citations=retrieval_bundle.citations,
        )

    async def _retrieve_bundle(
        self,
        request: QueryRequest,
        *,
        intent_decision,
        session_context: dict[str, object] | None,
    ) -> RetrievalBundle:
        if intent_decision.intent_type == "informational" and not intent_decision.use_product_retrieval:
            return self._build_no_retrieval_bundle(intent_decision)
        return await chatbot_retrieval_service.retrieve(
            request,
            session_context=session_context,
        )

    async def _build_answer(
        self,
        request: QueryRequest,
        retrieval_bundle: RetrievalBundle,
        response_type: str,
        client_context: ClientContext | None,
        session_context: dict | None,
    ) -> tuple[str, str]:
        """LLM 생성 실패까지 포함해 최종 answer/response_type 조합을 결정합니다."""
        try:
            return (
                await self._generate_answer(
                    request,
                    retrieval_bundle,
                    client_context=client_context,
                    session_context=session_context,
                ),
                response_type,
            )
        except RuntimeError as exc:
            logger.warning("Chatbot generation fell back to template response: %s", exc)
            # 후보 상품이 있으면 최소한 카드와 모순되지 않는 템플릿 답변은 만들 수 있습니다.
            if retrieval_bundle.products:
                return build_grounded_template_answer(request, retrieval_bundle), response_type
            if response_type == "informational":
                return build_informational_template_answer(request), response_type
            # 후보도 없으면 검색 문맥을 활용할 수 없으므로 fallback 타입으로 내려 보냅니다.
            return build_fallback_answer(request, retrieval_bundle), "fallback"

    async def _generate_answer(
        self,
        request: QueryRequest,
        retrieval_bundle: RetrievalBundle,
        client_context: ClientContext | None,
        session_context: dict | None,
    ) -> str:
        return await chatbot_llm_service.generate_answer(
            message=request.message,
            user_context=request.user_context,
            retrieval_context=retrieval_bundle.retrieval_context,
            client_context=client_context,
            session_context=session_context,
        )

    def _build_no_retrieval_bundle(self, intent_decision) -> RetrievalBundle:
        return RetrievalBundle(
            response_type="informational",
            applied_filters={
                "intentType": intent_decision.intent_type,
                "routeSource": intent_decision.route_source,
                "lowConfidence": intent_decision.low_confidence,
                "usedProductRetrieval": False,
            },
            retrieval_context=(
                "이번 응답은 상품 검색을 실행하지 않고 일반 안내로 처리해야 합니다. "
                "특정 상품이나 성분 사실을 단정하지 말고, 일반적인 화장품 선택 기준이나 사용 팁만 실용적으로 안내하세요."
            ),
        )


chatbot_service = ChatbotService()
