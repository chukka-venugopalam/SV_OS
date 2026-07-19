"""Backward-compatibility shim — re-exports from canonical app.infrastructure.runtime.

New code should import directly from ``app.infrastructure.runtime``.
"""

from app.infrastructure.runtime import (
    PlatformRuntime,
    initialize_platform_runtime,
)

__all__ = [
    'PlatformRuntime',
    'initialize_platform_runtime',
]
