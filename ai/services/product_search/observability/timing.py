"""Timing helpers for product search instrumentation."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass, field
import logging
import time


@dataclass
class ProductSearchTiming:
    phases_ms: dict[str, float] = field(default_factory=dict)
    _started_at: float = field(default_factory=time.perf_counter)

    @contextmanager
    def phase(self, name: str):
        started_at = time.perf_counter()
        try:
            yield
        finally:
            self.phases_ms[name] = round((time.perf_counter() - started_at) * 1000.0, 1)

    def total_ms(self) -> float:
        return round((time.perf_counter() - self._started_at) * 1000.0, 1)

    def log_summary(
        self,
        logger: logging.Logger,
        *,
        query_text: str,
        query_shape: str,
        query_bucket: str,
        result_count: int,
        category_ids: tuple[int, ...] | None,
        big_category_id: int | None,
        observability_terms: dict[str, tuple[str, ...]] | None = None,
    ) -> None:
        ordered = ", ".join(
            f"{name}={elapsed_ms:.1f}ms"
            for name, elapsed_ms in self.phases_ms.items()
        )
        normalized_observability_terms = {
            name: terms
            for name, terms in (observability_terms or {}).items()
            if terms
        }
        logger.info(
            "Product search timing: query='%s' shape=%s bucket=%s categoryIds=%s bigCategoryId=%s resultCount=%d terms=%s total=%.1fms [%s]",
            query_text,
            query_shape,
            query_bucket,
            category_ids,
            big_category_id,
            result_count,
            normalized_observability_terms,
            self.total_ms(),
            ordered,
        )
