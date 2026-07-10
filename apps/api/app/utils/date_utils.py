"""Date/time utilities for consistent timestamp handling."""

from __future__ import annotations

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return the current UTC timestamp."""
    return datetime.now(UTC)


def format_iso(dt: datetime | None = None) -> str:
    """Format a datetime as an ISO 8601 string (defaults to now)."""
    return (dt or utc_now()).isoformat()


def parse_iso(value: str) -> datetime:
    """Parse an ISO 8601 string into a datetime (assumes UTC if no tz)."""
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt
