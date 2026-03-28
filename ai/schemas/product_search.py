from pydantic import BaseModel, Field


class ProductSearchResultItem(BaseModel):
    productId: int
    rawScore: float | None = None
    distance: float | None = None
    matchedSources: list[str] = Field(default_factory=list)


class ProductSearchQueryResponse(BaseModel):
    query: str
    queryShape: str | None = None
    queryBucket: str | None = None
    results: list[ProductSearchResultItem] = Field(default_factory=list)


class ProductSearchDictionaryCountsResponse(BaseModel):
    brands: int
    categories: int
    productTypes: int
    ingredientTerms: int
    lineTerms: int
    attributes: int
    stopwords: int


class ProductSearchDictionaryFilesResponse(BaseModel):
    brands: str
    categories: str
    productTypes: str
    ingredientTerms: str
    lineTerms: str
    attributes: str


class ProductSearchDictionaryStatusResponse(BaseModel):
    loadedAt: str
    dictionaryDir: str
    generatedFiles: ProductSearchDictionaryFilesResponse
    counts: ProductSearchDictionaryCountsResponse
