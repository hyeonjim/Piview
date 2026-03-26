import re

from services.chatbot.domain import QueryRequest
from services.chatbot.input import (
    has_followup_signal,
    is_contextual_followup_without_context,
    is_likely_nonsense_input,
    normalize_message_for_chatbot,
)
from services.chatbot.intent.constants import (
    ANCHOR_PRODUCT_HINTS,
    FOLLOW_UP_HINTS,
    GREETING_FILLER_PATTERNS,
    GREETING_PATTERNS,
    INFORMATIONAL_HINTS,
    PRODUCT_SEARCHABLE_INFORMATIONAL_HINTS,
    REACTION_ONLY_PATTERNS,
    RECOMMENDATION_HINTS,
)
from services.chatbot.intent.models import IntentDecision
from services.chatbot.retrieval.parsers.category import extract_preferred_categories

try:
    from kiwipiepy import Kiwi
except ImportError:
    Kiwi = None

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None


_KIWI = Kiwi() if Kiwi is not None else None
_CONSTRAINT_ONLY_HINTS = (
    "향료",
    "무향",
    "무향료",
    "알코올",
    "무알코올",
    "에센셜오일",
    "에센셜 오일",
    "fragrance",
    "alcohol",
    "essential oil",
)


def route_by_rules(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
) -> IntentDecision | None:
    raw_message = request.message.strip()
    if not raw_message:
        return IntentDecision(
            intent_type="informational",
            route_source="rule",
            low_confidence=True,
            matched_rule="empty_message",
        )
    message = normalize_message_for_chatbot(raw_message)

    if is_likely_nonsense_input(raw_message):
        return IntentDecision(
            intent_type="informational",
            route_source="rule",
            low_confidence=True,
            matched_rule="nonsense_input",
        )

    if is_contextual_followup_without_context(raw_message, session_context):
        return IntentDecision(
            intent_type="informational",
            route_source="rule",
            low_confidence=True,
            matched_rule="followup_needs_context",
        )

    if _is_constraint_only_without_context(message, session_context=session_context):
        return IntentDecision(
            intent_type="informational",
            route_source="rule",
            low_confidence=True,
            matched_rule="constraint_needs_context",
        )

    if _is_greeting_only(message):
        return IntentDecision(
            intent_type="greeting_chitchat",
            route_source="rule",
            matched_rule="greeting_only",
        )

    if _is_followup_request(message, session_context=session_context):
        return IntentDecision(
            intent_type="recommendation_followup",
            route_source="rule",
            use_product_retrieval=True,
            matched_rule="followup_hint",
            low_confidence=not _has_anchor_context(request, session_context=session_context),
        )

    if _is_recommendation_request(message):
        return IntentDecision(
            intent_type="recommendation_fresh",
            route_source="rule",
            use_product_retrieval=True,
            matched_rule="recommendation_hint",
        )

    if _is_searchable_informational(message):
        return IntentDecision(
            intent_type="informational",
            route_source="rule",
            use_product_retrieval=True,
            matched_rule="searchable_informational",
        )

    if _is_general_informational(message):
        return IntentDecision(
            intent_type="informational",
            route_source="rule",
            matched_rule="general_informational",
        )

    return None


def _is_greeting_only(message: str) -> bool:
    if _is_bot_name_call(message):
        return True

    if _is_reaction_only(message):
        return True

    normalized_tokens = _tokenize(message)
    if not normalized_tokens:
        return False

    collapsed = "".join(normalized_tokens)
    if collapsed in GREETING_PATTERNS or collapsed in GREETING_FILLER_PATTERNS:
        return True

    if len(normalized_tokens) > 3:
        return False

    for token in normalized_tokens:
        if token in GREETING_PATTERNS or token in GREETING_FILLER_PATTERNS:
            continue
        if _is_fuzzy_greeting(token):
            continue
        return False
    return True


