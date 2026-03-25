from services.chatbot.domain import QueryRequest
from services.chatbot.retrieval.builders import (
    build_context_hints,
    build_excluded_product_ids,
    build_search_query,
    collect_applied_filters,
)
from services.chatbot.retrieval.parsers import (
    extract_avoid_terms,
    extract_existing_categories,
    extract_missing_categories,
    extract_preferred_categories,
    extract_preferred_concerns,
    needs_clarifying_question,
)
from services.chatbot.retrieval.workflow.models import RetrievalPlan


def build_retrieval_plan(
    request: QueryRequest,
    session_context: dict[str, object] | None = None,
) -> RetrievalPlan:
    preferred_categories = extract_preferred_categories(request.message)
    context_hints = build_context_hints(request.client_context, session_context)

    if needs_clarifying_question(request.message, preferred_categories):
        return RetrievalPlan(
            request=request,
            context_hints=context_hints,
            applied_filters=collect_applied_filters(
                request,
                session_context=session_context,
            ),
            preferred_categories=preferred_categories,
            avoid_terms=extract_avoid_terms(request),
            needs_clarifying_question=True,
        )

    search_query, used_session_memory = build_search_query(
        request,
        session_context=session_context,
    )
    return RetrievalPlan(
        request=request,
        context_hints=context_hints,
        applied_filters=collect_applied_filters(
            request,
            session_context=session_context,
            used_session_memory=used_session_memory,
        ),
        preferred_categories=preferred_categories,
        preferred_concerns=extract_preferred_concerns(request),
        avoid_terms=extract_avoid_terms(request),
        existing_categories=extract_existing_categories(request.message),
        missing_categories=extract_missing_categories(request.message),
        excluded_product_ids=build_excluded_product_ids(request),
        search_query=search_query,
        used_session_memory=used_session_memory,
    )
