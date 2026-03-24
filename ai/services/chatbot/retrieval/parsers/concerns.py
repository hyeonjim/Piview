"""피부 고민 / 회피 성분 파싱 로직."""

from schemas.chatbot import ChatbotQueryRequest
from services.chatbot.retrieval.constants import AVOID_TERM_ALIASES, CONCERN_HINTS


def extract_preferred_concerns(request: ChatbotQueryRequest) -> set[str]:
    """질문 본문과 userContext를 합쳐 현재 중요 고민을 추출합니다."""
    preferred_concerns: set[str] = set()
    for concern in CONCERN_HINTS:
        if concern in request.message:
            preferred_concerns.add(concern)

    if request.userContext:
        preferred_concerns.update(request.userContext.skinProblems)
    return preferred_concerns


def filter_display_concerns(
    concern_names: list[str],
    preferred_concerns: set[str],
) -> list[str]:
    """노출용 고민 라벨을 최대 3개로 줄입니다.

    사용자가 특정 고민을 말한 경우에는 그 고민과 겹치는 라벨만 보여줍니다.
    """
    if not concern_names:
        return []
    if not preferred_concerns:
        return concern_names[:3]

    matched = [
        concern_name
        for concern_name in concern_names
        if any(preferred in concern_name for preferred in preferred_concerns)
    ]
    return matched[:3] if matched else []


def extract_avoid_terms(request: ChatbotQueryRequest) -> set[str]:
    """질문과 userContext에서 회피해야 할 대표 성분 그룹을 추출합니다."""
    avoid_terms: set[str] = set()
    for term in AVOID_TERM_ALIASES:
        if term in request.message:
            avoid_terms.add(term)

    if request.userContext:
        for term in request.userContext.dislikedIngredientNames:
            if term in AVOID_TERM_ALIASES:
                avoid_terms.add(term)
    return avoid_terms
