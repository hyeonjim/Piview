from typing import Iterable

from services.chatbot.domain import UserContext
from services.chatbot.input.preprocess import (
    has_followup_signal,
    is_replace_followup,
    normalize_message_for_chatbot,
)
from services.chatbot.retrieval.constants import CATEGORY_HINTS, CONCERN_HINTS, LIGHTWEIGHT_HINTS
from services.chatbot.retrieval.parsers.category import extract_preferred_categories
from services.chatbot.retrieval.parsers.concerns import (
    canonicalize_avoid_term,
    extract_avoid_terms_from_text,
)


_SKIN_TYPE_HINTS: dict[str, tuple[str, ...]] = {
    "oily": ("지성", "번들", "유분"),
    "dry": ("건성", "건조"),
    "combination": ("복합성", "수부지"),
    "sensitive": ("민감성", "예민"),
}

_RICH_TEXTURE_HINTS: tuple[str, ...] = ("리치", "묵직", "쫀쫀")
_NON_STICKY_HINTS: tuple[str, ...] = ("끈적이지 않", "산뜻")
_ADD_HINTS: tuple[str, ...] = ("같이", "함께", "추가", "도 같이", "도 추천")
_REMOVE_HINTS: tuple[str, ...] = ("말고", "대신", "빼고", "제외")


def extract_turn_slots(
    message: str,
    user_context: UserContext | None = None,
) -> dict[str, object]:
    normalized_message = normalize_message_for_chatbot(message)
    slots: dict[str, object] = {}

    categories = sorted(extract_preferred_categories(normalized_message))
    if categories:
        slots["categories"] = categories

    concerns = {
        concern
        for concern in CONCERN_HINTS
        if concern in normalized_message
    }
    if user_context and user_context.skin_problems:
        concerns.update(user_context.skin_problems)
    if concerns:
        slots["concerns"] = sorted(concerns)

    avoid_terms = set(extract_avoid_terms_from_text(normalized_message))
    if user_context:
        for term in user_context.disliked_ingredient_names:
            canonical_term = canonicalize_avoid_term(term)
            if canonical_term:
                avoid_terms.add(canonical_term)
    if avoid_terms:
        slots["avoidTerms"] = sorted(avoid_terms)

    textures: list[str] = []
    if any(hint in normalized_message for hint in LIGHTWEIGHT_HINTS) or any(
        hint in normalized_message for hint in _NON_STICKY_HINTS
    ):
        textures.append("가벼운")
    if any(hint in normalized_message for hint in _RICH_TEXTURE_HINTS):
        textures.append("리치한")
    if textures:
        slots["textures"] = textures

    skin_type = _extract_skin_type(normalized_message, user_context)
    if skin_type:
        slots["skinType"] = skin_type

    if has_followup_signal(normalized_message):
        slots["followupMode"] = "replace" if is_replace_followup(normalized_message) else "followup"

    return slots


def apply_slot_overwrite(
    previous_slots: dict[str, object] | None,
    message: str,
    current_slots: dict[str, object] | None = None,
) -> dict[str, object]:
    previous = _copy_slots(previous_slots)
    current = _copy_slots(current_slots or extract_turn_slots(message))
    explicit = extract_turn_slots(message, None)
    overwrite_focus = extract_overwrite_focus_slots(message)
    normalized_message = normalize_message_for_chatbot(message)

    result = _copy_slots(previous)
    replace_mode = _has_replace_signal(normalized_message)
    add_mode = _has_add_signal(normalized_message)

    _apply_list_slot(
        result,
        previous,
        current,
        overwrite_focus if overwrite_focus.get("categories") else explicit,
        key="categories",
        replace_mode=replace_mode,
        add_mode=add_mode,
    )
    _apply_list_slot(
        result,
        previous,
        current,
        overwrite_focus if overwrite_focus.get("concerns") else explicit,
        key="concerns",
        replace_mode=replace_mode,
        add_mode=add_mode,
    )
    _apply_list_slot(
        result,
        previous,
        current,
        overwrite_focus if overwrite_focus.get("textures") else explicit,
        key="textures",
        replace_mode=True,
        add_mode=False,
    )

    explicit_avoid_terms = list(explicit.get("avoidTerms", []))
    current_avoid_terms = list(current.get("avoidTerms", []))
    if explicit_avoid_terms:
        result["avoidTerms"] = _dedupe_texts([*previous.get("avoidTerms", []), *current_avoid_terms])
    elif current_avoid_terms and "avoidTerms" not in result:
        result["avoidTerms"] = _dedupe_texts(current_avoid_terms)

    current_skin_type = current.get("skinType")
    if current_skin_type:
        result["skinType"] = str(current_skin_type)

    if current.get("followupMode"):
        result["followupMode"] = current["followupMode"]

    return {key: value for key, value in result.items() if value not in (None, [], {})}


