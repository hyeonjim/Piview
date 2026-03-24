from typing import Sequence

from core.settings import get_settings
from services.chatbot.search.embedding.client import gms_openai_embedding_service


class GmsOpenAIEmbeddingFunction:
    def name(self) -> str:
        settings = get_settings()
        return f"gms-openai-{settings.embedding_model}"

    def embed_documents(self, input: Sequence[str]) -> list[list[float]]:
        return gms_openai_embedding_service.embed_texts(list(input))

    def embed_query(self, input: str | Sequence[str]) -> list[list[float]]:
        query_texts = [input] if isinstance(input, str) else list(input)
        embeddings = gms_openai_embedding_service.embed_texts(query_texts)
        if not embeddings:
            raise RuntimeError("Failed to create query embedding")
        return embeddings

    def __call__(self, input: Sequence[str]) -> list[list[float]]:
        return self.embed_documents(input)
