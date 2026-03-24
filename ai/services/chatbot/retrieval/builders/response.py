"""Retrieval 결과를 API 응답 친화적인 형태로 변환하는 함수들."""

from schemas.chatbot import ChatbotCitation, ChatbotProductCandidate
from services.chatbot.retrieval.parsers import (
    filter_display_concerns,
    has_strict_filter_request,
)
from services.chatbot.search.vector import ProductSearchResult


def to_product_candidate(
    result: ProductSearchResult,
    preferred_concerns: set[str],
) -> ChatbotProductCandidate:
    """검색 결과 1개를 카드 노출용 후보 객체로 바꿉니다."""
    return ChatbotProductCandidate(
        productId=result.product_id,
        name=result.name,
        brandName=result.brand_name,
        reason=_build_reason(result, preferred_concerns),
    )


def to_citation(
    result: ProductSearchResult,
    preferred_concerns: set[str],
) -> ChatbotCitation:
    """생성 모델이 참고할 수 있도록, 짧은 citation 텍스트를 만듭니다."""
    display_concerns = filter_display_concerns(result.concern_names, preferred_concerns)
    concern_text = f" / 관련 고민: {', '.join(display_concerns)}" if display_concerns else ""
    return ChatbotCitation(
        type="product",
        productId=result.product_id,
        text=f"{result.name} ({result.brand_name or '브랜드 미상'}){concern_text}",
    )


def build_retrieval_context(
    results: list[ProductSearchResult],
    preferred_concerns: set[str],
    message: str,
    avoid_terms: set[str],
) -> str:
    """LLM에 넣을 검색 요약 텍스트를 만듭니다.

    여기서는 카드에 뜬 후보를 짧게 나열하고, 말하면 안 되는 표현 제약도 함께 전달합니다.
    """
    lines = ["상품 검색으로 찾은 후보입니다:"]
    for result in results[:5]:
        line = f"- {result.name}"
        if result.brand_name:
            line += f" / 브랜드 {result.brand_name}"
        if result.category_name:
            line += f" / 카테고리 {result.category_name}"

        display_concerns = filter_display_concerns(result.concern_names, preferred_concerns)
        if display_concerns:
            line += f" / 관련 고민 {', '.join(display_concerns[:3])}"
        lines.append(line)

    if avoid_terms and has_strict_filter_request(message):
        # 회피 성분은 랭킹 신호라서, 답변에서는 확정 표현을 금지합니다.
        lines.append("피하고 싶은 성분 조건은 후보 정렬에 참고했지만, 전성분 완전 검증으로 단정할 수는 없다.")
        lines.append(
            "따라서 답변에서 '향료 없는 제품', '무알코올 제품', '배제한 제품'처럼 확정 표현은 쓰지 말고, 그런 조건을 함께 고려해 좁힌 후보라고만 설명해야 한다."
        )

    lines.append(
        "답변은 반드시 위 후보를 우선 참고하고, 찾지 못한 정보는 추측하지 말고 보수적으로 안내해야 합니다."
    )
    return "\n".join(lines)


def _build_reason(
    result: ProductSearchResult,
    preferred_concerns: set[str],
) -> str:
    """카드 하단에 노출할 짧은 추천 이유를 만듭니다."""
    reason_parts: list[str] = []
    if result.category_name:
        reason_parts.append(f"{result.category_name} 카테고리")

    display_concerns = filter_display_concerns(result.concern_names, preferred_concerns)
    if display_concerns:
        reason_parts.append(f"관련 고민 {', '.join(display_concerns[:3])}")

    skin_type_hints = [item for item in (result.top_skin_type, result.top2_skin_type) if item]
    if skin_type_hints:
        reason_parts.append(f"피부타입 힌트 {', '.join(skin_type_hints)}")

    return " / ".join(reason_parts) if reason_parts else "질문과 의미적으로 가까운 상품 후보입니다."
