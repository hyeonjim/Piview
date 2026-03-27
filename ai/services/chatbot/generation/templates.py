"""LLM 없이도 안전하게 내려줄 수 있는 짧은 템플릿 답변 모음.

생성 모델이 실패하더라도 UX를 완전히 깨지 않게 하기 위한 보조 계층입니다.
답변 톤은 자연스럽게 유지하되, 검색 카드와 충돌하는 내용을 새로 발명하지 않도록
문구를 짧고 보수적으로 유지합니다.
"""

from services.chatbot.domain import QueryRequest
from services.chatbot.retrieval.models import RetrievalBundle

from services.chatbot.generation.helpers import build_skin_problem_hint, extract_category_hint
from services.chatbot.retrieval.parsers import extract_preferred_categories


CONSTRAINT_TERMS = ("향료", "알코올", "에센셜오일", "에센셜 오일", "오일")
ROUTINE_TERMS = ("있는데", "있고", "없어서", "빠진 단계", "겹치지 않게")


def build_fallback_answer(
    request: QueryRequest,
    retrieval_bundle: RetrievalBundle,
) -> str:
    """LLM이 완전히 실패했을 때 보여줄 최후의 답변을 만듭니다."""
    if not retrieval_bundle.products:
        return (
            "지금 검색이나 답변 생성이 잠시 불안정합니다. 잠시 후 다시 시도해 주세요. "
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
    request: QueryRequest,
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


def build_greeting_answer() -> str:
    """인사/짧은 잡담에는 검색 없이 가볍게 응답합니다."""
    return "안녕하세요. 저는 Gamini예요. 피부 고민이나 찾는 제품 종류를 말씀해 주시면 바로 이어서 도와드릴게요."


def build_nonsense_answer(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
) -> str:
    """무의미하거나 깨진 입력에는 재입력을 유도합니다."""
    recent_slots = dict((session_context or {}).get("recentSlots") or {})
    recent_categories = [str(item) for item in recent_slots.get("categories", []) if str(item).strip()]
    if recent_categories:
        category_examples = ", ".join(_display_category_name(category) for category in recent_categories[:2])
        return (
            "방금 입력은 의미를 정확히 잡기 어려웠어요. "
            f"이전 조건은 유지할 수 있으니 바꾸고 싶은 항목만 짧게 적어주세요. 예: {category_examples} 말고 올인원, 더 순한 거, 향료 제외"
        )

    requested_categories = extract_preferred_categories(request.message)
    if requested_categories:
        category_examples = ", ".join(_display_category_name(category) for category in requested_categories)
        return (
            "입력하신 내용만으로는 의미를 정확히 파악하기 어려웠어요. "
            f"찾는 방향을 한 번만 더 적어주세요. 예: {category_examples} 추천, 토너 대신 올인원, 여드름 피부 세럼"
        )

    return (
        "입력하신 내용만으로는 의미를 파악하기 어려웠어요. "
        "피부 고민이나 찾는 제품 종류를 조금만 더 구체적으로 적어주시면 바로 도와드릴게요. "
        "예: 여드름 피부 토너 추천, 토너 대신 올인원"
    )


def build_followup_clarification_answer(request: QueryRequest) -> str:
    """문맥 없이 들어온 짧은 후속질문은 기준을 다시 물어봅니다."""
    lowered = request.message.lower()
    if any(token in lowered for token in ("향료", "무향", "fragrance", "알코올", "alcohol", "에센셜오일", "essential oil")):
        return "향료나 알코올 같은 제외 조건을 반영해서 찾을 수 있어요. 토너, 세럼, 크림처럼 찾는 제품 종류를 같이 알려주시면 더 정확하게 추천해드릴게요."
    if any(token in request.message for token in ("토너", "스킨", "toner")):
        return "토너 기준으로 다른 제품을 찾는 건지, 방금 본 제품 대체를 찾는 건지 한 번만 더 알려주세요."
    return "어떤 기준으로 다른 제품을 찾을지 한 번만 더 알려주세요. 방금 본 제품 기준인지, 찾는 카테고리 기준인지 같이 적어주시면 바로 이어서 볼게요."


def build_informational_template_answer(request: QueryRequest) -> str:
    """설명형 질의에서 LLM 호출이 실패했을 때의 보수적 템플릿입니다."""
    if "성분" in request.message or "효능" in request.message:
        return "지금은 자세한 설명 생성이 잠시 불안정합니다. 우선 성분이나 제품 선택 기준을 일반적인 수준에서 다시 안내해드릴 수 있어요."
    return "지금은 자세한 설명 생성이 잠시 불안정합니다. 다시 요청하시면 일반적인 피부/제품 선택 기준 중심으로 이어서 안내드릴게요."


def _display_category_name(category_key: str) -> str:
    category_display_names = {
        "cleanser": "클렌저",
        "toner": "토너",
        "mist": "미스트",
        "serum": "세럼",
        "lotion": "로션/에멀전/올인원",
        "cream": "크림",
        "sunscreen": "선크림",
    }
    return category_display_names.get(category_key, category_key)


def _build_fallback_category_hint(products) -> str:
    """검색 결과 reason에서 카테고리 힌트를 추출해 짧은 설명에 재사용합니다."""
    category_names = [
        category_hint
        for category_hint in (extract_category_hint(product.reason) for product in products)
        if category_hint
    ]
    return f"{category_names[0]} 중심으로" if category_names else "후보 중심으로"


def _build_avoid_hint(request: QueryRequest) -> str:
    """userContext에만 있는 회피 성분은 fallback 문구에도 짧게 반영합니다."""
    if not request.user_context or not request.user_context.disliked_ingredient_names:
        return ""
    return f" {', '.join(request.user_context.disliked_ingredient_names)}는 우선 피하는 방향으로 봤습니다."
