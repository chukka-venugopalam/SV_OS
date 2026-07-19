"""KnowledgeEdge — a relationship between two knowledge nodes.

The ORM model at ``app.models.knowledge_edge.KnowledgeEdge`` is the
persistence mapping for this domain concept.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class KnowledgeEdge:
    """A directed relationship between two knowledge nodes."""

    id: UUID = field(default_factory=uuid4)
    source_node_id: UUID = field(default_factory=uuid4)
    target_node_id: UUID = field(default_factory=uuid4)
    relationship_type: str = 'related_to'
    direction: str = 'forward'
    description: str = ''
    weight: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime | None = None
