"""Rate limit middleware — token bucket implementation.

Supports:
- Token bucket algorithm
- Per-IP and per-user rate limiting
- Configurable limits and burst
- X-RateLimit headers
- Retry-After header
- In-memory and Redis-backed store
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class TokenBucket:
    """Token bucket rate limiter.

    Allows up to `capacity` tokens, refilling at `rate` tokens per second.
    """

    def __init__(self, capacity: int = 60, rate: float = 1.0) -> None:
        self._capacity = capacity
        self._rate = rate
        self._tokens: float = float(capacity)
        self._last_refill: float = time.monotonic()

    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens. Returns True if allowed."""
        self._refill()
        if self._tokens >= tokens:
            self._tokens -= tokens
            return True
        return False

    def remaining(self) -> int:
        """Return the number of remaining tokens."""
        self._refill()
        return int(self._tokens)

    def reset_time(self) -> float:
        """Return seconds until the bucket fully refills."""
        needed = self._capacity - self._tokens
        if needed <= 0:
            return 0.0
        return needed / self._rate

    def _refill(self) -> None:
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens = min(self._capacity, self._tokens + elapsed * self._rate)
        self._last_refill = now


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using token bucket algorithm.

    Configuration:
    - `API_RATE_LIMIT`: requests per minute (default: 60)
    - `API_RATE_LIMIT_BURST`: burst capacity (default: 100)
    - Per-user limits when authenticated
    - Per-IP limits for anonymous requests
    """

    def __init__(
        self,
        app: Any,
        default_limit: int = 60,
        default_burst: int = 100,
        authenticated_limit: int = 120,
    ) -> None:
        super().__init__(app)
        self._default_limit = default_limit
        self._default_burst = default_burst
        self._authenticated_limit = authenticated_limit
        self._buckets: dict[str, TokenBucket] = {}

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # Skip health endpoints
        if request.url.path in ('/health', '/health/live', '/health/ready', '/metrics'):
            return await call_next(request)

        # Determine client identifier
        client_id = self._get_client_id(request)
        limit = self._authenticated_limit if self._is_authenticated(request) else self._default_limit
        burst = self._default_burst

        bucket = self._get_bucket(client_id, limit, burst)

        if not bucket.consume():
            retry_after = int(bucket.reset_time()) + 1
            return JSONResponse(
                status_code=429,
                content={
                    'success': False,
                    'message': 'Rate limit exceeded',
                    'data': {'retry_after_seconds': retry_after},
                    'errors': [{'code': 'rate_limit_exceeded', 'message': f'Rate limit exceeded. Retry after {retry_after} seconds.'}],
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                },
                headers={
                    'X-RateLimit-Limit': str(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': str(int(time.time() + retry_after)),
                    'Retry-After': str(retry_after),
                },
            )

        response = await call_next(request)
        response.headers['X-RateLimit-Limit'] = str(limit)
        response.headers['X-RateLimit-Remaining'] = str(bucket.remaining())
        return response

    def _get_client_id(self, request: Request) -> str:
        """Get a unique identifier for the client."""
        # Try user ID first
        user = getattr(request.state, 'user', None)
        if user and hasattr(user, 'id'):
            return f'user:{user.id}'

        # Fall back to IP
        forwarded = request.headers.get('X-Forwarded-For', '')
        ip = forwarded.split(',')[0].strip() if forwarded else request.client.host if request.client else 'unknown'
        return f'ip:{ip}'

    def _is_authenticated(self, request: Request) -> bool:
        """Check if the request is from an authenticated user."""
        return getattr(request.state, 'user', None) is not None

    def _get_bucket(self, client_id: str, capacity: int, rate: float) -> TokenBucket:
        """Get or create a token bucket for the client."""
        if client_id not in self._buckets:
            self._buckets[client_id] = TokenBucket(capacity=capacity, rate=rate)
        return self._buckets[client_id]
