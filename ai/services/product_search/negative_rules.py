"""상품 검색용 부정 성분 파싱 및 매칭 규칙."""

from __future__ import annotations

from services.chatbot.search.query_normalizer import normalize_text


NEGATIVE_OPERATOR_TOKENS = (
    "없는",
    "무첨가",
    "프리",
    "제외",
    "without",
)
NEGATIVE_OPERATOR_SUFFIXES = (
    "프리",
    "free",
)
NEGATIVE_OPERATOR_PREFIXES = (
    "무",
    "without",
)


def build_negative_safe_patterns(term: str) -> tuple[str, ...]:
    # negative operator는 product_search 내부 문법 규칙이다.
    # 이 함수는 canonical ingredient term 하나를 받아 실제 검색 텍스트에서 안전하게 찾을 표현을 만든다.
    # 예: 향료 -> 무향료, 향료 프리, without 향료, 향료-free
    normalized = normalize_text(term)
    if not normalized:
        return ()

    compact = normalized.replace(" ", "")
    variants = {normalized, compact}
    patterns: set[str] = set()
    for variant in variants:
        if not variant:
            continue
        patterns.update(
            {
                f"무{variant}",
                f"{variant} 프리",
                f"{variant}프리",
                f"{variant} 무첨가",
                f"{variant}무첨가",
                f"{variant} 제외",
                f"{variant}제외",
                f"without {variant}",
                f"{variant} free",
                f"{variant}-free",
                f"{variant}free",
            }
        )
    return tuple(sorted(patterns))


def has_negative_safe_pattern(text: str, term: str) -> bool:
    # "향료가 들어있다"와 "무향료"는 polarity가 정반대라 단순 substring 매칭으로는 구분할 수 없다.
    # 그래서 rerank 단계에서는 먼저 safe pattern을 보고, 그게 없을 때만 원 term 포함을 패널티로 본다.
    normalized_text = normalize_text(text)
    if not normalized_text:
        return False
    return any(pattern in normalized_text for pattern in build_negative_safe_patterns(term))
