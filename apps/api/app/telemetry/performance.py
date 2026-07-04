"""Performance timing utility for measuring code execution."""

from __future__ import annotations

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from structlog.stdlib import get_logger

logger = get_logger(__name__)


class PerformanceTimer:
    """Reusable performance timer with structured logging.

    Usage::

        timer = PerformanceTimer()
        async with timer.measure('db_query', node_id=str(node_id)):
            results = await run_query()
        # Logs: performance.db_query duration_ms=45.23
    """

    @asynccontextmanager
    async def measure(
        self,
        operation: str,
        **context: Any,
    ) -> AsyncGenerator[None, None]:
        """Measure and log the duration of an async code block."""
        start: float = time.perf_counter()
        try:
            yield
        finally:
            duration_ms: float = (time.perf_counter() - start) * 1000
            logger.info(
                f'performance.{operation}',
                duration_ms=f'{duration_ms:.2f}',
                **context,
            )
