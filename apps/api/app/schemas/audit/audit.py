"""Audit log DTOs — immutable records of system events.

Audit logs capture authentication events, data mutations, and other
security-relevant activities. These schemas define the API contract
for reading and filtering audit logs (logs are append-only — no
create/update contracts needed for the general case).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AuditLogEntry(BaseModel):
    """Compact audit log entry for list views."""

    id: UUID = Field(description='Unique audit log identifier')
    action: str = Field(
        description='Action identifier (e.g. "user.login", "node.create")',
        max_length=100,
        examples=['user.login', 'node.create', 'progress.update'],
    )
    entity_type: str | None = Field(
        default=None,
        description='Type of entity affected',
        max_length=50,
        examples=['user', 'knowledge_node', 'career'],
    )
    entity_id: UUID | None = Field(default=None, description='UUID of the entity affected')
    user_id: UUID | None = Field(default=None, description='User who performed the action')
    ip_address: str | None = Field(
        default=None,
        description='Client IP address',
        examples=['192.168.1.1', '10.0.0.1'],
    )
    created_at: datetime = Field(description='When the event occurred')


class AuditLogDetail(BaseModel):
    """Full audit log entry with metadata."""

    id: UUID = Field(description='Unique audit log identifier')
    action: str = Field(
        description='Action identifier',
        max_length=100,
        examples=['user.login', 'node.create', 'progress.update'],
    )
    entity_type: str | None = Field(
        default=None, description='Type of entity affected', max_length=50
    )
    entity_id: UUID | None = Field(default=None, description='UUID of the entity affected')
    user_id: UUID | None = Field(default=None, description='User who performed the action')
    username: str | None = Field(default=None, description='Username of the actor (if available)')
    metadata: dict = Field(default_factory=dict, description='Event metadata (diff, context, etc.)')
    ip_address: str | None = Field(default=None, description='Client IP address')
    created_at: datetime = Field(description='When the event occurred')


class AuditLogFilter(BaseModel):
    """Request contract for filtering audit logs.

    All fields are optional — filters are applied only when provided.
    """

    action: str | None = Field(
        default=None, max_length=100, description='Filter by action identifier'
    )
    entity_type: str | None = Field(
        default=None, max_length=50, description='Filter by entity type'
    )
    entity_id: UUID | None = Field(default=None, description='Filter by entity UUID')
    user_id: UUID | None = Field(default=None, description='Filter by user UUID')
    start_date: datetime | None = Field(
        default=None, description='Include events after this timestamp'
    )
    end_date: datetime | None = Field(
        default=None, description='Include events before this timestamp'
    )


class AuditLogList(BaseModel):
    """Paginated list of audit log entries."""

    items: list[AuditLogEntry]
    total: int = Field(ge=0, description='Total entries matching the filter')
