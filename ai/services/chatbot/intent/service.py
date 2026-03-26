from services.chatbot.domain import QueryRequest
from services.chatbot.intent.models import IntentDecision
from services.chatbot.intent.rules import route_by_rules
from services.chatbot.intent.semantic import semantic_intent_router


class ChatbotIntentRouter:
    def route(
        self,
        request: QueryRequest,
        session_context: dict[str, object] | None = None,
    ) -> IntentDecision:
        rule_decision = route_by_rules(request, session_context=session_context)
        if rule_decision is not None:
            return rule_decision

        try:
            return semantic_intent_router.route(
                request,
                session_context=session_context,
            )
        except RuntimeError:
            return _fallback_decision(request)


def _fallback_decision(request: QueryRequest) -> IntentDecision:
    message = request.message.strip()
    use_product_retrieval = bool(message) and ("추천" in message or "제품" in message)
    return IntentDecision(
        intent_type="recommendation_fresh" if use_product_retrieval else "informational",
        route_source="fallback",
        low_confidence=True,
        use_product_retrieval=use_product_retrieval,
    )


chatbot_intent_router = ChatbotIntentRouter()
