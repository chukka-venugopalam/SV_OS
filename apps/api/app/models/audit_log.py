"""AuditLog model — immutable record of important system events.

Maps to the ``activity_logs`` table.  Used for security auditing,
compliance, and debugging.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(AppBaseMixin, Base):
    """An immutable audit log entry recording a system event.

    Logs cover authentication events, data mutations, and other
    security-relevant activities.
    """

    __tablename__ = 'activity_logs'

    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
        comment='User who performed the action (NULL for anonymous)',
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment='Action identifier (e.g. "user.login", "node.create")',
    )
    entity_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment='Type of entity affected (e.g. "user", "knowledge_node")',
    )
    entity_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        comment='UUID of the entity affected',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Arbitrary event metadata (diff, context, IP, etc.)',
    )
    ip_address: Mapped[str | None] = mapped_column(
        INET,
        nullable=True,
        comment='Client IP address',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped[User | None] = relationship(
        'User',
        back_populates='audit_logs',
    )

    def __repr__(self) -> str:
        return f'<AuditLog id={self.id!r} action={self.action!r} user={self.user_id!r}>'
