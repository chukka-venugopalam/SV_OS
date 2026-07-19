"""Metrics collector — Prometheus implementation.

Supports:
- Counters (increment)
- Gauges (set value)
- Histograms (observe values)
- Latency tracking
- Request counts
- Engine metrics
- Cache metrics
- Scheduler metrics
- Database metrics
- /metrics endpoint
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class MetricCounter:
    """A simple counter metric."""
    name: str
    value: int = 0
    labels: dict[str, str] = field(default_factory=dict)


@dataclass
class MetricGauge:
    """A simple gauge metric."""
    name: str
    value: float = 0.0
    labels: dict[str, str] = field(default_factory=dict)


@dataclass
class MetricHistogram:
    """A simple histogram metric."""
    name: str
    observations: list[float] = field(default_factory=list)
    labels: dict[str, str] = field(default_factory=dict)

    @property
    def count(self) -> int:
        return len(self.observations)

    @property
    def sum(self) -> float:
        return sum(self.observations)

    @property
    def avg(self) -> float:
        return self.sum / self.count if self.count else 0.0

    @property
    def min(self) -> float:
        return min(self.observations) if self.observations else 0.0

    @property
    def max(self) -> float:
        return max(self.observations) if self.observations else 0.0


class MetricsCollector:
    """Prometheus-compatible metrics collector.

    Records counters, gauges, and histograms.
    Exposes metrics in Prometheus text format via export_metrics().
    """

    def __init__(self) -> None:
        self._counters: dict[str, MetricCounter] = {}
        self._gauges: dict[str, MetricGauge] = {}
        self._histograms: dict[str, MetricHistogram] = {}

    def increment(self, name: str, labels: dict[str, str] | None = None) -> None:
        """Increment a counter metric."""
        key = self._key(name, labels)
        if key not in self._counters:
            self._counters[key] = MetricCounter(name=name, labels=labels or {})
        self._counters[key].value += 1

    def gauge(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Set a gauge metric to the given value."""
        key = self._key(name, labels)
        self._gauges[key] = MetricGauge(name=name, value=value, labels=labels or {})

    def histogram(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Observe a value for a histogram metric."""
        key = self._key(name, labels)
        if key not in self._histograms:
            self._histograms[key] = MetricHistogram(name=name, labels=labels or {})
        self._histograms[key].observations.append(value)

    def timing(self, name: str, duration_ms: float, labels: dict[str, str] | None = None) -> None:
        """Record a timing observation (convenience alias for histogram)."""
        self.histogram(name, duration_ms, labels)

    def export_metrics(self) -> str:
        """Export all metrics in Prometheus text format."""
        lines: list[str] = []
        lines.append('# HELP sv_os_metrics SV-OS platform metrics')
        lines.append('# TYPE sv_os_metrics untyped')
        lines.append('')

        for counter in self._counters.values():
            labels = self._format_labels(counter.labels)
            lines.append(f'# HELP {counter.name} Counter metric')
            lines.append(f'# TYPE {counter.name} counter')
            lines.append(f'{counter.name}{labels} {counter.value}')

        for gauge in self._gauges.values():
            labels = self._format_labels(gauge.labels)
            lines.append(f'# HELP {gauge.name} Gauge metric')
            lines.append(f'# TYPE {gauge.name} gauge')
            lines.append(f'{gauge.name}{labels} {gauge.value}')

        for hist in self._histograms.values():
            labels = self._format_labels(hist.labels)
            lines.append(f'# HELP {hist.name} Histogram metric')
            lines.append(f'# TYPE {hist.name} histogram')
            lines.append(f'{hist.name}_count{labels} {hist.count}')
            lines.append(f'{hist.name}_sum{labels} {hist.sum}')
            lines.append(f'{hist.name}_avg{labels} {hist.avg}')

        return '\n'.join(lines)

    def get_counter(self, name: str, labels: dict[str, str] | None = None) -> int:
        """Get the value of a counter metric."""
        counter = self._counters.get(self._key(name, labels))
        return counter.value if counter else 0

    def get_gauge(self, name: str, labels: dict[str, str] | None = None) -> float:
        """Get the value of a gauge metric."""
        gauge = self._gauges.get(self._key(name, labels))
        return gauge.value if gauge else 0.0

    def get_histogram_count(self, name: str, labels: dict[str, str] | None = None) -> int:
        """Get the observation count of a histogram metric."""
        hist = self._histograms.get(self._key(name, labels))
        return hist.count if hist else 0

    def get_all_as_dict(self) -> dict[str, Any]:
        """Get all metrics as a dictionary."""
        return {
            'counters': {k: v.value for k, v in self._counters.items()},
            'gauges': {k: v.value for k, v in self._gauges.items()},
            'histograms': {k: {'count': v.count, 'sum': v.sum, 'avg': v.avg}
                          for k, v in self._histograms.items()},
        }

    def clear(self) -> None:
        """Clear all metrics."""
        self._counters.clear()
        self._gauges.clear()
        self._histograms.clear()

    def _key(self, name: str, labels: dict[str, str] | None = None) -> str:
        if labels:
            parts = [f'{k}={v}' for k, v in sorted(labels.items())]
            return f'{name}{{{",".join(parts)}}}'
        return name

    def _format_labels(self, labels: dict[str, str]) -> str:
        if not labels:
            return ''
        parts = [f'{k}="{v}"' for k, v in sorted(labels.items())]
        return f'{{{",".join(parts)}}}'


# Global metrics collector singleton
_metrics: MetricsCollector | None = None


def get_metrics_collector() -> MetricsCollector:
    global _metrics
    if _metrics is None:
        _metrics = MetricsCollector()
    return _metrics
