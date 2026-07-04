"""Reusable DTOs shared across all feature modules."""

from app.schemas.common.pagination import (
    CursorParams,
    CursorResponse,
    FilterParams,
    PageParams,
    PageResponse,
    SortDirection,
    SortParams,
)
from app.schemas.common.health import (
    HealthCheckDetail,
    HealthResponse,
)
from app.schemas.common.metadata import (
    APIVersion,
    Links,
    Metadata,
    ResponseMetadata,
)
from app.schemas.common.errors import (
    ErrorDetail,
    ValidationErrorItem,
    ErrorResponse,
    ValidationErrorResponse,
)

__all__ = [
    # Pagination
    'PageParams',
    'PageResponse',
    'CursorParams',
    'CursorResponse',
    'SortParams',
    'SortDirection',
    'FilterParams',
    # Health
    'HealthCheckDetail',
    'HealthResponse',
    # Metadata
    'Metadata',
    'ResponseMetadata',
    'APIVersion',
    'Links',
    # Errors
    'ErrorDetail',
    'ValidationErrorItem',
    'ErrorResponse',
    'ValidationErrorResponse',
]
