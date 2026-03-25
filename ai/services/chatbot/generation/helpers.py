from dataclasses import asdict, is_dataclass

from schemas.chatbot import ChatbotQueryRequest


def model_to_dict(model) -> dict:
    if model is None:
        return {}
    if isinstance(model, dict):
        return {key: value for key, value in model.items() if value is not None}
    if is_dataclass(model):
        return {key: value for key, value in asdict(model).items() if value is not None}
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_none=True)
    return model.dict(exclude_none=True)


def build_skin_problem_hint(request: ChatbotQueryRequest) -> str:
    if not request.userContext or not request.userContext.skinProblems:
        return ""

    concerns = request.userContext.skinProblems[:2]
    if len(concerns) == 1:
        return f"{concerns[0]} 쪽을 같이 보고 계시니, "
    return f"{concerns[0]}과 {concerns[1]}을 같이 보고 계시니, "


def extract_category_hint(reason: str | None) -> str:
    if not reason or "카테고리" not in reason:
        return ""
    return reason.split(" 카테고리")[0].split(" / ")[-1]


def build_effective_client_context(
    request: ChatbotQueryRequest,
    session_context: dict | None,
) -> dict[str, object]:
    current_screen = request.context.screen if request.context and request.context.screen else None
    current_product_id = (
        request.context.currentProductId
        if request.context and request.context.currentProductId is not None
        else None
    )
    fallback_screen = session_context.get("screen") if session_context else None
    fallback_product_id = session_context.get("currentProductId") if session_context else None

    payload: dict[str, object] = {}
    screen = current_screen or fallback_screen
    current_product_id = (
        current_product_id if current_product_id is not None else fallback_product_id
    )
    if screen:
        payload["screen"] = screen
    if current_product_id is not None:
        payload["currentProductId"] = current_product_id
    return payload
