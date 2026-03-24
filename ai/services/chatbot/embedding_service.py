from __future__ import annotations

import json
from typing import Sequence

import httpx

from core.settings import get_settings


class GmsOpenAIEmbeddingService:
    def embed_texts(self, texts: Sequence[str], model: str | None = None) -> list[list[float]]:
        settings = get_settings()
        if not settings.gms_key:
            raise RuntimeError("GMS_KEY is not set")

        normalized_texts = [text for text in texts if text]
        if not normalized_texts:
            return []

        model = model or settings.embedding_model
        batch_size = max(1, settings.embedding_batch_size)
        url = f"{settings.embedding_api_base_url}/v1/embeddings"

        embeddings: list[list[float]] = []
        with httpx.Client(timeout=120.0) as client:
            for start in range(0, len(normalized_texts), batch_size):
                chunk = normalized_texts[start : start + batch_size]
                payload = {
                    "model": model,
                    "input": chunk,
                }
                response = client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {settings.gms_key}",
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                )
                response.raise_for_status()

                body = response.json()
                data = sorted(body["data"], key=lambda item: item["index"])
                embeddings.extend([item["embedding"] for item in data])

        return embeddings


class GmsOpenAIEmbeddingFunction:
    def name(self) -> str:
        settings = get_settings()
        return f"gms-openai-{settings.embedding_model}"

    def embed_documents(self, input: Sequence[str]) -> list[list[float]]:
        return gms_openai_embedding_service.embed_texts(list(input))

    def embed_query(self, input: str | Sequence[str]) -> list[list[float]]:
        if isinstance(input, str):
            query_texts = [input]
        else:
            query_texts = list(input)
        embeddings = gms_openai_embedding_service.embed_texts(query_texts)
        if not embeddings:
            raise RuntimeError("Failed to create query embedding")
        return embeddings

    def __call__(self, input: Sequence[str]) -> list[list[float]]:
        return self.embed_documents(input)


gms_openai_embedding_service = GmsOpenAIEmbeddingService()
