"""상품 검색 플래닝용 공통 질의 신호 계산."""

from __future__ import annotations

from dataclasses import dataclass

from services.chatbot.search.query_normalizer import normalize_text


@dataclass(frozen=True)
class ProductSearchQuerySignals:
    residual_keyword_terms: tuple[str, ...]
    residual_keyword_count: int
    has_anchor_brand_or_category: bool
    has_ingredient_signal: bool
    has_attribute_signal: bool
    token_count: int
    is_long_query_like: bool


def build_product_search_query_signals(parsed_query) -> ProductSearchQuerySignals:
    residual_keyword_terms = tuple(
        dict.fromkeys(
            normalize_text(term)
            for term in parsed_query.keyword_terms
            if normalize_text(term)
            and normalize_text(term) not in {normalize_text(item) for item in parsed_query.ingredient_terms}
        )
    )
    residual_keyword_count = len(residual_keyword_terms)
    has_anchor_brand_or_category = bool(
        parsed_query.brand_terms
        or parsed_query.category_terms
        or parsed_query.product_type_terms
    )
    has_ingredient_signal = bool(parsed_query.ingredient_terms)
    has_attribute_signal = bool(parsed_query.attribute_terms or parsed_query.attribute_group_terms)
    is_long_query_like = bool(
        (has_ingredient_signal and residual_keyword_count >= 1)
        or (has_attribute_signal and residual_keyword_count >= 1)
        or (has_anchor_brand_or_category and residual_keyword_count >= 2)
    )

    return ProductSearchQuerySignals(
        residual_keyword_terms=residual_keyword_terms,
        residual_keyword_count=residual_keyword_count,
        has_anchor_brand_or_category=has_anchor_brand_or_category,
        has_ingredient_signal=has_ingredient_signal,
        has_attribute_signal=has_attribute_signal,
        token_count=parsed_query.token_count,
        is_long_query_like=is_long_query_like,
    )
