"""피부 고민 / 회피 성분 파싱 로직."""

from services.chatbot.domain import QueryRequest
from services.chatbot.retrieval.constants import (
    AVOID_TERM_ALIASES,
    CANONICAL_AVOID_TERM_LOOKUP,
    CONCERN_HINTS,
)

NOISY_AVOID_ALIASES = {"오일"}


def extract_preferred_concerns(request: QueryRequest) -> set[str]:
    """질문 본문과 userContext를 합쳐 현재 중요 고민을 추출합니다."""
    preferred_concerns: set[str] = set()
    for concern in CONCERN_HINTS:
        if concern in request.message:
            preferred_concerns.add(concern)

    if request.user_context:
        preferred_concerns.update(request.user_context.skin_problems)
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


def extract_avoid_terms(request: QueryRequest) -> set[str]:
    """질문과 userContext에서 회피해야 할 대표 성분 그룹을 추출합니다."""
    avoid_terms: set[str] = set()
    avoid_terms.update(extract_avoid_terms_from_text(request.message))

    if request.user_context:
        for term in request.user_context.disliked_ingredient_names:
            avoid_terms.update(extract_avoid_terms_from_text(term))
    return avoid_terms


def extract_avoid_terms_from_text(text: str) -> set[str]:
    normalized = text.lower()
    matched: set[str] = set()

    for alias, canonical_term in CANONICAL_AVOID_TERM_LOOKUP.items():
        if alias in NOISY_AVOID_ALIASES:
            continue
        if alias in normalized:
            matched.add(canonical_term)
    return matched


def canonicalize_avoid_term(text: str) -> str | None:
    normalized = text.lower().strip()
    if not normalized:
        return None
    if normalized in CANONICAL_AVOID_TERM_LOOKUP and normalized not in NOISY_AVOID_ALIASES:
        return CANONICAL_AVOID_TERM_LOOKUP[normalized]

    for canonical_term, aliases in AVOID_TERM_ALIASES.items():
        if canonical_term in normalized:
            return canonical_term
        if any(
            alias.lower() not in NOISY_AVOID_ALIASES and alias.lower() in normalized
            for alias in aliases
        ):
            return canonical_term
    return None
