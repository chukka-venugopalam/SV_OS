"""Health and readiness check DTOs.

These schemas define the contract for the health check endpoints.
They are independent of the underlying health check implementation.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class HealthCheckDetail(BaseModel):
    """Result of a single health check component."""

    healthy: bool = Field(description='Whether this component is healthy')
    message: str = Field(
        default='',
        description='Status message from the component',
        examples=['Database connection is healthy'],
    )
    details: dict = Field(
        default_factory=dict,
        description='Additional component-specific details',
        examples=[{'url': 'localhost:5432'}],
    )


class HealthResponse(BaseModel):
    """Unified health check response.

    Returned by ``GET /api/v1/health``.
    """

    status: str = Field(
        description='Overall health status: healthy or degraded',
        examples=['healthy', 'degraded'],
    )
    version: str = Field(
        description='Application version',
        examples=['0.6.0'],
    )
    environment: str = Field(
        description='Deployment environment',
        examples=['development', 'production'],
    )
    checks: dict[str, HealthCheckDetail] = Field(
        description='Individual health check results keyed by component name',
    )
    timestamp: datetime = Field(
        description='ISO 8601 timestamp of the health check',
    )
