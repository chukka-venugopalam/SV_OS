"""Category model — canonical knowledge domain taxonomy.

The ``categories`` table stores the canonical taxonomy of knowledge
categories/domains (e.g. "Programming Fundamentals", "Machine Learning")
with hierarchical ``parent_id`` support and search-friendly ``aliases``.

Renamed from ``domains`` to ``categories`` (migration 0008) for consistency
with the project's naming convention.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin


class Category(AppBaseMixin, Base):
    """A canonical knowledge domain / category in the taxonomy.

    Categories are hierarchical (via ``parent_id``) and support multiple
    ``aliases`` to resolve naming collisions (e.g. "Networks" vs.
    "Computer Networks").

    The table is created by migration ``0007`` (as ``domains``) and renamed
    to ``categories`` by migration ``0008``.  Every knowledge node may
    optionally reference a category via its slug (stored in
    ``knowledge_nodes.extra_metadata->>'domain'`` or a future FK).
    """

    __tablename__ = 'categories'

    slug: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        nullable=False,
        index=True,
        comment='URL-safe unique identifier (e.g. "programming-fundamentals")',
    )
    display_name: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Human-readable display name (e.g. "Programming Fundamentals")',
    )
    aliases: Mapped[list[str]] = mapped_column(
        ARRAY(Text),
        nullable=False,
        server_default=text("'{}'"),
        comment='Alternative names for resolving naming collisions',
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('categories.id', ondelete='SET NULL'),
        nullable=True,
        comment='Parent category ID for hierarchical taxonomy',
    )

    # ── Self-referential relationship for hierarchy ────────────────
    #
    # In a self-referential tree:
    #   parent   = ManyToOne  — FK (parent_id) is on the LOCAL table
    #   children = OneToMany  — FK (parent_id) is on the REMOTE table
    #
    # ``remote_side`` is ONLY set on the ManyToOne side (parent)
    # to tell SQLAlchemy which column is the remote primary key.
    # The OneToMany side (children) must NOT have ``remote_side``,
    # otherwise SQLAlchemy interprets it as ManyToOne too.

    children: Mapped[list[Category]] = relationship(
        'Category',
        back_populates='parent',
        foreign_keys='Category.parent_id',
    )
    parent: Mapped[Category | None] = relationship(
        'Category',
        back_populates='children',
        foreign_keys='Category.parent_id',
        remote_side='Category.id',
    )

    def __repr__(self) -> str:
        return f'<Category id={self.id!r} slug={self.slug!r}>'
