"""Retrieval 입력 조립 함수들.

질문 원문과 userContext를 그대로 검색에 넣으면 중복되거나 과한 신호가 섞일 수 있습니다.
여기서는 retrieval 단계가 공통으로 쓰는 입력값만 정리합니다.
"""

from services.chatbot.domain import QueryRequest
from services.chatbot.context import (
    build_slot_memory_lines,
    build_slot_priority_lines,
    extract_overwrite_focus_slots,
    has_slot_update_signal,
)
from services.chatbot.input.preprocess import (
    has_followup_signal,
    is_replace_followup,
    normalize_message_for_chatbot,
)
from services.chatbot.intent.models import IntentDecision
from services.chatbot.intent.constants import ANCHOR_PRODUCT_HINTS
from services.chatbot.retrieval.constants import CATEGORY_HINTS
from services.chatbot.retrieval.parsers import canonicalize_avoid_term, extract_preferred_categories
from services.chatbot.search.product_data import (
    build_ingredient_preview,
    product_search_data_repository,
    truncate_text,
)


def collect_applied_filters(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
    used_session_memory: bool = False,
    used_anchor_products: bool = False,
    intent_decision: IntentDecision | None = None,
) -> dict[str, object]:
    """응답에 다시 노출할 filter snapshot만 수집합니다."""
    applied_filters: dict[str, object] = {}
    if intent_decision is not None:
        applied_filters["intentType"] = intent_decision.intent_type
        applied_filters["routeSource"] = intent_decision.route_source
        applied_filters["lowConfidence"] = intent_decision.low_confidence
        applied_filters["usedProductRetrieval"] = intent_decision.use_product_retrieval
    effective_screen = (
        request.client_context.screen
        if request.client_context and request.client_context.screen
        else None
    )
    if not effective_screen and session_context:
        effective_screen = session_context.get("screen")
    effective_product_id = (
        request.client_context.current_product_id
        if request.client_context and request.client_context.current_product_id is not None
        else None
    )
    if effective_product_id is None and session_context:
        effective_product_id = session_context.get("currentProductId")

    if effective_screen:
        applied_filters["screen"] = effective_screen
    if effective_product_id is not None:
        applied_filters["currentProductId"] = effective_product_id
    if used_session_memory:
        applied_filters["usedSessionMemory"] = True
    if used_anchor_products:
        applied_filters["usedAnchorProducts"] = True

    if not request.user_context:
        return applied_filters

    if request.user_context.my_skin_type:
        applied_filters["mySkinType"] = request.user_context.my_skin_type
    if request.user_context.skin_problems:
        applied_filters["skinProblems"] = request.user_context.skin_problems
    if request.user_context.disliked_ingredient_names:
        applied_filters["dislikedIngredientNames"] = request.user_context.disliked_ingredient_names
    return applied_filters


def build_search_query(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
) -> tuple[str, bool, bool]:
    """검색용 질의 문자열을 만듭니다.

    원문을 우선하되, userContext의 고민/회피성분/피부타입을 필요할 때 함께 붙여
    검색 recall과 개인화 신호를 보완합니다.
    """
    message = request.message.strip()
    normalized_message = normalize_message_for_chatbot(message)
    overwrite_focus_slots = extract_overwrite_focus_slots(normalized_message or message)
    parts = [normalized_message or message]
    focus_category_source = (
        ", ".join(overwrite_focus_slots.get("categories", []))
        if overwrite_focus_slots.get("categories")
        else normalized_message or message
    )
    has_explicit_category = bool(extract_preferred_categories(focus_category_source))
    if has_explicit_category:
        category_aliases = _resolve_preferred_category_aliases(focus_category_source)
        if category_aliases:
            parts.append(f"카테고리 조건: {', '.join(category_aliases)}")
    used_session_memory = False
    used_anchor_products = False
    if _should_use_session_memory(normalized_message or message, session_context):
        priority_lines = build_slot_priority_lines(normalized_message or message)
        if priority_lines:
            parts.extend(priority_lines)
        recent_messages = [
            str(item).strip()
            for item in (session_context or {}).get("recentUserMessages", [])
            if str(item).strip()
        ]
        if recent_messages:
            parts.append(f"이전 추천 조건: {recent_messages[-1]}")
            used_session_memory = True
        slot_memory_lines = build_slot_memory_lines(
            (session_context or {}).get("recentSlots"),
            message=normalized_message or message,
            has_explicit_category=has_explicit_category,
        )
        if slot_memory_lines:
            parts.extend(slot_memory_lines)
            used_session_memory = True
        if is_replace_followup(normalized_message) and (session_context or {}).get("recentProductIds"):
            parts.append("직전 추천 상품과는 다른 후보를 우선해서 찾는다.")

    anchor_context_lines = _build_anchor_product_context(normalized_message or message, request, session_context)
    if anchor_context_lines:
        parts.extend(anchor_context_lines)
        used_anchor_products = True

    if request.user_context:
        personalization_lines = _build_user_context_query_parts(
            normalized_message or message,
            request,
            has_explicit_category=has_explicit_category,
        )
        parts.extend(personalization_lines)
    return "\n".join(parts), used_session_memory, used_anchor_products


