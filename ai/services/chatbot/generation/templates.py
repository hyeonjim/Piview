"""LLM 없이도 안전하게 내려줄 수 있는 짧은 템플릿 답변 모음.

생성 모델이 실패하더라도 UX를 완전히 깨지 않게 하기 위한 보조 계층입니다.
답변 톤은 자연스럽게 유지하되, 검색 카드와 충돌하는 내용을 새로 발명하지 않도록
문구를 짧고 보수적으로 유지합니다.
"""

from schemas.chatbot import ChatbotQueryRequest
from services.chatbot.retrieval import RetrievalBundle

from services.chatbot.generation.helpers import build_skin_problem_hint, extract_category_hint


CONSTRAINT_TERMS = ("향료", "알코올", "에센셜오일", "에센셜 오일", "오일")
ROUTINE_TERMS = ("있는데", "있고", "없어서", "빠진 단계", "겹치지 않게")


def build_fallback_answer(
    request: ChatbotQueryRequest,
    retrieval_bundle: RetrievalBundle,
) -> str:
    """LLM이 완전히 실패했을 때 보여줄 최후의 답변을 만듭니다."""
    if not retrieval_bundle.products:
        return (
            "지금 답변 생성이 잠시 불안정합니다. 잠시 후 다시 시도해 주세요. "
            "다음 요청에서는 피부 고민, 카테고리, 피하고 싶은 성분을 조금 더 구체적으로 적어주시면 후보를 더 정확하게 좁힐 수 있습니다."
        )

    top_products = retrieval_bundle.products[:3]
    product_names = ", ".join(product.name for product in top_products)
    category_hint = _build_fallback_category_hint(top_products)
    avoid_hint = _build_avoid_hint(request)

    return (
        "지금 답변 생성이 잠시 불안정합니다. 잠시 후 다시 시도해 주세요. "
        f"우선 검색된 후보만 보면 {category_hint} {product_names} 쪽이 먼저 잡혔습니다."
        f"{avoid_hint} "
        "급하면 이 후보들부터 먼저 보고, 다시 요청하시면 설명을 더 자연스럽게 이어드릴게요."
    ).strip()


def build_grounded_template_answer(
    request: ChatbotQueryRequest,
    retrieval_bundle: RetrievalBundle,
) -> str:
    """카드 후보는 있지만 자연어 생성만 실패한 경우의 안전한 템플릿 답변입니다.

    여기서는 제품명을 길게 반복하기보다, 왜 이런 방향으로 좁혔는지에만 집중합니다.
    """
    message = request.message
    reason = retrieval_bundle.products[0].reason or ""
    skin_problem_hint = build_skin_problem_hint(request)

    if any(term in message for term in CONSTRAINT_TERMS):
        return (
            f"{skin_problem_hint}말씀하신 제외 조건을 함께 고려해서 후보를 좁혀봤어요. "
            "지금 카드에 뜨는 제품들부터 사용감과 카테고리를 먼저 비교해보시면 좋겠어요."
        ).strip()

    if any(term in message for term in ROUTINE_TERMS):
        return (
            f"{skin_problem_hint}지금 루틴과 겹치지 않는 방향으로 후보를 추려봤어요. "
            "지금 카드에 뜨는 제품들 중에서 단계나 사용감이 맞는 쪽부터 보면 됩니다."
        ).strip()

    category_hint = extract_category_hint(reason)
    if category_hint:
        return (
            f"{skin_problem_hint}{category_hint} 쪽으로 먼저 보기 좋은 후보를 골라봤어요. "
            "지금 카드에 뜨는 제품들부터 가볍게 비교해보시면 됩니다."
        ).strip()

    return (
        f"{skin_problem_hint}지금 조건에 맞는 후보를 먼저 추려봤어요. "
        "카드에 뜨는 제품들부터 사용감과 고민 매칭 정도를 비교해보시면 됩니다."
    ).strip()


def build_clarifying_answer(message: str) -> str:
    """피부 진단처럼 보이지 않도록, 질문을 좁히는 짧은 되물음을 만듭니다."""
    if "문제인 것 같아" in message:
        return "지금 가장 불편한 쪽이 건조함인지, 자극인지, 번들거림인지부터 알려주실래요?"
    if any(term in message for term in ("필요한 게", "먼저 같이 정해")):
        return "좋아요. 건조함, 자극, 번들거림 중에서 지금 가장 먼저 잡고 싶은 것부터 정해볼까요?"
    if any(term in message for term in ("타입", "어떤 편")):
        return "지금은 건조함, 유분감, 자극 중에서 어떤 쪽이 더 두드러지는지부터 보면 더 자연스럽게 좁혀볼 수 있어요."
    return "지금 가장 불편한 게 건조함인지, 유분감인지, 자극인지 알려주시면 그쪽으로 더 잘 맞는 후보를 좁혀볼게요."


def _build_fallback_category_hint(products) -> str:
    """검색 결과 reason에서 카테고리 힌트를 추출해 짧은 설명에 재사용합니다."""
    category_names = [
        category_hint
        for category_hint in (extract_category_hint(product.reason) for product in products)
        if category_hint
    ]
    return f"{category_names[0]} 중심으로" if category_names else "후보 중심으로"


def _build_avoid_hint(request: ChatbotQueryRequest) -> str:
    """userContext에만 있는 회피 성분은 fallback 문구에도 짧게 반영합니다."""
    if not request.userContext or not request.userContext.dislikedIngredientNames:
        return ""
    return f" {', '.join(request.userContext.dislikedIngredientNames)}는 우선 피하는 방향으로 봤습니다."
