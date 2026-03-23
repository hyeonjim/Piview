from dataclasses import dataclass, field
from typing import Any

from schemas.chatbot import ChatbotCitation, ChatbotProductCandidate, ChatbotQueryRequest


@dataclass
class RetrievalBundle:
    # retrieval이 비어 있어도 downstream 응답 조립이 항상 같은 형태를 유지하도록 번들로 감쌉니다.
    products: list[ChatbotProductCandidate] = field(default_factory=list)
    citations: list[ChatbotCitation] = field(default_factory=list)
    applied_filters: dict[str, Any] = field(default_factory=dict)
    retrieval_context: str = (
        "현재 상품 retrieval은 아직 연결 전 상태입니다. "
        "실제 상품 추천 대신 일반적인 화장품 선택 가이드를 제공해야 합니다."
    )


class ChatbotRetrievalService:
    async def retrieve(self, request: ChatbotQueryRequest) -> RetrievalBundle:
        applied_filters: dict[str, Any] = {}

        if request.userContext:
            # retrieval 미연결 단계에서도 사용자 문맥이 응답에 반영됐는지 확인할 수 있게 필터 흔적은 남깁니다.
            if request.userContext.mySkinType:
                applied_filters["mySkinType"] = request.userContext.mySkinType
            if request.userContext.skinProblems:
                applied_filters["skinProblems"] = request.userContext.skinProblems

        return RetrievalBundle(applied_filters=applied_filters)


chatbot_retrieval_service = ChatbotRetrievalService()
