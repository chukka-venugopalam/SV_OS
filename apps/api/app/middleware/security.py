"""Security headers middleware — applies secure HTTP response headers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.utils.security_utils import SECURITY_HEADERS, csp_directive

if TYPE_CHECKING:
    from starlette.requests import Request
    from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies security-related HTTP headers to every response.

    Uses the shared ``SECURITY_HEADERS`` constant from
    ``app.utils.security_utils`` for the common headers, and
    generates the CSP header via ``csp_directive()``.

    Headers set:
    - ``X-Content-Type-Options: nosniff``
    - ``X-Frame-Options: DENY``
    - ``X-XSS-Protection: 0`` (deprecated but still requested by some scanners)
    - ``Strict-Transport-Security`` (only when not in development)
    - ``Referrer-Policy: strict-origin-when-cross-origin``
    - ``Permissions-Policy`` (restricts feature access)
    - ``Content-Security-Policy`` (basic script/style restriction)
    """

    def __init__(
        self,
        app,
        environment: str = 'development',
        csp_report_only: bool = False,
    ) -> None:
        super().__init__(app)
        self.environment = environment
        self.csp_report_only = csp_report_only

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response: Response = await call_next(request)

        # Apply all standard security headers from shared constants
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value

        # Only set HSTS in non-development environments
        if self.environment != 'development':
            response.headers['Strict-Transport-Security'] = (
                'max-age=63072000; includeSubDomains; preload'
            )

        # Content-Security-Policy via shared utility
        header_name, header_value = csp_directive(report_only=self.csp_report_only)
        response.headers[header_name] = header_value

        return response
