from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.retrieval.constants import AVOID_TERM_ALIASES, SAFE_FREE_PATTERNS
from services.chatbot.retrieval.parsers import has_strict_filter_request


def avoid_term_penalty(result: ProductSearchResult, avoid_terms: set[str]) -> float:
    if not avoid_terms:
        return 0.0

    penalty = 0.0
    for avoid_term in avoid_terms:
        if matches_specific_avoid_term(result, avoid_term):
            penalty += 1.25
    return penalty


def matches_avoid_term(result: ProductSearchResult, avoid_terms: set[str]) -> bool:
    return any(matches_specific_avoid_term(result, avoid_term) for avoid_term in avoid_terms)


def matches_specific_avoid_term(
    result: ProductSearchResult,
    avoid_term: str,
) -> bool:
    search_targets = " ".join(
        [
            result.name.lower(),
            (result.category_name or "").lower(),
            result.document.lower(),
        ]
    )
    aliases = AVOID_TERM_ALIASES.get(avoid_term, ())
    safe_patterns = SAFE_FREE_PATTERNS.get(avoid_term, ())
    if any(pattern.lower() in search_targets for pattern in safe_patterns):
        return False
    return any(alias.lower() in search_targets for alias in aliases)


def strict_filter_penalty(
    result: ProductSearchResult,
    message: str,
    avoid_terms: set[str],
) -> float:
    if not avoid_terms or not has_strict_filter_request(message):
        return 0.0
    if not matches_avoid_term(result, avoid_terms):
        return 0.0

    explicit_terms = sum(1 for term in ("향료", "알코올", "에센셜오일") if term in message)
    return 0.7 if explicit_terms >= 2 else 0.35
