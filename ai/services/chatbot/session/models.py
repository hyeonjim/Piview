from dataclasses import dataclass, field


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

    def to_llm_payload(self) -> dict[str, object]:
        """LLM에는 연속성에 필요한 최소 세션 힌트만 전달합니다."""
        payload: dict[str, object] = {}
        if self.screen:
            payload["screen"] = self.screen
        if self.recent_user_messages:
            payload["recentUserMessages"] = [self.recent_user_messages[-1]]
        return payload


@dataclass
class StoredTurn:
    user_message: str
    answer: str
    product_ids: list[int]


@dataclass
class StoredSession:
    user_id: int | None = None
    screen: str | None = None
    current_product_id: int | None = None
    turns: list[StoredTurn] = field(default_factory=list)
    updated_at: float = 0.0
