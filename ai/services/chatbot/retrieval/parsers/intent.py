"""검색 내부 휴리스틱에 필요한 질문 판별 로직."""

from services.chatbot.retrieval.constants import STEP_HINTS, STRICT_FILTER_PATTERNS


def has_strict_filter_request(message: str) -> bool:
    """'무향', '무알코올'처럼 강한 제외 조건 요청인지 검사합니다."""
    lowered = message.lower()
    return any(pattern in lowered for pattern in STRICT_FILTER_PATTERNS)


def is_very_generic_query(message: str) -> bool:
    """카테고리보다 '무난한 것'을 찾는 일반 탐색형 질문인지 판단합니다."""
    if any(hint in message for hint in STEP_HINTS):
        return False

    generic_terms = (
        "무난",
        "순한",
        "안전",
        "편하게",
        "데일리",
        "실패 확률",
        "맞을 만한",
        "뭐가 있을까",
    )
    return any(term in message for term in generic_terms)
