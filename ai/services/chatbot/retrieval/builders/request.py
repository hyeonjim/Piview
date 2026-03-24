from schemas.chatbot import ChatbotQueryRequest
from services.chatbot.retrieval.parsers import extract_preferred_categories


def collect_applied_filters(request: ChatbotQueryRequest) -> dict[str, object]:
    applied_filters: dict[str, object] = {}
    if not request.userContext:
        return applied_filters

    if request.userContext.mySkinType:
        applied_filters["mySkinType"] = request.userContext.mySkinType
    if request.userContext.skinProblems:
        applied_filters["skinProblems"] = request.userContext.skinProblems
    if request.userContext.dislikedIngredientNames:
        applied_filters["dislikedIngredientNames"] = request.userContext.dislikedIngredientNames
    return applied_filters


def build_search_query(request: ChatbotQueryRequest) -> str:
    message = request.message.strip()
    if extract_preferred_categories(message):
        return message

    parts = [message]
    if request.userContext:
        if request.userContext.skinProblems:
            parts.append(f"피부고민: {', '.join(request.userContext.skinProblems)}")
        if request.userContext.dislikedIngredientNames and not any(
            ingredient in message for ingredient in request.userContext.dislikedIngredientNames
        ):
            parts.append(f"피하고 싶은 성분: {', '.join(request.userContext.dislikedIngredientNames)}")
        if request.userContext.mySkinType:
            parts.append(f"피부타입: {request.userContext.mySkinType}")
    return "\n".join(parts)


def build_excluded_product_ids(request: ChatbotQueryRequest) -> set[int]:
    if not request.userContext:
        return set()
    return set(request.userContext.myCosProductIds) | set(request.userContext.dislikedProductIds)
