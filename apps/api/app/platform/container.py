"""Backward-compatibility shim — re-exports from canonical app.infrastructure.container.

New code should import directly from ``app.infrastructure.container``.
"""

from app.infrastructure.container import (
    PlatformContainer,
    build_platform_container,
    get_platform_container,
)

__all__ = [
    'PlatformContainer',
    'build_platform_container',
    'get_platform_container',
]
