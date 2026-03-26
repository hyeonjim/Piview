import json
import time
from typing import Iterable

from core.settings import get_settings
from services.chatbot.context import extract_turn_slots, merge_turn_slots
from services.chatbot.domain import QueryRequest
from services.chatbot.input import normalize_message_for_chatbot
from services.chatbot.session.models import SessionSnapshot, StoredSession, StoredTurn


def session_to_snapshot(
    session_id: str,
    stored: StoredSession | None,
    user_id: int | None = None,
) -> SessionSnapshot:
    if stored is None:
        return SessionSnapshot(session_id=session_id, user_id=user_id)
    if user_id is not None and stored.user_id is not None and stored.user_id != user_id:
        return SessionSnapshot(session_id=session_id, user_id=user_id)

    recent_turns = stored.turns[-2:]
    recent_product_ids = dedupe_product_ids(
        product_id
        for turn in reversed(stored.turns[-3:])
        for product_id in turn.product_ids
    )
    return SessionSnapshot(
        session_id=session_id,
        user_id=stored.user_id if stored.user_id is not None else user_id,
        screen=stored.screen,
        current_product_id=stored.current_product_id,
        recent_user_messages=[
            turn.normalized_user_message or turn.user_message
            for turn in recent_turns
        ],
        recent_answers=[turn.answer for turn in recent_turns],
        recent_product_ids=recent_product_ids,
        recent_slots=merge_turn_slots(stored.turns[-3:]),
    )


def update_stored_session(
    stored: StoredSession | None,
    request: QueryRequest,
    answer: str,
    product_ids: list[int],
) -> StoredSession:
    incoming_user_id = request.user_context.user_id if request.user_context else None
    settings = get_settings()

    if stored is None or (
        incoming_user_id is not None and stored.user_id is not None and stored.user_id != incoming_user_id
    ):
        stored = StoredSession(user_id=incoming_user_id, updated_at=time.time())

    if incoming_user_id is not None:
        stored.user_id = incoming_user_id
    if request.client_context:
        if request.client_context.screen:
            stored.screen = request.client_context.screen
        if request.client_context.current_product_id is not None:
            stored.current_product_id = request.client_context.current_product_id

    stored.turns.append(
        StoredTurn(
            user_message=request.message.strip(),
            normalized_user_message=normalize_message_for_chatbot(request.message.strip()),
            answer=answer.strip(),
            product_ids=product_ids,
            slots=extract_turn_slots(request.message, request.user_context),
        )
    )
    max_turns = max(1, settings.chatbot_session_max_turns)
    stored.turns = stored.turns[-max_turns:]
    stored.updated_at = time.time()
    return stored


def serialize_session(stored: StoredSession) -> str:
    payload = {
        "user_id": stored.user_id,
        "screen": stored.screen,
        "current_product_id": stored.current_product_id,
        "updated_at": stored.updated_at,
        "turns": [
            {
                "user_message": turn.user_message,
                "normalized_user_message": turn.normalized_user_message,
                "answer": turn.answer,
                "product_ids": turn.product_ids,
                "slots": turn.slots,
            }
            for turn in stored.turns
        ],
    }
    return json.dumps(payload, ensure_ascii=False)


def deserialize_session(raw_payload: str) -> StoredSession:
    payload = json.loads(raw_payload)
    turns = [
        StoredTurn(
            user_message=str(turn.get("user_message", "")),
            normalized_user_message=str(turn.get("normalized_user_message", "")).strip() or None,
            answer=str(turn.get("answer", "")),
            product_ids=[int(product_id) for product_id in turn.get("product_ids", [])],
            slots=dict(turn.get("slots", {}) or {}),
        )
        for turn in payload.get("turns", [])
    ]
    return StoredSession(
        user_id=payload.get("user_id"),
        screen=payload.get("screen"),
        current_product_id=payload.get("current_product_id"),
        turns=turns,
        updated_at=float(payload.get("updated_at", time.time())),
    )


def dedupe_product_ids(product_ids: Iterable[int]) -> list[int]:
    seen: set[int] = set()
    ordered: list[int] = []
    for product_id in product_ids:
        if product_id in seen:
            continue
        seen.add(product_id)
        ordered.append(product_id)
    return ordered
