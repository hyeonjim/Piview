import re

from services.chatbot.intent.constants import FOLLOW_UP_HINTS


_ENGLISH_NORMALIZATION_RULES: tuple[tuple[str, str], ...] = (
    (r"\brecommend(?:\s+me)?\b", "추천"),
    (r"\b(?:a|an|the)\b", " "),
    (r"\bplease\b", " "),
    (r"\bskin\s*toner\b", "토너"),
    (r"\btoner\s*pad(?:s)?\b", "토너패드"),
    (r"\btoner\b", "토너"),
    (r"\bmist\b", "미스트"),
    (r"\bmoisturi[sz](?:er|ing)\b", "보습"),
    (r"\bcream\b", "크림"),
    (r"\blotion\b", "로션"),
    (r"\bemulsion\b", "로션"),
    (r"\ball[\s-]*in[\s-]*one\b", "올인원"),
    (r"\bserum\b", "세럼"),
    (r"\bessence\b", "에센스"),
    (r"\bampoule\b", "앰플"),
    (r"\bcleanser\b", "클렌저"),
    (r"\bcleansing\s*foam\b", "클렌징폼"),
    (r"\bcleansing\s*oil\b", "클렌징오일"),
    (r"\bcleansing\s*balm\b", "클렌징밤"),
    (r"\bsunscreen\b", "선크림"),
    (r"\bsun\s*cream\b", "선크림"),
    (r"\bsun\s*stick\b", "선스틱"),
    (r"\bsun\s*care\b", "선케어"),
    (r"\bsunblock\b", "선크림"),
    (r"\bspf\b", "spf"),
    (r"\bpa\b", "pa"),
    (r"\bwithout\s+fragrance\b", "향료 없이"),
    (r"\bwithout\s+alcohol\b", "알코올 없이"),
    (r"\bwithout\s+essential\s+oil(?:s)?\b", "에센셜오일 없이"),
    (r"\bfragrance[\s-]*free\b", "무향료"),
    (r"\bparfum[\s-]*free\b", "무향료"),
    (r"\balcohol[\s-]*free\b", "무알코올"),
    (r"\bessential[\s-]*oil[\s-]*free\b", "에센셜오일 무첨가"),
    (r"\bnon[\s-]*sticky\b", "끈적이지 않는"),
    (r"\blight[\s-]*weight\b", "가벼운"),
    (r"\blight\b", "가벼운"),
    (r"\bgentle\b", "순한"),
    (r"\bmild\b", "순한"),
    (r"\bsoothing\b", "진정"),
    (r"\bcalming\b", "진정"),
    (r"\bcica\b", "시카"),
    (r"\bhydrating\b", "수분"),
    (r"\bmoisture\b", "수분"),
    (r"\bmoisturizing\b", "보습"),
    (r"\bacne\b", "트러블"),
    (r"\bblemish\b", "트러블"),
    (r"\bbreakout\b", "트러블"),
    (r"\bbrightening\b", "미백"),
    (r"\bfirming\b", "탄력"),
    (r"\bwrinkle\b", "주름"),
    (r"\banti[\s-]*aging\b", "주름"),
    (r"\boily\s*skin\b", "지성 피부"),
    (r"\bdry\s*skin\b", "건성 피부"),
    (r"\bcombination\s*skin\b", "복합성 피부"),
    (r"\bsensitive\s*skin\b", "민감성 피부"),
    (r"\boily\b", "지성"),
    (r"\bdry\b", "건성"),
    (r"\bcombination\b", "복합성"),
    (r"\bsensitive\b", "민감성"),
    (r"\binstead\b", "대신"),
    (r"\banother\s+one\b", "다른 거"),
    (r"\bsomething\s+else\b", "다른 거"),
    (r"\bother\s+one\b", "다른 거"),
    (r"\belse\b", "다른 거"),
    (r"\blighter\b", "더 가벼운"),
    (r"\bgentler\b", "더 순한"),
    (r"\bsimilar\b", "비슷한"),
)

_ASCII_DOMAIN_HINTS = {
    "ampoule",
    "anua",
    "calming",
    "cica",
    "cleanser",
    "combination",
    "cosrx",
    "cream",
    "dry",
    "essence",
    "fragrance",
    "gentle",
    "hydrating",
    "laneige",
    "light",
    "lightweight",
    "lotion",
    "mist",
    "moisture",
    "moisturizing",
    "oily",
    "roundlab",
    "sensitive",
    "serum",
    "soothing",
    "sun",
    "sunscreen",
    "toner",
}

