from dataclasses import replace

from services.chatbot.search.keyword.models import KeywordCandidateRow
from services.chatbot.search.product_data import build_evidence_snippets, build_ingredient_preview
from services.chatbot.search.vector import ProductSearchResult


def score_row(row: KeywordCandidateRow, terms: list[str]) -> KeywordCandidateRow:
    fields = {
        "name": row.name.lower(),
        "brand": (row.brand_name or "").lower(),
        "category": (row.category_name or "").lower(),
        "description": (row.description or "").lower(),
    }

    score = 0.0
    for term in terms:
        if term in fields["name"]:
            score += 10.0
        if term in fields["category"]:
            score += 8.0
        if term in fields["brand"]:
            score += 6.0
        if term in fields["description"]:
            score += 2.0

    return replace(row, keyword_score=score)


def to_search_result(row: KeywordCandidateRow) -> ProductSearchResult:
    return ProductSearchResult(
        product_id=row.product_id,
        name=row.name,
        brand_name=row.brand_name,
        category_name=row.category_name,
        concern_names=row.concern_names,
        top_skin_type=row.top_skin_type,
        top2_skin_type=row.top2_skin_type,
        document=build_document_text(row),
        description=row.description,
        ingredient_preview=build_ingredient_preview(
            row.ingredient_text_ko,
            row.ingredient_text_en,
        ),
        evidence_snippets=build_evidence_snippets(row),
        matched_sources=["keyword"],
        raw_score=row.keyword_score,
        distance=None,
    )


def build_document_text(row: KeywordCandidateRow) -> str:
    parts = [f"상품명: {row.name}"]
    if row.brand_name:
        parts.append(f"브랜드: {row.brand_name}")
    if row.category_name:
        parts.append(f"카테고리: {row.category_name}")
    if row.description:
        parts.append(f"설명: {' '.join(str(row.description).split())}")
    ingredient_preview = build_ingredient_preview(row.ingredient_text_ko, row.ingredient_text_en)
    if ingredient_preview:
        parts.append(f"전성분 메모: {ingredient_preview}")
    if row.concern_names:
        parts.append(f"관련 고민: {', '.join(row.concern_names[:5])}")
    return "\n".join(parts)
