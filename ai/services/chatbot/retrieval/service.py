"""Chatbot retrieval orchestration."""

from core.settings import get_settings
from services.chatbot.domain import QueryRequest
from services.chatbot.intent.models import IntentDecision
from services.chatbot.retrieval.models import RetrievalBundle
from services.chatbot.retrieval.workflow import (
    build_retrieval_bundle,
    build_retrieval_plan,
    execute_retrieval_searches,
)


class ChatbotRetrievalService:
    async def retrieve(
        self,
        request: QueryRequest,
        session_context: dict[str, object] | None = None,
        intent_decision: IntentDecision | None = None,
    ) -> RetrievalBundle:
        plan = build_retrieval_plan(
            request,
            session_context=session_context,
            intent_decision=intent_decision,
        )
        search_result = await execute_retrieval_searches(
            plan,
            settings=get_settings(),
        )
        return build_retrieval_bundle(
            plan=plan,
            search_result=search_result,
            session_context=session_context,
        )


chatbot_retrieval_service = ChatbotRetrievalService()
