from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.retrieval.constants import CATEGORY_HINTS


def category_priority(
    result: ProductSearchResult,
    preferred_categories: set[str],
) -> int:
    if not preferred_categories:
        return 0

    search_targets = " ".join(
        [
            (result.category_name or "").lower(),
            result.name.lower(),
            result.document.lower(),
        ]
    )
    for category_key in preferred_categories:
        aliases = CATEGORY_HINTS.get(category_key, ())
        if result.category_name and any(alias.lower() in result.category_name.lower() for alias in aliases):
            return 3
        if any(alias.lower() in result.name.lower() for alias in aliases):
            return 2
        if any(alias.lower() in search_targets for alias in aliases):
            return 1
    return 0


def category_score_bonus(
    result: ProductSearchResult,
    preferred_categories: set[str],
) -> float:
    priority = category_priority(result, preferred_categories)
    if priority == 3:
        return 0.35
    if priority == 2:
        return 0.2
    if priority == 1:
        return 0.08
    return 0.0


def missing_category_bonus(
    result: ProductSearchResult,
    missing_categories: set[str],
) -> float:
    priority = category_priority(result, missing_categories)
    if priority == 3:
        return 0.45
    if priority == 2:
        return 0.28
    if priority == 1:
        return 0.12
    return 0.0


def existing_category_penalty(
    result: ProductSearchResult,
    existing_categories: set[str],
) -> float:
    priority = category_priority(result, existing_categories)
    if priority == 3:
        return 0.62
    if priority == 2:
        return 0.34
    if priority == 1:
        return 0.16
    return 0.0
