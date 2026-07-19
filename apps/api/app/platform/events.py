"""Backward-compatibility shim — re-exports from canonical app.events.bus.

New code should import directly from ``app.events.bus``.
"""

from app.events.bus import EventBus, EventEnvelope, EventHandler, EventMetadata  # noqa: F401

__all__ = [
    'EventBus',
    'EventEnvelope',
    'EventHandler',
    'EventMetadata',
]
