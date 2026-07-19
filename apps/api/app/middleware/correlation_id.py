"""Correlation ID middleware — propagates a trace-wide correlation ID.

This middleware is the sole owner of ``request.state.correlation_id``.
It must be registered **after** ``RequestIDMiddleware`` in the stack
so that ``request.state.request_id`` is already available.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.logging import add_request_context

if TYPE_CHECKING:
    from starlette.requests import Request
    from starlette.responses import Response


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Propagates a correlation ID across service boundaries.

    The correlation ID is read from the ``X-Correlation-ID`` request
    header (if provided by an upstream service) or generated fresh.
    It is stored in ``request.state.correlation_id``, returned in
    the ``X-Correlation-ID`` response header, and bound to the
    structured logging context.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        correlation_id: str = request.headers.get('X-Correlation-ID') or str(uuid4())
        request.state.correlation_id = correlation_id

        # Re-bind logging context so correlation_id is included
        # alongside the request_id already set by RequestIDMiddleware.
        add_request_context(
            request_id=getattr(request.state, 'request_id', ''),
            correlation_id=correlation_id,
        )

        response: Response = await call_next(request)
        response.headers['X-Correlation-ID'] = correlation_id
        return response
