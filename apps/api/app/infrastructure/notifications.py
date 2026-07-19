"""Notifications — event-driven notification system.

Supports:
- In-app notifications (stored in-memory)
- Email notification interface (adapter pattern)
- Webhook notification interface (adapter pattern)
- Notification preferences per user

No vendor lock-in. All external integrations use adapters.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4


@dataclass
class Notification:
    """A single notification."""

    notification_id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ''
    title: str = ''
    body: str = ''
    notification_type: str = 'info'  # info, success, warning, error
    source: str = 'system'
    read: bool = False
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    read_at: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class EmailAdapter(Protocol):
    """Protocol for email notification adapters."""

    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send an email notification."""
        ...


class WebhookAdapter(Protocol):
    """Protocol for webhook notification adapters."""

    async def send_webhook(self, url: str, payload: dict[str, Any]) -> bool:
        """Send a webhook notification."""
        ...


class NotificationService:
    """Event-driven notification service.

    Supports in-app notifications and pluggable email/webhook adapters.
    """

    def __init__(
        self,
        email_adapter: EmailAdapter | None = None,
        webhook_adapter: WebhookAdapter | None = None,
    ) -> None:
        self._email_adapter = email_adapter
        self._webhook_adapter = webhook_adapter
        self._notifications: dict[str, Notification] = {}
        self._user_notifications: dict[str, list[str]] = {}
        self._preferences: dict[str, dict[str, bool]] = {}

    def set_email_adapter(self, adapter: EmailAdapter) -> None:
        """Set the email notification adapter."""
        self._email_adapter = adapter

    def set_webhook_adapter(self, adapter: WebhookAdapter) -> None:
        """Set the webhook notification adapter."""
        self._webhook_adapter = adapter

    async def send_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        notification_type: str = 'info',
        source: str = 'system',
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Send a notification to a user."""
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            source=source,
            metadata=metadata or {},
        )
        self._notifications[notification.notification_id] = notification

        if user_id not in self._user_notifications:
            self._user_notifications[user_id] = []
        self._user_notifications[user_id].append(notification.notification_id)

        # Send via email adapter (if configured)
        if self._email_adapter and self._get_preference(user_id, 'email'):
            try:  # noqa: SIM105
                await self._email_adapter.send_email(
                    to=user_id,
                    subject=title,
                    body=body,
                )
            except Exception:
                pass  # Email is best-effort

        return self._notification_to_dict(notification)

    async def mark_read(self, user_id: str, notification_id: str) -> dict | None:
        """Mark a notification as read."""
        notification = self._notifications.get(notification_id)
        if notification is None or notification.user_id != user_id:
            return None
        notification.read = True
        notification.read_at = datetime.now(UTC).isoformat()
        return self._notification_to_dict(notification)

    async def mark_all_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        count = 0
        for nid in self._user_notifications.get(user_id, []):
            notification = self._notifications.get(nid)
            if notification and not notification.read:
                notification.read = True
                notification.read_at = datetime.now(UTC).isoformat()
                count += 1
        return count

    async def get_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
    ) -> list[dict]:
        """Get notifications for a user."""
        nids = self._user_notifications.get(user_id, [])
        notifications = [self._notifications[nid] for nid in nids if nid in self._notifications]
        if unread_only:
            notifications = [n for n in notifications if not n.read]
        notifications.sort(key=lambda n: n.created_at, reverse=True)
        return [self._notification_to_dict(n) for n in notifications[:limit]]

    async def get_unread_count(self, user_id: str) -> int:
        """Get the number of unread notifications for a user."""
        count = 0
        for nid in self._user_notifications.get(user_id, []):
            notification = self._notifications.get(nid)
            if notification and not notification.read:
                count += 1
        return count

    async def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification."""
        notification = self._notifications.get(notification_id)
        if notification is None or notification.user_id != user_id:
            return False
        self._notifications.pop(notification_id, None)
        nids = self._user_notifications.get(user_id, [])
        if notification_id in nids:
            nids.remove(notification_id)
        return True

    async def get_statistics(self) -> dict:
        """Get notification statistics."""
        all_notifications = list(self._notifications.values())
        return {
            'total': len(all_notifications),
            'unread': sum(1 for n in all_notifications if not n.read),
            'by_type': {
                'info': sum(1 for n in all_notifications if n.notification_type == 'info'),
                'success': sum(1 for n in all_notifications if n.notification_type == 'success'),
                'warning': sum(1 for n in all_notifications if n.notification_type == 'warning'),
                'error': sum(1 for n in all_notifications if n.notification_type == 'error'),
            },
            'active_users': len(self._user_notifications),
        }

    def set_preference(self, user_id: str, key: str, value: bool) -> None:
        """Set a notification preference for a user."""
        if user_id not in self._preferences:
            self._preferences[user_id] = {'email': True, 'webhook': True, 'in_app': True}
        self._preferences[user_id][key] = value

    def _get_preference(self, user_id: str, key: str) -> bool:
        """Get a notification preference for a user."""
        prefs = self._preferences.get(user_id, {})
        return prefs.get(key, True)

    def _notification_to_dict(self, notification: Notification) -> dict:
        return {
            'notification_id': notification.notification_id,
            'user_id': notification.user_id,
            'title': notification.title,
            'body': notification.body,
            'type': notification.notification_type,
            'source': notification.source,
            'read': notification.read,
            'created_at': notification.created_at,
            'read_at': notification.read_at,
            'metadata': notification.metadata,
        }
