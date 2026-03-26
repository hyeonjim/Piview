from services.chatbot.domain import ClientContext, QueryRequest
from services.chatbot.intent.models import IntentDecision


def build_skin_problem_hint(request: QueryRequest) -> str:
    if not request.user_context or not request.user_context.skin_problems:
        return ""

    concerns = request.user_context.skin_problems[:2]
    if len(concerns) == 1:
        return f"{concerns[0]} 쪽을 같이 보고 계시니, "
    return f"{concerns[0]}과 {concerns[1]}을 같이 보고 계시니, "


def extract_category_hint(reason: str | None) -> str:
    if not reason or "카테고리" not in reason:
        return ""
    return reason.split(" 카테고리")[0].split(" / ")[-1]


def build_effective_client_context(
    request: QueryRequest,
    session_context: dict | None,
) -> ClientContext | None:
    current_screen = (
        request.client_context.screen
        if request.client_context and request.client_context.screen
        else None
    )
    current_product_id = (
        request.client_context.current_product_id
        if request.client_context and request.client_context.current_product_id is not None
        else None
    )
    fallback_screen = session_context.get("screen") if session_context else None
    fallback_product_id = session_context.get("currentProductId") if session_context else None

    screen = current_screen or fallback_screen
    current_product_id = (
        current_product_id if current_product_id is not None else fallback_product_id
    )
    if screen is None and current_product_id is None:
        return None
    return ClientContext(
        screen=screen,
        current_product_id=current_product_id,
    )


def build_effective_llm_session_context(
    session_context: dict | None,
    intent_decision: IntentDecision,
) -> dict | None:
    """LLM에 넘길 세션 메모를 최소화합니다.

    새 질문까지 직전 대화 메모를 항상 주면, 의미 없는 입력이 필터를 통과했을 때
    이전 주제를 이어서 답하는 현상이 생깁니다. 따라서 후속 질문으로 판단된 경우에만
    recentUserMessages/recentAnswers/recentProductIds를 전달하고,
    그 외에는 화면 정보만 유지합니다.
    """
    if not session_context:
        return None

    payload: dict[str, object] = {}
    if session_context.get("screen"):
        payload["screen"] = session_context["screen"]

    is_followup_intent = intent_decision.intent_type == "recommendation_followup"
    is_followup_rule = intent_decision.matched_rule in {
        "followup_hint",
        "followup_needs_context",
        "constraint_needs_context",
    }
    if not (is_followup_intent or is_followup_rule):
        return payload or None

    if session_context.get("recentUserMessages"):
        payload["recentUserMessages"] = session_context["recentUserMessages"]
    if session_context.get("recentAnswers"):
        payload["recentAnswers"] = session_context["recentAnswers"]
    if session_context.get("recentProductIds"):
        payload["recentProductIds"] = session_context["recentProductIds"]
    if session_context.get("recentSlots"):
        payload["recentSlots"] = session_context["recentSlots"]
    return payload or None
