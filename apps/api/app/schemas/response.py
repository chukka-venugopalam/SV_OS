"""Standard API response schemas.

Every API endpoint returns responses conforming to one of these schemas.
This module provides:

- ``APIResponse[T]`` — Generic wrapper for all responses
- ``success_response()`` — Factory for 2xx responses
- ``error_response()`` — Factory for 4xx/5xx responses

Note: ``ErrorDetail`` is imported from ``app.schemas.common.errors`` to avoid
duplicate definitions. ``PaginatedData`` is imported from
``app.schemas.common.pagination``.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TypeVar
from uuid import uuid4

from pydantic import BaseModel, ConfigDict

from app.schemas.common.errors import ErrorDetail

T = TypeVar('T')


class APIResponse[T](BaseModel):
    """Universal API response wrapper.

    Every endpoint returns this shape — success or error.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool
    message: str
    data: T | None = None
    errors: list[ErrorDetail] | None = None
    timestamp: datetime
    request_id: str


def build_success_response[T](
    data: T,
    message: str = 'Success',
    request_id: str | None = None,
) -> dict:
    """Build a standard success response dict (ready for JSON serialisation)."""
    return APIResponse(
        success=True,
        message=message,
        data=data,
        errors=None,
        timestamp=datetime.now(UTC),
        request_id=request_id or str(uuid4()),
    ).model_dump(mode='json')


def build_error_response(
    message: str = 'An error occurred',
    errors: list[ErrorDetail] | None = None,
    request_id: str | None = None,
) -> dict:
    """Build a standard error response dict (ready for JSON serialisation)."""
    return APIResponse(
        success=False,
        message=message,
        data=None,
        errors=errors,
        timestamp=datetime.now(UTC),
        request_id=request_id or str(uuid4()),
    ).model_dump(mode='json')


# Backward-compatible aliases
success_response = build_success_response
error_response = build_error_response
