"""Dependency injection container — holds registries, event bus, cache."""

from app.infrastructure.container.container import (
    PlatformContainer,
    build_platform_container,
    get_platform_container,
)

__all__ = [
    'PlatformContainer',
    'build_platform_container',
    'get_platform_container',
]
