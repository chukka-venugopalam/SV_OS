"""Event bus for asynchronous platform events with metadata and idempotency."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

EventHandler = Callable[['EventEnvelope'], Awaitable[None]]


@dataclass(slots=True)
class EventMetadata:
    """Metadata describing an event for tracing and observability."""

    event_id: str = field(default_factory=lambda: str(uuid4()))
    correlation_id: str | None = None
    causation_id: str | None = None
    source: str = 'platform'
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    idempotency_key: str | None = None


@dataclass(slots=True)
class EventEnvelope:
    """A platform event with metadata and payload."""

    name: str
    payload: dict[str, Any]
    metadata: EventMetadata = field(default_factory=EventMetadata)


class EventBus:
    """Simple in-process event bus with async handlers and idempotency support."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[EventHandler]] = {}
        self._seen_idempotency_keys: set[str] = set()

    def subscribe(self, event_name: str, handler: EventHandler) -> None:
        """Register an async subscriber for an event name."""
        self._subscribers.setdefault(event_name, []).append(handler)

    async def publish(
        self,
        event_name: str,
        payload: dict[str, Any],
        *,
        correlation_id: str | None = None,
        causation_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> list[EventEnvelope]:
        """Publish an event to all subscribers, honoring idempotency."""
        if idempotency_key and idempotency_key in self._seen_idempotency_keys:
            return []

        metadata = EventMetadata(
            correlation_id=correlation_id,
            causation_id=causation_id,
            idempotency_key=idempotency_key,
        )
        envelope = EventEnvelope(name=event_name, payload=payload, metadata=metadata)

        if idempotency_key is not None:
            self._seen_idempotency_keys.add(idempotency_key)

        handlers = self._subscribers.get(event_name, [])
        for handler in handlers:
            await handler(envelope)

        return [envelope]

    def subscriber_count(self) -> int:
        """Return the total number of registered subscriber handlers."""
        return sum(len(handlers) for handlers in self._subscribers.values())

    def clear(self) -> None:
        """Clear subscribers and idempotency cache."""
        self._subscribers.clear()
        self._seen_idempotency_keys.clear()