def merge_turn_slots(turns: Iterable[object]) -> dict[str, object]:
    state: dict[str, object] = {}
    ordered_turns = list(turns)
    for turn in ordered_turns:
        state = apply_slot_overwrite(
            state,
            getattr(turn, "user_message", ""),
            getattr(turn, "slots", None) or {},
        )
    return state


def resolve_carryover_slots(
    previous_slots: dict[str, object] | None,
    message: str,
) -> dict[str, object]:
    previous = _copy_slots(previous_slots)
    if not previous:
        return {}

    explicit = extract_turn_slots(message, None)
    overwrite_focus = extract_overwrite_focus_slots(message)
    normalized_message = normalize_message_for_chatbot(message)
    replace_mode = _has_replace_signal(normalized_message)
    add_mode = _has_add_signal(normalized_message)

    carryover = _copy_slots(previous)

    category_signal = overwrite_focus.get("categories") or explicit.get("categories")
    if category_signal:
        if replace_mode or not add_mode:
            carryover.pop("categories", None)

    concern_signal = overwrite_focus.get("concerns") or explicit.get("concerns")
    if concern_signal:
        if replace_mode:
            carryover.pop("concerns", None)

    texture_signal = overwrite_focus.get("textures") or explicit.get("textures")
    if texture_signal:
        carryover.pop("textures", None)

    if explicit.get("skinType"):
        carryover.pop("skinType", None)

    if explicit.get("avoidTerms"):
        previous_avoid = [
            value
            for value in previous.get("avoidTerms", [])
            if value not in explicit.get("avoidTerms", [])
        ]
        if previous_avoid:
            carryover["avoidTerms"] = previous_avoid
        else:
            carryover.pop("avoidTerms", None)

    return carryover


def build_slot_memory_lines(
    slots: dict[str, object] | None,
    *,
    message: str,
    has_explicit_category: bool,
) -> list[str]:
    carryover_slots = resolve_carryover_slots(slots, message)
    if not carryover_slots:
        return []

    normalized_message = normalize_message_for_chatbot(message)
    lines: list[str] = []

    categories = list(carryover_slots.get("categories", []))
    if categories and not has_explicit_category:
        category_labels = [_display_category_name(category_key) for category_key in categories]
        lines.append(f"이전 유지 카테고리: {', '.join(category_labels)}")

    concerns = [
        concern
        for concern in carryover_slots.get("concerns", [])
        if concern and concern not in normalized_message
    ]
    if concerns:
        lines.append(f"이전 유지 피부고민: {', '.join(concerns)}")

    avoid_terms = [
        term
        for term in carryover_slots.get("avoidTerms", [])
        if term and term not in normalized_message
    ]
    if avoid_terms:
        lines.append(f"이전 유지 회피성분: {', '.join(avoid_terms)}")

    textures = [
        texture
        for texture in carryover_slots.get("textures", [])
        if texture and texture not in normalized_message
    ]
    if textures:
        lines.append(f"이전 유지 제형 조건: {', '.join(textures)}")

    skin_type = carryover_slots.get("skinType")
    if skin_type and skin_type not in normalized_message:
        lines.append(f"이전 유지 피부타입 힌트: {skin_type}")

    return lines


