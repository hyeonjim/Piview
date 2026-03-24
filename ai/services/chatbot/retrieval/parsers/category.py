from services.chatbot.retrieval.constants import (
    CATEGORY_HINTS,
    EXISTING_CATEGORY_MARKERS,
    MISSING_CATEGORY_MARKERS,
)


def extract_preferred_categories(message: str) -> set[str]:
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
    return _extract_category_mentions(message, EXISTING_CATEGORY_MARKERS)


def extract_missing_categories(message: str) -> set[str]:
    return _extract_category_mentions(message, MISSING_CATEGORY_MARKERS)


def _extract_category_mentions(message: str, markers: tuple[str, ...]) -> set[str]:
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
