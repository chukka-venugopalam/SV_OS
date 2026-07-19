"""ImportJob — represents an import workflow and its execution state.

The ORM persistence mapping is at the database layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class ImportJob:
    """An import workflow with execution state."""

    id: UUID = field(default_factory=uuid4)
    status: str = 'pending'  # pending, running, completed, failed, rolled_back
    source: str = ''
    payload: dict[str, Any] = field(default_factory=dict)
    validation_report_id: UUID | None = None
    error_message: str | None = None
    created_at: datetime | None = None
    completed_at: datetime | None = None
