from schemas.chatbot import (
    ChatbotCitation,
    ChatbotClientContext,
    ChatbotProductCandidate,
    ChatbotQueryRequest,
    ChatbotQueryResponse,
    ChatbotRetrieveProduct,
    ChatbotRetrieveRequest,
    ChatbotRetrieveResponse,
    ChatbotUserContext,
)
from services.chatbot.domain.models import (
    Citation,
    ClientContext,
    ProductCandidate,
    QueryRequest,
    QueryResponse,
    UserContext,
)
from services.chatbot.retrieval_query import RetrievalQueryResponse


def to_domain_request(api_request: ChatbotQueryRequest) -> QueryRequest:
    return QueryRequest(
        message=api_request.message,
        session_id=api_request.sessionId,
        client_context=_to_domain_client_context(api_request.context),
        user_context=_to_domain_user_context(api_request.userContext),
    )


def to_domain_retrieve_request(api_request: ChatbotRetrieveRequest) -> QueryRequest:
    return QueryRequest(
        message=api_request.message,
        session_id=api_request.sessionId,
        client_context=_to_domain_client_context(api_request.context),
        user_context=_to_domain_user_context(api_request.userContext),
    )


def to_api_response(domain_response: QueryResponse) -> ChatbotQueryResponse:
    return ChatbotQueryResponse(
        sessionId=domain_response.session_id,
        responseType=domain_response.response_type,
        answer=domain_response.answer,
        products=[
            ChatbotProductCandidate(
                productId=product.product_id,
                name=product.name,
                brandName=product.brand_name,
                reason=product.reason,
            )
            for product in domain_response.products
        ],
        appliedFilters=domain_response.applied_filters,
        citations=[
            ChatbotCitation(
                type=citation.type,
                productId=citation.product_id,
                text=citation.text,
                title=citation.title,
                snippet=citation.snippet,
                source=citation.source,
                score=citation.score,
                metadata=citation.metadata,
            )
            for citation in domain_response.citations
        ],
    )


def to_api_retrieve_response(
    domain_response: RetrievalQueryResponse,
) -> ChatbotRetrieveResponse:
    return ChatbotRetrieveResponse(
        sessionId=domain_response.session_id,
        query=domain_response.query,
        searchQuery=domain_response.search_query,
        requestedLimit=domain_response.requested_limit,
        returnedCount=domain_response.returned_count,
        searchLimit=domain_response.search_limit,
        hadSearchError=domain_response.had_search_error,
        appliedFilters=domain_response.applied_filters,
        products=[
            ChatbotRetrieveProduct(
                productId=product.product_id,
                name=product.name,
                brandName=product.brand_name,
                categoryName=product.category_name,
                score=product.hybrid_score,
                rawScore=product.raw_score,
                reason=product.reason,
                matchedSources=product.matched_sources,
                concernNames=product.concern_names,
                topSkinType=product.top_skin_type,
                top2SkinType=product.top2_skin_type,
                ingredientPreview=product.ingredient_preview,
                evidenceSnippets=product.evidence_snippets,
                scoreBreakdown=product.score_breakdown,
            )
            for product in domain_response.products
        ],
        citations=[
            ChatbotCitation(
                type=citation.type,
                productId=citation.product_id,
                text=citation.text,
                title=citation.title,
                snippet=citation.snippet,
                source=citation.source,
                score=citation.score,
                metadata=citation.metadata,
            )
            for citation in domain_response.citations
        ],
    )


def user_context_to_payload(user_context: UserContext | None) -> dict[str, object]:
    if user_context is None:
        return {}

    payload: dict[str, object] = {}
    if user_context.user_id is not None:
        payload["userId"] = user_context.user_id
    if user_context.my_skin_type:
        payload["mySkinType"] = user_context.my_skin_type
    if user_context.skin_problems:
        payload["skinProblems"] = user_context.skin_problems
    if user_context.my_product_ids:
        payload["myCosProductIds"] = user_context.my_product_ids
    if user_context.disliked_ingredient_names:
        payload["dislikedIngredientNames"] = user_context.disliked_ingredient_names
    if user_context.disliked_product_ids:
        payload["dislikedProductIds"] = user_context.disliked_product_ids
    return payload


def user_context_to_prompt_payload(user_context: UserContext | None) -> dict[str, object]:
    """LLM에는 개인화에 직접 쓰는 요약 정보만 전달합니다."""
    if user_context is None:
        return {}

    payload: dict[str, object] = {}
    if user_context.my_skin_type:
        payload["mySkinType"] = user_context.my_skin_type
    if user_context.skin_problems:
        payload["skinProblems"] = user_context.skin_problems[:3]
    if user_context.disliked_ingredient_names:
        payload["dislikedIngredientNames"] = user_context.disliked_ingredient_names[:5]
    return payload


def client_context_to_payload(client_context: ClientContext | None) -> dict[str, object]:
    if client_context is None:
        return {}

    payload: dict[str, object] = {}
    if client_context.screen:
        payload["screen"] = client_context.screen
    if client_context.current_product_id is not None:
        payload["currentProductId"] = client_context.current_product_id
    return payload


def client_context_to_prompt_payload(client_context: ClientContext | None) -> dict[str, object]:
    """화면 맥락만 짧게 전달하고 raw product id는 제외합니다."""
    if client_context is None:
        return {}

    payload: dict[str, object] = {}
    if client_context.screen:
        payload["screen"] = client_context.screen
    return payload


def _to_domain_client_context(
    client_context: ChatbotClientContext | None,
) -> ClientContext | None:
    if client_context is None:
        return None
    return ClientContext(
        screen=client_context.screen,
        current_product_id=client_context.currentProductId,
    )


def _to_domain_user_context(user_context: ChatbotUserContext | None) -> UserContext | None:
    if user_context is None:
        return None
    return UserContext(
        user_id=user_context.userId,
        my_skin_type=user_context.mySkinType,
        skin_problems=list(user_context.skinProblems),
        my_product_ids=list(user_context.myCosProductIds),
        disliked_ingredient_names=list(user_context.dislikedIngredientNames),
        disliked_product_ids=list(user_context.dislikedProductIds),
    )
