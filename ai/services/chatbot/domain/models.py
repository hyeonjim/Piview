from dataclasses import dataclass, field
from typing import Any, Literal, TypeAlias


ResponseType: TypeAlias = Literal[
    "product_recommendation",
    "informational",
    "fallback",
]


@dataclass(frozen=True)
class ClientContext:
    screen: str | None = None
    current_product_id: int | None = None


@dataclass(frozen=True)
class UserContext:
    user_id: int | None = None
    my_skin_type: str | None = None
    skin_problems: list[str] = field(default_factory=list)
    my_product_ids: list[int] = field(default_factory=list)
    disliked_ingredient_names: list[str] = field(default_factory=list)
    disliked_product_ids: list[int] = field(default_factory=list)


@dataclass(frozen=True)
class QueryRequest:
    message: str
    session_id: str | None = None
    client_context: ClientContext | None = None
    user_context: UserContext | None = None


@dataclass
class ProductCandidate:
    product_id: int | None = None
    name: str = ""
    brand_name: str | None = None
    reason: str | None = None


@dataclass
class Citation:
    type: str
    product_id: int | None = None
    text: str | None = None
    title: str | None = None
    snippet: str | None = None
    source: str | None = None
    score: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class QueryResponse:
    session_id: str
    response_type: ResponseType
    answer: str
    products: list[ProductCandidate] = field(default_factory=list)
    applied_filters: dict[str, Any] = field(default_factory=dict)
    citations: list[Citation] = field(default_factory=list)
