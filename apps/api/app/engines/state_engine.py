"""State Engine — maintain learner state and progression.

Supports:
- State transitions (not_started -> learning -> completed -> mastered)
- Transition validation (valid state machine paths)
- Transition history
- Confidence updates
- Timestamps for all state changes
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from app.engines.base import EngineBase, EngineDependency, EngineHealth

if TYPE_CHECKING:
    from uuid import UUID

# ── Valid State Transitions ────────────────────────────────────────


VALID_TRANSITIONS: dict[str, set[str]] = {
    'not_started': {'learning'},
    'learning': {'completed', 'paused', 'not_started'},
    'completed': {'mastered', 'learning'},
    'mastered': {'learning'},  # Re-learning
    'paused': {'learning', 'not_started'},
}

PROGRESS_VALUES: dict[str, float] = {
    'not_started': 0.0,
    'learning': 0.3,
    'completed': 0.8,
    'mastered': 1.0,
    'paused': 0.3,
}


# ── State Record ───────────────────────────────────────────────────


@dataclass
class StateRecord:
    """In-memory record of a learner's state on a node."""

    user_id: UUID
    node_id: UUID
    status: str = 'not_started'
    confidence: float = 0.0
    time_spent_minutes: int = 0
    started_at: str | None = None
    completed_at: str | None = None
    mastered_at: str | None = None
    updated_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    history: list[dict] = field(default_factory=list)


# ── State Engine ───────────────────────────────────────────────────


class StateEngine(EngineBase):
    """State Engine — learner state and progression management.

    Manages learner state transitions on knowledge nodes with:
    - Validated state machine transitions
    - Full transition history
    - Confidence tracking
    - Timestamps for all state changes

    Public Interface:
        get_state, update_state, list_states, get_transition_history
    """

    def __init__(self) -> None:
        super().__init__()
        self._states: dict[tuple[UUID, UUID], StateRecord] = {}  # (user_id, node_id) -> record

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'state'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='event',
                required=False,
                description='Event engine for publishing state events',
            ),
        ]

    # ── Lifecycle ──────────────────────────────────────────────────

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._states.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='State engine is operational',
            details={'tracked_nodes': len(self._states)},
        )

    async def validate_configuration(self) -> list[str]:
        return []

    # ── Core State Operations ──────────────────────────────────────

    async def get_state(self, user_id: UUID, node_id: UUID) -> dict | None:
        """Get the learning state for a user on a specific node."""
        record = self._states.get((user_id, node_id))
        if record is None:
            return None
        return self._record_to_dict(record)

    async def update_state(
        self,
        user_id: UUID,
        node_id: UUID,
        status: str,
        *,
        confidence: float | None = None,
        time_spent_minutes: int | None = None,
    ) -> dict:
        """Update the learning state for a user on a node.

        Args:
            user_id: The user's UUID.
            node_id: The knowledge node UUID.
            status: New status ('not_started', 'learning', 'completed', 'mastered', 'paused').
            confidence: Optional confidence score (0.0 to 1.0).
            time_spent_minutes: Additional time spent to add.

        Returns:
            The updated state dict.

        Raises:
            ValueError: If the transition is not valid.

        """
        key = (user_id, node_id)
        record = self._states.get(key)

        if record is None:
            # Create new record
            record = StateRecord(
                user_id=user_id,
                node_id=node_id,
                status='not_started',
            )
            self._states[key] = record

        # Validate transition (skip if first creation from any status)
        if record.status != status and record.status in VALID_TRANSITIONS:
            allowed = VALID_TRANSITIONS.get(record.status, set())
            if status not in allowed:
                msg = (
                    f"Invalid state transition: '{record.status}' -> '{status}'. "
                    f"Allowed transitions from '{record.status}': {allowed}"
                )
                raise ValueError(
                    msg,
                )

        old_status = record.status
        datetime.now(UTC).isoformat()

        # Update timestamps
        now_ts = datetime.now(UTC).isoformat()
        if status == 'learning' and record.started_at is None:
            record.started_at = now_ts
        if status == 'completed':
            record.completed_at = now_ts
        if status == 'mastered':
            record.mastered_at = now_ts

        # Update fields
        record.status = status
        record.updated_at = now_ts

        if confidence is not None:
            record.confidence = max(0.0, min(1.0, confidence))

        if time_spent_minutes is not None:
            record.time_spent_minutes += time_spent_minutes

        # Record transition history
        record.history.append(
            {
                'from_status': old_status,
                'to_status': status,
                'timestamp': now_ts,
                'confidence': record.confidence,
                'time_spent_minutes': record.time_spent_minutes,
            },
        )

        # Publish state update event
        await self.publish_event(
            'state.updated.v1' if status != 'completed' else 'state.completed.v1',
            {
                'user_id': str(user_id),
                'node_id': str(node_id),
                'status': status,
                'confidence': record.confidence,
                'timestamp': now_ts,
            },
        )

        return self._record_to_dict(record)

    async def list_states(
        self,
        user_id: UUID,
        status: str | None = None,
        limit: int = 100,
    ) -> list[dict]:
        """List learning states for a user, optionally filtered by status."""
        results: list[dict] = []
        for key, record in self._states.items():
            if key[0] != user_id:
                continue
            if status is not None and record.status != status:
                continue
            results.append(self._record_to_dict(record))
            if len(results) >= limit:
                break

        # Sort by updated_at descending
        results.sort(key=lambda r: r['updated_at'], reverse=True)
        return results[:limit]

    # ── Confidence ─────────────────────────────────────────────────

    async def update_confidence(
        self,
        user_id: UUID,
        node_id: UUID,
        delta: float,
    ) -> float:
        """Update confidence by a delta, clamped to [0.0, 1.0].

        Args:
            user_id: The user's UUID.
            node_id: The knowledge node UUID.
            delta: Change in confidence (positive or negative).

        Returns:
            The new confidence value.

        """
        key = (user_id, node_id)
        record = self._states.get(key)
        if record is None:
            return 0.0

        record.confidence = max(0.0, min(1.0, record.confidence + delta))
        record.updated_at = datetime.now(UTC).isoformat()
        return record.confidence

    # ── Transition History ─────────────────────────────────────────

    async def get_transition_history(
        self,
        user_id: UUID,
        node_id: UUID | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """Get transition history for a user, optionally for a specific node."""
        history: list[dict] = []
        for key, record in self._states.items():
            if key[0] != user_id:
                continue
            if node_id is not None and key[1] != node_id:
                continue
            history.extend(record.history)

        # Sort by timestamp descending
        history.sort(key=lambda h: h['timestamp'], reverse=True)
        return history[:limit]

    # ── Counts ─────────────────────────────────────────────────────

    async def count_by_status(self, user_id: UUID) -> dict[str, int]:
        """Get counts of states grouped by status for a user."""
        counts: dict[str, int] = {}
        for key, record in self._states.items():
            if key[0] != user_id:
                continue
            counts[record.status] = counts.get(record.status, 0) + 1
        return counts

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        """Register event subscriptions."""
        await super().subscribe_events(event_bus)

    # ── Internal ───────────────────────────────────────────────────

    def _record_to_dict(self, record: StateRecord) -> dict:
        return {
            'user_id': str(record.user_id),
            'node_id': str(record.node_id),
            'status': record.status,
            'confidence': record.confidence,
            'time_spent_minutes': record.time_spent_minutes,
            'started_at': record.started_at,
            'completed_at': record.completed_at,
            'mastered_at': record.mastered_at,
            'updated_at': record.updated_at,
            'history_count': len(record.history),
        }
