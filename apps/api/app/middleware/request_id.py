"""Request ID middleware — assigns a unique ID to every request.

This middleware should be registered **before** ``CorrelationIDMiddleware``
in the middleware stack so that ``request.state.request_id`` is available
for logging context binding in downstream middleware.
"""

from __future__ import annotations

from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import add_request_context, clear_request_context


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Assigns a unique request ID to every incoming request.

    The ID is stored in ``request.state.request_id`` and returned
    in the ``X-Request-ID`` response header.  If the client sends an
    ``X-Request-ID`` header on a POST/PUT/PATCH, that value is reused
    (idempotency-friendly).

    Also initialises the structured logging context with the request
    ID (correlation ID is handled by ``CorrelationIDMiddleware``).
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id: str = request.headers.get('X-Request-ID') or str(uuid4())
        request.state.request_id = request_id

        # Initialise logging context with request_id (correlation_id
        # will be handled by CorrelationIDMiddleware which runs after).
        add_request_context(request_id)

        try:
            response: Response = await call_next(request)
            response.headers['X-Request-ID'] = request_id
            return response
        finally:
            clear_request_context()
