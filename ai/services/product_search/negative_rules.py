"""Negative ingredient parsing and matching rules for product search."""

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
    normalized_text = normalize_text(text)
    if not normalized_text:
        return False
    return any(pattern in normalized_text for pattern in build_negative_safe_patterns(term))
