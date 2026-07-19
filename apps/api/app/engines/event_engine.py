"""Event Engine — domain event backbone with typed events and metadata.

Builds on the EventBus to provide a full event engine with:
- Typed events with versioning
- Event metadata (correlation ID, causation ID, timestamps)
- Publish / subscribe / unsubscribe
- Replay hooks
- Dead-letter placeholder
- Idempotency support

Note: Persistence is NOT implemented yet. Events are in-memory only.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.events.bus import EventBus, EventEnvelope

# ── Event Type Constants ───────────────────────────────────────────


class EventTypes:
    """Canonical event type strings for the domain event backbone."""

    # Platform events
    PLATFORM_STARTED = 'platform.started.v1'
    PLATFORM_STOPPING = 'platform.stopping.v1'

    # Graph events
    GRAPH_NODE_CREATED = 'graph.node.created.v1'
    GRAPH_NODE_UPDATED = 'graph.node.updated.v1'
    GRAPH_EDGE_CREATED = 'graph.edge.created.v1'
    GRAPH_EDGE_UPDATED = 'graph.edge.updated.v1'

    # Knowledge events
    KNOWLEDGE_CONTENT_UPDATED = 'knowledge.content.updated.v1'

    # State events
    STATE_UPDATED = 'state.updated.v1'
    STATE_COMPLETED = 'state.completed.v1'
    STATE_BLOCKED = 'state.blocked.v1'

    # Dependency events
    DEPENDENCY_READINESS_UPDATED = 'dependency.readiness.updated.v1'

    # Validation events
    VALIDATION_PASSED = 'validation.passed.v1'
    VALIDATION_FAILED = 'validation.failed.v1'

    # Recommendation events
    RECOMMENDATION_GENERATED = 'recommendation.generated.v1'

    # Learning path events
    ROADMAP_GENERATED = 'roadmap.generated.v1'

    # Career events
    CAREER_MATCH_UPDATED = 'career.match.updated.v1'

    # Assessment events
    ASSESSMENT_SUBMITTED = 'assessment.submitted.v1'
    ASSESSMENT_SCORED = 'assessment.scored.v1'

    # Import events
    IMPORT_STARTED = 'import.started.v1'
    IMPORT_COMPLETED = 'import.completed.v1'
    IMPORT_FAILED = 'import.failed.v1'
    IMPORT_ROLLBACK_REQUESTED = 'import.rollback.requested.v1'

    # Versioning events
    GRAPH_SNAPSHOT_CREATED = 'graph.snapshot.created.v1'
    GRAPH_SNAPSHOT_RESTORED = 'graph.snapshot.restored.v1'
    GRAPH_VERSION_CREATED = 'graph.version.created.v1'
    GRAPH_VERSION_ROLLBACK = 'graph.version.rollback.v1'

    # Import events
    GRAPH_IMPORT_STARTED = 'graph.import.started.v1'
    GRAPH_IMPORT_COMPLETED = 'graph.import.completed.v1'
    GRAPH_IMPORT_FAILED = 'graph.import.failed.v1'

    # Export events
    GRAPH_EXPORT_STARTED = 'graph.export.started.v1'
    GRAPH_EXPORT_COMPLETED = 'graph.export.completed.v1'
    GRAPH_EXPORT_FAILED = 'graph.export.failed.v1'

    # Simulator events
    SIMULATOR_STARTED = 'simulator.started.v1'
    SIMULATOR_COMPLETED = 'simulator.completed.v1'


# ── Typed Event Handler ────────────────────────────────────────────


EventHandlerFn = Callable[[EventEnvelope], Awaitable[None]]
UnsubscribeFn = Callable[[], None]


# ── Replay Hook ────────────────────────────────────────────────────


@dataclass
class ReplayHook:
    """Registers a hook to be called during event replay."""

    event_type: str
    handler: EventHandlerFn
    description: str = ''

    async def __call__(self, envelope: EventEnvelope) -> None:
        await self.handler(envelope)


# ── Dead-Letter Entry ──────────────────────────────────────────────


@dataclass
class DeadLetterEntry:
    """An event that exceeded retry attempts and was dead-lettered."""

    envelope: EventEnvelope
    error: str
    failed_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    retry_count: int = 0


# ── EventEngine Implementation ─────────────────────────────────────


class EventEngine:
    """Event Engine — domain event backbone for SV-OS.

    Wraps EventBus with typed event support, replay hooks,
    dead-letter handling, and the canonical EventEngine interface.

    Public Interface:
        publish, subscribe, unsubscribe, replay,
        get_history, retry_dead_letter
    """

    def __init__(self, event_bus: EventBus | None = None) -> None:
        self._bus = event_bus or EventBus()
        self._replay_hooks: dict[str, list[ReplayHook]] = {}
        self._dead_letter_queue: list[DeadLetterEntry] = []
        self._event_history: list[EventEnvelope] = []
        self._history_limit: int = 10_000
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the event engine."""
        self._initialized = True

    # ── Publish ─────────────────────────────────────────────────────

    async def publish(
        self,
        event_name: str,
        payload: dict[str, Any],
        *,
        correlation_id: str | None = None,
        causation_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> list[EventEnvelope]:
        """Publish a domain event.

        The event is published to all subscribers, recorded in the
        in-memory event history, and checked against idempotency keys.

        Args:
            event_name: The event type (e.g. 'graph.node.created.v1').
            payload: Event payload data.
            correlation_id: Trace ID for correlating related events.
            causation_id: ID of the event that caused this one.
            idempotency_key: Key for duplicate detection.

        Returns:
            List of published EventEnvelopes.

        """
        envelopes = await self._bus.publish(
            event_name=event_name,
            payload=payload,
            correlation_id=correlation_id,
            causation_id=causation_id,
            idempotency_key=idempotency_key,
        )

        # Record in event history
        for envelope in envelopes:
            self._event_history.append(envelope)
            # Trim history if it exceeds the limit
            if len(self._event_history) > self._history_limit:
                self._event_history = self._event_history[-self._history_limit :]

        return envelopes

    # ── Subscribe / Unsubscribe ─────────────────────────────────────

    def subscribe(self, event_name: str, handler: EventHandlerFn) -> UnsubscribeFn:
        """Register a handler for a specific event type.

        Args:
            event_name: The event type to subscribe to.
            handler: Async callable accepting an EventEnvelope.

        Returns:
            A callable that unsubscribes the handler when invoked.

        """
        self._bus.subscribe(event_name, handler)

        # Return an unsubscribe function
        def unsubscribe() -> None:
            self._unsubscribe(event_name, handler)

        return unsubscribe

    def _unsubscribe(self, event_name: str, handler: EventHandlerFn) -> None:
        """Remove a handler from the subscriber list."""
        handlers = self._bus._subscribers.get(event_name, [])
        if handler in handlers:
            handlers.remove(handler)

    # ── Replay ──────────────────────────────────────────────────────

    async def replay(
        self,
        event_ids: list[str] | None = None,
        event_type: str | None = None,
    ) -> int:
        """Replay events through registered replay hooks.

        Replay hooks are separate from regular subscribers and are
        used for rebuilding state (e.g. rebuilding a cache).

        Args:
            event_ids: Optional list of event IDs to replay.
                       If None, replays all events in history.
            event_type: Optional event type filter.

        Returns:
            Number of events replayed.

        """
        events_to_replay = list(self._event_history)

        if event_type:
            events_to_replay = [e for e in events_to_replay if e.name == event_type]

        if event_ids:
            events_to_replay = [e for e in events_to_replay if e.metadata.event_id in event_ids]

        replayed = 0
        for envelope in events_to_replay:
            hooks = self._replay_hooks.get(envelope.name, [])
            for hook in hooks:
                try:
                    await hook(envelope)
                    replayed += 1
                except Exception:
                    pass  # Replay errors are non-fatal

        return replayed

    def register_replay_hook(
        self,
        event_type: str,
        handler: EventHandlerFn,
        description: str = '',
    ) -> None:
        """Register a hook to be called during replay for a specific event type."""
        hook = ReplayHook(event_type=event_type, handler=handler, description=description)
        self._replay_hooks.setdefault(event_type, []).append(hook)

    # ── Event History ───────────────────────────────────────────────

    async def get_history(
        self,
        aggregate_id: str | None = None,
        event_type: str | None = None,
        limit: int = 100,
    ) -> list[dict]:
        """Get event history, optionally filtered.

        Args:
            aggregate_id: Filter by aggregate/business object ID.
            event_type: Filter by event type string.
            limit: Maximum events to return.

        Returns:
            List of event dicts with metadata and payload.

        """
        events = list(self._event_history)

        if event_type:
            events = [e for e in events if e.name == event_type]

        if aggregate_id:
            events = [
                e
                for e in events
                if str(e.payload.get('aggregate_id', '')) == aggregate_id
                or e.metadata.event_id == aggregate_id
            ]

        # Sort by timestamp descending (most recent first)
        events.sort(key=lambda e: e.metadata.timestamp, reverse=True)

        return [
            {
                'event_id': e.metadata.event_id,
                'event_type': e.name,
                'correlation_id': e.metadata.correlation_id,
                'causation_id': e.metadata.causation_id,
                'timestamp': e.metadata.timestamp,
                'payload': e.payload,
            }
            for e in events[:limit]
        ]

    # ── Dead-Letter Queue ───────────────────────────────────────────

    async def retry_dead_letter(self, event_id: str) -> bool:
        """Retry a dead-lettered event by re-publishing it.

        Args:
            event_id: The event ID to retry.

        Returns:
            True if the event was found and retried, False otherwise.

        """
        for i, entry in enumerate(self._dead_letter_queue):
            if entry.envelope.metadata.event_id == event_id:
                # Remove from dead-letter queue
                self._dead_letter_queue.pop(i)
                # Re-publish
                await self._bus.publish(
                    event_name=entry.envelope.name,
                    payload=entry.envelope.payload,
                    correlation_id=entry.envelope.metadata.correlation_id,
                    causation_id=entry.envelope.metadata.causation_id,
                    idempotency_key=entry.envelope.metadata.idempotency_key,
                )
                return True
        return False

    def dead_letter_event(self, envelope: EventEnvelope, error: str) -> None:
        """Move an event to the dead-letter queue after exhausting retries."""
        entry = DeadLetterEntry(envelope=envelope, error=error)
        self._dead_letter_queue.append(entry)

    def get_dead_letter_queue(self) -> list[DeadLetterEntry]:
        """Return a copy of the dead-letter queue."""
        return list(self._dead_letter_queue)

    # ── Clear ───────────────────────────────────────────────────────

    def clear(self) -> None:
        """Clear all subscribers, history, and dead-letter queue."""
        self._bus.clear()
        self._replay_hooks.clear()
        self._dead_letter_queue.clear()
        self._event_history.clear()

    @property
    def is_initialized(self) -> bool:
        return self._initialized
