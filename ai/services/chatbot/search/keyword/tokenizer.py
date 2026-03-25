import re


STOPWORDS = {
    "추천",
    "제품",
    "상품",
    "화장품",
    "피부",
    "사용",
    "좋은",
    "해주세요",
    "해줘",
    "추천해줘",
    "추천해주세요",
    "싶어",
    "위한",
    "관련",
    "있는",
    "없는",
    "고민",
    "타입",
    "강한",
    "이거",
    "그거",
    "이건",
    "그건",
    "방금",
    "아까",
    "지금",
}

TRAILING_PARTICLES = (
    "으로",
    "에서",
    "이랑",
    "하고",
    "처럼",
    "보다",
    "까지",
    "부터",
    "에게",
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "에",
    "도",
    "만",
    "와",
    "과",
    "로",
)


def extract_terms(query_text: str) -> list[str]:
    raw_terms = re.findall(r"[0-9A-Za-z가-힣]+", query_text.lower())
    unique_terms: list[str] = []
    seen: set[str] = set()

    for term in raw_terms:
        for normalized in _expand_term_variants(term):
            if len(normalized) < 2 or normalized in STOPWORDS or normalized in seen:
                continue
            seen.add(normalized)
            unique_terms.append(normalized)

    return unique_terms[:10]


def _expand_term_variants(term: str) -> list[str]:
    stripped = term.strip().lower()
    if not stripped:
        return []
    normalized = _strip_trailing_particle(stripped)
    return [normalized]


def _strip_trailing_particle(term: str) -> str:
    for particle in TRAILING_PARTICLES:
        if term.endswith(particle) and len(term) - len(particle) >= 2:
            return term[: -len(particle)]
    return term
