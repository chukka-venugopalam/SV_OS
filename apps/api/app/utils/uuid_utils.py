"""UUID utilities for consistent ID generation."""

from __future__ import annotations

from uuid import UUID, uuid4


def new_uuid() -> UUID:
    """Generate a new UUID v4."""
    return uuid4()


def is_valid_uuid(value: str, version: int = 4) -> bool:
    """Check whether a string is a valid UUID of the given version."""
    try:
        UUID(value, version=version)
        return True
    except (ValueError, AttributeError):
        return False
