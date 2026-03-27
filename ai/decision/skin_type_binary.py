from inference.display_score import build_display_scores


SKIN_INFO = {
    "건성": {
        "emoji": "💧",
        "desc": "수분이 부족하고 세안 후 당김이 느껴지는 편이에요",
        "tips": [
            "세라마이드·히알루론산 등 고보습 성분을 챙기세요",
            "크림 제형으로 수분 장벽을 강화하세요",
            "알코올 함유 제품은 피하는 게 좋아요",
            "세안 후 3분 이내에 보습을 마무리하세요",
        ],
        "ingredients_good": ["세라마이드", "히알루론산", "글리세린", "스쿠알란"],
        "ingredients_bad": ["알코올", "살리실산", "레티놀 고함량"],
    },
    "지성": {
        "emoji": "🌿",
        "desc": "피지 분비가 많고 번들거림이 생기기 쉬운 편이에요",
        "tips": [
            "약산성 클렌저로 하루 2회 세안을 권장해요",
            "젤·세럼 위주의 가벼운 보습을 선택하세요",
            "나이아신아마이드·BHA 성분이 피지 조절에 효과적이에요",
            "과도한 세안은 오히려 피지 분비를 늘릴 수 있어요",
        ],
        "ingredients_good": ["나이아신아마이드", "BHA(살리실산)", "징크", "티트리"],
        "ingredients_bad": ["미네랄오일", "라놀린", "고함량 오일류"],
    },
}


def _confidence_message(prob: float, skin_type: str) -> str:
    if prob >= 0.75:
        return f"높은 확률로 {skin_type}이에요"
    if prob >= 0.60:
        return f"{skin_type}일 가능성이 높아요"
    return "경계선에 있어 판단이 다소 불확실해요"


def build_binary_skin_response(dry_prob: float, oily_prob: float) -> dict:
    skin_type = "건성" if dry_prob >= oily_prob else "지성"
    main_prob = dry_prob if skin_type == "건성" else oily_prob
    info = SKIN_INFO[skin_type]

    return {
        "skin_type": skin_type,
        "emoji": info["emoji"],
        "description": info["desc"],
        "confidence_message": _confidence_message(main_prob, skin_type),
        "dry_probability": round(dry_prob, 4),
        "oily_probability": round(oily_prob, 4),
        **build_display_scores(oily_prob, 0.5),
        "tips": info["tips"],
        "ingredients_good": info["ingredients_good"],
        "ingredients_bad": info["ingredients_bad"],
        "disclaimer": "AI 참고용 결과입니다. 정확한 진단은 전문의 상담을 권장해요.",
    }
