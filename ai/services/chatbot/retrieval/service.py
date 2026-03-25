"""Chatbot retrieval orchestration.

이 모듈은 "질문을 검색 가능한 형태로 바꾸고, 검색 결과를 후보 묶음으로 만든다"는
최상위 흐름만 담당합니다. 세부 parsing, scoring, response formatting은
하위 패키지로 나눠서 관리합니다.
"""

import asyncio
import logging

from core.settings import get_settings
from schemas.chatbot import ChatbotQueryRequest
from services.chatbot.retrieval.builders import (
    build_context_hints,
    build_excluded_product_ids,
    build_retrieval_context,
    build_search_query,
    collect_applied_filters,
    to_citation,
    to_product_candidate,
)
from services.chatbot.search.keyword import product_keyword_service
from services.chatbot.search.vector import product_vector_service
from services.chatbot.retrieval.models import RetrievalBundle
from services.chatbot.retrieval.parsers import (
    extract_avoid_terms,
    extract_existing_categories,
    extract_missing_categories,
    extract_preferred_categories,
    extract_preferred_concerns,
    needs_clarifying_question,
)
from services.chatbot.retrieval.scoring import fuse_results


logger = logging.getLogger(__name__)


class ChatbotRetrievalService:
    async def retrieve(
        self,
        request: ChatbotQueryRequest,
        session_context: dict[str, object] | None = None,
    ) -> RetrievalBundle:
        """질문 하나를 RetrievalBundle로 변환합니다.

        RetrievalBundle은 이후 generation 단계가 그대로 소비하는 표준 중간 산출물입니다.
        """
        preferred_categories = extract_preferred_categories(request.message)
        avoid_terms = extract_avoid_terms(request)
        context_hints = build_context_hints(request.context, session_context)

        if needs_clarifying_question(request.message, preferred_categories):
            # 이 경우는 상품 추천을 밀어붙이는 것보다, 질문을 한 번 더 좁히는 게 자연스럽습니다.
            return RetrievalBundle(
                response_type="clarifying_question",
                applied_filters=collect_applied_filters(request, session_context=session_context),
                retrieval_context=self._merge_context_hints(
                    context_hints,
                    (
                        "이 질문은 지금 바로 상품 카드를 붙이기보다 사용자의 상태를 한 번 더 확인하는 편이 자연스럽습니다. "
                        "제품 추천을 억지로 하지 말고, 한 문장으로 짧게 되물어라. "
                        "피부타입을 진단처럼 단정하지 말고, 건조함/유분/민감함 중 무엇이 더 신경 쓰이는지처럼 가볍게 좁혀라."
                    ),
                ),
            )

        settings = get_settings()
        preferred_concerns = extract_preferred_concerns(request)
        excluded_product_ids = build_excluded_product_ids(request)
        existing_categories = extract_existing_categories(request.message)
        missing_categories = extract_missing_categories(request.message)
        search_query, used_session_memory = build_search_query(
            request,
            session_context=session_context,
        )
        applied_filters = collect_applied_filters(
            request,
            session_context=session_context,
            used_session_memory=used_session_memory,
        )

        vector_results, keyword_results, had_search_error = await self._run_searches(
            settings=settings,
            search_query=search_query,
            excluded_product_ids=excluded_product_ids,
        )
        if had_search_error and not vector_results and not keyword_results:
            return RetrievalBundle(
                response_type="informational",
                applied_filters=applied_filters,
                retrieval_context=self._merge_context_hints(
                    context_hints,
                    "상품 검색이 일시적으로 불안정합니다. 지금은 일반적인 선택 가이드 중심으로만 안내해야 합니다.",
                ),
            )

        # 실제 추천 순서는 검색 결과 자체가 아니라, fusion 단계에서 다시 계산됩니다.
        results = fuse_results(
            message=request.message,
            vector_results=vector_results,
            keyword_results=keyword_results,
            limit=settings.chatbot_top_k,
            preferred_categories=preferred_categories,
            avoid_terms=avoid_terms,
            existing_categories=existing_categories,
            missing_categories=missing_categories,
        )

        if not results:
            # 상품을 못 찾았더라도 generation 단계는 이 문맥을 이용해 일반 가이드는 만들 수 있습니다.
            return RetrievalBundle(
                response_type="informational",
                applied_filters=applied_filters,
                retrieval_context=self._merge_context_hints(
                    context_hints,
                    (
                        "현재 질문과 직접적으로 맞는 상품 후보를 찾지 못했습니다. "
                        "답변은 일반 가이드 중심으로 하되, 사용자가 카테고리/피부고민/피하고 싶은 성분을 더 구체적으로 말하면 검색 품질이 좋아집니다."
                    ),
                ),
            )

        return RetrievalBundle(
            response_type="product_recommendation",
            products=[to_product_candidate(result, preferred_concerns) for result in results],
            citations=[to_citation(result, preferred_concerns) for result in results],
            applied_filters=applied_filters,
            retrieval_context=build_retrieval_context(
                results=results,
                preferred_concerns=preferred_concerns,
                message=request.message,
                avoid_terms=avoid_terms,
                client_context=request.context,
                session_context=session_context,
            ),
        )

    async def _run_searches(
        self,
        settings,
        search_query: str,
        excluded_product_ids: set[int],
    ) -> tuple[list, list, bool]:
        vector_task = product_vector_service.query_async(
            query_text=search_query,
            limit=max(settings.chatbot_top_k, settings.chatbot_candidate_pool),
            exclude_product_ids=excluded_product_ids,
        )
        keyword_task = product_keyword_service.search_async(
            query_text=search_query,
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

        keyword_results = [
            result
            for result in keyword_results
            if result.product_id not in excluded_product_ids
        ]
        return vector_results, keyword_results, had_search_error

    def _merge_context_hints(self, context_hints: list[str], base_text: str) -> str:
        if not context_hints:
            return base_text
        return "\n".join([*context_hints, base_text])


chatbot_retrieval_service = ChatbotRetrievalService()
