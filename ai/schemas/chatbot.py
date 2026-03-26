from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatbotClientContext(BaseModel):
    # 화면 문맥은 추후 search/product 상세 진입점별 응답 튜닝에 사용합니다.
    screen: str | None = Field(
        default=None,
        description="질의가 발생한 화면입니다. 예: search, detail.",
        examples=["search"],
    )
    currentProductId: int | None = Field(
        default=None,
        description=(
            "상품 상세나 비교 화면처럼 특정 상품을 기준으로 검색할 때 사용하는 anchor 상품 ID입니다. "
            "없으면 비워도 됩니다."
        ),
        examples=[161485],
    )


class ChatbotUserContext(BaseModel):
    # userId는 현재 로깅/추적용이고, 실제 개인화는 아래 요약 필드들을 우선 사용합니다.
    userId: int | None = Field(
        default=None,
        description="사용자 식별자입니다. 추적과 세션 연결용이며 비워도 검색은 가능합니다.",
        examples=[101],
    )
    mySkinType: str | None = Field(
        default=None,
        description="사용자 피부타입입니다. 예: dry, oily, combination, subuji.",
        examples=["combination"],
    )
    skinProblems: list[str] = Field(
        default_factory=list,
        description="현재 사용자가 주로 신경 쓰는 피부 고민 목록입니다.",
        examples=[["수분", "진정"]],
    )
    myCosProductIds: list[int] = Field(
        default_factory=list,
        description="이미 보유 중인 상품 ID 목록입니다. 검색 후보 제외 신호로 사용할 수 있습니다.",
        examples=[[101, 102]],
    )
    dislikedIngredientNames: list[str] = Field(
        default_factory=list,
        description="피하고 싶은 성분명 목록입니다. 랭킹 페널티 신호로 사용됩니다.",
        examples=[["향료", "에탄올"]],
    )
    dislikedProductIds: list[int] = Field(
        default_factory=list,
        description="사용자가 피하고 싶은 상품 ID 목록입니다. 검색 후보 제외 신호로 사용할 수 있습니다.",
        examples=[[999, 1001]],
    )


class ChatbotQueryRequest(BaseModel):
    # 메시지는 초기 MVP에서 한 턴 질의만 받도록 두고, 과도한 본문은 방어합니다.
    message: str = Field(
        min_length=1,
        max_length=2000,
        description="사용자 질문 원문입니다.",
        examples=["속건조인데 진정되는 수분크림 추천해줘."],
    )
    sessionId: str | None = Field(
        default=None,
        description="후속 질문에서 이전 대화 문맥을 이어 붙일 때 사용하는 세션 ID입니다.",
        examples=["optional-session-id"],
    )
    context: ChatbotClientContext | None = Field(
        default=None,
        description="현재 화면이나 기준 상품 같은 클라이언트 문맥입니다.",
    )
    userContext: ChatbotUserContext | None = Field(
        default=None,
        description="개인화 검색에 사용할 사용자 요약 문맥입니다.",
    )


class ChatbotProductCandidate(BaseModel):
    # retrieval 연결 후 프론트 카드/리스트에 바로 매핑할 수 있는 최소 필드만 둡니다.
    productId: int | None = Field(default=None, description="상품 ID입니다.", examples=[5825])
    name: str = Field(description="상품명입니다.", examples=["워터 볼륨 아쿠아 젤 크림"])
    brandName: str | None = Field(default=None, description="브랜드명입니다.", examples=["미즈온"])
    reason: str | None = Field(
        default=None,
        description="왜 이 상품이 후보로 노출되었는지 보여주는 짧은 설명입니다.",
        examples=["크림 카테고리 / 관련 고민 수분, 진정 / 피부타입 힌트 combination"],
    )


class ChatbotCitation(BaseModel):
    type: str = Field(description="citation 종류입니다.", examples=["product"])
    productId: int | None = Field(default=None, description="근거가 된 상품 ID입니다.", examples=[5825])
    text: str | None = Field(
        default=None,
        description="사용자에게 보여줄 수 있는 짧은 근거 문장입니다.",
        examples=["워터 볼륨 아쿠아 젤 크림 (미즈온) / 관련 고민: 수분, 진정"],
    )
    title: str | None = Field(default=None, description="citation 제목입니다.", examples=["워터 볼륨 아쿠아 젤 크림"])
    snippet: str | None = Field(default=None, description="대표 근거 snippet입니다.")
    source: str | None = Field(default=None, description="어떤 검색 소스에서 잡혔는지 요약한 문자열입니다.", examples=["vector, keyword"])
    score: float | None = Field(default=None, description="최종 하이브리드 점수입니다.", examples=[0.9132])
    metadata: dict[str, Any] = Field(default_factory=dict, description="UI나 디버깅에 쓸 수 있는 추가 근거 메타데이터입니다.")


class ChatbotQueryResponse(BaseModel):
    # appliedFilters/citations는 retrieval이 붙었을 때 응답 설명력을 높이기 위한 확장 필드입니다.
    sessionId: str = Field(description="대화 세션 ID입니다.")
    responseType: Literal["product_recommendation", "informational", "fallback"] = Field(
        description="최종 응답 타입입니다."
    )
    answer: str = Field(description="사용자에게 보여줄 최종 자연어 응답입니다.")
    products: list[ChatbotProductCandidate] = Field(default_factory=list)
    appliedFilters: dict[str, Any] = Field(
        default_factory=dict,
        description="검색/생성 과정에서 실제 반영된 필터와 문맥 스냅샷입니다.",
    )
    citations: list[ChatbotCitation] = Field(
        default_factory=list,
        description="답변이나 추천의 근거 목록입니다.",
    )


