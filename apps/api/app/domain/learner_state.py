"""LearnerState — learner progress on a knowledge node.

The ORM model at ``app.models.user_progress.UserProgress`` is the
persistence mapping for this domain concept.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class LearnerState:
    """Progress state for a learner on a specific knowledge node."""

    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    node_id: UUID = field(default_factory=uuid4)
    status: str = 'not_started'  # not_started, learning, completed, mastered
    started_at: datetime | None = None
    completed_at: datetime | None = None
    time_spent_minutes: int = 0
    updated_at: datetime | None = None
