"""CSRF protection middleware — double-submit cookie pattern.

Generates a token, sets it as a cookie, and verifies it on mutating
requests (POST, PUT, PATCH, DELETE).  Safe by default — exempts
health checks, authentication endpoints, and GET/HEAD/OPTIONS.
"""

from __future__ import annotations

import secrets
from typing import TYPE_CHECKING, Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from starlette.requests import Request

CSRF_COOKIE_NAME = 'csrf_token'
CSRF_HEADER_NAME = 'X-CSRF-Token'
SAFE_METHODS = frozenset({'GET', 'HEAD', 'OPTIONS', 'TRACE'})
EXEMPT_PATHS = frozenset(
    {
        '/health',
        '/health/live',
        '/health/ready',
        '/api/v1/health',
        '/api/v1/health/live',
        '/api/v1/health/ready',
    },
)


class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection using the double-submit cookie pattern.

    Sets a ``csrf_token`` cookie (if one does not already exist).
    Mutating requests (POST, PUT, PATCH, DELETE) must include a
    matching ``X-CSRF-Token`` header.
    """

    def __init__(self, app: Any, cookie_secure: bool = True) -> None:
        super().__init__(app)
        self._cookie_secure = cookie_secure

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Skip CSRF for safe methods and exempt paths
        if request.method in SAFE_METHODS or self._is_exempt(request):
            response = await call_next(request)
            return self._ensure_cookie(request, response)

        # Require CSRF token for mutating requests
        body_token = request.headers.get(CSRF_HEADER_NAME, '')
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME, '')

        if not body_token or not cookie_token or body_token != cookie_token:
            return JSONResponse(
                status_code=403,
                content={
                    'success': False,
                    'message': 'CSRF token missing or invalid',
                    'data': None,
                    'errors': [
                        {
                            'code': 'csrf_error',
                            'message': 'A valid CSRF token is required. Refresh the page and try again.',  # noqa: E501
                        },
                    ],
                    'timestamp': None,
                    'request_id': getattr(request.state, 'request_id', None),
                },
            )

        response = await call_next(request)
        return self._ensure_cookie(request, response)

    def _is_exempt(self, request: Request) -> bool:
        """Check if the request path is exempt from CSRF validation."""
        path = request.url.path.rstrip('/')
        return path in EXEMPT_PATHS

    def _ensure_cookie(self, request: Request, response: Response) -> Response:
        """Set a CSRF cookie only if one is not already present."""
        if CSRF_COOKIE_NAME not in request.cookies:
            cookie_value = secrets.token_hex(32)
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=cookie_value,
                max_age=86_400,  # 24 hours
                secure=self._cookie_secure,
                httponly=True,
                samesite='lax',
            )
        return response
