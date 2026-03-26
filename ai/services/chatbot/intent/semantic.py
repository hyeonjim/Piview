from functools import lru_cache
import math

from services.chatbot.domain import QueryRequest
from services.chatbot.intent.constants import (
    PRODUCT_SEARCHABLE_INFORMATIONAL_HINTS,
    RECOMMENDATION_HINTS,
    SEMANTIC_ROUTE_EXAMPLES,
)
from services.chatbot.intent.models import IntentDecision
from services.chatbot.retrieval.parsers.category import extract_preferred_categories
from services.chatbot.search.embedding import chatbot_embedding_service


_ACCEPT_THRESHOLD = 0.72
_MARGIN_THRESHOLD = 0.06


class SemanticIntentRouter:
    def route(
        self,
        request: QueryRequest,
        session_context: dict[str, object] | None = None,
    ) -> IntentDecision:
        query_vector = chatbot_embedding_service.embed_texts([request.message.strip()])[0]
        route_scores = {
            route_name: _cosine_similarity(query_vector, route_vector)
            for route_name, route_vector in _get_route_vectors().items()
        }
        ordered = sorted(route_scores.items(), key=lambda item: item[1], reverse=True)
        top_route, top_score = ordered[0]
        second_score = ordered[1][1] if len(ordered) > 1 else None
        low_confidence = top_score < _ACCEPT_THRESHOLD or (
            second_score is not None and (top_score - second_score) < _MARGIN_THRESHOLD
        )

        if top_route == "recommendation_followup" and not _has_session_anchor(session_context):
            top_route = "recommendation_fresh"
            low_confidence = True

        use_product_retrieval = _should_use_product_retrieval(
            intent_type=top_route,
            message=request.message,
        )
        return IntentDecision(
            intent_type=top_route,
            route_source="semantic",
            low_confidence=low_confidence,
            use_product_retrieval=use_product_retrieval,
            top_score=top_score,
            second_score=second_score,
        )


semantic_intent_router = SemanticIntentRouter()


@lru_cache(maxsize=1)
def _get_route_vectors() -> dict[str, list[float]]:
    route_vectors: dict[str, list[float]] = {}
    for route_name, utterances in SEMANTIC_ROUTE_EXAMPLES.items():
        embeddings = chatbot_embedding_service.embed_texts(list(utterances))
        dimension = len(embeddings[0])
        centroid = [0.0] * dimension
        for embedding in embeddings:
            for index, value in enumerate(embedding):
                centroid[index] += float(value)
        route_vectors[route_name] = [value / len(embeddings) for value in centroid]
    return route_vectors


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    numerator = sum(float(lv) * float(rv) for lv, rv in zip(left, right))
    left_norm = math.sqrt(sum(float(value) ** 2 for value in left))
    right_norm = math.sqrt(sum(float(value) ** 2 for value in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return numerator / (left_norm * right_norm)


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
