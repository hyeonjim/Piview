"""Retrieval-only search service for backend/system consumers.

이 엔드포인트는 챗봇 자연어 답변을 만들지 않고,
질의를 검색용으로만 해석해서 대량의 상품 후보를 반환합니다.
"""

from dataclasses import dataclass, field
import asyncio
import logging
from uuid import uuid4

from core.settings import Settings, get_settings
from services.chatbot.domain.models import Citation, QueryRequest
from services.chatbot.retrieval.builders import to_citation, to_product_candidate
from services.chatbot.retrieval.scoring import HybridScoringConfig, fuse_results
from services.chatbot.retrieval.workflow import build_retrieval_plan
from services.chatbot.retrieval.workflow.models import RetrievalPlan
from services.chatbot.search.keyword import product_keyword_service
from services.chatbot.search.vector import ProductSearchResult, product_vector_service
from services.chatbot.session import chat_session_store


logger = logging.getLogger(__name__)


@dataclass
class RetrievedProduct:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    score: float | None
    raw_score: float | None
    reason: str | None
    matched_sources: list[str] = field(default_factory=list)
    concern_names: list[str] = field(default_factory=list)
    top_skin_type: str | None = None
    top2_skin_type: str | None = None
    ingredient_preview: str | None = None
    evidence_snippets: list[str] = field(default_factory=list)
    score_breakdown: dict[str, float] = field(default_factory=dict)


@dataclass
class RetrievalQueryResponse:
    session_id: str
    query: str
    search_query: str
    requested_limit: int
    returned_count: int
    search_limit: int
    had_search_error: bool
    applied_filters: dict[str, object] = field(default_factory=dict)
    products: list[RetrievedProduct] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)


class ChatbotRetrieveService:
    async def retrieve(
        self,
        request: QueryRequest,
        *,
        limit: int,
    ) -> RetrievalQueryResponse:
        """질의를 검색 전용으로 처리하고 랭킹된 상품 리스트를 반환합니다."""
        session_id = request.session_id or str(uuid4())
        session_snapshot = chat_session_store.get_snapshot(
            session_id=session_id,
            user_id=request.user_context.user_id if request.user_context else None,
        )
        session_context = session_snapshot.to_prompt_payload()

        plan = build_retrieval_plan(
            request,
            session_context=session_context,
            intent_decision=None,
        )
        settings = get_settings()
        search_limit = self._resolve_search_limit(plan, settings, requested_limit=limit)
        keyword_prefilter_limit = self._resolve_keyword_prefilter_limit(
            search_limit,
            settings,
        )

        vector_results, keyword_results, had_search_error = await self._execute_searches(
            plan,
            search_limit=search_limit,
            keyword_prefilter_limit=keyword_prefilter_limit,
        )
        ranked_results = fuse_results(
            message=plan.request.message,
            vector_results=vector_results,
            keyword_results=keyword_results,
            limit=limit,
            preferred_categories=plan.preferred_categories,
            avoid_terms=plan.avoid_terms,
            existing_categories=plan.existing_categories,
            missing_categories=plan.missing_categories,
            config=HybridScoringConfig.from_settings(settings),
        )

        products = [
            self._to_retrieved_product(result, plan.preferred_concerns)
            for result in ranked_results
        ]
        citations = [to_citation(result, plan.preferred_concerns) for result in ranked_results]

        # retrieval-only API도 후속 검색 품질을 위해 최근 메시지/상품 문맥은 저장합니다.
        chat_session_store.remember_turn(
            session_id=session_id,
            request=request,
            answer="",
            product_ids=[product.product_id for product in ranked_results],
        )

        return RetrievalQueryResponse(
            session_id=session_id,
            query=request.message,
            search_query=plan.search_query,
            requested_limit=limit,
            returned_count=len(products),
            search_limit=search_limit,
            had_search_error=had_search_error,
            applied_filters=plan.applied_filters,
            products=products,
            citations=citations,
        )

    async def _execute_searches(
        self,
        plan: RetrievalPlan,
        *,
        search_limit: int,
        keyword_prefilter_limit: int,
    ) -> tuple[list[ProductSearchResult], list[ProductSearchResult], bool]:
        """vector/keyword search를 병렬 실행하고 부분 실패를 흡수합니다."""
        vector_task = product_vector_service.query_async(
            query_text=plan.search_query,
            limit=search_limit,
            exclude_product_ids=plan.excluded_product_ids,
        )
        keyword_task = product_keyword_service.search_async(
            query_text=plan.search_query,
            limit=search_limit,
            candidate_limit=keyword_prefilter_limit,
            preferred_categories=plan.preferred_categories,
        )
        vector_results, keyword_results = await asyncio.gather(
            vector_task,
            keyword_task,
            return_exceptions=True,
        )

        had_search_error = False
        if isinstance(vector_results, Exception):
            had_search_error = True
            logger.warning("Retrieve vector search failed: %s", vector_results)
            vector_results = []
        if isinstance(keyword_results, Exception):
            had_search_error = True
            logger.warning("Retrieve keyword search failed: %s", keyword_results)
            keyword_results = []

        filtered_keyword_results = [
            result
            for result in keyword_results
            if result.product_id not in plan.excluded_product_ids
        ]
        return list(vector_results), filtered_keyword_results, had_search_error

    def _resolve_search_limit(
        self,
        plan: RetrievalPlan,
        settings: Settings,
        *,
        requested_limit: int,
    ) -> int:
        """검색 전용 API는 100개 반환을 안정적으로 채우도록 최소 250개 후보를 본다."""
        del plan
        del settings
        return max(requested_limit, 250)

    def _resolve_keyword_prefilter_limit(
        self,
        search_limit: int,
        settings: Settings,
    ) -> int:
        # 대량 결과에서 keyword 쪽 후보 풀이 너무 빨리 닫히지 않도록 search_limit보다 크게 잡습니다.
        return max(settings.chatbot_keyword_prefilter_limit, search_limit * 4)

    def _to_retrieved_product(
        self,
        result: ProductSearchResult,
        preferred_concerns: set[str],
    ) -> RetrievedProduct:
        product_candidate = to_product_candidate(result, preferred_concerns)
        return RetrievedProduct(
            product_id=result.product_id,
            name=result.name,
            brand_name=result.brand_name,
            category_name=result.category_name,
            score=result.hybrid_score,
            raw_score=result.raw_score,
            reason=product_candidate.reason,
            matched_sources=list(result.matched_sources),
            concern_names=list(result.concern_names),
            top_skin_type=result.top_skin_type,
            top2_skin_type=result.top2_skin_type,
            ingredient_preview=result.ingredient_preview,
            evidence_snippets=list(result.evidence_snippets),
            score_breakdown=dict(result.score_breakdown),
        )


chatbot_retrieve_service = ChatbotRetrieveService()


__all__ = [
    "ChatbotRetrieveService",
    "RetrievedProduct",
    "RetrievalQueryResponse",
    "chatbot_retrieve_service",
]
