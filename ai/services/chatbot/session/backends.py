import logging
import time
from threading import Lock
from typing import Protocol

from core.settings import get_settings
from services.chatbot.domain import QueryRequest
from services.chatbot.session.models import SessionSnapshot, StoredSession
from services.chatbot.session.serialization import (
    deserialize_session,
    serialize_session,
    session_to_snapshot,
    update_stored_session,
)


logger = logging.getLogger(__name__)


class SessionBackend(Protocol):
    def ensure_ready(self) -> None: ...

    def get_snapshot(self, session_id: str, user_id: int | None = None) -> SessionSnapshot: ...

    def remember_turn(
        self,
        session_id: str,
        request: QueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None: ...


class MemorySessionBackend:
    def __init__(self) -> None:
        self._sessions: dict[str, StoredSession] = {}
        self._lock = Lock()

    def get_snapshot(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> SessionSnapshot:
        with self._lock:
            self._purge_stale_sessions()
            return session_to_snapshot(session_id, self._sessions.get(session_id), user_id=user_id)

    def ensure_ready(self) -> None:
        return None

    def remember_turn(
        self,
        session_id: str,
        request: QueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        with self._lock:
            self._purge_stale_sessions()
            stored = update_stored_session(
                self._sessions.get(session_id),
                request,
                answer,
                product_ids,
            )
            self._sessions[session_id] = stored

    def _purge_stale_sessions(self) -> None:
        settings = get_settings()
        ttl_sec = max(60, settings.chatbot_session_ttl_sec)
        now = time.time()
        expired_keys = [
            session_id
            for session_id, stored in self._sessions.items()
            if now - stored.updated_at > ttl_sec
        ]
        for session_id in expired_keys:
            self._sessions.pop(session_id, None)

    def clear(self) -> None:
        with self._lock:
            self._sessions.clear()


class RedisSessionBackend:
    _KEY_PREFIX = "chatbot:session:"

    def __init__(self) -> None:
        self._client = None

    def ensure_ready(self) -> None:
        self._get_client()

    def get_snapshot(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> SessionSnapshot:
        stored = self._load_session(session_id)
        return session_to_snapshot(session_id, stored, user_id=user_id)

    def remember_turn(
        self,
        session_id: str,
        request: QueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        stored = update_stored_session(
            self._load_session(session_id),
            request,
            answer,
            product_ids,
        )
        self._save_session(session_id, stored)

    def _load_session(self, session_id: str) -> StoredSession | None:
        raw_payload = self._get_client().get(self._make_key(session_id))
        if not raw_payload:
            return None
        try:
            return deserialize_session(raw_payload)
        except ValueError as exc:
            raise RuntimeError("Stored Redis session payload is invalid") from exc

    def _save_session(self, session_id: str, stored: StoredSession) -> None:
        settings = get_settings()
        ttl_sec = max(60, settings.chatbot_session_ttl_sec)
        self._get_client().setex(
            self._make_key(session_id),
            ttl_sec,
            serialize_session(stored),
        )

    def _make_key(self, session_id: str) -> str:
        return f"{self._KEY_PREFIX}{session_id}"

    def _get_client(self):
        if self._client is not None:
            return self._client

        try:
            import redis
        except ImportError as exc:
            raise RuntimeError("redis package is not installed") from exc

        settings = get_settings()
        if settings.chatbot_redis_url:
            client = redis.Redis.from_url(settings.chatbot_redis_url, decode_responses=True)
        elif settings.chatbot_redis_host:
            client = redis.Redis(
                host=settings.chatbot_redis_host,
                port=settings.chatbot_redis_port,
                password=settings.chatbot_redis_password,
                db=settings.chatbot_redis_db,
                decode_responses=True,
            )
        else:
            raise RuntimeError(
                "CHATBOT_SESSION_BACKEND is 'redis' but Redis connection settings are missing"
            )

        try:
            client.ping()
        except Exception as exc:
            raise RuntimeError(f"Redis session store is unavailable: {exc}") from exc

        self._client = client
        return self._client
