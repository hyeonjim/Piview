from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.retrieval.constants import (
    ACUTE_NEGATIVE_TERMS,
    ACUTE_SENSITIVITY_HINTS,
    BRIGHTENING_TERMS,
    CALMING_POSITIVE_TERMS,
    LIGHTWEIGHT_HINTS,
    SIMILAR_CANDIDATE_HINTS,
    SPECIALIZED_AGEING_TERMS,
    SPECIALIZED_SEBUM_TERMS,
    STEP_HINTS,
)
from services.chatbot.retrieval.parsers import is_very_generic_query


def generic_query_bonus(
    result: ProductSearchResult,
    message: str,
    preferred_categories: set[str],
) -> float:
    if preferred_categories:
        return 0.0

    category_name = (result.category_name or "").lower()
    bonus = 0.0

    if any(hint in message for hint in LIGHTWEIGHT_HINTS):
        if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
            bonus += 0.08
        if "크림" in category_name:
            bonus -= 0.05

    if any(hint in message for hint in STEP_HINTS):
        if any(alias in category_name for alias in ("스킨/토너", "에센스/앰플/세럼")):
            bonus += 0.12
        if "크림" in category_name:
            bonus -= 0.08

    if ("건조" in message or "속건조" in message) and "크림" in category_name:
        bonus += 0.03
    if "번들거" in message and "크림" in category_name:
        bonus -= 0.04

    if any(term in message for term in ("답답", "무거운", "무겁")):
        if "크림" in category_name:
            bonus -= 0.12
        if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
            bonus += 0.08

    if is_very_generic_query(message):
        if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
            bonus += 0.06
        if "크림" in category_name:
            bonus -= 0.06

    if any(hint in message for hint in ACUTE_SENSITIVITY_HINTS):
        search_targets = " ".join(
            [
                result.name.lower(),
                category_name,
                result.document.lower(),
                " ".join(result.concern_names).lower(),
            ]
        )
        if any(term in search_targets for term in CALMING_POSITIVE_TERMS):
            bonus += 0.16
        if any(term in search_targets for term in ACUTE_NEGATIVE_TERMS):
            bonus -= 0.18
        if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼", "크림")):
            bonus += 0.04

    return bonus


def specialized_mismatch_penalty(
    result: ProductSearchResult,
    message: str,
    preferred_categories: set[str],
) -> float:
    if preferred_categories:
        return 0.0
    if not (is_very_generic_query(message) or any(term in message for term in STEP_HINTS)):
        return 0.0

    search_targets = " ".join(
        [
            result.name.lower(),
            (result.category_name or "").lower(),
            result.document.lower(),
            " ".join(result.concern_names).lower(),
        ]
    )

    penalty = 0.0
    if not any(term in message for term in ("피지", "유분", "번들", "트러블", "여드름", "모공")):
        if any(term in search_targets for term in SPECIALIZED_SEBUM_TERMS):
            penalty += 0.22
    if not any(term in message for term in ("주름", "탄력", "노화", "리프팅", "콜라겐")):
        if any(term in search_targets for term in SPECIALIZED_AGEING_TERMS):
            penalty += 0.16
    return penalty


def brightening_bonus(result: ProductSearchResult, message: str) -> float:
    if not any(term in message for term in BRIGHTENING_TERMS):
        return 0.0

    search_targets = " ".join(
        [
            result.name.lower(),
            (result.category_name or "").lower(),
            result.document.lower(),
            " ".join(result.concern_names).lower(),
        ]
    )
    return 0.28 if any(term in search_targets for term in BRIGHTENING_TERMS) else -0.12


def sensitivity_dryness_bonus(
    result: ProductSearchResult,
    message: str,
    preferred_categories: set[str],
) -> float:
    if preferred_categories:
        return 0.0
    if not any(term in message for term in ("민감", "예민")):
        return 0.0
    if not any(term in message for term in ("건조", "속건조", "수분", "보습")):
        return 0.0

    category_name = (result.category_name or "").lower()
    if any(alias in category_name for alias in ("에센스/앰플/세럼", "크림", "로션", "에멀", "미스트")):
        return 0.12
    if "스킨/토너" in category_name:
        return -0.04
    return 0.0


def similar_candidate_adjustment(
    result: ProductSearchResult,
    message: str,
    preferred_categories: set[str],
) -> float:
    if preferred_categories:
        return 0.0
    if not any(term in message for term in SIMILAR_CANDIDATE_HINTS):
        return 0.0

    category_name = (result.category_name or "").lower()
    if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
        return 0.08
    if "크림" in category_name:
        return -0.12
    return 0.0
