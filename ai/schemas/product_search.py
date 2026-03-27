from pydantic import BaseModel, Field


class ProductSearchResultItem(BaseModel):
    productId: int
    rawScore: float | None = None
    distance: float | None = None
    matchedSources: list[str] = Field(default_factory=list)


class ProductSearchQueryResponse(BaseModel):
    query: str
    results: list[ProductSearchResultItem] = Field(default_factory=list)


class ProductSearchDictionaryCountsResponse(BaseModel):
    brands: int
    categories: int
    productTypes: int
    lineTerms: int
    attributes: int
    stopwords: int


class ProductSearchDictionaryFilesResponse(BaseModel):
    brands: str
    categories: str
    productTypes: str
    lineTerms: str
    attributes: str


class ProductSearchDictionaryStatusResponse(BaseModel):
    loadedAt: str
    dictionaryDir: str
    generatedFiles: ProductSearchDictionaryFilesResponse
    counts: ProductSearchDictionaryCountsResponse
