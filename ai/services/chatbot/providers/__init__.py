from services.chatbot.providers.base import ChatProvider, EmbeddingProvider
from services.chatbot.providers.gms import GmsChatProvider, GmsEmbeddingProvider


chat_provider: ChatProvider = GmsChatProvider()
embedding_provider: EmbeddingProvider = GmsEmbeddingProvider()


__all__ = [
    "ChatProvider",
    "EmbeddingProvider",
    "GmsChatProvider",
    "GmsEmbeddingProvider",
    "chat_provider",
    "embedding_provider",
]
