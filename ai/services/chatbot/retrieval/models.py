from dataclasses import dataclass, field
from typing import Any

from services.chatbot.domain import Citation, ProductCandidate, ResponseType


@dataclass
class RetrievalBundle:
    # 검색 결과가 비어도 downstream 응답 형태는 동일하게 유지합니다.
    response_type: ResponseType = "informational"
    products: list[ProductCandidate] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)
    applied_filters: dict[str, Any] = field(default_factory=dict)
    retrieval_context: str = (
        "현재 상품 retrieval은 아직 연결 전 상태입니다. "
        "실제 상품 추천 대신 일반적인 화장품 선택 가이드를 제공해야 합니다."
    )
