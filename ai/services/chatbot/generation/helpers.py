from schemas.chatbot import ChatbotQueryRequest


def model_to_dict(model) -> dict:
    if model is None:
        return {}
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
