from uuid import uuid4

from schemas.chatbot import ChatbotQueryRequest, ChatbotQueryResponse
from services.chatbot.llm_service import chatbot_llm_service
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
        answer = await chatbot_llm_service.generate_answer(
            message=request.message,
            user_context=_model_to_dict(request.userContext) if request.userContext else None,
            retrieval_context=retrieval_bundle.retrieval_context,
        )

        return ChatbotQueryResponse(
            # 세션은 아직 서버 저장 없이 응답 식별자 역할만 합니다.
            sessionId=request.sessionId or str(uuid4()),
            answer=answer,
            products=retrieval_bundle.products,
            appliedFilters=retrieval_bundle.applied_filters,
            citations=retrieval_bundle.citations,
        )


chatbot_service = ChatbotService()
