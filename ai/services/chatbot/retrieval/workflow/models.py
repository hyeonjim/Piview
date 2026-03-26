from dataclasses import dataclass, field

from services.chatbot.domain import QueryRequest
from services.chatbot.intent.models import IntentDecision
from services.chatbot.search.vector import ProductSearchResult


@dataclass
class RetrievalPlan:
    request: QueryRequest
    context_hints: list[str] = field(default_factory=list)
    applied_filters: dict[str, object] = field(default_factory=dict)
    preferred_categories: set[str] = field(default_factory=set)
    preferred_concerns: set[str] = field(default_factory=set)
    avoid_terms: set[str] = field(default_factory=set)
    existing_categories: set[str] = field(default_factory=set)
    missing_categories: set[str] = field(default_factory=set)
    excluded_product_ids: set[int] = field(default_factory=set)
    search_query: str = ""
    used_session_memory: bool = False
    used_anchor_products: bool = False
    intent_decision: IntentDecision | None = None


@dataclass
class SearchExecutionResult:
    vector_results: list[ProductSearchResult] = field(default_factory=list)
    keyword_results: list[ProductSearchResult] = field(default_factory=list)
    had_search_error: bool = False