def build_slot_priority_lines(message: str) -> list[str]:
    overwrite_focus = extract_overwrite_focus_slots(message)
    current = extract_turn_slots(message, None)
    normalized_message = normalize_message_for_chatbot(message)
    lines: list[str] = []

    categories = list(overwrite_focus.get("categories") or current.get("categories", []))
    concerns = list(overwrite_focus.get("concerns") or current.get("concerns", []))
    textures = list(overwrite_focus.get("textures") or current.get("textures", []))
    avoid_terms = list(current.get("avoidTerms", []))

    if _has_replace_signal(normalized_message):
        if categories:
            lines.append(f"이번 턴 우선 카테고리: {', '.join(_display_category_name(item) for item in categories)}")
        if concerns:
            lines.append(f"이번 턴 우선 피부고민: {', '.join(concerns)}")
        if textures:
            lines.append(f"이번 턴 우선 제형 조건: {', '.join(textures)}")
    elif avoid_terms:
        lines.append(f"이번 턴 추가 회피성분: {', '.join(avoid_terms)}")
    elif textures:
        lines.append(f"이번 턴 우선 제형 조건: {', '.join(textures)}")
    elif concerns and not categories:
        lines.append(f"이번 턴 우선 피부고민: {', '.join(concerns)}")

    return lines


def has_slot_update_signal(message: str) -> bool:
    current = extract_turn_slots(message, None)
    return bool(
        current.get("concerns")
        or current.get("avoidTerms")
        or current.get("textures")
        or current.get("categories")
        or _has_replace_signal(normalize_message_for_chatbot(message))
    )


def _extract_skin_type(
    normalized_message: str,
    user_context: UserContext | None,
) -> str | None:
    if user_context and user_context.my_skin_type:
        return user_context.my_skin_type
    for skin_type, hints in _SKIN_TYPE_HINTS.items():
        if any(hint in normalized_message for hint in hints):
            return skin_type
    return None


def _display_category_name(category_key: str) -> str:
    aliases = CATEGORY_HINTS.get(category_key, ())
    return aliases[0] if aliases else category_key


def extract_overwrite_focus_slots(message: str) -> dict[str, object]:
    normalized_message = normalize_message_for_chatbot(message)
    focus_text = normalized_message
    for hint in _REMOVE_HINTS:
        if hint in normalized_message:
            focus_text = normalized_message.rsplit(hint, 1)[-1].strip()
            break
    if focus_text == normalized_message:
        return {}
    return extract_turn_slots(focus_text, None)


def _apply_list_slot(
    result: dict[str, object],
    previous: dict[str, object],
    current: dict[str, object],
    explicit: dict[str, object],
    *,
    key: str,
    replace_mode: bool,
    add_mode: bool,
) -> None:
    explicit_values = list(explicit.get(key, []))
    current_values = list(current.get(key, []))
    previous_values = list(previous.get(key, []))

    if explicit_values:
        if previous_values and add_mode and not replace_mode:
            result[key] = _dedupe_texts([*previous_values, *current_values])
        else:
            result[key] = _dedupe_texts(current_values or explicit_values)
        return

    if current_values and not previous_values:
        result[key] = _dedupe_texts(current_values)
        return

    if previous_values:
        result[key] = _dedupe_texts(previous_values)


def _copy_slots(slots: dict[str, object] | None) -> dict[str, object]:
    if not slots:
        return {}
    copied: dict[str, object] = {}
    for key, value in slots.items():
        if isinstance(value, list):
            copied[key] = list(value)
        elif isinstance(value, dict):
            copied[key] = dict(value)
        else:
            copied[key] = value
    return copied


def _dedupe_texts(values: Iterable[object]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = str(value).strip()
        if not text or text in seen:
            continue
        seen.add(text)
        ordered.append(text)
    return ordered


def _has_replace_signal(normalized_message: str) -> bool:
    return any(hint in normalized_message for hint in _REMOVE_HINTS)


def _has_add_signal(normalized_message: str) -> bool:
    return any(hint in normalized_message for hint in _ADD_HINTS)
