"""Chroma embedding_function 규약 어댑터."""

from typing import Sequence
import numpy as np
from chromadb.api.types import Embeddings

from core.settings import get_settings
from services.chatbot.providers import embedding_provider
from services.chatbot.search.embedding.client import chatbot_embedding_service


class ChatbotEmbeddingFunction:
    def name(self) -> str:
        """현재 설정 기준 임베딩 함수 이름을 돌려줍니다."""
        settings = get_settings()
        return embedding_provider.provider_name(settings.embedding_model)

    def embed_documents(self, input: Sequence[str]) -> Embeddings:
        """문서 배치 임베딩."""
        embeddings = chatbot_embedding_service.embed_texts(list(input))
        return [np.asarray(embedding, dtype=np.float32) for embedding in embeddings]

    def embed_query(self, input: str | Sequence[str]) -> Embeddings:
        """질의 임베딩.

        query는 보통 1개지만, 라이브러리 인터페이스에 맞춰 시퀀스도 허용합니다.
        """
        query_texts = [input] if isinstance(input, str) else list(input)
        embeddings = chatbot_embedding_service.embed_texts(query_texts)
        if not embeddings:
            raise RuntimeError("Failed to create query embedding")
        return [np.asarray(embedding, dtype=np.float32) for embedding in embeddings]

    def __call__(self, input: Sequence[str]) -> Embeddings:
        """Chroma가 callable embedding function으로 사용할 수 있게 맞춥니다."""
        return self.embed_documents(input)
