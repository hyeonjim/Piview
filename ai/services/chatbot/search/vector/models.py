from dataclasses import dataclass, field
from typing import Any


@dataclass
class IndexedProductDocument:
    product_id: int
    name: str
    document: str
    metadata: dict[str, Any]


@dataclass
class ProductSearchResult:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    concern_names: list[str]
    top_skin_type: str | None
    top2_skin_type: str | None
    document: str
    description: str | None = None
    ingredient_preview: str | None = None
    evidence_snippets: list[str] = field(default_factory=list)
    matched_sources: list[str] = field(default_factory=list)
    raw_score: float | None = None
    hybrid_score: float | None = None
    score_breakdown: dict[str, float] = field(default_factory=dict)
    distance: float | None = None
