"""Base exception hierarchy for the SV-OS API.

Every custom exception extends ``AppException``, which carries
a human-readable ``message``, an HTTP ``status_code``, and an
optional list of ``errors`` (field-level error details).
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(kw_only=True)
class ErrorDetail:
    """A single error detail for field-level or general errors."""

    message: str
    field: str | None = None


class AppException(Exception):
    """Base exception for all application-level errors."""

    def __init__(
        self,
        message: str = 'An unexpected error occurred',
        status_code: int = 500,
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(self.message)


class NotFoundError(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(
        self,
        message: str = 'Resource not found',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=404, errors=errors)


class ConflictError(AppException):
    """Raised when a resource already exists (duplicate)."""

    def __init__(
        self,
        message: str = 'Resource already exists',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=409, errors=errors)


class ValidationError(AppException):
    """Raised when request data fails validation."""

    def __init__(
        self,
        message: str = 'Validation failed',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=422, errors=errors)


class UnauthorizedError(AppException):
    """Raised when authentication is required but missing or invalid."""

    def __init__(
        self,
        message: str = 'Authentication required',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=401, errors=errors)


class ForbiddenError(AppException):
    """Raised when the authenticated user lacks permission."""

    def __init__(
        self,
        message: str = 'Insufficient permissions',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=403, errors=errors)


class RateLimitedError(AppException):
    """Raised when the client has exceeded the rate limit."""

    def __init__(
        self,
        message: str = 'Too many requests',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=429, errors=errors)


class InternalError(AppException):
    """Raised for unexpected server-side errors (no stack trace leak)."""

    def __init__(
        self,
        message: str = 'An internal error occurred',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=500, errors=errors)


class ServiceUnavailableError(AppException):
    """Raised when a downstream dependency is unavailable."""

    def __init__(
        self,
        message: str = 'Service temporarily unavailable',
        errors: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=503, errors=errors)
