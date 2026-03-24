from uuid import uuid4
import re

from schemas.chatbot import ChatbotQueryRequest, ChatbotQueryResponse
from services.chatbot.llm_service import chatbot_llm_service
from services.chatbot.retrieval_service import RetrievalBundle
from services.chatbot.retrieval_service import chatbot_retrieval_service


def _model_to_dict(model) -> dict:
    if model is None:
        return {}
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_none=True)
    return model.dict(exclude_none=True)


class ChatbotService:
    async def query(self, request: ChatbotQueryRequest) -> ChatbotQueryResponse:
        # retrieval과 generation을 분리해 두면 이후 vector search가 붙어도 라우터 계약은 그대로 유지됩니다.
        retrieval_bundle = await chatbot_retrieval_service.retrieve(request)
        response_type = retrieval_bundle.response_type
        try:
            answer = await chatbot_llm_service.generate_answer(
                message=request.message,
                user_context=_model_to_dict(request.userContext) if request.userContext else None,
                retrieval_context=retrieval_bundle.retrieval_context,
            )
        except RuntimeError:
            answer = self._build_fallback_answer(request, retrieval_bundle)
            response_type = "fallback"
        answer = self._postprocess_answer(answer)

        return ChatbotQueryResponse(
            # 세션은 아직 서버 저장 없이 응답 식별자 역할만 합니다.
            sessionId=request.sessionId or str(uuid4()),
            responseType=response_type,
            answer=answer,
            products=retrieval_bundle.products,
            appliedFilters=retrieval_bundle.applied_filters,
            citations=retrieval_bundle.citations,
        )

    def _build_fallback_answer(
        self,
        request: ChatbotQueryRequest,
        retrieval_bundle: RetrievalBundle,
    ) -> str:
        if not retrieval_bundle.products:
            return (
                "지금 답변 생성이 잠시 불안정합니다. 잠시 후 다시 시도해 주세요. "
                "다음 요청에서는 피부 고민, 카테고리, 피하고 싶은 성분을 조금 더 구체적으로 적어주시면 후보를 더 정확하게 좁힐 수 있습니다."
            )

        top_products = retrieval_bundle.products[:3]
        product_names = ", ".join(product.name for product in top_products)
        category_names = []
        for product in top_products:
            reason = product.reason or ""
            if "카테고리" in reason:
                category_names.append(reason.split(" 카테고리")[0].split(" / ")[-1])
        category_hint = f"{category_names[0]} 중심으로" if category_names else "후보 중심으로"

        avoid_terms = []
        if request.userContext and request.userContext.dislikedIngredientNames:
            avoid_terms = request.userContext.dislikedIngredientNames
        avoid_hint = f" {', '.join(avoid_terms)}는 우선 피하는 방향으로 봤습니다." if avoid_terms else ""

        return (
            "지금 답변 생성이 잠시 불안정합니다. 잠시 후 다시 시도해 주세요. "
            f"우선 검색된 후보만 보면 {category_hint} {product_names} 쪽이 먼저 잡혔습니다."
            f"{avoid_hint} "
            "급하면 이 후보들부터 먼저 보고, 다시 요청하시면 설명을 더 자연스럽게 이어드릴게요."
        ).strip()

    def _postprocess_answer(self, answer: str) -> str:
        cleaned = answer.strip()
        replacements = {
            "제공된 상품 후보 중에서는 ": "",
            "제공된 상품 후보들에는 ": "지금 후보들에는 ",
            "특정하기 어렵습니다.": "바로 하나로 좁히기는 어렵습니다.",
            "특정하기 어렵습니다": "바로 하나로 좁히기는 어렵습니다",
        }
        for before, after in replacements.items():
            cleaned = cleaned.replace(before, after)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned


chatbot_service = ChatbotService()
