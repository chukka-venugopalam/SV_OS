"""Reusable DTOs shared across all feature modules."""

from app.schemas.common.errors import (
    ErrorDetail,
    ErrorResponse,
    ValidationErrorItem,
    ValidationErrorResponse,
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
from app.schemas.common.pagination import (
    CursorParams,
    CursorResponse,
    FilterParams,
    PageParams,
    PageResponse,
    SortDirection,
    SortParams,
)

__all__ = [
    'APIVersion',
    'CursorParams',
    'CursorResponse',
    # Errors
    'ErrorDetail',
    'ErrorResponse',
    'FilterParams',
    # Health
    'HealthCheckDetail',
    'HealthResponse',
    'Links',
    # Metadata
    'Metadata',
    # Pagination
    'PageParams',
    'PageResponse',
    'ResponseMetadata',
    'SortDirection',
    'SortParams',
    'ValidationErrorItem',
    'ValidationErrorResponse',
]
