from services.chatbot.retrieval.constants import (
    CLARIFYING_PATTERNS,
    STEP_HINTS,
    STRICT_FILTER_PATTERNS,
)


def needs_clarifying_question(
    message: str,
    preferred_categories: set[str],
) -> bool:
    if preferred_categories:
        return False
    lowered = message.lower()
    return any(pattern in lowered for pattern in CLARIFYING_PATTERNS)


def has_strict_filter_request(message: str) -> bool:
    lowered = message.lower()
    return any(pattern in lowered for pattern in STRICT_FILTER_PATTERNS)


def is_very_generic_query(message: str) -> bool:
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
