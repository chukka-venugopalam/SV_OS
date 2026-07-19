"""Runtime — platform initialization and startup status."""

from app.infrastructure.runtime.runtime import PlatformRuntime, initialize_platform_runtime

__all__ = [
    'PlatformRuntime',
    'initialize_platform_runtime',
]
