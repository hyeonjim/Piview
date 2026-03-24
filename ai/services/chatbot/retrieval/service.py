from core.settings import get_settings
from schemas.chatbot import ChatbotQueryRequest
from services.chatbot.retrieval.builders import (
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


class ChatbotRetrievalService:
    async def retrieve(self, request: ChatbotQueryRequest) -> RetrievalBundle:
        applied_filters = collect_applied_filters(request)
        preferred_categories = extract_preferred_categories(request.message)
        avoid_terms = extract_avoid_terms(request)

        if needs_clarifying_question(request.message, preferred_categories):
            return RetrievalBundle(
                response_type="clarifying_question",
                applied_filters=applied_filters,
                retrieval_context=(
                    "이 질문은 지금 바로 상품 카드를 붙이기보다 사용자의 상태를 한 번 더 확인하는 편이 자연스럽습니다. "
                    "제품 추천을 억지로 하지 말고, 한 문장으로 짧게 되물어라. "
                    "피부타입을 진단처럼 단정하지 말고, 건조함/유분/민감함 중 무엇이 더 신경 쓰이는지처럼 가볍게 좁혀라."
                ),
            )

        try:
            settings = get_settings()
            preferred_concerns = extract_preferred_concerns(request)
            excluded_product_ids = build_excluded_product_ids(request)
            existing_categories = extract_existing_categories(request.message)
            missing_categories = extract_missing_categories(request.message)
            search_query = build_search_query(request)

            vector_results = product_vector_service.query(
                query_text=search_query,
                limit=max(settings.chatbot_top_k, settings.chatbot_candidate_pool),
                exclude_product_ids=excluded_product_ids,
            )
            keyword_results = [
                result
                for result in product_keyword_service.search(
                    query_text=search_query,
                    limit=max(settings.chatbot_top_k, settings.chatbot_keyword_top_k),
                )
                if result.product_id not in excluded_product_ids
            ]
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
        except RuntimeError as exc:
            return RetrievalBundle(
                response_type="informational",
                applied_filters=applied_filters,
                retrieval_context=(
                    "상품 검색 인덱스를 아직 사용할 수 없습니다. "
                    f"현재 검색은 비활성화 상태이며 오류는 다음과 같습니다: {exc}"
                ),
            )

        if not results:
            return RetrievalBundle(
                response_type="informational",
                applied_filters=applied_filters,
                retrieval_context=(
                    "현재 질문과 직접적으로 맞는 상품 후보를 찾지 못했습니다. "
                    "답변은 일반 가이드 중심으로 하되, 사용자가 카테고리/피부고민/피하고 싶은 성분을 더 구체적으로 말하면 검색 품질이 좋아집니다."
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
            ),
        )


chatbot_retrieval_service = ChatbotRetrievalService()
