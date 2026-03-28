"""Execution planning for product search."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProductSearchExecutionPlan:
    query_shape: str
    run_exact: bool
    run_fuzzy: bool
    include_ingredient_text_in_prefilter: bool = False


def build_product_search_execution_plan(parsed_query) -> ProductSearchExecutionPlan:
    has_brand = bool(parsed_query.brand_terms)
    has_category = bool(parsed_query.category_terms or parsed_query.product_type_terms)
    has_textual_detail = bool(parsed_query.line_terms or parsed_query.keyword_terms)
    has_attributes = bool(parsed_query.attribute_terms or parsed_query.attribute_group_terms)
    is_free_text = not parsed_query.is_structured

    if is_free_text:
        return ProductSearchExecutionPlan(
            query_shape="free_text",
            run_exact=True,
            run_fuzzy=True,
        )

    if has_category and not has_brand and not has_textual_detail and not has_attributes:
        return ProductSearchExecutionPlan(
            query_shape="category_only",
            run_exact=False,
            run_fuzzy=False,
        )

    if has_brand and not has_category and not has_textual_detail and not has_attributes:
        return ProductSearchExecutionPlan(
            query_shape="brand_only",
            run_exact=False,
            run_fuzzy=False,
        )

    if has_brand and has_category and not has_textual_detail and not has_attributes:
        return ProductSearchExecutionPlan(
            query_shape="brand_category",
            run_exact=False,
            run_fuzzy=False,
        )

    if len(parsed_query.brand_terms) > 1 and has_category:
        return ProductSearchExecutionPlan(
            query_shape="multi_brand_category",
            run_exact=False,
            run_fuzzy=False,
        )

    allow_name_matching = has_textual_detail or not has_category
    run_exact = allow_name_matching and len(parsed_query.brand_terms) <= 1 and len(parsed_query.keyword_terms) <= 4
    run_fuzzy = run_exact and (bool(parsed_query.line_terms) or len(parsed_query.keyword_terms) <= 2)

    return ProductSearchExecutionPlan(
        query_shape="mixed_structured",
        run_exact=run_exact,
        run_fuzzy=run_fuzzy,
    )
