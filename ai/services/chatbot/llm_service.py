import asyncio
import json
from urllib import parse

import httpx

from core.settings import get_settings
from prompts.chatbot_prompt import CHATBOT_SYSTEM_PROMPT, build_chatbot_user_prompt


class ChatbotLlmService:
    async def generate_answer(
        self,
        message: str,
        user_context: dict | None,
        retrieval_context: str,
    ) -> str:
        settings = get_settings()
        if not settings.gms_key:
            raise RuntimeError("GMS_KEY is not set")

        # 프롬프트 조합은 별도 함수로 분리해 retrieval/문맥 규칙이 바뀌어도 호출 코드는 단순하게 유지합니다.
        prompt = build_chatbot_user_prompt(
            message=message,
            user_context=user_context,
            retrieval_context=retrieval_context,
        )

        # 실제 호출은 GMS 프록시가 제공하는 LLM API 경로로 보냅니다.
        endpoint = f"{settings.gms_api_base_url}/v1beta/models/{settings.chatbot_model}:generateContent"
        url = f"{endpoint}?{parse.urlencode({'key': settings.gms_key})}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"{CHATBOT_SYSTEM_PROMPT}\n\n{prompt}",
                        }
                    ],
                }
            ],
            "generationConfig": {
                # 초기 단계에서는 안정적인 안내형 응답이 우선이라 temperature를 낮게 둡니다.
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
                    detail = exc.response.text
                    raise RuntimeError(
                        detail or f"GMS request failed with status {exc.response.status_code}"
                    ) from exc
            except httpx.HTTPError as exc:
                last_exception = exc
                if attempt == max_retries:
                    raise RuntimeError(f"GMS request failed: {exc}") from exc

            await asyncio.sleep(backoff_sec * (2 ** (attempt - 1)))

        if response is None:
            raise RuntimeError(f"GMS request failed: {last_exception}") from last_exception

        try:
            response_payload = response.json()
            # 현재는 텍스트 한 개만 꺼내지만, 이후 citations/tool calls가 생기면 여기서 확장합니다.
            return response_payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(f"Unexpected GMS chatbot response: {response.text[:500]!r}") from exc

    def _should_retry_status(self, status_code: int) -> bool:
        return status_code in {429, 500, 502, 503, 504}


chatbot_llm_service = ChatbotLlmService()
