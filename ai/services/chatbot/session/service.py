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
        self._memory_backend = MemorySessionBackend()
        self._backend = self._build_backend()
        self._fallback_warning_logged = False

    def get_snapshot(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> SessionSnapshot:
        try:
            return self._backend.get_snapshot(session_id, user_id=user_id)
        except RuntimeError as exc:
            self._log_backend_failure(exc)
            return self._memory_backend.get_snapshot(session_id, user_id=user_id)

    def remember_turn(
        self,
        session_id: str,
        request: QueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        try:
            self._backend.remember_turn(session_id, request, answer, product_ids)
        except RuntimeError as exc:
            self._log_backend_failure(exc)
            self._memory_backend.remember_turn(session_id, request, answer, product_ids)

    def _build_backend(self) -> SessionBackend:
        settings = get_settings()
        if settings.chatbot_session_backend == "redis":
            return RedisSessionBackend()
        return self._memory_backend

    def _log_backend_failure(self, exc: RuntimeError) -> None:
        if self._backend is self._memory_backend or self._fallback_warning_logged:
            return
        self._backend = self._memory_backend
        logger.warning("Chat session store fell back to in-memory backend: %s", exc)
        self._fallback_warning_logged = True


chat_session_store = ChatSessionStore()
