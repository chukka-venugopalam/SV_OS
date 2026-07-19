"""DomainEvent — a state-change event for cross-engine coordination.

The ORM persistence mapping is at the database layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, UTC
from uuid import UUID, uuid4
from typing import Any


@dataclass
class DomainEvent:
    """A domain event representing a state change in the system."""

    event_id: UUID = field(default_factory=uuid4)
    event_type: str = ''
    aggregate_id: UUID | None = None
    correlation_id: str | None = None
    causation_id: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, Any] = field(default_factory=dict)
