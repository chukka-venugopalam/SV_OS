"""Metadata and API information DTOs.

Provides reusable schemas for API version, response metadata,
and resource links that can be attached to any response.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime


class APIVersion(BaseModel):
    """API version information returned at the root endpoint."""

    name: str = Field(description='API name', examples=['SV-OS API'])
    description: str = Field(
        description='API description',
        examples=['Silicon Valley Learning OS — Backend API'],
    )
    version: str = Field(description='Semantic version', examples=['0.6.0'])
    environment: str = Field(
        description='Deployment environment',
        examples=['development', 'production'],
    )
    documentation: str = Field(
        description='URL to API documentation',
        examples=['/docs'],
    )
    api_version: str = Field(
        description='API version identifier',
        examples=['v1'],
    )


class Links(BaseModel):
    """Hypermedia links for HATEOAS-style responses.

    Attach to any resource response to provide discoverable actions.
    Only ``self`` is required; other links are optional.
    """

    self: str = Field(description='Link to this resource', examples=['/api/v1/nodes/python'])
    first: str | None = Field(
        default=None,
        description='Link to first page',
        examples=['/api/v1/nodes?page=1'],
    )
    prev: str | None = Field(
        default=None,
        description='Link to previous page',
        examples=['/api/v1/nodes?page=1'],
    )
    next: str | None = Field(
        default=None,
        description='Link to next page',
        examples=['/api/v1/nodes?page=3'],
    )
    last: str | None = Field(
        default=None,
        description='Link to last page',
        examples=['/api/v1/nodes?page=10'],
    )


class Metadata(BaseModel):
    """Flexible metadata container for embedding in responses.

    Carries contextual information about the response that doesn't
    belong in the data payload itself.
    """

    generated_at: datetime = Field(
        description='When this response was generated',
    )
    version: str = Field(
        default='0.6.0',
        description='API version that generated this response',
        examples=['0.6.0'],
    )


class ResponseMetadata(BaseModel):
    """Extended response metadata with timing and pagination."""

    timestamp: datetime = Field(
        description='ISO 8601 timestamp of the response',
    )
    request_id: str = Field(
        description='Unique identifier for the request (for tracing)',
        examples=['req_abc123'],
    )
    version: str = Field(
        default='0.6.0',
        description='API version',
        examples=['0.6.0'],
    )
