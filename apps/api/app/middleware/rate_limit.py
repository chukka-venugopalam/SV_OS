"""Rate limit middleware — stub implementation.

This is a placeholder that passes all requests through.
Actual rate limiting will be implemented in a later phase
using a token-bucket or sliding-window algorithm with
an in-memory or Redis-backed store.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware — **stub only**.

    Currently passes all requests without limiting.  The interface
    is ready for implementation:

    - ``API_RATE_LIMIT`` (requests per minute) from settings
    - Different limits for authenticated vs. anonymous users
    - ``X-RateLimit-Limit``, ``X-RateLimit-Remaining``, ``X-RateLimit-Reset`` headers
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # TODO: Implement rate limiting in a future phase.
        # For now, pass through without modification.
        response: Response = await call_next(request)
        return response