class ChatbotRetrieveRequest(BaseModel):
    """검색 전용 retrieval 요청 스키마."""

    message: str = Field(
        min_length=1,
        max_length=2000,
        description=(
            "검색하고 싶은 자연어 질의입니다. "
            "카테고리, 피부 고민, 피하고 싶은 조건을 자연어로 적으면 retrieval이 이를 반영해 상품을 랭킹합니다."
        ),
        examples=["속건조인데 끈적이지 않는 진정 수분크림 추천해줘."],
    )
    sessionId: str | None = Field(
        default=None,
        description=(
            "같은 사용자의 후속 검색에서 직전 메시지와 최근 상품 맥락을 이어 붙이고 싶을 때 사용하는 세션 ID입니다. "
            "비워도 동작하며, 비운 경우 서버가 새 세션 ID를 발급합니다."
        ),
        examples=["retrieve-session-id"],
    )
    context: ChatbotClientContext | None = Field(
        default=None,
        description="현재 화면과 anchor 상품 같은 클라이언트 문맥입니다.",
    )
    userContext: ChatbotUserContext | None = Field(
        default=None,
        description="개인화 검색에 필요한 사용자 요약 문맥입니다.",
    )
    limit: int = Field(
        default=100,
        ge=1,
        le=100,
        description=(
            "반환할 최대 상품 수입니다. 검색 전용 엔드포인트이므로 최대 100개까지 요청할 수 있습니다. "
            "실제 반환 수는 필터, 제외 상품, 검색 결과 수에 따라 이보다 적을 수 있습니다."
        ),
        examples=[100],
    )


class ChatbotRetrieveProduct(BaseModel):
    productId: int = Field(description="검색 결과 상품 ID입니다.", examples=[5825])
    name: str = Field(description="상품명입니다.", examples=["워터 볼륨 아쿠아 젤 크림"])
    brandName: str | None = Field(default=None, description="브랜드명입니다.", examples=["미즈온"])
    categoryName: str | None = Field(default=None, description="카테고리명입니다.", examples=["크림"])
    score: float | None = Field(
        default=None,
        description="최종 하이브리드 랭킹 점수입니다. 정렬 기준으로 사용할 수 있습니다.",
        examples=[0.9132],
    )
    rawScore: float | None = Field(
        default=None,
        description="개별 검색 source에서 계산된 원시 점수입니다. source마다 의미는 다를 수 있어 참고용입니다.",
    )
    reason: str | None = Field(
        default=None,
        description="이 상품이 결과에 포함된 이유를 요약한 설명입니다.",
        examples=["크림 카테고리 / 관련 고민 수분, 진정 / 피부타입 힌트 combination"],
    )
    matchedSources: list[str] = Field(
        default_factory=list,
        description="이 상품을 찾은 검색 source 목록입니다. 예: vector, keyword.",
        examples=[["vector", "keyword"]],
    )
    concernNames: list[str] = Field(
        default_factory=list,
        description="상품과 연결된 피부 고민 태그 목록입니다.",
        examples=[["수분", "진정"]],
    )
    topSkinType: str | None = Field(default=None, description="대표 피부타입 힌트 1순위입니다.", examples=["combination"])
    top2SkinType: str | None = Field(default=None, description="대표 피부타입 힌트 2순위입니다.", examples=["dry"])
    ingredientPreview: str | None = Field(
        default=None,
        description="검색 설명에 쓰는 전성분 미리보기입니다.",
        examples=["정제수, 부틸렌글라이콜, 나이아신아마이드 등"],
    )
    evidenceSnippets: list[str] = Field(
        default_factory=list,
        description="검색 랭킹 근거로 사용한 짧은 snippet 목록입니다.",
    )
    scoreBreakdown: dict[str, float] = Field(
        default_factory=dict,
        description="vector/keyword/source signal 및 휴리스틱 가중치 합산 내역입니다. 디버깅 용도입니다.",
    )


class ChatbotRetrieveResponse(BaseModel):
    sessionId: str = Field(
        description="검색 세션 ID입니다. 다음 retrieval 요청에 다시 보내면 최근 메시지와 상품 문맥을 재사용할 수 있습니다."
    )
    query: str = Field(
        description="사용자가 보낸 원본 질의입니다.",
        examples=["속건조인데 끈적이지 않는 진정 수분크림 추천해줘."],
    )
    searchQuery: str = Field(
        description="서버가 실제 검색에 사용한 확장 질의 문자열입니다. 사용자 문맥, anchor 상품 정보가 추가될 수 있습니다."
    )
    requestedLimit: int = Field(description="클라이언트가 요청한 최대 반환 개수입니다.", examples=[100])
    returnedCount: int = Field(description="실제로 반환된 상품 수입니다.", examples=[74])
    searchLimit: int = Field(
        description="내부 vector/keyword search에 사용한 후보 조회 개수입니다. requestedLimit보다 크게 잡아 결과 손실을 줄입니다.",
        examples=[150],
    )
    hadSearchError: bool = Field(
        description="vector 또는 keyword search 중 일부 source가 실패했는지 여부입니다. 일부 실패여도 다른 source 결과로 200 응답을 줄 수 있습니다."
    )
    appliedFilters: dict[str, Any] = Field(
        default_factory=dict,
        description="검색에 실제 반영된 화면 문맥, 피부타입, 회피 성분, anchor 상품 여부 등의 스냅샷입니다.",
    )
    products: list[ChatbotRetrieveProduct] = Field(
        default_factory=list,
        description="최종 랭킹 순서대로 정렬된 상품 결과 목록입니다. 최대 100개까지 반환됩니다.",
    )
    citations: list[ChatbotCitation] = Field(
        default_factory=list,
        description="상품별 citation 목록입니다. 검색 결과 설명 또는 디버깅에 사용할 수 있습니다.",
    )
