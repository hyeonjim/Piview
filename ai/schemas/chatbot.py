from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatbotClientContext(BaseModel):
    # 화면 문맥은 추후 search/product 상세 진입점별 응답 튜닝에 사용합니다.
    screen: str | None = None
    currentProductId: int | None = None


class ChatbotUserContext(BaseModel):
    # userId는 현재 로깅/추적용이고, 실제 개인화는 아래 요약 필드들을 우선 사용합니다.
    userId: int | None = None
    mySkinType: str | None = None
    skinProblems: list[str] = Field(default_factory=list)
    myCosProductIds: list[int] = Field(default_factory=list)
    dislikedIngredientNames: list[str] = Field(default_factory=list)
    dislikedProductIds: list[int] = Field(default_factory=list)


class ChatbotQueryRequest(BaseModel):
    # 메시지는 초기 MVP에서 한 턴 질의만 받도록 두고, 과도한 본문은 방어합니다.
    message: str = Field(min_length=1, max_length=2000)
    sessionId: str | None = None
    context: ChatbotClientContext | None = None
    userContext: ChatbotUserContext | None = None


class ChatbotProductCandidate(BaseModel):
    # retrieval 연결 후 프론트 카드/리스트에 바로 매핑할 수 있는 최소 필드만 둡니다.
    productId: int | None = None
    name: str
    brandName: str | None = None
    reason: str | None = None


class ChatbotCitation(BaseModel):
    type: str
    productId: int | None = None
    text: str | None = None
    title: str | None = None
    snippet: str | None = None
    source: str | None = None
    score: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatbotQueryResponse(BaseModel):
    # appliedFilters/citations는 retrieval이 붙었을 때 응답 설명력을 높이기 위한 확장 필드입니다.
    sessionId: str
    responseType: Literal["product_recommendation", "informational", "fallback"]
    answer: str
    products: list[ChatbotProductCandidate] = Field(default_factory=list)
    appliedFilters: dict[str, Any] = Field(default_factory=dict)
    citations: list[ChatbotCitation] = Field(default_factory=list)
