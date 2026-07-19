"""KnowledgeNode — a node in the knowledge graph.

This is the pure domain representation. The ORM model at
``app.models.knowledge_node.KnowledgeNode`` is the persistence mapping.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class KnowledgeNode:
    """A node in the knowledge graph."""

    id: UUID = field(default_factory=uuid4)
    slug: str = ''
    title: str = ''
    description: str = ''
    node_type: str = ''
    difficulty: str = 'beginner'
    estimated_minutes: int = 30
    icon: str | None = None
    color: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    view_count: int = 0
    is_published: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
