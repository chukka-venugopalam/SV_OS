"""Tracing — OpenTelemetry compatible implementation.

Supports:
- Distributed tracing with span hierarchy
- Request spans
- Engine spans
- Database spans
- API spans
- Correlation IDs
- Span attributes and events
- Span export configuration
"""

from __future__ import annotations

import contextvars
import time
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import Any


_current_span: contextvars.ContextVar[Span | None] = contextvars.ContextVar('current_span', default=None)


@dataclass
class SpanEvent:
    """An event recorded within a span."""
    name: str
    timestamp: float = field(default_factory=time.time)
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class Span:
    """A single span in a distributed trace."""
    span_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_span_id: str | None = None
    name: str = ''
    attributes: dict[str, Any] = field(default_factory=dict)
    events: list[SpanEvent] = field(default_factory=list)
    start_time: float = field(default_factory=time.time)
    end_time: float | None = None
    status: str = 'ok'

    @property
    def duration_ms(self) -> float:
        end = self.end_time or time.time()
        return (end - self.start_time) * 1000

    def to_dict(self) -> dict[str, Any]:
        return {
            'span_id': self.span_id,
            'trace_id': self.trace_id,
            'parent_span_id': self.parent_span_id,
            'name': self.name,
            'attributes': dict(self.attributes),
            'events': [{'name': e.name, 'timestamp': e.timestamp, 'attributes': e.attributes} for e in self.events],
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration_ms': self.duration_ms,
            'status': self.status,
        }


class Tracer:
    """OpenTelemetry-compatible tracer.

    Supports span creation, attribute setting, and event recording.
    All spans are stored in-memory and can be exported.
    """

    def __init__(self) -> None:
        self._spans: dict[str, Span] = {}
        self._export_enabled: bool = True

    @asynccontextmanager
    async def span(
        self,
        name: str,
        attributes: dict[str, Any] | None = None,
    ) -> AsyncGenerator[Span, None]:
        """Create a new span within the current trace context."""
        parent = _current_span.get()
        span = Span(
            name=name,
            trace_id=parent.trace_id if parent else str(uuid.uuid4()),
            parent_span_id=parent.span_id if parent else None,
            attributes=attributes or {},
        )

        token = _current_span.set(span)
        self._spans[span.span_id] = span

        try:
            yield span
            span.status = 'ok'
        except Exception as exc:
            span.status = 'error'
            span.attributes['error'] = str(exc)
            raise
        finally:
            span.end_time = time.time()
            _current_span.reset(token)

    def set_attribute(self, key: str, value: Any) -> None:
        """Set an attribute on the current span."""
        span = _current_span.get()
        if span:
            span.attributes[key] = value

    def add_event(self, name: str, attributes: dict[str, Any] | None = None) -> None:
        """Add an event to the current span."""
        span = _current_span.get()
        if span:
            span.events.append(SpanEvent(name=name, attributes=attributes or {}))

    def get_current_span(self) -> Span | None:
        """Get the current span (if any)."""
        return _current_span.get()

    def get_trace(self, trace_id: str) -> list[dict[str, Any]]:
        """Get all spans for a given trace."""
        return [
            s.to_dict() for s in self._spans.values()
            if s.trace_id == trace_id
        ]

    def export_traces(self, limit: int = 100) -> list[dict[str, Any]]:
        """Export recent traces (for debugging/monitoring)."""
        sorted_spans = sorted(
            self._spans.values(),
            key=lambda s: s.start_time,
            reverse=True,
        )
        return [s.to_dict() for s in sorted_spans[:limit]]

    def clear(self) -> None:
        """Clear all stored spans."""
        self._spans.clear()

    @property
    def span_count(self) -> int:
        return len(self._spans)

    @property
    def export_enabled(self) -> bool:
        return self._export_enabled

    @export_enabled.setter
    def export_enabled(self, value: bool) -> None:
        self._export_enabled = value

    def get_statistics(self) -> dict[str, Any]:
        """Get tracer statistics."""
        return {
            'total_spans': len(self._spans),
            'unique_traces': len(set(s.trace_id for s in self._spans.values())),
            'export_enabled': self._export_enabled,
            'error_spans': sum(1 for s in self._spans.values() if s.status == 'error'),
        }


# Global tracer singleton
_tracer: Tracer | None = None


def get_tracer() -> Tracer:
    global _tracer
    if _tracer is None:
        _tracer = Tracer()
    return _tracer
