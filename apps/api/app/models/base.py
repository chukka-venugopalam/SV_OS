"""
Shared base mixin for all SV-OS domain models.

Provides:
- UUID primary key (auto-generated)
- Created / updated timestamps
- Soft-delete support
- Optimistic-locking version field
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Integer, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column

from app.utils.date_utils import utc_now
from app.utils.uuid_utils import new_uuid


@declarative_mixin
class AppBaseMixin:
    """Mixin that adds common lifecycle columns to every domain model.

    Every entity in the system inherits from this mixin **in addition**
    to ``Base`` so that the columns below are present on every table.
    """

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=new_uuid,
        server_default=text('gen_random_uuid()'),
        comment='Primary key, auto-generated UUID v4',
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
        comment='Timestamp when the record was created',
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
        nullable=False,
        comment='Timestamp when the record was last updated',
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text('false'),
        nullable=False,
        comment='Soft-delete flag (True = logically deleted)',
    )

    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default=text('1'),
        nullable=False,
        comment='Optimistic-locking version counter',
    )
