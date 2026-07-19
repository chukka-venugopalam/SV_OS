"""Audit Logging — immutable audit trail for platform mutations.

Records:
- Graph mutations (node/edge creation, update, deletion)
- Imports (source, status, items affected)
- Exports (format, target, items exported)
- Rollbacks (version, reason, items restored)
- Assessments (user, score, result)
- Authentication events (login, logout, failure)
- Configuration changes (setting, old value, new value)

Audit entries are append-only. No deletion or modification allowed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4


AUDIT_CATEGORIES = {
    'graph_mutation': 'Graph mutations (node/edge CRUD)',
    'import': 'Import operations',
    'export': 'Export operations',
    'rollback': 'Version rollback operations',
    'assessment': 'Assessment submissions',
    'auth': 'Authentication events',
    'config_change': 'Configuration changes',
    'system': 'System events',
}


@dataclass(frozen=True)
class AuditEntry:
    """An immutable audit log entry."""
    entry_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    category: str = 'system'
    action: str = ''
    actor: str = 'system'
    resource_type: str = ''
    resource_id: str = ''
    details: dict[str, Any] = field(default_factory=dict)
    correlation_id: str = ''
    ip_address: str = ''


class AuditLogger:
    """Append-only audit logger.

    Entries are stored in memory and can be exported.
    No deletion or modification of existing entries is allowed.
    """

    def __init__(self) -> None:
        self._entries: list[AuditEntry] = []

    def record(
        self,
        category: str,
        action: str,
        actor: str = 'system',
        resource_type: str = '',
        resource_id: str = '',
        details: dict[str, Any] | None = None,
        correlation_id: str = '',
        ip_address: str = '',
    ) -> str:
        """Record an audit entry. Returns the entry ID."""
        entry = AuditEntry(
            category=category,
            action=action,
            actor=actor,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            correlation_id=correlation_id,
            ip_address=ip_address,
        )
        self._entries.append(entry)
        return entry.entry_id

    def query(
        self,
        category: str | None = None,
        actor: str | None = None,
        action: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Query audit entries with filtering."""
        results = list(self._entries)

        if category:
            results = [e for e in results if e.category == category]
        if actor:
            results = [e for e in results if e.actor == actor]
        if action:
            results = [e for e in results if e.action == action]
        if resource_type:
            results = [e for e in results if e.resource_type == resource_type]
        if resource_id:
            results = [e for e in results if e.resource_id == resource_id]

        results.reverse()  # Most recent first
        return [self._entry_to_dict(e) for e in results[offset:offset + limit]]

    def get_entry(self, entry_id: str) -> dict[str, Any] | None:
        """Get a single audit entry by ID."""
        for entry in self._entries:
            if entry.entry_id == entry_id:
                return self._entry_to_dict(entry)
        return None

    def get_statistics(self) -> dict[str, Any]:
        """Get audit log statistics."""
        return {
            'total_entries': len(self._entries),
            'by_category': {
                cat: sum(1 for e in self._entries if e.category == cat)
                for cat in AUDIT_CATEGORIES
            },
            'unique_actors': len(set(e.actor for e in self._entries)),
            'date_range': {
                'earliest': self._entries[0].timestamp if self._entries else None,
                'latest': self._entries[-1].timestamp if self._entries else None,
            },
        }

    def export(self, format: str = 'json') -> list[dict[str, Any]] | str:
        """Export all audit entries."""
        entries = [self._entry_to_dict(e) for e in self._entries]
        if format == 'json':
            return entries
        if format == 'csv':
            lines = ['entry_id,timestamp,category,action,actor,resource_type,resource_id']
            for e in entries:
                lines.append(
                    f'{e["entry_id"]},{e["timestamp"]},{e["category"]},'
                    f'{e["action"]},{e["actor"]},{e["resource_type"]},{e["resource_id"]}'
                )
            return '\n'.join(lines)
        return entries

    @property
    def entry_count(self) -> int:
        """Get the total number of audit entries."""
        return len(self._entries)

    def _entry_to_dict(self, entry: AuditEntry) -> dict[str, Any]:
        return {
            'entry_id': entry.entry_id,
            'timestamp': entry.timestamp,
            'category': entry.category,
            'action': entry.action,
            'actor': entry.actor,
            'resource_type': entry.resource_type,
            'resource_id': entry.resource_id,
            'details': entry.details,
            'correlation_id': entry.correlation_id,
            'ip_address': entry.ip_address,
        }


# Global audit logger singleton
_audit_logger: AuditLogger | None = None


def get_audit_logger() -> AuditLogger:
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger
