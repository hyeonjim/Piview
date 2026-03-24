from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.retrieval.scoring.category import category_priority


def care_gap_bonus(
    result: ProductSearchResult,
    message: str,
    existing_categories: set[str],
    missing_categories: set[str],
) -> float:
    if missing_categories or not existing_categories:
        return 0.0

    category_name = (result.category_name or "").lower()
    if any(term in message for term in ("보습", "수분", "건조", "속건조")):
        if any(category in existing_categories for category in ("sunscreen", "cleanser")):
            if any(
                key in category_name
                for key in ("스킨/토너", "미스트", "크림", "로션", "에멀", "에센스", "세럼", "앰플")
            ):
                return 0.4
    return 0.0


def care_gap_penalty(
    result: ProductSearchResult,
    message: str,
    existing_categories: set[str],
    missing_categories: set[str],
) -> float:
    if missing_categories or not existing_categories:
        return 0.0

    penalty = 0.0
    category_name = (result.category_name or "").lower()
    if any(term in message for term in ("보습", "수분", "건조", "속건조")):
        if "sunscreen" in existing_categories and ("선크림" in category_name or "선케어" in category_name):
            penalty += 0.55
        if "cleanser" in existing_categories and any(
            key in category_name for key in ("클렌징", "클렌저", "폼", "워터")
        ):
            penalty += 0.45
    return penalty


def should_demote_existing_categories_for_gap(
    message: str,
    existing_categories: set[str],
    missing_categories: set[str],
) -> bool:
    if missing_categories or not existing_categories:
        return False
    if not any(term in message for term in ("보습", "수분", "건조", "속건조", "부족")):
        return False
    return any(category in existing_categories for category in ("sunscreen", "cleanser"))


def hydration_gap_adjustment(
    result: ProductSearchResult,
    message: str,
    existing_categories: set[str],
    missing_categories: set[str],
) -> float:
    if missing_categories or not existing_categories:
        return 0.0
    if not any(term in message for term in ("보습", "수분", "건조", "속건조", "부족")):
        return 0.0
    if not any(category in existing_categories for category in ("sunscreen", "cleanser")):
        return 0.0

    if category_priority(result, {"cream", "lotion"}) > 0:
        return 0.24
    if category_priority(result, {"serum"}) > 0:
        return 0.16
    if category_priority(result, {"toner", "mist"}) > 0:
        return -0.08
    return 0.0
