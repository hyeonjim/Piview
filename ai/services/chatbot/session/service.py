import logging

from core.settings import get_settings
from services.chatbot.domain import QueryRequest
from services.chatbot.session.backends import (
    MemorySessionBackend,
    RedisSessionBackend,
    SessionBackend,
)
from services.chatbot.session.models import SessionSnapshot


logger = logging.getLogger(__name__)


class ChatSessionStore:
    def __init__(self) -> None:
        self._backend = self._build_backend()
        self._backend.ensure_ready()

    def get_snapshot(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> SessionSnapshot:
        return self._backend.get_snapshot(session_id, user_id=user_id)

    def remember_turn(
        self,
        session_id: str,
        request: QueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        self._backend.remember_turn(session_id, request, answer, product_ids)

    def _build_backend(self) -> SessionBackend:
        settings = get_settings()
        if settings.chatbot_session_backend == "memory":
            logger.warning(
                "Chat session store is explicitly configured to use in-memory backend."
            )
            return MemorySessionBackend()
        return RedisSessionBackend()


chat_session_store = ChatSessionStore()
