from core.settings import get_settings
from services.chatbot.retrieval.builders import (
    build_retrieval_context,
    to_citation,
    to_product_candidate,
)
from services.chatbot.retrieval.models import RetrievalBundle
from services.chatbot.retrieval.scoring import HybridScoringConfig, fuse_results
from services.chatbot.retrieval.workflow.models import RetrievalPlan, SearchExecutionResult


def build_retrieval_bundle(
    *,
    plan: RetrievalPlan,
    search_result: SearchExecutionResult | None = None,
    session_context: dict[str, object] | None = None,
) -> RetrievalBundle:
    search_result = search_result or SearchExecutionResult()
    if search_result.had_search_error and not search_result.vector_results and not search_result.keyword_results:
        return RetrievalBundle(
            response_type="informational",
            applied_filters=plan.applied_filters,
            retrieval_context=_merge_context_hints(
                plan.context_hints,
                "상품 검색이 일시적으로 불안정합니다. 지금은 일반적인 선택 가이드 중심으로만 안내해야 합니다.",
            ),
        )

    settings = get_settings()
    results = fuse_results(
        message=plan.request.message,
        vector_results=search_result.vector_results,
        keyword_results=search_result.keyword_results,
        limit=settings.chatbot_top_k,
        preferred_categories=plan.preferred_categories,
        avoid_terms=plan.avoid_terms,
        existing_categories=plan.existing_categories,
        missing_categories=plan.missing_categories,
        config=HybridScoringConfig.from_settings(settings),
    )
    if not results:
        return RetrievalBundle(
            response_type="informational",
            applied_filters=plan.applied_filters,
            retrieval_context=_merge_context_hints(
                plan.context_hints,
                (
                    "현재 질문과 직접적으로 맞는 상품 후보를 찾지 못했습니다. "
                    "답변은 일반 가이드 중심으로 하되, 사용자가 카테고리/피부고민/피하고 싶은 성분을 더 구체적으로 말하면 검색 품질이 좋아집니다."
                ),
            ),
        )

    return RetrievalBundle(
        response_type="product_recommendation",
        products=[to_product_candidate(result, plan.preferred_concerns) for result in results],
        citations=[to_citation(result, plan.preferred_concerns) for result in results],
        applied_filters=plan.applied_filters,
        retrieval_context=build_retrieval_context(
            results=results,
            preferred_concerns=plan.preferred_concerns,
            message=plan.request.message,
            avoid_terms=plan.avoid_terms,
            client_context=plan.request.client_context,
            session_context=session_context,
        ),
    )


def _merge_context_hints(context_hints: list[str], base_text: str) -> str:
    if not context_hints:
        return base_text
    return "\n".join([*context_hints, base_text])
