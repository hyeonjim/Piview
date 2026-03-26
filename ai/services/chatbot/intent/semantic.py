from functools import lru_cache

from services.chatbot.domain import QueryRequest
from services.chatbot.intent.constants import (
    PRODUCT_SEARCHABLE_INFORMATIONAL_HINTS,
    RECOMMENDATION_HINTS,
    SEMANTIC_ROUTE_EXAMPLES,
)
from services.chatbot.intent.models import IntentDecision
from services.chatbot.retrieval.parsers.category import extract_preferred_categories
from services.chatbot.search.embedding import chatbot_embedding_service

try:
    from semantic_router import Route
    from semantic_router.encoders.base import BaseEncoder
    from semantic_router.layer import RouteLayer
except ImportError:
    Route = None
    BaseEncoder = object
    RouteLayer = None


_ROUTE_SCORE_THRESHOLD = 0.72
_LOW_CONFIDENCE_THRESHOLD = 0.78


class ChatbotSemanticRouterEncoder(BaseEncoder):
    name: str = "chatbot-semantic-router-encoder"
    score_threshold: float | None = _ROUTE_SCORE_THRESHOLD
    type: str = "chatbot"

    def __call__(self, docs: list[str]) -> list[list[float]]:
        return chatbot_embedding_service.embed_texts(docs)

    async def acall(self, docs: list[str]) -> list[list[float]]:
        return self(docs)


class SemanticIntentRouter:
    def route(
        self,
        request: QueryRequest,
        session_context: dict[str, object] | None = None,
    ) -> IntentDecision:
        route_layer = _get_route_layer()
        if route_layer is None:
            raise RuntimeError("semantic-router is not installed")

        route_choice = route_layer(request.message.strip())
        if route_choice is None or route_choice.name is None:
            use_product_retrieval = _should_use_product_retrieval(
                intent_type="informational",
                message=request.message,
            )
            return IntentDecision(
                intent_type="recommendation_fresh" if use_product_retrieval else "informational",
                route_source="semantic",
                low_confidence=True,
                use_product_retrieval=use_product_retrieval,
            )

        intent_type = route_choice.name
        low_confidence = (route_choice.similarity_score or 0.0) < _LOW_CONFIDENCE_THRESHOLD
        if intent_type == "recommendation_followup" and not _has_session_anchor(session_context):
            intent_type = "recommendation_fresh"
            low_confidence = True

        use_product_retrieval = _should_use_product_retrieval(
            intent_type=intent_type,
            message=request.message,
        )
        return IntentDecision(
            intent_type=intent_type,
            route_source="semantic",
            low_confidence=low_confidence,
            use_product_retrieval=use_product_retrieval,
            top_score=route_choice.similarity_score,
        )


semantic_intent_router = SemanticIntentRouter()


@lru_cache(maxsize=1)
def _get_route_layer():
    if RouteLayer is None or Route is None:
        return None
    routes = [
        Route(name=route_name, utterances=list(utterances))
        for route_name, utterances in SEMANTIC_ROUTE_EXAMPLES.items()
    ]
    encoder = ChatbotSemanticRouterEncoder()
    return RouteLayer(encoder=encoder, routes=routes)


def _has_session_anchor(session_context: dict[str, object] | None) -> bool:
    if not session_context:
        return False
    return bool(session_context.get("recentProductIds") or session_context.get("currentProductId"))


def _should_use_product_retrieval(
    *,
    intent_type: str,
    message: str,
) -> bool:
    if intent_type.startswith("recommendation"):
        return True
    if intent_type != "informational":
        return False

    lowered = message.lower().replace(" ", "")
    if extract_preferred_categories(message):
        return True
    if any(hint.replace(" ", "") in lowered for hint in PRODUCT_SEARCHABLE_INFORMATIONAL_HINTS):
        return True
    if any(hint.replace(" ", "") in lowered for hint in RECOMMENDATION_HINTS):
        return True
    return False
