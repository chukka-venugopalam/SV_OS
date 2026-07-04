"""Error response DTOs.

Defines the contract for all error responses returned by the API.
Every error response follows the same structure regardless of
the error type or source.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """A single error message, optionally scoped to a specific field."""

    message: str = Field(
        description='Human-readable error description',
        examples=['Email already registered', 'Resource not found'],
    )
    field: str | None = Field(
        default=None,
        description='The field that caused the error (null for general errors)',
        examples=['email', 'username', 'password'],
    )


class ValidationErrorItem(BaseModel):
    """A single validation error on a specific field.

    More detailed than ``ErrorDetail`` — includes the rejected value
    and the validation rule that failed.
    """

    field: str = Field(
        description='Path to the field that failed validation',
        examples=['body.email', 'query.per_page'],
    )
    message: str = Field(
        description='Human-readable validation message',
        examples=['Value is not a valid email address'],
    )
    value: str | None = Field(
        default=None,
        description='The rejected value',
        examples=['not-an-email'],
    )
    rule: str | None = Field(
        default=None,
        description='The validation rule that failed',
        examples=['email', 'min_length', 'pattern'],
    )


class ErrorResponse(BaseModel):
    """Standard error response envelope.

    Returned for 4xx and 5xx responses.  The ``errors`` list carries
    field-level details when available, or a single general error.
    """

    success: bool = Field(default=False, description='Always false for errors')
    message: str = Field(
        description='Human-readable error summary',
        examples=['Resource not found', 'Validation failed'],
    )
    data: None = Field(default=None, description='Always null for errors')
    errors: list[ErrorDetail] | None = Field(
        default=None,
        description='Field-level error details (null for general errors)',
    )
    timestamp: str = Field(
        description='ISO 8601 timestamp',
        examples=['2026-07-01T12:00:00+00:00'],
    )
    request_id: str = Field(
        description='Request identifier for tracing',
        examples=['req_abc123'],
    )


class ValidationErrorResponse(BaseModel):
    """Validation error response with detailed field errors.

    Returned when request data fails Pydantic validation.
    """

    success: bool = Field(default=False, description='Always false for errors')
    message: str = Field(default='Request validation failed')
    data: None = Field(default=None)
    errors: list[ValidationErrorItem] = Field(
        description='Detailed validation errors per field',
    )
    timestamp: str = Field(
        description='ISO 8601 timestamp',
    )
    request_id: str = Field(
        description='Request identifier for tracing',
    )
