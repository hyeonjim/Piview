from schemas.chatbot import (
    ChatbotCitation,
    ChatbotClientContext,
    ChatbotProductCandidate,
    ChatbotQueryRequest,
    ChatbotQueryResponse,
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


def to_domain_request(api_request: ChatbotQueryRequest) -> QueryRequest:
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


def client_context_to_payload(client_context: ClientContext | None) -> dict[str, object]:
    if client_context is None:
        return {}

    payload: dict[str, object] = {}
    if client_context.screen:
        payload["screen"] = client_context.screen
    if client_context.current_product_id is not None:
        payload["currentProductId"] = client_context.current_product_id
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
