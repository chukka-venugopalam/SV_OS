"""Security utilities — reusable helpers for authentication and data protection.

This module provides lightweight, stateless utilities for:
- Password strength validation
- Input sanitisation basics
- Security header generation
- JWT token helpers (stub — full implementation in Phase 4)

Authentication middleware and full JWT handling belong in later phases.
"""

from __future__ import annotations

import re
from typing import Any

# ── Password Validation ───────────────────────────────────────────


PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128

# At least one uppercase, one lowercase, one digit, one special char
PASSWORD_PATTERN = re.compile(
    r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?/{}[\]|~`]).+$',
)


def validate_password_strength(password: str) -> list[str]:
    """Validate password strength and return a list of failure reasons.

    Returns an empty list when the password meets all requirements.
    """
    errors: list[str] = []

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f'Password must be at least {PASSWORD_MIN_LENGTH} characters long')
    if len(password) > PASSWORD_MAX_LENGTH:
        errors.append(f'Password must not exceed {PASSWORD_MAX_LENGTH} characters')
    if not PASSWORD_PATTERN.match(password):
        errors.append(
            'Password must contain at least one uppercase letter, '
            'one lowercase letter, one digit, and one special character',
        )

    return errors


# ── Input Sanitisation ────────────────────────────────────────────


def strip_whitespace(value: str) -> str:
    """Strip leading/trailing whitespace and collapse internal whitespace."""
    return ' '.join(value.split())


def sanitise_email(value: str) -> str:
    """Normalise an email address (lowercase, stripped)."""
    return strip_whitespace(value).lower()


# ── Security Header Constants ─────────────────────────────────────


SECURITY_HEADERS: dict[str, str] = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': ('camera=(), microphone=(), geolocation=(), interest-cohort=()'),
}


def csp_directive(
    script_src: str = "'none'",
    style_src: str = "'self' 'unsafe-inline'",
    report_only: bool = False,
) -> tuple[str, str]:
    """Build a Content-Security-Policy header value.

    Default is a restrictive policy suitable for a JSON API.
    Pass ``report_only=True`` to generate the ``-Report-Only`` variant.
    """
    return ('Content-Security-Policy-Report-Only' if report_only else 'Content-Security-Policy'), (
        f"default-src 'self'; "
        f'script-src {script_src}; '
        f'style-src {style_src}; '
        f"img-src 'self' data:; "
        f"connect-src 'self'; "
        f"frame-ancestors 'none'; "
        f"form-action 'self'"
    )


# ── JWT Helpers (Stub — Phase 4) ──────────────────────────────────


def decode_token(_token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT token (stub).

    Full JWT validation will be implemented in Phase 4.
    Currently returns ``None`` for all tokens.
    """
    return None


def create_token(_payload: dict[str, Any]) -> str:
    """Create a signed JWT token (stub).

    Full JWT creation will be implemented in Phase 4.
    """
    msg = 'JWT creation is not yet implemented'
    raise NotImplementedError(msg)
