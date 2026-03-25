import asyncio
import json
import logging
from typing import Sequence
from urllib import parse

import httpx

from core.settings import get_settings


logger = logging.getLogger(__name__)


class GmsEmbeddingProvider:
    def provider_name(self, model: str) -> str:
        return f"gms-openai-{model}"

    def embed_texts(
        self,
        texts: Sequence[str],
        model: str,
    ) -> list[list[float]]:
        settings = get_settings()
        if not settings.gms_key:
            raise RuntimeError("GMS_KEY is not set")

        normalized_texts = [text for text in texts if text]
        if not normalized_texts:
            return []

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


class GmsChatProvider:
    async def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
    ) -> str:
        settings = get_settings()
        if not settings.gms_key:
            raise RuntimeError("GMS_KEY is not set")

        endpoint = f"{settings.gms_api_base_url}/v1beta/models/{model}:generateContent"
        url = f"{endpoint}?{parse.urlencode({'key': settings.gms_key})}"
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
            },
        }

        max_retries = max(1, settings.chatbot_llm_max_retries)
        backoff_sec = max(0.1, settings.chatbot_llm_retry_backoff_sec)
        response = None
        last_exception: Exception | None = None

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        url,
                        content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                    )
                    response.raise_for_status()
                last_exception = None
                break
            except httpx.HTTPStatusError as exc:
                last_exception = exc
                if not self._should_retry_status(exc.response.status_code) or attempt == max_retries:
                    logger.warning(
                        "Chat provider request failed with status %s: %s",
                        exc.response.status_code,
                        exc.response.text[:500],
                    )
                    raise RuntimeError(
                        f"LLM request failed with status {exc.response.status_code}"
                    ) from exc
            except httpx.HTTPError as exc:
                last_exception = exc
                if attempt == max_retries:
                    logger.warning("Chat provider request failed: %s", exc)
                    raise RuntimeError(f"GMS request failed: {exc}") from exc

            await asyncio.sleep(backoff_sec * (2 ** (attempt - 1)))

        if response is None:
            raise RuntimeError(f"GMS request failed: {last_exception}") from last_exception

        try:
            response_payload = response.json()
            return response_payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            logger.warning("Unexpected chat provider response: %s", response.text[:500])
            raise RuntimeError(f"Unexpected GMS chatbot response: {response.text[:500]!r}") from exc

    def _should_retry_status(self, status_code: int) -> bool:
        return status_code in {429, 500, 502, 503, 504}
