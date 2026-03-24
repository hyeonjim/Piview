from dataclasses import dataclass


@dataclass
class KeywordCandidateRow:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    description: str | None
    top_skin_type: str | None
    top2_skin_type: str | None
    concern_names: list[str]
    keyword_score: float
