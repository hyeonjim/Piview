from services.chatbot.domain import ClientContext, QueryRequest


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
