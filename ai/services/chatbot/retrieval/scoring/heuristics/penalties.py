from services.chatbot.search.vector import ProductSearchResult
from services.chatbot.retrieval.constants import (
    CONTEXT_MISMATCH_TERMS,
    HEAVY_TEXTURE_TERMS,
    NON_SKINCARE_TERMS,
)


def oil_feel_penalty(result: ProductSearchResult, message: str) -> float:
    if "오일" not in message:
        return 0.0
    if not any(term in message for term in ("싫", "피하", "부담", "덜", "없는")):
        return 0.0

    search_targets = " ".join(
        [
            result.name.lower(),
            (result.category_name or "").lower(),
            result.document.lower(),
        ]
    )
    return 0.45 if "오일" in search_targets else 0.0


def context_mismatch_penalty(result: ProductSearchResult, message: str) -> float:
    lowered_message = message.lower()
    search_targets = " ".join([result.name.lower(), (result.category_name or "").lower()])

    penalty = 0.0
    for term in CONTEXT_MISMATCH_TERMS:
        if term in search_targets and term not in lowered_message:
            penalty += 0.22
    return penalty


def non_skincare_penalty(result: ProductSearchResult, message: str) -> float:
    lowered_message = message.lower()
    search_targets = " ".join([result.name.lower(), (result.category_name or "").lower()])

    penalty = 0.0
    for term in NON_SKINCARE_TERMS:
        if term in search_targets and term not in lowered_message:
            penalty += 0.85
    return penalty


def heavy_texture_penalty(result: ProductSearchResult, message: str) -> float:
    if not any(term in message for term in ("밤 타입", "밤타입", "무거운", "무겁", "답답")):
        return 0.0

    search_targets = " ".join(
        [
            result.name.lower(),
            (result.category_name or "").lower(),
            result.document.lower(),
        ]
    )
    return 0.65 if any(term in search_targets for term in HEAVY_TEXTURE_TERMS) else 0.0
