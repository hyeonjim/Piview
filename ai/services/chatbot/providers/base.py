from typing import Protocol, Sequence


class EmbeddingProvider(Protocol):
    def provider_name(self, model: str) -> str: ...

    def embed_texts(
        self,
        texts: Sequence[str],
        model: str,
    ) -> list[list[float]]: ...


class ChatProvider(Protocol):
    async def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
    ) -> str: ...
