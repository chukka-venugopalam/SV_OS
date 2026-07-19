"""ValidationReport — the result of validating a mutation or import.

The ORM persistence mapping is defined at the database layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class ValidationReport:
    """Result of a validation check on a mutation or import."""

    id: UUID = field(default_factory=uuid4)
    passed: bool = False
    errors: list[dict] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    entity_type: str = ''
    entity_id: UUID | None = None
    created_at: datetime | None = None
