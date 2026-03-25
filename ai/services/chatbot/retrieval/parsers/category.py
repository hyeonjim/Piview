"""카테고리 의도 파싱 로직."""

from services.chatbot.retrieval.constants import (
    CATEGORY_HINTS,
    EXISTING_CATEGORY_MARKERS,
    MISSING_CATEGORY_MARKERS,
)


def extract_preferred_categories(message: str) -> set[str]:
    """질문 원문에서 직접 원하는 카테고리를 추출합니다."""
    lowered = message.lower()
    preferred_categories: set[str] = set()
    for category_key, aliases in CATEGORY_HINTS.items():
        if any(alias.lower() in lowered for alias in aliases):
            preferred_categories.add(category_key)

    # 선크림 질문에서 "크림" substring 때문에 크림 카테고리가 섞이는 것을 막습니다.
    if "sunscreen" in preferred_categories:
        preferred_categories.discard("cream")
    return preferred_categories


def extract_existing_categories(message: str) -> set[str]:
    """이미 가지고 있다고 말한 카테고리를 추출합니다."""
    return _extract_category_mentions(message, EXISTING_CATEGORY_MARKERS)


def extract_missing_categories(message: str) -> set[str]:
    """부족하거나 추가하고 싶다고 말한 카테고리를 추출합니다."""
    return _extract_category_mentions(message, MISSING_CATEGORY_MARKERS)


def _extract_category_mentions(message: str, markers: tuple[str, ...]) -> set[str]:
    """조사까지 붙은 자연어 표현을 완전한 형태로 검사합니다.

    예: "토너는 있는데", "세럼이 없어서"
    """
    collapsed = message.lower().replace(" ", "")
    particles = ("", "은", "는", "이", "가")
    matched: set[str] = set()

    for category_key, aliases in CATEGORY_HINTS.items():
        for alias in aliases:
            alias_token = alias.lower().replace(" ", "")
            if any(
                f"{alias_token}{particle}{marker}" in collapsed
                for particle in particles
                for marker in markers
            ):
                matched.add(category_key)
                break
    return matched
