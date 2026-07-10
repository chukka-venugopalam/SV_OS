"""Startup diagnostics — validates infrastructure at boot time."""

from __future__ import annotations

from structlog.stdlib import get_logger

from app.core.config import settings
from app.telemetry.health import HealthChecker

logger = get_logger(__name__)


class Diagnostics:
    """Runs diagnostic checks during application startup.

    Non-fatal warnings are logged so operators can address
    misconfigurations without blocking boot.
    """

    def __init__(self, health_checker: HealthChecker) -> None:
        self.health_checker = health_checker

    async def run_all(self) -> list[str]:
        """Execute all diagnostic checks and return a list of warnings."""
        warnings: list[str] = []

        # Environment
        if (
            settings.ENVIRONMENT == 'production'
            and settings.SECRET_KEY == 'change-me-in-production'
        ):
            warnings.append(
                'SECRET_KEY is still set to the default value — change it in production.'
            )

        # Database URL
        if 'localhost' in settings.DATABASE_URL and settings.ENVIRONMENT == 'production':
            warnings.append('DATABASE_URL points to localhost in a non-development environment.')

        # CORS
        if '*' in settings.CORS_ORIGINS and settings.ENVIRONMENT == 'production':
            warnings.append(
                'CORS allows all origins (*) in production — restrict to specific domains.'
            )

        # Log warnings
        for warning in warnings:
            logger.warning('diagnostic_warning', message=warning)

        if not warnings:
            logger.info('diagnostics_passed', message='All startup checks passed.')

        return warnings
