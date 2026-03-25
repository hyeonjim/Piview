"""In-memory chat session store.

현재 챗봇은 단일 요청 계약을 유지하지만, 같은 sessionId 안에서는
직전 대화와 화면 문맥을 짧게 이어받아 follow-up 질문 품질을 보완합니다.
"""

from dataclasses import dataclass, field
import json
import logging
import time
from threading import Lock
from typing import Iterable, Protocol

from core.settings import get_settings
from schemas.chatbot import ChatbotQueryRequest

logger = logging.getLogger(__name__)


@dataclass
class SessionSnapshot:
    session_id: str
    user_id: int | None = None
    screen: str | None = None
    current_product_id: int | None = None
    recent_user_messages: list[str] = field(default_factory=list)
    recent_answers: list[str] = field(default_factory=list)
    recent_product_ids: list[int] = field(default_factory=list)

    @property
    def has_history(self) -> bool:
        return bool(self.recent_user_messages)

    def to_prompt_payload(self) -> dict[str, object]:
        return {
            "sessionId": self.session_id,
            "userId": self.user_id,
            "screen": self.screen,
            "currentProductId": self.current_product_id,
            "recentUserMessages": self.recent_user_messages,
            "recentAnswers": self.recent_answers,
            "recentProductIds": self.recent_product_ids,
        }


@dataclass
class _StoredTurn:
    user_message: str
    answer: str
    product_ids: list[int]


@dataclass
class _StoredSession:
    user_id: int | None = None
    screen: str | None = None
    current_product_id: int | None = None
    turns: list[_StoredTurn] = field(default_factory=list)
    updated_at: float = field(default_factory=time.time)


