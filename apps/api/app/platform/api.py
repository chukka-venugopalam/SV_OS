"""Backward-compatibility shim — re-exports the platform status router from infrastructure.

New code should import directly from ``app.infrastructure.runtime.status_api``.
"""

from app.infrastructure.runtime.status_api import router  # noqa: F401
