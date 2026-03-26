import re
from dataclasses import dataclass


@dataclass(frozen=True)
class NormalizedQuery:
    original: str
    spaced: str
    compact: str
    tokens: list[str]


def normalize_text(text: str | None) -> str:
    if not text:
        return ""
    return " ".join(text.strip().lower().split())


def compact_text(text: str | None) -> str:
    return normalize_text(text).replace(" ", "")


def tokenize_text(text: str | None) -> list[str]:
    if not text:
        return []
    return re.findall(r"[0-9A-Za-z가-힣]+", normalize_text(text))


def normalize_query(query_text: str) -> NormalizedQuery:
    spaced = normalize_text(query_text)
    return NormalizedQuery(
        original=query_text,
        spaced=spaced,
        compact=compact_text(spaced),
        tokens=tokenize_text(spaced),
    )