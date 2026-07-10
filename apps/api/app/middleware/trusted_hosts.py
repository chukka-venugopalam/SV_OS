"""Trusted hosts middleware — validates the Host header against an allowlist."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import PlainTextResponse, Response


class TrustedHostsMiddleware(BaseHTTPMiddleware):
    """Validates that the ``Host`` header matches an allowed domain.

    Raises a 400 response if the host is not in the allowed list.
    In development mode, ``localhost`` (with any port) and ``127.0.0.1``
    are implicitly allowed.
    """

    def __init__(
        self,
        app,
        allowed_hosts: list[str] | None = None,
        environment: str = 'development',
    ) -> None:
        super().__init__(app)
        self.allowed_hosts: list[str] = allowed_hosts or []
        self.environment = environment

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        host: str = request.headers.get('Host', '').split(':')[0].lower()

        # Development: allow localhost and 127.0.0.1 implicitly
        if self.environment == 'development' and host in ('localhost', '127.0.0.1', '0.0.0.0'):
            return await call_next(request)

        # Production: check against allowed list
        if self.allowed_hosts and host not in self.allowed_hosts:
            return PlainTextResponse(
                'Invalid Host header',
                status_code=400,
            )

        return await call_next(request)
