"""AssessmentSubmission — a learner's submission for an assessment.

The ORM persistence mapping is at the database layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class AssessmentSubmission:
    """A learner's submission for a knowledge assessment."""

    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    assessment_id: UUID = field(default_factory=uuid4)
    answers: list[dict] = field(default_factory=list)
    score: float | None = None
    passed: bool | None = None
    submitted_at: datetime | None = None
    graded_at: datetime | None = None
