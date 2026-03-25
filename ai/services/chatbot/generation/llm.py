from core.settings import get_settings
from prompts.chatbot_prompt import CHATBOT_SYSTEM_PROMPT, build_chatbot_user_prompt
from services.chatbot.domain import (
    client_context_to_prompt_payload,
    user_context_to_prompt_payload,
)
from services.chatbot.providers import chat_provider

class ChatbotLlmService:
    async def generate_answer(
        self,
        message: str,
        user_context,
        retrieval_context: str,
        client_context=None,
        session_context: dict | None = None,
    ) -> str:
        settings = get_settings()
        prompt = build_chatbot_user_prompt(
            message=message,
            user_context=user_context_to_prompt_payload(user_context),
            retrieval_context=retrieval_context,
            client_context=client_context_to_prompt_payload(client_context),
            session_context=session_context,
        )
        return await chat_provider.generate_text(
            system_prompt=CHATBOT_SYSTEM_PROMPT,
            user_prompt=prompt,
            model=settings.chatbot_model,
            temperature=settings.chatbot_temperature,
        )


chatbot_llm_service = ChatbotLlmService()