def _is_followup_request(
    message: str,
    session_context: dict[str, object] | None,
) -> bool:
    if not session_context:
        return False
    if not session_context.get("recentUserMessages") and not session_context.get("recentProductIds"):
        return False
    return has_followup_signal(message)


def _has_anchor_context(
    request: QueryRequest,
    session_context: dict[str, object] | None,
) -> bool:
    if request.client_context and request.client_context.current_product_id is not None:
        return True
    if session_context and session_context.get("currentProductId") is not None:
        return True
    if session_context and session_context.get("recentProductIds"):
        return True
    lowered = _collapse(request.message)
    return any(_collapse(hint) in lowered for hint in ANCHOR_PRODUCT_HINTS)


def _is_recommendation_request(message: str) -> bool:
    lowered = _collapse(message)
    if any(_collapse(hint) in lowered for hint in RECOMMENDATION_HINTS):
        return True
    return bool(extract_preferred_categories(message))


def _is_searchable_informational(message: str) -> bool:
    lowered = _collapse(message)
    if extract_preferred_categories(message):
        return True
    return any(_collapse(hint) in lowered for hint in PRODUCT_SEARCHABLE_INFORMATIONAL_HINTS)


def _is_general_informational(message: str) -> bool:
    lowered = _collapse(message)
    if any(_collapse(hint) in lowered for hint in INFORMATIONAL_HINTS):
        return True
    return message.endswith("?") or message.endswith("요") or message.endswith("까")


def _is_constraint_only_without_context(
    message: str,
    session_context: dict[str, object] | None,
) -> bool:
    if _has_session_context(session_context):
        return False
    if extract_preferred_categories(message):
        return False

    normalized = message.lower()
    if not any(hint in normalized for hint in _CONSTRAINT_ONLY_HINTS):
        return False

    if any(token in normalized for token in ("추천", "제품", "크림", "토너", "세럼", "로션", "선크림")):
        return False

    tokens = re.findall(r"[0-9a-z가-힣]+", normalized)
    return 0 < len(tokens) <= 6


def _tokenize(message: str) -> list[str]:
    normalized = re.sub(r"[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ\s]+", " ", message.lower()).strip()
    if not normalized:
        return []
    if _KIWI is None:
        return [token for token in normalized.split() if token]
    tokens = [
        token.form
        for token in _KIWI.tokenize(normalized)
        if token.form and not token.form.isspace()
    ]
    return tokens or [token for token in normalized.split() if token]


def _collapse(message: str) -> str:
    return re.sub(r"\s+", "", message.lower())


def _is_bot_name_call(message: str) -> bool:
    collapsed = re.sub(r"[^0-9a-z가-힣]+", "", message.lower())
    if not collapsed:
        return False
    return bool(re.fullmatch(r"(?:저기)?(?:gamini|가민|가민이|가민아)(?:야|아)?", collapsed))


def _has_session_context(session_context: dict[str, object] | None) -> bool:
    if not session_context:
        return False
    return bool(
        session_context.get("recentUserMessages")
        or session_context.get("recentProductIds")
        or session_context.get("currentProductId") is not None
    )


def _is_reaction_only(message: str) -> bool:
    collapsed = _collapse(message)
    if not collapsed:
        return False

    if re.fullmatch(r"[ㅋㅎㅠㅜ!?.,~]+", collapsed):
        return True

    allowed_chars = set("".join(REACTION_ONLY_PATTERNS) + "!?.,~")
    meaningful_chars = [char for char in collapsed if char not in allowed_chars]
    if meaningful_chars:
        return False

    reaction_chars = sum(1 for char in collapsed if char in allowed_chars)
    return reaction_chars >= max(2, len(collapsed) - 1)


def _is_fuzzy_greeting(token: str) -> bool:
    if fuzz is None:
        return False
    candidates = (*GREETING_PATTERNS, *GREETING_FILLER_PATTERNS)
    return any(fuzz.ratio(token, candidate) >= 85 for candidate in candidates)