_KEYBOARD_ROWS = ("qwertyuiop", "asdfghjkl", "zxcvbnm")
_REPLACE_FOLLOWUP_HINTS = ("다른거", "말고", "대신")


def normalize_message_for_chatbot(message: str) -> str:
    normalized = " ".join((message or "").strip().split())
    if not normalized:
        return ""

    output = normalized
    for pattern, replacement in _ENGLISH_NORMALIZATION_RULES:
        output = re.sub(pattern, replacement, output, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", output).strip()


def detect_message_language(message: str) -> str:
    text = message or ""
    hangul_count = len(re.findall(r"[가-힣]", text))
    ascii_count = len(re.findall(r"[A-Za-z]", text))
    if hangul_count and ascii_count:
        return "mixed"
    if hangul_count:
        return "ko"
    if ascii_count:
        return "en"
    return "other"


def has_followup_signal(message: str) -> bool:
    collapsed = _collapse(normalize_message_for_chatbot(message))
    if not collapsed:
        return False
    return any(_collapse(hint) in collapsed for hint in FOLLOW_UP_HINTS)


def is_replace_followup(message: str) -> bool:
    collapsed = _collapse(normalize_message_for_chatbot(message))
    if not collapsed:
        return False
    return any(hint in collapsed for hint in _REPLACE_FOLLOWUP_HINTS)


def is_contextual_followup_without_context(
    message: str,
    session_context: dict[str, object] | None,
) -> bool:
    if _has_session_anchor(session_context):
        return False
    if not has_followup_signal(message):
        return False

    normalized = normalize_message_for_chatbot(message)
    tokens = re.findall(r"[0-9A-Za-z가-힣]+", normalized.lower())
    return len(tokens) <= 6


def is_likely_nonsense_input(message: str) -> bool:
    normalized = " ".join((message or "").strip().split())
    if not normalized:
        return False

    tokens = re.findall(r"[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]+", normalized.lower())
    if not tokens:
        return True

    if len(tokens) == 1:
        token = tokens[0]
        if re.fullmatch(r"[ㄱ-ㅎㅏ-ㅣ]{3,}", token):
            return True
        if re.fullmatch(r"\d{4,}", token):
            return True
        if _is_repeated_char_token(token):
            return True
        if _looks_like_keyboard_mash(token):
            return True
        if re.fullmatch(r"[a-z]{7,}", token):
            if _contains_domain_hint(token):
                return False
            if _vowel_ratio(token) < 0.3:
                return True

    if all(re.fullmatch(r"\d+", token) for token in tokens) and len("".join(tokens)) >= 4:
        return True

    if all(_is_noise_token(token) for token in tokens) and len("".join(tokens)) >= 6:
        return True

    return False


def _collapse(message: str) -> str:
    return re.sub(r"\s+", "", message.lower())


def _has_session_anchor(session_context: dict[str, object] | None) -> bool:
    if not session_context:
        return False
    return bool(
        session_context.get("recentUserMessages")
        or session_context.get("recentProductIds")
        or session_context.get("currentProductId") is not None
    )


def _looks_like_keyboard_mash(token: str) -> bool:
    if len(token) < 6 or not re.fullmatch(r"[a-z]+", token):
        return False

    row_hits = [sum(1 for char in token if char in row) for row in _KEYBOARD_ROWS]
    if max(row_hits) / len(token) >= 0.7:
        return True
    return len(set(token)) <= max(2, len(token) // 4)


def _is_repeated_char_token(token: str) -> bool:
    if not re.fullmatch(r"[a-z]+", token):
        return False
    if _contains_domain_hint(token):
        return False
    return len(token) >= 3 and len(set(token)) == 1


def _contains_domain_hint(token: str) -> bool:
    return any(hint in token for hint in _ASCII_DOMAIN_HINTS)


def _vowel_ratio(token: str) -> float:
    if not token:
        return 0.0
    vowels = sum(1 for char in token if char in "aeiou")
    return vowels / len(token)


def _is_noise_token(token: str) -> bool:
    if re.fullmatch(r"[ㄱ-ㅎㅏ-ㅣ]+", token):
        return True
    if re.fullmatch(r"\d+", token):
        return True
    if re.fullmatch(r"[a-z]{1,3}", token) and not _contains_domain_hint(token):
        return True
    return False
