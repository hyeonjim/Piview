"""상품 검색 결과용 구조화 재정렬 로직."""

from __future__ import annotations

from services.chatbot.search.query_normalizer import normalize_text
from services.chatbot.search.vector import ProductSearchResult
from services.product_search.models import ParsedSearchQuery
from services.product_search.negative_rules import has_negative_safe_pattern


def rerank_results(
    results: list[ProductSearchResult],
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]] | None = None,
    ingredient_expansion_lookup: dict[str, tuple[str, ...]] | None = None,
) -> list[ProductSearchResult]:
    # 이 reranker는 fuse 결과 위에 product_search 전용 structured bias를 얹는 마지막 단계다.
    # exact/fuzzy/keyword/vector source가 섞여 들어와도, 최종 순서는 parsed_query 기준으로 다시 정렬한다.
    if not results:
        return []

    scored: list[tuple[float, int, ProductSearchResult]] = []
    for index, result in enumerate(results):
        score = float(result.hybrid_score or result.raw_score or 0.0)
        score += _structured_bonus(
            result,
            parsed_query,
            attribute_groups or {},
            ingredient_expansion_lookup or {},
        )
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
    ingredient_expansion_lookup: dict[str, tuple[str, ...]],
) -> float:
    # bonus 계산은 service._apply_structured_constraints보다 더 가벼운 전역 재정렬 용도다.
    # 여기서는 source와 무관하게 각 결과 자체가 query intent를 얼마나 설명하는지 본다.
    score = 0.0
    searchable_text = _searchable_text(result)
    ingredient_text = normalize_text(result.ingredient_preview)
    strong_keyword_terms = _strong_keyword_terms(parsed_query, attribute_groups)
    weak_keyword_terms = _weak_keyword_terms(parsed_query, attribute_groups)
    ingredient_match_count = _match_ingredient_query_count(
        searchable_text,
        parsed_query.ingredient_terms,
        ingredient_expansion_lookup,
    )
    ingredient_field_match_count = _match_ingredient_query_count(
        ingredient_text,
        parsed_query.ingredient_terms,
        ingredient_expansion_lookup,
    )
    ingredient_name_match_count = _match_ingredient_query_count(
        normalize_text(result.name),
        parsed_query.ingredient_terms,
        ingredient_expansion_lookup,
    )
    if parsed_query.brand_terms and _matches_brand(result, parsed_query.brand_terms):
        score += 25.0
    if parsed_query.category_terms and _matches_text(_category_text(result), parsed_query.category_terms):
        score += 14.0
    if parsed_query.product_type_terms and _matches_text(searchable_text, parsed_query.product_type_terms):
        score += 10.0
    if parsed_query.ingredient_terms:
        score += 24.0 * ingredient_field_match_count
        score += 10.0 * ingredient_name_match_count
        score += 12.0 * ingredient_match_count
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


def _match_ingredient_query_count(
    text: str,
    ingredient_terms: tuple[str, ...],
    ingredient_expansion_lookup: dict[str, tuple[str, ...]],
) -> int:
    if not text or not ingredient_terms:
        return 0

    match_count = 0
    normalized_text = normalize_text(text)
    for ingredient_term in ingredient_terms:
        normalized_term = normalize_text(ingredient_term)
        if not normalized_term:
            continue
        candidates = (
            normalized_term,
            *ingredient_expansion_lookup.get(normalized_term, ()),
        )
        if any(candidate and candidate in normalized_text for candidate in candidates):
            match_count += 1
    return match_count


def _weak_keyword_terms(
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]],
) -> tuple[str, ...]:
    # weak keyword는 attribute alias와 겹치는 경우만 남긴다.
    # 그렇지 않은 자유어는 strong keyword 또는 일반 keyword relevance에서 처리하는 편이 안전하다.
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
        if normalized_term in seen or normalized_term in parsed_query.ingredient_terms:
            continue
        seen.add(normalized_term)
        weak_terms.append(normalized_term)
    return tuple(weak_terms)


def _strong_keyword_terms(
    parsed_query: ParsedSearchQuery,
    attribute_groups: dict[str, tuple[str, ...]],
) -> tuple[str, ...]:
    # long query에서 상위권을 결정하는 실질적인 본문 키워드 집합이다.
    # ingredient는 무조건 strong에 포함하고, weak로 빠진 term은 제외한다.
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
    # polarity handling은 service 쪽과 동일 원칙을 유지한다.
    # safe pattern 우선, 그 외 단순 포함은 패널티다.
    if not searchable_text or not negative_terms:
        return 0.0

    score = 0.0
    for term in negative_terms:
        if has_negative_safe_pattern(searchable_text, term):
            score += 12.0
            continue
        if normalize_text(term) in searchable_text:
            score -= 14.0
    return score
