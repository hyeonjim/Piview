from typing import Sequence

from core.settings import get_settings
from services.chatbot.providers import EmbeddingProvider, embedding_provider


class ChatbotEmbeddingService:
    def __init__(self, provider: EmbeddingProvider = embedding_provider) -> None:
        self._provider = provider

    def embed_texts(self, texts: Sequence[str], model: str | None = None) -> list[list[float]]:
        """문자열 목록을 현재 provider 기준 임베딩 벡터 목록으로 바꿉니다."""
        settings = get_settings()
        return self._provider.embed_texts(texts, model=model or settings.embedding_model)


chatbot_embedding_service = ChatbotEmbeddingService()
