from dataclasses import dataclass

from core.settings import Settings


@dataclass(frozen=True)
class HybridScoringConfig:
    reciprocal_rank_base: int
    vector_weight: float
    keyword_weight: float
    vector_signal_weight: float = 0.05
    keyword_signal_weight: float = 0.08

    @classmethod
    def from_settings(cls, settings: Settings) -> "HybridScoringConfig":
        return cls(
            reciprocal_rank_base=max(1, settings.chatbot_hybrid_rrf_k),
            vector_weight=max(0.0, settings.chatbot_vector_weight),
            keyword_weight=max(0.0, settings.chatbot_keyword_weight),
        )
