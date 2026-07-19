"""WebSocket Layer — live streaming updates for engine status, job progress, and notifications.

Supports:
- Live engine status updates
- Job progress streaming (import, export)
- Health status updates
- Notification streaming
- Client connection management
- Channel-based subscriptions
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Callable
from uuid import uuid4


@dataclass
class WebSocketClient:
    """A connected WebSocket client."""
    client_id: str = field(default_factory=lambda: str(uuid4()))
    channels: list[str] = field(default_factory=lambda: ['all'])
    connected_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    last_heartbeat: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    queue: asyncio.Queue = field(default_factory=asyncio.Queue)


class WebSocketManager:
    """Manages WebSocket connections and broadcasts.

    Channels:
    - 'all': All clients receive messages on this channel
    - 'notifications': Notification updates
    - 'engine.status': Engine lifecycle status changes
    - 'job.progress': Import/export job progress
    - 'health': Health status updates
    """

    def __init__(self) -> None:
        self._clients: dict[str, WebSocketClient] = {}
        self._channel_clients: dict[str, set[str]] = {'all': set()}

    async def connect(self, channels: list[str] | None = None) -> WebSocketClient:
        """Register a new client connection."""
        client = WebSocketClient(channels=channels or ['all'])
        self._clients[client.client_id] = client

        for channel in client.channels:
            if channel not in self._channel_clients:
                self._channel_clients[channel] = set()
            self._channel_clients[channel].add(client.client_id)
        self._channel_clients['all'].add(client.client_id)

        return client

    async def disconnect(self, client_id: str) -> None:
        """Remove a client connection."""
        self._clients.pop(client_id, None)
        for channel in list(self._channel_clients.keys()):
            self._channel_clients[channel].discard(client_id)

    async def broadcast(self, channel: str, event_type: str, data: dict[str, Any]) -> int:
        """Broadcast a message to all clients on a channel. Returns recipient count."""
        client_ids = self._channel_clients.get(channel, set())
        message = {
            'type': event_type,
            'data': data,
            'timestamp': datetime.now(UTC).isoformat(),
        }
        count = 0
        for cid in client_ids:
            client = self._clients.get(cid)
            if client:
                try:
                    await client.queue.put(message)
                    count += 1
                except Exception:
                    pass
        return count

    async def broadcast_all(self, event_type: str, data: dict[str, Any]) -> int:
        """Broadcast to all connected clients."""
        return await self.broadcast('all', event_type, data)

    async def send_to_client(self, client_id: str, event_type: str, data: dict[str, Any]) -> bool:
        """Send a message to a specific client."""
        client = self._clients.get(client_id)
        if client is None:
            return False
        try:
            await client.queue.put({
                'type': event_type,
                'data': data,
                'timestamp': datetime.now(UTC).isoformat(),
            })
            return True
        except Exception:
            return False

    async def get_messages(self, client_id: str) -> list[dict[str, Any]]:
        """Get all pending messages for a client (non-blocking)."""
        client = self._clients.get(client_id)
        if client is None:
            return []
        messages = []
        while not client.queue.empty():
            try:
                msg = client.queue.get_nowait()
                messages.append(msg)
            except asyncio.QueueEmpty:
                break
        return messages

    async def broadcast_engine_status(self, engine_name: str, status: str, details: dict[str, Any] | None = None) -> None:
        """Broadcast engine status change."""
        await self.broadcast('engine.status', 'engine_status', {
            'engine': engine_name,
            'status': status,
            'details': details or {},
        })

    async def broadcast_job_progress(self, job_id: str, job_type: str, progress: float, status: str, message: str = '') -> None:
        """Broadcast job progress update."""
        await self.broadcast('job.progress', 'job_progress', {
            'job_id': job_id,
            'job_type': job_type,
            'progress': progress,
            'status': status,
            'message': message,
        })

    async def broadcast_notification(self, user_id: str, title: str, body: str, notification_type: str = 'info') -> None:
        """Broadcast a notification to a user."""
        await self.broadcast('notifications', 'notification', {
            'user_id': user_id,
            'title': title,
            'body': body,
            'type': notification_type,
        })

    async def get_statistics(self) -> dict:
        """Get WebSocket connection statistics."""
        return {
            'connected_clients': len(self._clients),
            'channels': {ch: len(clients) for ch, clients in self._channel_clients.items()},
            'total_channels': len(self._channel_clients),
        }

    def heartbeat(self, client_id: str) -> bool:
        """Update client heartbeat timestamp."""
        client = self._clients.get(client_id)
        if client is None:
            return False
        client.last_heartbeat = datetime.now(UTC).isoformat()
        return True


# Global WebSocket manager singleton
_ws_manager: WebSocketManager | None = None


def get_websocket_manager() -> WebSocketManager:
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = WebSocketManager()
    return _ws_manager
