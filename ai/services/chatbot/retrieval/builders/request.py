"""Retrieval 입력 조립 함수들.

질문 원문과 userContext를 그대로 검색에 넣으면 중복되거나 과한 신호가 섞일 수 있습니다.
여기서는 retrieval 단계가 공통으로 쓰는 입력값만 정리합니다.
"""

from schemas.chatbot import ChatbotQueryRequest
from services.chatbot.retrieval.parsers import extract_preferred_categories


def collect_applied_filters(request: ChatbotQueryRequest) -> dict[str, object]:
    """응답에 다시 노출할 filter snapshot만 수집합니다."""
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
    """검색용 질의 문자열을 만듭니다.

    카테고리 의도가 이미 질문에 명시돼 있으면 원문을 우선합니다.
    그렇지 않으면 userContext의 고민/회피성분/피부타입을 덧붙여 검색 recall을 보완합니다.
    """
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
            # 이미 본문에 적힌 성분을 또 붙이면 같은 신호를 과하게 중복할 수 있습니다.
            parts.append(f"피하고 싶은 성분: {', '.join(request.userContext.dislikedIngredientNames)}")
        if request.userContext.mySkinType:
            parts.append(f"피부타입: {request.userContext.mySkinType}")
    return "\n".join(parts)


def build_excluded_product_ids(request: ChatbotQueryRequest) -> set[int]:
    """사용자가 이미 갖고 있거나 싫다고 한 상품은 검색 후보에서 제외합니다."""
    if not request.userContext:
        return set()
    return set(request.userContext.myCosProductIds) | set(request.userContext.dislikedProductIds)
