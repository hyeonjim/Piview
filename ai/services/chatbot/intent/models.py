from dataclasses import dataclass
from typing import Literal, TypeAlias


IntentType: TypeAlias = Literal[
    "greeting_chitchat",
    "recommendation_fresh",
    "recommendation_followup",
    "informational",
]

IntentRouteSource: TypeAlias = Literal["rule", "semantic", "fallback"]


@dataclass(frozen=True)
class IntentDecision:
    intent_type: IntentType
    route_source: IntentRouteSource
    low_confidence: bool = False
    use_product_retrieval: bool = False
    matched_rule: str | None = None
    top_score: float | None = None
