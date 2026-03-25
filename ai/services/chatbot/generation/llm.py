import asyncio
import json
import logging
from urllib import parse

import httpx

from core.settings import get_settings
from prompts.chatbot_prompt import CHATBOT_SYSTEM_PROMPT, build_chatbot_user_prompt


logger = logging.getLogger(__name__)


class ChatbotLlmService:
    async def generate_answer(
        self,
        message: str,
        user_context: dict | None,
        retrieval_context: str,
        client_context: dict | None = None,
        session_context: dict | None = None,
    ) -> str:
        settings = get_settings()
        if not settings.gms_key:
            raise RuntimeError("GMS_KEY is not set")

        prompt = build_chatbot_user_prompt(
            message=message,
            user_context=user_context,
            retrieval_context=retrieval_context,
            client_context=client_context,
            session_context=session_context,
        )
        endpoint = f"{settings.gms_api_base_url}/v1beta/models/{settings.chatbot_model}:generateContent"
        url = f"{endpoint}?{parse.urlencode({'key': settings.gms_key})}"
        payload = {
            "systemInstruction": {
                "parts": [{"text": CHATBOT_SYSTEM_PROMPT}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": settings.chatbot_temperature,
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
                        "Chatbot LLM request failed with status %s: %s",
                        exc.response.status_code,
                        exc.response.text[:500],
                    )
                    raise RuntimeError(
                        f"LLM request failed with status {exc.response.status_code}"
                    ) from exc
            except httpx.HTTPError as exc:
                last_exception = exc
                if attempt == max_retries:
                    logger.warning("Chatbot LLM request failed: %s", exc)
                    raise RuntimeError(f"GMS request failed: {exc}") from exc

            await asyncio.sleep(backoff_sec * (2 ** (attempt - 1)))

        if response is None:
            raise RuntimeError(f"GMS request failed: {last_exception}") from last_exception

        try:
            response_payload = response.json()
            return response_payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            logger.warning("Unexpected chatbot LLM response: %s", response.text[:500])
            raise RuntimeError(f"Unexpected GMS chatbot response: {response.text[:500]!r}") from exc

    def _should_retry_status(self, status_code: int) -> bool:
        return status_code in {429, 500, 502, 503, 504}


chatbot_llm_service = ChatbotLlmService()