def build_excluded_product_ids(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
) -> set[int]:
    """사용자가 이미 갖고 있거나 싫다고 한 상품은 검색 후보에서 제외합니다."""
    excluded_ids: set[int] = set()
    if request.user_context:
        excluded_ids.update(request.user_context.my_product_ids)
        excluded_ids.update(request.user_context.disliked_product_ids)

    if session_context and is_replace_followup(request.message):
        for product_id in session_context.get("recentProductIds", []):
            try:
                excluded_ids.add(int(product_id))
            except (TypeError, ValueError):
                continue
    return excluded_ids


def _should_use_session_memory(
    message: str,
    session_context: dict[str, object] | None,
) -> bool:
    if not session_context or not session_context.get("recentUserMessages"):
        return False
    return has_followup_signal(message) or has_slot_update_signal(message)


def _ingredient_already_mentioned(ingredient: str, message: str) -> bool:
    lowered_message = message.lower()
    lowered_ingredient = ingredient.lower()
    canonical_term = canonicalize_avoid_term(ingredient)
    if lowered_ingredient in lowered_message:
        return True
    if canonical_term and canonical_term.lower() in lowered_message:
        return True
    return False


def _build_anchor_product_context(
    message: str,
    request: QueryRequest,
    session_context: dict[str, object] | None,
) -> list[str]:
    anchor_product_ids = _collect_anchor_product_ids(request, session_context)
    if not anchor_product_ids or not _should_use_anchor_product_context(message, anchor_product_ids):
        return []

    try:
        rows = product_search_data_repository.fetch_products_for_indexing(
            product_ids=anchor_product_ids[:2]
        )
    except Exception:
        return []

    if not rows:
        return []

    lines = ["기준 상품 정보:"]
    for row in rows[:2]:
        parts = [f"- 상품명 {row.name}"]
        if row.brand_name:
            parts.append(f"브랜드 {row.brand_name}")
        if row.category_name:
            parts.append(f"카테고리 {row.category_name}")
        if row.concern_names:
            parts.append(f"관련 고민 {', '.join(row.concern_names[:3])}")
        description = truncate_text(row.description, 140)
        if description:
            parts.append(f"설명 {description}")
        ingredient_preview = build_ingredient_preview(
            row.ingredient_text_ko,
            row.ingredient_text_en,
            limit=6,
        )
        if ingredient_preview:
            parts.append(f"전성분 메모 {ingredient_preview}")
        lines.append(" / ".join(parts))
    return lines


def _collect_anchor_product_ids(
    request: QueryRequest,
    session_context: dict[str, object] | None,
) -> list[int]:
    candidate_ids: list[int] = []
    if request.client_context and request.client_context.current_product_id is not None:
        candidate_ids.append(request.client_context.current_product_id)
    elif session_context and session_context.get("currentProductId") is not None:
        candidate_ids.append(int(session_context["currentProductId"]))

    if session_context:
        for product_id in session_context.get("recentProductIds", []):
            try:
                candidate_ids.append(int(product_id))
            except (TypeError, ValueError):
                continue

    ordered_ids: list[int] = []
    seen: set[int] = set()
    for product_id in candidate_ids:
        if product_id in seen:
            continue
        seen.add(product_id)
        ordered_ids.append(product_id)
    return ordered_ids


def _should_use_anchor_product_context(message: str, anchor_product_ids: list[int]) -> bool:
    if not anchor_product_ids:
        return False
    collapsed_message = message.lower().replace(" ", "")
    return any(hint.replace(" ", "") in collapsed_message for hint in ANCHOR_PRODUCT_HINTS)


def _build_user_context_query_parts(
    message: str,
    request: QueryRequest,
    *,
    has_explicit_category: bool,
) -> list[str]:
    user_context = request.user_context
    if user_context is None:
        return []

    parts: list[str] = []
    if user_context.skin_problems:
        if not has_explicit_category or not any(problem in message for problem in user_context.skin_problems):
            parts.append(f"피부고민: {', '.join(user_context.skin_problems)}")

    missing_ingredients = [
        ingredient
        for ingredient in user_context.disliked_ingredient_names
        if not _ingredient_already_mentioned(ingredient, message)
    ]
    if missing_ingredients:
        parts.append(f"피하고 싶은 성분: {', '.join(missing_ingredients)}")

    if user_context.my_skin_type:
        normalized_skin_type = user_context.my_skin_type.lower()
        if not has_explicit_category or normalized_skin_type not in message.lower():
            parts.append(f"피부타입: {user_context.my_skin_type}")

    return parts


def _resolve_preferred_category_aliases(message: str) -> list[str]:
    aliases: list[str] = []
    seen: set[str] = set()
    for category_key in extract_preferred_categories(message):
        for alias in CATEGORY_HINTS.get(category_key, ()):
            normalized = alias.strip()
            if not normalized or normalized.lower() in seen:
                continue
            seen.add(normalized.lower())
            aliases.append(normalized)
    return aliases
