"""SearchHistory model — records user search queries for analytics and UX.

Maps to the ``search_history`` table.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from uuid import UUID

    from app.models.user import User


class SearchHistory(AppBaseMixin, Base):
    """A single search query executed by a user.

    Stored for analytics (trending searches), personalisation
    (recent searches dropdown), and improving search results.
    """

    __tablename__ = 'search_history'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='User who performed the search',
    )
    query: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment='Raw search query text',
    )
    filters: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Filters applied during the search (e.g. type, difficulty)',
    )
    results_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text('0'),
        nullable=False,
        comment='Number of results returned',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped[User] = relationship(
        'User',
        back_populates='search_history',
    )

    def __repr__(self) -> str:
        return f'<SearchHistory id={self.id!r} query={self.query!r} user={self.user_id!r}>'
