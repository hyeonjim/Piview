from pydantic import BaseModel, Field


class ProductseachResultItem(BaseModel):
    productId: int
    rawScore: float | None = None
    distance: float | None = None
    matchedSources: list[str] = Field(default_factory=list)


class ProductSearchQueryResponse(BaseModel):
    query: str
    results: list[ProductSearchResultItem] = Field(default_factory=list)