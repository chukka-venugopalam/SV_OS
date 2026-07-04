"""Metrics collector — **stub interface**.

Ready for integration with Prometheus, Datadog, or similar.
No metrics are recorded yet.
"""

from __future__ import annotations

from typing import Any


class MetricsCollector:
    """Stub metrics collector — all methods are no-ops.

    Replace with a real implementation (e.g. ``prometheus_client``)
    in a later phase.
    """

    def increment(self, name: str, labels: dict[str, str] | None = None) -> None:
        """Increment a counter metric."""
        pass

    def gauge(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Set a gauge metric to the given value."""
        pass

    def histogram(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
    ) -> None:
        """Observe a value for a histogram metric."""
        pass

    def timing(
        self,
        name: str,
        duration_ms: float,
        labels: dict[str, str] | None = None,
    ) -> None:
        """Record a timing observation (convenience alias for histogram)."""
        self.histogram(name, duration_ms, labels)
