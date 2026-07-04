"""Health monitoring — readiness and liveness checks."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine


@dataclass
class HealthStatus:
    """Result of a single health check."""

    name: str
    healthy: bool
    message: str = ''
    details: dict[str, Any] = field(default_factory=dict)


class HealthChecker:
    """Registry of health checks that can be executed on demand.

    Usage::

        checker = HealthChecker()
        checker.register('database', check_database_connection)
        results = await checker.run_all()
    """

    def __init__(self) -> None:
        self._checks: dict[str, Callable[[], Coroutine[Any, Any, HealthStatus]]] = {}

    def register(
        self,
        name: str,
        check_fn: Callable[[], Coroutine[Any, Any, HealthStatus]],
    ) -> None:
        """Register a named health check function."""
        self._checks[name] = check_fn

    async def run_all(self) -> list[HealthStatus]:
        """Execute all registered checks and return their results."""
        results: list[HealthStatus] = []
        for name, check_fn in self._checks.items():
            try:
                status = await check_fn()
            except Exception as exc:
                status = HealthStatus(
                    name=name,
                    healthy=False,
                    message=str(exc),
                )
            results.append(status)
        return results

    async def is_healthy(self) -> bool:
        """Return ``True`` only when all registered checks pass."""
        results = await self.run_all()
        return all(r.healthy for r in results)

    def to_dict(self, results: list[HealthStatus]) -> dict[str, Any]:
        """Format health results as a standard response dict."""
        return {
            'status': 'healthy' if all(r.healthy for r in results) else 'degraded',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'checks': {
                r.name: {
                    'healthy': r.healthy,
                    'message': r.message,
                    'details': r.details,
                }
                for r in results
            },
        }
