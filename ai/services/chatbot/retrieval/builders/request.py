"""Retrieval 입력 조립 함수들.

질문 원문과 userContext를 그대로 검색에 넣으면 중복되거나 과한 신호가 섞일 수 있습니다.
여기서는 retrieval 단계가 공통으로 쓰는 입력값만 정리합니다.
"""

from services.chatbot.domain import QueryRequest
from services.chatbot.retrieval.parsers import canonicalize_avoid_term, extract_preferred_categories


FOLLOW_UP_HINTS: tuple[str, ...] = (
    "이거",
    "그거",
    "이 중",
    "둘 중",
    "뭐가 더",
    "어떤 게 더",
    "그럼",
    "그러면",
    "같은 조건",
    "방금",
    "아까",
)


def collect_applied_filters(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
    used_session_memory: bool = False,
) -> dict[str, object]:
    """응답에 다시 노출할 filter snapshot만 수집합니다."""
    applied_filters: dict[str, object] = {}
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
) -> tuple[str, bool]:
    """검색용 질의 문자열을 만듭니다.

    카테고리 의도가 이미 질문에 명시돼 있으면 원문을 우선합니다.
    그렇지 않으면 userContext의 고민/회피성분/피부타입을 덧붙여 검색 recall을 보완합니다.
    """
    message = request.message.strip()
    if extract_preferred_categories(message):
        return message, False

    parts = [message]
    used_session_memory = False
    if _should_use_session_memory(message, session_context):
        recent_messages = [
            str(item).strip()
            for item in (session_context or {}).get("recentUserMessages", [])
            if str(item).strip()
        ]
        if recent_messages:
            parts.append(f"직전 대화 주제: {recent_messages[-1]}")
            used_session_memory = True

    if request.user_context:
        if request.user_context.skin_problems:
            parts.append(f"피부고민: {', '.join(request.user_context.skin_problems)}")
        if request.user_context.disliked_ingredient_names and not any(
            _ingredient_already_mentioned(ingredient, message)
            for ingredient in request.user_context.disliked_ingredient_names
        ):
            # 이미 본문에 적힌 성분을 또 붙이면 같은 신호를 과하게 중복할 수 있습니다.
            parts.append(f"피하고 싶은 성분: {', '.join(request.user_context.disliked_ingredient_names)}")
        if request.user_context.my_skin_type:
            parts.append(f"피부타입: {request.user_context.my_skin_type}")
    return "\n".join(parts), used_session_memory


def build_excluded_product_ids(request: QueryRequest) -> set[int]:
    """사용자가 이미 갖고 있거나 싫다고 한 상품은 검색 후보에서 제외합니다."""
    if not request.user_context:
        return set()
    return set(request.user_context.my_product_ids) | set(request.user_context.disliked_product_ids)


def _should_use_session_memory(
    message: str,
    session_context: dict[str, object] | None,
) -> bool:
    if not session_context or not session_context.get("recentUserMessages"):
        return False
    collapsed_message = message.lower().replace(" ", "")
    if len(collapsed_message) <= 18:
        return True
    return any(hint.replace(" ", "") in collapsed_message for hint in FOLLOW_UP_HINTS)


def _ingredient_already_mentioned(ingredient: str, message: str) -> bool:
    lowered_message = message.lower()
    lowered_ingredient = ingredient.lower()
    canonical_term = canonicalize_avoid_term(ingredient)
    if lowered_ingredient in lowered_message:
        return True
    if canonical_term and canonical_term.lower() in lowered_message:
        return True
    return False
