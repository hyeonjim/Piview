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
        result_count: int,
        category_ids: tuple[int, ...] | None,
        big_category_id: int | None,
    ) -> None:
        ordered = ", ".join(
            f"{name}={elapsed_ms:.1f}ms"
            for name, elapsed_ms in self.phases_ms.items()
        )
        logger.info(
            "Product search timing: query='%s' shape=%s categoryIds=%s bigCategoryId=%s resultCount=%d total=%.1fms [%s]",
            query_text,
            query_shape,
            category_ids,
            big_category_id,
            result_count,
            self.total_ms(),
            ordered,
        )
