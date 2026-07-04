"""Request timing middleware — measures and records request duration."""

from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from structlog.stdlib import get_logger

logger = get_logger(__name__)


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Records the duration of each request and attaches timing headers.

    Timing is exposed via:
    - ``X-Request-Duration-MS`` response header
    - ``request.state.duration_ms`` for use by downstream handlers
    - Structured log line at INFO level with duration info
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time: float = time.perf_counter()

        response: Response = await call_next(request)

        duration_ms: float = (time.perf_counter() - start_time) * 1000
        request.state.duration_ms = duration_ms

        response.headers['X-Request-Duration-MS'] = f'{duration_ms:.2f}'

        logger.info(
            'request_completed',
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            duration_ms=f'{duration_ms:.2f}',
            request_id=getattr(request.state, 'request_id', None),
        )

        return response
