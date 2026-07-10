"""Tracing — **stub interface**.

Ready for integration with OpenTelemetry, Datadog APM, or similar.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any


class Tracer:
    """Stub tracer — all methods are no-ops.

    Replace with a real implementation (e.g. ``opentelemetry``) in a
    later phase.
    """

    @asynccontextmanager
    async def span(
        self,
        _name: str,
        _attributes: dict[str, Any] | None = None,
    ) -> AsyncGenerator[None, None]:
        """Context manager wrapping a span of work."""
        yield

    def set_attribute(self, key: str, value: Any) -> None:
        """Set an attribute on the current span."""
        pass

    def add_event(self, name: str, attributes: dict[str, Any] | None = None) -> None:
        """Add an event to the current span."""
        pass