class _SessionBackend(Protocol):
    def get_snapshot(self, session_id: str, user_id: int | None = None) -> SessionSnapshot: ...

    def remember_turn(
        self,
        session_id: str,
        request: ChatbotQueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None: ...


def _session_to_snapshot(
    session_id: str,
    stored: _StoredSession | None,
    user_id: int | None = None,
) -> SessionSnapshot:
    if stored is None:
        return SessionSnapshot(session_id=session_id, user_id=user_id)
    if user_id is not None and stored.user_id is not None and stored.user_id != user_id:
        # 같은 sessionId를 다른 사용자가 재사용한 경우에는 이전 문맥을 섞지 않습니다.
        return SessionSnapshot(session_id=session_id, user_id=user_id)

    recent_turns = stored.turns[-2:]
    # 최근 추천 상품은 한두 턴 전까지 합쳐 두어 후속 질문에서 "아까 추천한 것"을 참조할 수 있게 합니다.
    recent_product_ids = _dedupe_product_ids(
        product_id
        for turn in reversed(stored.turns[-3:])
        for product_id in turn.product_ids
    )
    return SessionSnapshot(
        session_id=session_id,
        user_id=stored.user_id if stored.user_id is not None else user_id,
        screen=stored.screen,
        current_product_id=stored.current_product_id,
        recent_user_messages=[turn.user_message for turn in recent_turns],
        recent_answers=[turn.answer for turn in recent_turns],
        recent_product_ids=recent_product_ids,
    )


def _update_stored_session(
    stored: _StoredSession | None,
    request: ChatbotQueryRequest,
    answer: str,
    product_ids: list[int],
) -> _StoredSession:
    incoming_user_id = request.userContext.userId if request.userContext else None
    settings = get_settings()

    if stored is None or (
        incoming_user_id is not None and stored.user_id is not None and stored.user_id != incoming_user_id
    ):
        # 사용자 경계가 바뀌면 기존 turn 히스토리를 버리고 새 세션처럼 다시 쌓습니다.
        stored = _StoredSession(user_id=incoming_user_id)

    if incoming_user_id is not None:
        stored.user_id = incoming_user_id
    if request.context:
        if request.context.screen:
            stored.screen = request.context.screen
        if request.context.currentProductId is not None:
            stored.current_product_id = request.context.currentProductId

    stored.turns.append(
        _StoredTurn(
            user_message=request.message.strip(),
            answer=answer.strip(),
            product_ids=product_ids,
        )
    )
    max_turns = max(1, settings.chatbot_session_max_turns)
    stored.turns = stored.turns[-max_turns:]
    stored.updated_at = time.time()
    return stored


def _dedupe_product_ids(product_ids: Iterable[int]) -> list[int]:
    seen: set[int] = set()
    ordered: list[int] = []
    for product_id in product_ids:
        if product_id in seen:
            continue
        seen.add(product_id)
        ordered.append(product_id)
    return ordered


class _MemorySessionBackend:
    def __init__(self) -> None:
        self._sessions: dict[str, _StoredSession] = {}
        self._lock = Lock()

    def get_snapshot(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> SessionSnapshot:
        with self._lock:
            self._purge_stale_sessions()
            return _session_to_snapshot(session_id, self._sessions.get(session_id), user_id=user_id)

    def remember_turn(
        self,
        session_id: str,
        request: ChatbotQueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        with self._lock:
            self._purge_stale_sessions()
            stored = _update_stored_session(
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
        # 메모리 백엔드는 별도 만료 이벤트가 없으므로 접근 시점에만 느슨하게 정리합니다.
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


class _RedisSessionBackend:
    _KEY_PREFIX = "chatbot:session:"

    def __init__(self) -> None:
        self._client = None

    def get_snapshot(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> SessionSnapshot:
        stored = self._load_session(session_id)
        return _session_to_snapshot(session_id, stored, user_id=user_id)

    def remember_turn(
        self,
        session_id: str,
        request: ChatbotQueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        stored = _update_stored_session(
            self._load_session(session_id),
            request,
            answer,
            product_ids,
        )
        self._save_session(session_id, stored)

    def _load_session(self, session_id: str) -> _StoredSession | None:
        raw_payload = self._get_client().get(self._make_key(session_id))
        if not raw_payload:
            return None
        try:
            payload = json.loads(raw_payload)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Stored Redis session payload is invalid") from exc

        # Redis에는 dataclass를 그대로 저장하지 않고, 직렬화 가능한 dict 형태만 남깁니다.
        turns = [
            _StoredTurn(
                user_message=str(turn.get("user_message", "")),
                answer=str(turn.get("answer", "")),
                product_ids=[int(product_id) for product_id in turn.get("product_ids", [])],
            )
            for turn in payload.get("turns", [])
        ]
        return _StoredSession(
            user_id=payload.get("user_id"),
            screen=payload.get("screen"),
            current_product_id=payload.get("current_product_id"),
            turns=turns,
            updated_at=float(payload.get("updated_at", time.time())),
        )

    def _save_session(self, session_id: str, stored: _StoredSession) -> None:
        settings = get_settings()
        payload = {
            "user_id": stored.user_id,
            "screen": stored.screen,
            "current_product_id": stored.current_product_id,
            "updated_at": stored.updated_at,
            "turns": [
                {
                    "user_message": turn.user_message,
                    "answer": turn.answer,
                    "product_ids": turn.product_ids,
                }
                for turn in stored.turns
            ],
        }
        ttl_sec = max(60, settings.chatbot_session_ttl_sec)
        self._get_client().setex(
            self._make_key(session_id),
            ttl_sec,
            json.dumps(payload, ensure_ascii=False),
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
            # 시작 시 한 번 ping 해 두면, 이후 요청 중간이 아니라 부팅 초기에 설정 오류를 드러낼 수 있습니다.
            client.ping()
        except Exception as exc:
            raise RuntimeError(f"Redis session store is unavailable: {exc}") from exc

        self._client = client
        return self._client


class ChatSessionStore:
    def __init__(self) -> None:
        self._memory_backend = _MemorySessionBackend()
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
            # 세션 저장소 장애가 챗봇 전체 실패로 번지지 않게 메모리 백엔드로 즉시 우회합니다.
            self._log_backend_failure(exc)
            return self._memory_backend.get_snapshot(session_id, user_id=user_id)

    def remember_turn(
        self,
        session_id: str,
        request: ChatbotQueryRequest,
        answer: str,
        product_ids: list[int],
    ) -> None:
        try:
            self._backend.remember_turn(session_id, request, answer, product_ids)
        except RuntimeError as exc:
            # 기록 저장 실패도 응답 자체는 살리고, 후속 turn 품질만 메모리 저장소로 유지합니다.
            self._log_backend_failure(exc)
            self._memory_backend.remember_turn(session_id, request, answer, product_ids)

    def _build_backend(self) -> _SessionBackend:
        settings = get_settings()
        if settings.chatbot_session_backend == "redis":
            return _RedisSessionBackend()
        return self._memory_backend

    def _log_backend_failure(self, exc: RuntimeError) -> None:
        if self._backend is self._memory_backend or self._fallback_warning_logged:
            return
        logger.warning("Chat session store fell back to in-memory backend: %s", exc)
        self._fallback_warning_logged = True


chat_session_store = ChatSessionStore()
