"""AuditLog repository — persistence operations for the ``AuditLog`` model."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository
from app.repositories.query_helpers import FilterCondition, PageResult


class AuditLogRepository(BaseRepository[AuditLog]):
    """Repository for ``AuditLog`` persistence operations.

    Audit logs are immutable — ``delete`` and ``restore`` methods
    inherited from ``BaseRepository`` are intentionally excluded.
    Use ``hard_delete`` only for data retention policies.
    """

    model = AuditLog

    # ── Query Methods ──────────────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        _page: int = 1,
        _per_page: int = 20,
    ) -> PageResult[AuditLog]:
        """Find audit log entries for a specific user."""
        return await self.paginate(
            page=_page,
            per_page=_per_page,
            filters={'user_id': user_id},
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_by_action(
        self,
        action: str,
        _page: int = 1,
        _per_page: int = 20,
    ) -> PageResult[AuditLog]:
        """Find audit log entries by action type."""
        return await self.paginate(
            page=_page,
            per_page=_per_page,
            filters={'action': action},
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_by_entity(
        self,
        entity_type: str,
        entity_id: UUID,
        _page: int = 1,
        _per_page: int = 20,
    ) -> PageResult[AuditLog]:
        """Find audit log entries for a specific entity."""
        return await self.find_by(
            conditions=[
                FilterCondition(field='entity_type', value=entity_type, operator='eq'),
                FilterCondition(field='entity_id', value=entity_id, operator='eq'),
            ],
            sorts=[('created_at', 'desc')],
        )

    async def find_recent(
        self,
        limit: int = 50,
    ) -> list[AuditLog]:
        """Find the most recent audit log entries across all users."""
        return await self.get_all(
            sort_field='created_at',
            sort_direction='desc',
            limit=limit,
        )

    async def find_filtered(
        self,
        user_id: UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: Any = None,
        date_to: Any = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[AuditLog]:
        """Find audit log entries with combined filters."""
        conditions = []
        if user_id:
            conditions.append(FilterCondition(field='user_id', value=user_id, operator='eq'))
        if action:
            conditions.append(FilterCondition(field='action', value=action, operator='eq'))
        if entity_type:
            conditions.append(
                FilterCondition(field='entity_type', value=entity_type, operator='eq')
            )

        builder = self._query()
        if conditions:
            builder.apply_filters(conditions)
        if date_from:
            builder.filter(AuditLog.created_at >= date_from)
        if date_to:
            builder.filter(AuditLog.created_at <= date_to)

        builder.sort('created_at', 'desc')
        builder.paginate(page, per_page)

        count_result = await self.session.execute(builder.build_count())
        total: int = count_result.scalar() or 0

        result = await self.session.execute(builder.build())
        items = list(result.scalars().all())
        return PageResult(items=items, total=total, page=page, per_page=per_page)

    # ── Statistics ─────────────────────────────────────────────────

    async def count_by_action(self) -> list[dict[str, Any]]:
        """Count audit log entries grouped by action type."""
        stmt = (
            select(
                AuditLog.action,
                func.count().label('count'),
            )
            .where(AuditLog.is_deleted == False)  # noqa: E712
            .group_by(AuditLog.action)
            .order_by(func.count().desc())
        )
        result = await self.session.execute(stmt)
        return [{'action': row[0], 'count': row[1]} for row in result.all()]

    async def count_recent_hours(self, hours: int = 24) -> int:
        """Count audit log entries created in the last N hours."""
        from datetime import timedelta

        from app.utils.date_utils import utc_now

        since = utc_now() - timedelta(hours=hours)
        stmt = (
            select(func.count())
            .select_from(AuditLog)
            .where(
                AuditLog.created_at >= since,
                AuditLog.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    # ── Create (Immutable) ─────────────────────────────────────────

    async def log_event(
        self,
        action: str,
        user_id: UUID | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        extra_metadata: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        """Create an immutable audit log entry."""
        return await self.create(
            action=action,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            extra_metadata=extra_metadata or {},
            ip_address=ip_address,
        )
