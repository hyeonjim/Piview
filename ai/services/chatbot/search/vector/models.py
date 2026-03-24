from dataclasses import dataclass
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
    distance: float | None = None
