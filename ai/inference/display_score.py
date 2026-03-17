from __future__ import annotations


def build_display_scores(oily_probability: float, threshold: float = 0.5) -> dict[str, float]:
    """Map a raw oily probability onto a 0-100 display scale centered at the threshold.

    The threshold becomes the 50-point boundary so the displayed dry/oily percentages
    align with the final axis decision shown to the user.
    """
    p = max(0.0, min(1.0, float(oily_probability)))
    t = max(1e-6, min(1 - 1e-6, float(threshold)))

    if p >= t:
        oily_score = 50 + 50 * (p - t) / (1 - t)
    else:
        oily_score = 50 * (p / t)

    oily_score = max(0.0, min(100.0, oily_score))
    dry_score = 100.0 - oily_score

    return {
        "display_dry_probability": round(dry_score, 2),
        "display_oily_probability": round(oily_score, 2),
    }
