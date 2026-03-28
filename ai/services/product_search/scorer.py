"""Structured reranking for product search results."""

from __future__ import annotations

from services.chatbot.retrieval.constants import (
    AVOID_TERM_ALIASES,
    NOISY_AVOID_ALIASES,
    SAFE_FREE_PATTERNS,
)
from services.chatbot.search.query_normalizer import normalize_text
from services.chatbot.search.vector import ProductSearchResult
from services.product_search.models import ParsedSearchQuery


def rerank_results(
    results: list[ProductSearchResult],
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]] | None = None,
) -> list[ProductSearchResult]:
    if not results:
        return []

    scored: list[tuple[float, int, ProductSearchResult]] = []
    for index, result in enumerate(results):
        score = float(result.hybrid_score or result.raw_score or 0.0)
        score += _structured_bonus(result, parsed_query, attribute_groups or {})
        scored.append((score, index, result))

    scored.sort(key=lambda item: (item[0], -item[1]), reverse=True)
    reranked = [item[2] for item in scored]

    if parsed_query.brand_terms:
        brand_matches = [item for item in reranked if _matches_brand(item, parsed_query.brand_terms)]
        if brand_matches:
            others = [item for item in reranked if item not in brand_matches]
            reranked = brand_matches + others

    if parsed_query.category_terms or parsed_query.product_type_terms:
        category_terms = parsed_query.category_terms + parsed_query.product_type_terms
        category_matches = [item for item in reranked if _matches_text(_category_text(item), category_terms)]
        if category_matches:
            others = [item for item in reranked if item not in category_matches]
            reranked = category_matches + others

    if parsed_query.attribute_group_terms:
        group_matches = [
            item
            for item in reranked
            if _matches_attribute_groups(
                _searchable_text(item),
                parsed_query.attribute_group_terms,
                attribute_groups or {},
            )
        ]
        if group_matches:
            others = [item for item in reranked if item not in group_matches]
            reranked = group_matches + others

    return reranked


def _structured_bonus(
    result: ProductSearchResult,
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]],
) -> float:
    score = 0.0
    searchable_text = _searchable_text(result)
    ingredient_text = normalize_text(result.ingredient_preview)
    strong_keyword_terms = _strong_keyword_terms(parsed_query, attribute_groups)
    weak_keyword_terms = _weak_keyword_terms(parsed_query, attribute_groups)
    if parsed_query.brand_terms and _matches_brand(result, parsed_query.brand_terms):
        score += 25.0
    if parsed_query.category_terms and _matches_text(_category_text(result), parsed_query.category_terms):
        score += 14.0
    if parsed_query.product_type_terms and _matches_text(searchable_text, parsed_query.product_type_terms):
        score += 10.0
    if parsed_query.ingredient_terms:
        score += 18.0 * _match_count(ingredient_text, parsed_query.ingredient_terms)
        score += 8.0 * _match_count(searchable_text, parsed_query.ingredient_terms)
    if parsed_query.attribute_group_terms and _matches_attribute_groups(
        searchable_text,
        parsed_query.attribute_group_terms,
        attribute_groups,
    ):
        score += 12.0
    if parsed_query.attribute_terms and _matches_text(searchable_text, parsed_query.attribute_terms):
        score += 6.0
    if strong_keyword_terms:
        score += 7.0 * _match_count(searchable_text, strong_keyword_terms)
    if weak_keyword_terms:
        score += 3.0 * _match_count(searchable_text, weak_keyword_terms)
    score += _negative_ingredient_adjustment(searchable_text, parsed_query.negative_ingredient_terms)
    if parsed_query.brand_terms and not _matches_brand(result, parsed_query.brand_terms):
        score -= 8.0
    return score


def _matches_brand(result: ProductSearchResult, terms: tuple[str, ...]) -> bool:
    return _matches_text(normalize_text(result.brand_name), terms)


def _category_text(result: ProductSearchResult) -> str:
    return normalize_text(result.category_name)


def _searchable_text(result: ProductSearchResult) -> str:
    parts = [
        result.name,
        result.brand_name,
        result.category_name,
        result.description,
        result.ingredient_preview,
        " ".join(result.concern_names),
        " ".join(result.evidence_snippets),
    ]
    return normalize_text(" ".join(part for part in parts if part))


def _matches_text(text: str, terms: tuple[str, ...]) -> bool:
    if not text:
        return False
    return any(term and term in text for term in terms)


def _matches_attribute_groups(
    text: str,
    group_terms: tuple[str, ...],
    attribute_groups: dict[str, tuple[str, ...]],
) -> bool:
    if not text or not group_terms:
        return False
    for group_key in group_terms:
        aliases = attribute_groups.get(group_key, ())
        if any(alias and alias in text for alias in aliases):
            return True
    return False


def _match_count(text: str, terms: tuple[str, ...]) -> int:
    if not text:
        return 0
    return sum(1 for term in terms if term and term in text)


def _weak_keyword_terms(
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]],
) -> tuple[str, ...]:
    weak_terms: list[str] = []
    seen: set[str] = set()
    attribute_aliases = {
        normalize_text(alias)
        for group_key in parsed_query.attribute_group_terms
        for alias in attribute_groups.get(group_key, ())
        if normalize_text(alias)
    }
    for term in (*parsed_query.attribute_terms, *parsed_query.keyword_terms):
        normalized_term = normalize_text(term)
        if not normalized_term:
            continue
        if normalized_term not in attribute_aliases and normalized_term not in parsed_query.attribute_terms:
            continue
        if normalized_term in seen:
            continue
        seen.add(normalized_term)
        weak_terms.append(normalized_term)
    return tuple(weak_terms)


def _strong_keyword_terms(
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]],
) -> tuple[str, ...]:
    weak_terms = set(_weak_keyword_terms(parsed_query, attribute_groups))
    strong_terms: list[str] = []
    seen: set[str] = set()
    for term in parsed_query.ingredient_terms:
        normalized_term = normalize_text(term)
        if not normalized_term or normalized_term in seen:
            continue
        seen.add(normalized_term)
        strong_terms.append(normalized_term)
    for term in parsed_query.keyword_terms:
        normalized_term = normalize_text(term)
        if not normalized_term or normalized_term in weak_terms or normalized_term in seen:
            continue
        seen.add(normalized_term)
        strong_terms.append(normalized_term)
    return tuple(strong_terms)


def _negative_ingredient_adjustment(
    searchable_text: str,
    negative_terms: tuple[str, ...],
) -> float:
    if not searchable_text or not negative_terms:
        return 0.0

    score = 0.0
    for term in negative_terms:
        safe_patterns = tuple(pattern.lower() for pattern in SAFE_FREE_PATTERNS.get(term, ()))
        aliases = tuple(
            alias.lower()
            for alias in AVOID_TERM_ALIASES.get(term, ())
            if alias.lower() not in NOISY_AVOID_ALIASES
        )
        if any(pattern in searchable_text for pattern in safe_patterns):
            score += 12.0
            continue
        if any(alias in searchable_text for alias in aliases):
            score -= 14.0
    return score
