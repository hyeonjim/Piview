"""Chatbot retrieval orchestration."""

from core.settings import get_settings
from services.chatbot.domain import QueryRequest
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
    ) -> RetrievalBundle:
        plan = build_retrieval_plan(request, session_context=session_context)
        if plan.needs_clarifying_question:
            return build_retrieval_bundle(
                plan=plan,
                session_context=session_context,
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
