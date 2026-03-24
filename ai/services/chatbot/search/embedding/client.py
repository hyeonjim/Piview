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
                response = client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {settings.gms_key}",
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    content=json.dumps(
                        {
                            "model": model,
                            "input": chunk,
                        },
                        ensure_ascii=False,
                    ).encode("utf-8"),
                )
                response.raise_for_status()

                body = response.json()
                data = sorted(body["data"], key=lambda item: item["index"])
                embeddings.extend([item["embedding"] for item in data])

        return embeddings


gms_openai_embedding_service = GmsOpenAIEmbeddingService()
