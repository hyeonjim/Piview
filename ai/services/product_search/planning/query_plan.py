"""Execution planning for product search."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProductSearchExecutionPlan:
    query_shape: str
    query_bucket: str
    run_exact: bool
    run_fuzzy: bool
    include_ingredient_text_in_prefilter: bool = False


def build_product_search_execution_plan(parsed_query) -> ProductSearchExecutionPlan:
    has_brand = bool(parsed_query.brand_terms)
    has_category = bool(parsed_query.category_terms or parsed_query.product_type_terms)
    has_textual_detail = bool(parsed_query.keyword_terms)
    has_attributes = bool(parsed_query.attribute_terms or parsed_query.attribute_group_terms)
    has_ingredient = bool(parsed_query.ingredient_terms)
    has_negative_ingredient = bool(parsed_query.negative_ingredient_terms)
    remaining_keywords = tuple(
        term for term in parsed_query.keyword_terms if term not in parsed_query.ingredient_terms
    )
    is_long_query = parsed_query.token_count >= 4 and bool(
        remaining_keywords or parsed_query.attribute_terms or parsed_query.attribute_group_terms
    )
    is_free_text = not parsed_query.is_structured

    if has_negative_ingredient:
        return ProductSearchExecutionPlan(
            query_shape="negative_ingredient",
            query_bucket="negative_ingredient",
            run_exact=False,
            run_fuzzy=False,
        )

    if has_ingredient and not has_brand and not has_category and not remaining_keywords:
        return ProductSearchExecutionPlan(
            query_shape="ingredient_only",
            query_bucket="ingredient_only",
            run_exact=False,
            run_fuzzy=False,
            include_ingredient_text_in_prefilter=True,
        )

    if has_ingredient and has_category:
        return ProductSearchExecutionPlan(
            query_shape="ingredient_category",
            query_bucket="ingredient_category",
            run_exact=False,
            run_fuzzy=False,
            include_ingredient_text_in_prefilter=True,
        )

    if is_free_text:
        query_bucket = "ambiguous_keyword" if len(parsed_query.keyword_terms) == 1 else "free_text"
        return ProductSearchExecutionPlan(
            query_shape=query_bucket,
            query_bucket=query_bucket,
            run_exact=True,
            run_fuzzy=True,
        )

    if has_category and not has_brand and not has_textual_detail and not has_attributes:
        return ProductSearchExecutionPlan(
            query_shape="category_only",
            query_bucket="category_only",
            run_exact=False,
            run_fuzzy=False,
        )

    if has_brand and not has_category and not has_textual_detail and not has_attributes:
        return ProductSearchExecutionPlan(
            query_shape="brand_only",
            query_bucket="brand_only",
            run_exact=False,
            run_fuzzy=False,
        )

    if len(parsed_query.brand_terms) > 1 and has_category:
        return ProductSearchExecutionPlan(
            query_shape="multi_brand_category",
            query_bucket="multi_brand_category",
            run_exact=False,
            run_fuzzy=False,
        )

    if has_brand and has_category and not has_textual_detail and not has_attributes:
        return ProductSearchExecutionPlan(
            query_shape="brand_category",
            query_bucket="brand_category",
            run_exact=False,
            run_fuzzy=False,
        )

    if is_long_query:
        return ProductSearchExecutionPlan(
            query_shape="long_query",
            query_bucket="long_query",
            run_exact=False,
            run_fuzzy=False,
            include_ingredient_text_in_prefilter=has_ingredient,
        )

    allow_name_matching = has_textual_detail or not has_category
    run_exact = allow_name_matching and len(parsed_query.brand_terms) <= 1 and len(parsed_query.keyword_terms) <= 4
    run_fuzzy = run_exact and len(parsed_query.keyword_terms) <= 2

    return ProductSearchExecutionPlan(
        query_shape="mixed_structured",
        query_bucket="mixed_structured",
        run_exact=run_exact,
        run_fuzzy=run_fuzzy,
    )
