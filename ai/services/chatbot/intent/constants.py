from typing import Final


GREETING_PATTERNS: Final[tuple[str, ...]] = (
    "hi",
    "hello",
    "hey",
    "안녕",
    "안녕하세요",
    "하이",
    "ㅎㅇ",
    "반가워",
    "반가워요",
)

GREETING_FILLER_PATTERNS: Final[tuple[str, ...]] = (
    "there",
    "bot",
    "chatbot",
    "gamini",
    "야",
    "요",
    "ㅎㅎ",
    "ㅋㅋ",
    "고마워",
    "고마워요",
    "감사",
    "감사해",
    "감사합니다",
)

REACTION_ONLY_PATTERNS: Final[tuple[str, ...]] = (
    "ㅋ",
    "ㅎ",
    "ㅠ",
    "ㅜ",
    "ㄷ",
)

FOLLOW_UP_HINTS: Final[tuple[str, ...]] = (
    "이거",
    "그거",
    "이 중",
    "둘 중",
    "뭐가 더",
    "어떤 게 더",
    "그럼",
    "그러면",
    "같은 조건",
    "방금",
    "아까",
    "다른 거",
    "말고",
    "대신",
    "더 순한",
    "더 가벼운",
    "더 촉촉한",
    "비슷한 거",
)

ANCHOR_PRODUCT_HINTS: Final[tuple[str, ...]] = (
    "이거",
    "그거",
    "이 제품",
    "그 제품",
    "방금",
    "아까",
    "지금 본",
    "비슷",
    "유사",
    "대신",
    "보다",
    "같은",
)

RECOMMENDATION_HINTS: Final[tuple[str, ...]] = (
    "추천",
    "뭐가 좋아",
    "좋아?",
    "좋을까",
    "쓸만",
    "뭐 써",
    "뭐 사",
    "골라줘",
    "찾아줘",
)

INFORMATIONAL_HINTS: Final[tuple[str, ...]] = (
    "성분",
    "효능",
    "차이",
    "기준",
    "사용법",
    "써도 돼",
    "왜",
    "어떤 뜻",
    "뭔 뜻",
    "어떻게 써",
    "뭘 봐야",
)

PRODUCT_SEARCHABLE_INFORMATIONAL_HINTS: Final[tuple[str, ...]] = (
    "들어간 제품",
    "제품 있어",
    "제품 있",
    "들어간 거",
    "무향",
    "진정",
    "보습",
    "세라마이드 들어간",
    "나이아신아마이드 들어간",
    "토너 있어",
    "크림 있어",
    "세럼 있어",
    "앰플 있어",
)

SEMANTIC_ROUTE_EXAMPLES: Final[dict[str, tuple[str, ...]]] = {
    "greeting_chitchat": (
        "안녕",
        "하이",
        "고마워",
        "반가워",
        "ㅋㅋ",
        "ㅋㅋㅋㅋ",
        "ㅋㄷㅋㄷㅋㅋㅋ",
    ),
    "recommendation_followup": (
        "이거 말고 다른 거 보여줘",
        "방금 거보다 순한 거",
        "이 중에서 토너만 볼래",
        "비슷한 거 있어?",
        "그 제품 대신 다른 거",
    ),
    "recommendation_fresh": (
        "민감성 피부 수분크림 추천해줘",
        "트러블 피부 앰플 뭐가 좋아",
        "무향 토너 추천해줘",
        "순한 세럼 찾아줘",
        "보습크림 골라줘",
    ),
    "informational": (
        "세라마이드는 어떤 성분이야",
        "민감성 피부는 토너 고를 때 뭘 봐야 해",
        "수분크림과 로션 차이가 뭐야",
        "나이아신아마이드가 왜 좋아",
        "이 성분은 어떤 역할이야",
    ),
}
