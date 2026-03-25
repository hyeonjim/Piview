import re
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
        "concerns": " ".join(row.concern_names).lower(),
        "ingredients": " ".join(
            filter(None, [(row.ingredient_text_ko or "").lower(), (row.ingredient_text_en or "").lower()])
        ),
        "skin_type": " ".join(
            filter(None, [(row.top_skin_type or "").lower(), (row.top2_skin_type or "").lower()])
        ),
    }
    field_tokens = {name: _tokenize(value) for name, value in fields.items()}

    score = 0.0
    for term in terms:
        matched_fields = 0
        if _matches(term, fields["name"], field_tokens["name"]):
            score += 12.0 if term in field_tokens["name"] else 9.0
            matched_fields += 1
        if _matches(term, fields["category"], field_tokens["category"]):
            score += 9.0 if term in field_tokens["category"] else 7.0
            matched_fields += 1
        if _matches(term, fields["brand"], field_tokens["brand"]):
            score += 7.0 if term in field_tokens["brand"] else 5.0
            matched_fields += 1
        if _matches(term, fields["concerns"], field_tokens["concerns"]):
            score += 6.0 if term in field_tokens["concerns"] else 4.0
            matched_fields += 1
        if _matches(term, fields["skin_type"], field_tokens["skin_type"]):
            score += 4.5
            matched_fields += 1
        if _matches(term, fields["ingredients"], field_tokens["ingredients"]):
            score += 4.0 if term in field_tokens["ingredients"] else 2.5
            matched_fields += 1
        if _matches(term, fields["description"], field_tokens["description"]):
            score += 3.0 if term in field_tokens["description"] else 1.8
            matched_fields += 1
        if matched_fields >= 2:
            score += 1.5 + ((matched_fields - 2) * 0.4)

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


def _tokenize(text: str) -> set[str]:
    return {token for token in re.findall(r"[0-9A-Za-z가-힣]+", text.lower()) if len(token) >= 2}


def _matches(term: str, text: str, tokens: set[str]) -> bool:
    if not text:
        return False
    return term in tokens or term in text
