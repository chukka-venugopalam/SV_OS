"""KnowledgeEdge model — a directed relationship between two knowledge nodes.

Every edge belongs to the ``knowledge_edges`` table and carries a
semantic type and direction.  Prerequisite edges are just
``KnowledgeEdge`` records with ``relationship_type = 'prerequisite'``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Float, ForeignKey, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import EdgeDirection, EdgeType, pg_enum

if TYPE_CHECKING:
    from uuid import UUID

    from app.models.knowledge_node import KnowledgeNode


class KnowledgeEdge(AppBaseMixin, Base):
    """A directed, typed edge in the knowledge graph.

    Connects two ``KnowledgeNode`` records (``source`` → ``target``)
    with a semantic ``relationship_type`` and an optional weight.

    Prerequisite edges are filtered by ``relationship_type='prerequisite'``
    at the repository or service layer.
    """

    __tablename__ = 'knowledge_edges'

    __table_args__ = (
        UniqueConstraint(
            'source_node_id',
            'target_node_id',
            'relationship_type',
            name='uq_edge_source_target_type',
        ),
        CheckConstraint(
            'source_node_id != target_node_id',
            name='ck_edge_no_self_loop',
        ),
    )

    source_node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Source / parent node ID',
    )
    target_node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Target / child node ID',
    )
    relationship_type: Mapped[EdgeType] = mapped_column(
        pg_enum(EdgeType, 'edge_type_enum'),
        nullable=False,
        index=True,
        comment='Semantic type of the relationship',
    )
    direction: Mapped[EdgeDirection] = mapped_column(
        pg_enum(EdgeDirection, 'edge_direction_enum'),
        default=EdgeDirection.FORWARD,
        server_default=text("'forward'"),
        nullable=False,
        comment='Directionality of the edge',
    )
    description: Mapped[str] = mapped_column(
        Text,
        default='',
        server_default=text("''"),
        nullable=False,
        comment='Human-readable description of the relationship',
    )
    weight: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        server_default=text('1.0'),
        nullable=False,
        comment='Numeric weight for ranking / scoring traversals',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Arbitrary metadata JSON blob for extensibility',
    )

    # ── Relationships ──────────────────────────────────────────────

    source_node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        foreign_keys=[source_node_id],
        back_populates='outgoing_edges',
    )
    target_node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        foreign_keys=[target_node_id],
        back_populates='incoming_edges',
    )

    def __repr__(self) -> str:
        return (
            f'<KnowledgeEdge id={self.id!r} '
            f'{self.source_node_id!r} → {self.target_node_id!r} '
            f'type={self.relationship_type}>'
        )
