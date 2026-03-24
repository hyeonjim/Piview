from dataclasses import dataclass, field
from typing import Any

from core.settings import get_settings
from schemas.chatbot import ChatbotCitation, ChatbotProductCandidate, ChatbotQueryRequest
from services.chatbot.product_keyword_service import product_keyword_service
from services.chatbot.product_vector_service import ProductSearchResult, product_vector_service


@dataclass
class RetrievalBundle:
    # retrieval이 비어 있어도 downstream 응답 조립이 항상 같은 형태를 유지하도록 번들로 감쌉니다.
    response_type: str = "informational"
    products: list[ChatbotProductCandidate] = field(default_factory=list)
    citations: list[ChatbotCitation] = field(default_factory=list)
    applied_filters: dict[str, Any] = field(default_factory=dict)
    retrieval_context: str = (
        "현재 상품 retrieval은 아직 연결 전 상태입니다. "
        "실제 상품 추천 대신 일반적인 화장품 선택 가이드를 제공해야 합니다."
    )


class ChatbotRetrievalService:
    _CATEGORY_HINTS: dict[str, tuple[str, ...]] = {
        "toner": ("토너", "스킨", "화장수", "토닝", "스킨/토너", "토너패드"),
        "mist": ("미스트",),
        "cream": ("크림",),
        "lotion": ("로션", "에멀전", "에멀젼"),
        "serum": ("세럼", "앰플", "에센스", "에센스/세럼", "에센스/앰플/세럼"),
        "sunscreen": ("선크림", "선케어", "선 케어", "선스틱", "자외선", "spf", "pa"),
        "cleanser": (
            "클렌징",
            "클렌징워터",
            "클렌징폼",
            "클렌징오일",
            "클렌징밤",
            "클렌징젤",
            "클렌저",
            "세안",
            "폼클렌저",
        ),
    }
    _AVOID_TERM_ALIASES: dict[str, tuple[str, ...]] = {
        "향료": ("향료", "fragrance", "parfum", "퍼퓸"),
        "알코올": (
            "알코올",
            "알코홀",
            "에탄올",
            "에틸알코올",
            "변성알코올",
            "alcohol",
            "ethanol",
        ),
        "에센셜오일": ("에센셜오일", "에센셜 오일", "essential oil", "티트리 오일", "오일"),
    }
    _SAFE_FREE_PATTERNS: dict[str, tuple[str, ...]] = {
        "향료": ("무향료", "향료 무첨가", "fragrance-free", "fragrance free", "parfum-free"),
        "알코올": ("무알코올", "알코올프리", "알코올 프리", "알코올 무첨가", "alcohol-free"),
        "에센셜오일": (
            "에센셜오일 무첨가",
            "에센셜 오일 무첨가",
            "essential oil free",
            "essential-oil-free",
        ),
    }
    _CONCERN_HINTS: tuple[str, ...] = (
        "민감",
        "진정",
        "수분",
        "속건조",
        "피지",
        "트러블",
        "보습",
        "미백",
        "주름",
        "탄력",
        "노화방지",
    )
    _LIGHTWEIGHT_HINTS: tuple[str, ...] = (
        "가벼운",
        "가볍고",
        "산뜻",
        "편하게",
        "데일리",
        "무난",
        "순한",
        "자극",
        "실패 확률",
    )
    _STEP_HINTS: tuple[str, ...] = (
        "뭐부터",
        "먼저",
        "하나만",
        "하나 추가",
        "추가",
        "바꾼다면",
        "대체품",
    )
    _ACUTE_SENSITIVITY_HINTS: tuple[str, ...] = (
        "따갑",
        "붉",
        "빨갛",
        "화끈",
        "열감",
        "뒤집어",
    )
    _CALMING_POSITIVE_TERMS: tuple[str, ...] = (
        "진정",
        "카밍",
        "시카",
        "리페어",
        "수딩",
        "병풀",
        "어성초",
        "약쑥",
        "센텔라",
        "장벽",
    )
    _ACUTE_NEGATIVE_TERMS: tuple[str, ...] = (
        "파우더",
        "필링",
        "스크럽",
        "클렌징",
        "포밍",
        "워시",
    )
    _EXISTING_CATEGORY_MARKERS: tuple[str, ...] = (
        "있는데",
        "있고",
        "있어서",
        "있는데",
    )
    _MISSING_CATEGORY_MARKERS: tuple[str, ...] = (
        "없는데",
        "없고",
        "없어서",
        "없는",
        "부족",
        "모자라",
        "필요",
    )
    _HYDRATION_POSITIVE_CATEGORIES: tuple[str, ...] = (
        "toner",
        "mist",
        "cream",
        "lotion",
        "serum",
    )
    _CONTEXT_MISMATCH_TERMS: tuple[str, ...] = (
        "아이",
        "eye",
        "맨",
        "옴므",
        "homme",
    )
    _NON_SKINCARE_TERMS: tuple[str, ...] = (
        "제모",
        "블러쉬",
        "립",
        "마스카라",
        "아이브로우",
        "쿠션",
        "파운데이션",
        "컨실러",
        "바디",
        "헤어",
        "샴푸",
        "트리트먼트",
    )
    _BRIGHTENING_TERMS: tuple[str, ...] = (
        "미백",
        "브라이트닝",
        "화이트닝",
        "톤업",
        "기미",
        "잡티",
    )
    _HEAVY_TEXTURE_TERMS: tuple[str, ...] = (
        "밤",
        "balm",
    )
    _SIMILAR_CANDIDATE_HINTS: tuple[str, ...] = (
        "비슷한 후보",
        "비슷한 걸",
        "최대한 비슷",
        "딱 맞는 게 없",
        "조건이 많",
    )
    _CLARIFYING_PATTERNS: tuple[str, ...] = (
        "내 타입이 뭐",
        "무슨 타입",
        "뭐라고 생각해",
        "어떻게 생각해",
        "내가 이건데",
        "내 피부가 어떤 편",
        "어떤 편 같아",
    )

    async def retrieve(self, request: ChatbotQueryRequest) -> RetrievalBundle:
        applied_filters: dict[str, Any] = {}
        if request.userContext:
            if request.userContext.mySkinType:
                applied_filters["mySkinType"] = request.userContext.mySkinType
            if request.userContext.skinProblems:
                applied_filters["skinProblems"] = request.userContext.skinProblems
            if request.userContext.dislikedIngredientNames:
                applied_filters["dislikedIngredientNames"] = request.userContext.dislikedIngredientNames

        preferred_categories = self._extract_preferred_categories(request.message)
        if self._needs_clarifying_question(request.message, preferred_categories):
            return RetrievalBundle(
                response_type="clarifying_question",
                applied_filters=applied_filters,
                retrieval_context=(
                    "이 질문은 지금 바로 상품 카드를 붙이기보다 사용자의 상태를 한 번 더 확인하는 편이 자연스럽습니다. "
                    "제품 추천을 억지로 하지 말고, 한 문장으로 짧게 되물어라. "
                    "피부타입을 진단처럼 단정하지 말고, 건조함/유분/민감함 중 무엇이 더 신경 쓰이는지처럼 가볍게 좁혀라."
                ),
            )

        try:
            settings = get_settings()
            search_query = self._build_search_query(request)
            preferred_concerns = self._extract_preferred_concerns(request)
            excluded_product_ids = self._build_excluded_product_ids(request)
            vector_results = product_vector_service.query(
                query_text=search_query,
                limit=max(settings.chatbot_top_k, settings.chatbot_candidate_pool),
                exclude_product_ids=excluded_product_ids,
            )
            keyword_results = product_keyword_service.search(
                query_text=search_query,
                limit=max(settings.chatbot_top_k, settings.chatbot_keyword_top_k),
            )
            keyword_results = [
                result for result in keyword_results if result.product_id not in excluded_product_ids
            ]
            results = self._fuse_results(
                message=request.message,
                vector_results=vector_results,
                keyword_results=keyword_results,
                limit=settings.chatbot_top_k,
                preferred_categories=preferred_categories,
                avoid_terms=self._extract_avoid_terms(request),
            )
        except RuntimeError as exc:
            return RetrievalBundle(
                response_type="informational",
                applied_filters=applied_filters,
                retrieval_context=(
                    "상품 검색 인덱스를 아직 사용할 수 없습니다. "
                    f"현재 검색은 비활성화 상태이며 오류는 다음과 같습니다: {exc}"
                ),
            )

        if not results:
            return RetrievalBundle(
                response_type="informational",
                applied_filters=applied_filters,
                retrieval_context=(
                    "현재 질문과 직접적으로 맞는 상품 후보를 찾지 못했습니다. "
                    "답변은 일반 가이드 중심으로 하되, 사용자가 카테고리/피부고민/피하고 싶은 성분을 더 구체적으로 말하면 검색 품질이 좋아집니다."
                ),
            )

        return RetrievalBundle(
            response_type="product_recommendation",
            products=[self._to_product_candidate(result, preferred_concerns) for result in results],
            citations=[self._to_citation(result, preferred_concerns) for result in results],
            applied_filters=applied_filters,
            retrieval_context=self._build_retrieval_context(results, preferred_concerns),
        )

    def _build_search_query(self, request: ChatbotQueryRequest) -> str:
        message = request.message.strip()
        parts = [message]
        if self._extract_preferred_categories(message):
            return message

        if request.userContext:
            if request.userContext.skinProblems:
                parts.append(f"피부고민: {', '.join(request.userContext.skinProblems)}")
            if request.userContext.dislikedIngredientNames:
                if not any(
                    ingredient in message for ingredient in request.userContext.dislikedIngredientNames
                ):
                    parts.append(f"피하고 싶은 성분: {', '.join(request.userContext.dislikedIngredientNames)}")
            if request.userContext.mySkinType:
                parts.append(f"피부타입: {request.userContext.mySkinType}")
        return "\n".join(parts)

    def _build_excluded_product_ids(self, request: ChatbotQueryRequest) -> set[int]:
        if not request.userContext:
            return set()
        return set(request.userContext.myCosProductIds) | set(request.userContext.dislikedProductIds)

    def _to_product_candidate(
        self,
        result: ProductSearchResult,
        preferred_concerns: set[str],
    ) -> ChatbotProductCandidate:
        return ChatbotProductCandidate(
            productId=result.product_id,
            name=result.name,
            brandName=result.brand_name,
            reason=self._build_reason(result, preferred_concerns),
        )

    def _to_citation(
        self,
        result: ProductSearchResult,
        preferred_concerns: set[str],
    ) -> ChatbotCitation:
        display_concerns = self._filter_display_concerns(result.concern_names, preferred_concerns)
        concern_text = f" / 관련 고민: {', '.join(display_concerns)}" if display_concerns else ""
        return ChatbotCitation(
            type="product",
            productId=result.product_id,
            text=f"{result.name} ({result.brand_name or '브랜드 미상'}){concern_text}",
        )

    def _build_reason(
        self,
        result: ProductSearchResult,
        preferred_concerns: set[str],
    ) -> str:
        reason_parts: list[str] = []
        if result.category_name:
            reason_parts.append(f"{result.category_name} 카테고리")
        display_concerns = self._filter_display_concerns(result.concern_names, preferred_concerns)
        if display_concerns:
            reason_parts.append(f"관련 고민 {', '.join(display_concerns[:3])}")
        skin_type_hints = [item for item in (result.top_skin_type, result.top2_skin_type) if item]
        if skin_type_hints:
            reason_parts.append(f"피부타입 힌트 {', '.join(skin_type_hints)}")
        return " / ".join(reason_parts) if reason_parts else "질문과 의미적으로 가까운 상품 후보입니다."

    def _build_retrieval_context(
        self,
        results: list[ProductSearchResult],
        preferred_concerns: set[str],
    ) -> str:
        lines = ["상품 검색으로 찾은 후보입니다:"]
        for result in results[:5]:
            line = f"- {result.name}"
            if result.brand_name:
                line += f" / 브랜드 {result.brand_name}"
            if result.category_name:
                line += f" / 카테고리 {result.category_name}"
            display_concerns = self._filter_display_concerns(result.concern_names, preferred_concerns)
            if display_concerns:
                line += f" / 관련 고민 {', '.join(display_concerns[:3])}"
            lines.append(line)
        lines.append("답변은 반드시 위 후보를 우선 참고하고, 찾지 못한 정보는 추측하지 말고 보수적으로 안내해야 합니다.")
        return "\n".join(lines)

    def _fuse_results(
        self,
        message: str,
        vector_results: list[ProductSearchResult],
        keyword_results: list[ProductSearchResult],
        limit: int,
        preferred_categories: set[str],
        avoid_terms: set[str],
    ) -> list[ProductSearchResult]:
        if not vector_results and not keyword_results:
            return []

        settings = get_settings()
        k = max(1, settings.chatbot_hybrid_rrf_k)
        fused_scores: dict[int, float] = {}
        result_map: dict[int, ProductSearchResult] = {}
        existing_categories = self._extract_existing_categories(message)
        missing_categories = self._extract_missing_categories(message)

        for rank, result in enumerate(vector_results, start=1):
            score = (
                settings.chatbot_vector_weight / (k + rank)
            )
            score += self._category_score_bonus(result, preferred_categories)
            score += self._generic_query_bonus(result, message, preferred_categories)
            score += self._missing_category_bonus(result, missing_categories)
            score -= self._existing_category_penalty(result, existing_categories)
            score += self._care_gap_bonus(result, message, existing_categories, missing_categories)
            score -= self._care_gap_penalty(result, message, existing_categories, missing_categories)
            score -= self._avoid_term_penalty(result, avoid_terms)
            score -= self._oil_feel_penalty(result, message)
            score -= self._context_mismatch_penalty(result, message)
            score -= self._non_skincare_penalty(result, message)
            score -= self._heavy_texture_penalty(result, message)
            score += self._brightening_bonus(result, message)
            score += self._sensitivity_dryness_bonus(result, message, preferred_categories)
            score += self._similar_candidate_adjustment(result, message, preferred_categories)
            fused_scores[result.product_id] = fused_scores.get(result.product_id, 0.0) + score
            result_map.setdefault(result.product_id, result)

        for rank, result in enumerate(keyword_results, start=1):
            score = (
                settings.chatbot_keyword_weight / (k + rank)
            )
            score += self._category_score_bonus(result, preferred_categories)
            score += self._generic_query_bonus(result, message, preferred_categories)
            score += self._missing_category_bonus(result, missing_categories)
            score -= self._existing_category_penalty(result, existing_categories)
            score += self._care_gap_bonus(result, message, existing_categories, missing_categories)
            score -= self._care_gap_penalty(result, message, existing_categories, missing_categories)
            score -= self._avoid_term_penalty(result, avoid_terms)
            score -= self._oil_feel_penalty(result, message)
            score -= self._context_mismatch_penalty(result, message)
            score -= self._non_skincare_penalty(result, message)
            score -= self._heavy_texture_penalty(result, message)
            score += self._brightening_bonus(result, message)
            score += self._sensitivity_dryness_bonus(result, message, preferred_categories)
            score += self._similar_candidate_adjustment(result, message, preferred_categories)
            fused_scores[result.product_id] = fused_scores.get(result.product_id, 0.0) + score
            result_map.setdefault(result.product_id, result)

        matched_product_ids = [
            product_id
            for product_id in fused_scores.keys()
            if self._category_priority(result_map[product_id], preferred_categories) > 0
        ]
        unmatched_product_ids = [
            product_id
            for product_id in fused_scores.keys()
            if self._category_priority(result_map[product_id], preferred_categories) == 0
        ]

        matched_product_ids.sort(
            key=lambda product_id: (
                self._category_priority(result_map[product_id], preferred_categories),
                fused_scores[product_id],
            ),
            reverse=True,
        )
        unmatched_product_ids.sort(
            key=lambda product_id: fused_scores[product_id],
            reverse=True,
        )

        ranked_product_ids = matched_product_ids + unmatched_product_ids
        if self._should_demote_existing_categories_for_gap(message, existing_categories, missing_categories):
            promoted_product_ids = [
                product_id
                for product_id in ranked_product_ids
                if self._category_priority(result_map[product_id], existing_categories) == 0
            ]
            demoted_product_ids = [
                product_id
                for product_id in ranked_product_ids
                if self._category_priority(result_map[product_id], existing_categories) > 0
            ]
            ranked_product_ids = promoted_product_ids + demoted_product_ids
        if avoid_terms:
            safe_product_ids = [
                product_id
                for product_id in ranked_product_ids
                if not self._matches_avoid_term(result_map[product_id], avoid_terms)
            ]
            unsafe_product_ids = [
                product_id
                for product_id in ranked_product_ids
                if self._matches_avoid_term(result_map[product_id], avoid_terms)
            ]
            ranked_product_ids = safe_product_ids + unsafe_product_ids
        return [result_map[product_id] for product_id in ranked_product_ids[:limit]]

    def _extract_preferred_categories(self, message: str) -> set[str]:
        lowered = message.lower()
        preferred_categories: set[str] = set()
        for category_key, aliases in self._CATEGORY_HINTS.items():
            if any(alias.lower() in lowered for alias in aliases):
                preferred_categories.add(category_key)
        if "sunscreen" in preferred_categories:
            preferred_categories.discard("cream")
        return preferred_categories

    def _needs_clarifying_question(
        self,
        message: str,
        preferred_categories: set[str],
    ) -> bool:
        if preferred_categories:
            return False
        lowered = message.lower()
        return any(pattern in lowered for pattern in self._CLARIFYING_PATTERNS)

    def _extract_preferred_concerns(self, request: ChatbotQueryRequest) -> set[str]:
        preferred_concerns: set[str] = set()
        message = request.message
        for concern in self._CONCERN_HINTS:
            if concern in message:
                preferred_concerns.add(concern)
        if request.userContext:
            for concern in request.userContext.skinProblems:
                preferred_concerns.add(concern)
        return preferred_concerns

    def _filter_display_concerns(
        self,
        concern_names: list[str],
        preferred_concerns: set[str],
    ) -> list[str]:
        if not concern_names:
            return []

        if not preferred_concerns:
            return concern_names[:3]

        matched = [
            concern_name
            for concern_name in concern_names
            if any(preferred in concern_name for preferred in preferred_concerns)
        ]
        if matched:
            return matched[:3]
        return []

    def _category_priority(
        self,
        result: ProductSearchResult,
        preferred_categories: set[str],
    ) -> int:
        if not preferred_categories:
            return 0

        search_targets = " ".join(
            [
                (result.category_name or "").lower(),
                result.name.lower(),
                result.document.lower(),
            ]
        )
        for category_key in preferred_categories:
            aliases = self._CATEGORY_HINTS.get(category_key, ())
            if result.category_name and any(alias.lower() in result.category_name.lower() for alias in aliases):
                return 3
            if any(alias.lower() in result.name.lower() for alias in aliases):
                return 2
            if any(alias.lower() in search_targets for alias in aliases):
                return 1
        return 0

    def _category_score_bonus(
        self,
        result: ProductSearchResult,
        preferred_categories: set[str],
    ) -> float:
        priority = self._category_priority(result, preferred_categories)
        if priority == 3:
            return 0.35
        if priority == 2:
            return 0.2
        if priority == 1:
            return 0.08
        return 0.0

    def _missing_category_bonus(
        self,
        result: ProductSearchResult,
        missing_categories: set[str],
    ) -> float:
        priority = self._category_priority(result, missing_categories)
        if priority == 3:
            return 0.45
        if priority == 2:
            return 0.28
        if priority == 1:
            return 0.12
        return 0.0

    def _existing_category_penalty(
        self,
        result: ProductSearchResult,
        existing_categories: set[str],
    ) -> float:
        priority = self._category_priority(result, existing_categories)
        if priority == 3:
            return 0.62
        if priority == 2:
            return 0.34
        if priority == 1:
            return 0.16
        return 0.0

    def _generic_query_bonus(
        self,
        result: ProductSearchResult,
        message: str,
        preferred_categories: set[str],
    ) -> float:
        if preferred_categories:
            return 0.0

        lowered = message.lower()
        category_name = (result.category_name or "").lower()
        bonus = 0.0

        if any(hint in message for hint in self._LIGHTWEIGHT_HINTS):
            if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
                bonus += 0.08
            if "크림" in category_name:
                bonus -= 0.05

        if any(hint in message for hint in self._STEP_HINTS):
            if any(alias in category_name for alias in ("스킨/토너", "에센스/앰플/세럼")):
                bonus += 0.12
            if "크림" in category_name:
                bonus -= 0.08

        if ("건조" in message or "속건조" in message) and "크림" in category_name:
            bonus += 0.03

        if "번들거" in message and "크림" in category_name:
            bonus -= 0.04
        if any(term in message for term in ("답답", "무거운", "무겁")):
            if "크림" in category_name:
                bonus -= 0.12
            if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
                bonus += 0.08

        if self._is_very_generic_query(message):
            if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
                bonus += 0.06
            if "크림" in category_name:
                bonus -= 0.06

        if any(hint in message for hint in self._ACUTE_SENSITIVITY_HINTS):
            search_targets = " ".join(
                [
                    result.name.lower(),
                    category_name,
                    result.document.lower(),
                    " ".join(result.concern_names).lower(),
                ]
            )
            if any(term in search_targets for term in self._CALMING_POSITIVE_TERMS):
                bonus += 0.16
            if any(term in search_targets for term in self._ACUTE_NEGATIVE_TERMS):
                bonus -= 0.18
            if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼", "크림")):
                bonus += 0.04

        return bonus

    def _care_gap_bonus(
        self,
        result: ProductSearchResult,
        message: str,
        existing_categories: set[str],
        missing_categories: set[str],
    ) -> float:
        if missing_categories:
            return 0.0
        if not existing_categories:
            return 0.0

        bonus = 0.0
        category_name = (result.category_name or "").lower()
        if any(term in message for term in ("보습", "수분", "건조", "속건조")):
            if any(category in existing_categories for category in ("sunscreen", "cleanser")):
                if any(key in category_name for key in ("스킨/토너", "미스트", "크림", "로션", "에멀", "에센스", "세럼", "앰플")):
                    bonus += 0.4
        return bonus

    def _care_gap_penalty(
        self,
        result: ProductSearchResult,
        message: str,
        existing_categories: set[str],
        missing_categories: set[str],
    ) -> float:
        if missing_categories:
            return 0.0
        if not existing_categories:
            return 0.0

        penalty = 0.0
        category_name = (result.category_name or "").lower()
        if any(term in message for term in ("보습", "수분", "건조", "속건조")):
            if "sunscreen" in existing_categories and ("선크림" in category_name or "선케어" in category_name):
                penalty += 0.55
            if "cleanser" in existing_categories and any(
                key in category_name for key in ("클렌징", "클렌저", "폼", "워터")
            ):
                penalty += 0.45
        return penalty

    def _should_demote_existing_categories_for_gap(
        self,
        message: str,
        existing_categories: set[str],
        missing_categories: set[str],
    ) -> bool:
        if missing_categories:
            return False
        if not existing_categories:
            return False
        if not any(term in message for term in ("보습", "수분", "건조", "속건조", "부족")):
            return False
        return any(category in existing_categories for category in ("sunscreen", "cleanser"))

    def _is_very_generic_query(self, message: str) -> bool:
        if any(hint in message for hint in self._STEP_HINTS):
            return False
        generic_terms = (
            "무난",
            "순한",
            "안전",
            "편하게",
            "데일리",
            "실패 확률",
            "맞을 만한",
            "뭐가 있을까",
        )
        return any(term in message for term in generic_terms)

    def _extract_avoid_terms(self, request: ChatbotQueryRequest) -> set[str]:
        avoid_terms: set[str] = set()
        message = request.message
        for term in self._AVOID_TERM_ALIASES:
            if term in message:
                avoid_terms.add(term)
        if request.userContext:
            for term in request.userContext.dislikedIngredientNames:
                if term in self._AVOID_TERM_ALIASES:
                    avoid_terms.add(term)
        return avoid_terms

    def _extract_existing_categories(self, message: str) -> set[str]:
        return self._extract_category_mentions(message, self._EXISTING_CATEGORY_MARKERS)

    def _extract_missing_categories(self, message: str) -> set[str]:
        return self._extract_category_mentions(message, self._MISSING_CATEGORY_MARKERS)

    def _extract_category_mentions(self, message: str, markers: tuple[str, ...]) -> set[str]:
        collapsed = message.lower().replace(" ", "")
        particles = ("", "은", "는", "이", "가")
        matched: set[str] = set()
        for category_key, aliases in self._CATEGORY_HINTS.items():
            for alias in aliases:
                alias_token = alias.lower().replace(" ", "")
                if any(f"{alias_token}{particle}{marker}" in collapsed for particle in particles for marker in markers):
                    matched.add(category_key)
                    break
        return matched

    def _avoid_term_penalty(self, result: ProductSearchResult, avoid_terms: set[str]) -> float:
        if not avoid_terms:
            return 0.0

        penalty = 0.0
        for avoid_term in avoid_terms:
            if self._matches_specific_avoid_term(result, avoid_term):
                penalty += 1.0
        return penalty

    def _matches_avoid_term(self, result: ProductSearchResult, avoid_terms: set[str]) -> bool:
        return any(self._matches_specific_avoid_term(result, avoid_term) for avoid_term in avoid_terms)

    def _matches_specific_avoid_term(
        self,
        result: ProductSearchResult,
        avoid_term: str,
    ) -> bool:
        search_targets = " ".join(
            [
                result.name.lower(),
                (result.category_name or "").lower(),
                result.document.lower(),
            ]
        )
        aliases = self._AVOID_TERM_ALIASES.get(avoid_term, ())
        safe_patterns = self._SAFE_FREE_PATTERNS.get(avoid_term, ())
        if any(pattern.lower() in search_targets for pattern in safe_patterns):
            return False
        return any(alias.lower() in search_targets for alias in aliases)

    def _oil_feel_penalty(self, result: ProductSearchResult, message: str) -> float:
        if "오일" not in message:
            return 0.0
        if not any(term in message for term in ("싫", "피하", "부담", "덜", "없는")):
            return 0.0

        search_targets = " ".join(
            [
                result.name.lower(),
                (result.category_name or "").lower(),
                result.document.lower(),
            ]
        )
        if "오일" in search_targets:
            return 0.45
        return 0.0

    def _context_mismatch_penalty(self, result: ProductSearchResult, message: str) -> float:
        lowered_message = message.lower()
        search_targets = " ".join(
            [
                result.name.lower(),
                (result.category_name or "").lower(),
            ]
        )
        penalty = 0.0
        for term in self._CONTEXT_MISMATCH_TERMS:
            if term in search_targets and term not in lowered_message:
                penalty += 0.22
        return penalty

    def _non_skincare_penalty(self, result: ProductSearchResult, message: str) -> float:
        lowered_message = message.lower()
        search_targets = " ".join(
            [
                result.name.lower(),
                (result.category_name or "").lower(),
            ]
        )
        penalty = 0.0
        for term in self._NON_SKINCARE_TERMS:
            if term in search_targets and term not in lowered_message:
                penalty += 0.85
        return penalty

    def _heavy_texture_penalty(self, result: ProductSearchResult, message: str) -> float:
        if not any(term in message for term in ("밤 타입", "밤타입", "무거운", "무겁", "답답")):
            return 0.0

        search_targets = " ".join(
            [
                result.name.lower(),
                (result.category_name or "").lower(),
                result.document.lower(),
            ]
        )
        if any(term in search_targets for term in self._HEAVY_TEXTURE_TERMS):
            return 0.65
        return 0.0

    def _brightening_bonus(self, result: ProductSearchResult, message: str) -> float:
        if not any(term in message for term in self._BRIGHTENING_TERMS):
            return 0.0

        search_targets = " ".join(
            [
                result.name.lower(),
                (result.category_name or "").lower(),
                result.document.lower(),
                " ".join(result.concern_names).lower(),
            ]
        )
        if any(term in search_targets for term in self._BRIGHTENING_TERMS):
            return 0.28
        return -0.12

    def _sensitivity_dryness_bonus(
        self,
        result: ProductSearchResult,
        message: str,
        preferred_categories: set[str],
    ) -> float:
        if preferred_categories:
            return 0.0
        if not any(term in message for term in ("민감", "예민")):
            return 0.0
        if not any(term in message for term in ("건조", "속건조", "수분", "보습")):
            return 0.0

        category_name = (result.category_name or "").lower()
        if any(alias in category_name for alias in ("에센스/앰플/세럼", "크림", "로션", "에멀", "미스트")):
            return 0.12
        if "스킨/토너" in category_name:
            return -0.04
        return 0.0

    def _similar_candidate_adjustment(
        self,
        result: ProductSearchResult,
        message: str,
        preferred_categories: set[str],
    ) -> float:
        if preferred_categories:
            return 0.0
        if not any(term in message for term in self._SIMILAR_CANDIDATE_HINTS):
            return 0.0

        category_name = (result.category_name or "").lower()
        if any(alias in category_name for alias in ("스킨/토너", "미스트", "에센스/앰플/세럼")):
            return 0.08
        if "크림" in category_name:
            return -0.12
        return 0.0


chatbot_retrieval_service = ChatbotRetrievalService()
