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
    "싶어",
    "위한",
    "관련",
    "있는",
    "없는",
    "고민",
    "타입",
    "강한",
}


def extract_terms(query_text: str) -> list[str]:
    raw_terms = re.findall(r"[0-9A-Za-z가-힣]+", query_text.lower())
    unique_terms: list[str] = []
    seen: set[str] = set()

    for term in raw_terms:
        normalized = term.strip()
        if len(normalized) < 2 or normalized in STOPWORDS or normalized in seen:
            continue
        seen.add(normalized)
        unique_terms.append(normalized)

    return unique_terms[:8]
