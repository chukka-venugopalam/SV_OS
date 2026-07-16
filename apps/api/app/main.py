"""SV-OS API — FastAPI Application Entry Point.

Builds and configures the FastAPI application with:
- Structured logging (structlog)
- Middleware stack (request ID, correlation ID, timing, CORS, security, compression)
- Global exception handlers
- Application lifespan (startup / shutdown)
- Versioned API router (v1)
- OpenAPI / Swagger customisation
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from structlog.stdlib import get_logger

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.exceptions.handlers import register_exception_handlers
from app.middleware import (
    CorrelationIDMiddleware,
    RateLimitMiddleware,
    RequestIDMiddleware,
    RequestTimingMiddleware,
    SecurityHeadersMiddleware,
    TrustedHostsMiddleware,
)
from app.startup.lifespan import Lifespan

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    # ── Logging ─────────────────────────────────────────────────────
    configure_logging()

    # ── App Instance ────────────────────────────────────────────────
    app = FastAPI(
        title=settings.APP_NAME,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        lifespan=Lifespan,
        docs_url='/docs' if not settings.is_production else None,
        redoc_url='/redoc' if not settings.is_production else None,
        openapi_url='/openapi.json' if not settings.is_production else None,
        root_path=settings.ROOT_PATH,
        terms_of_service='https://sv-os.com/terms',
        contact={
            'name': 'SV-OS Team',
            'url': 'https://sv-os.com',
        },
        license_info={
            'name': 'MIT',
        },
    )

    # ── Middleware Stack ─────────────────────────────────────────────
    #
    # Starlette/FastAPI middleware is an onion: the LAST middleware added
    # via add_middleware() becomes the OUTERMOST layer, processing
    # requests first.  All non-CORS middleware are added first (inner
    # layers), then CORSMiddleware is added LAST so it intercepts OPTIONS
    # preflight before any other middleware can reject the request.
    #
    # ── Inner middleware (added first, runs after CORS) ──────────────

    app.add_middleware(  # 1. Compression — compress responses
        GZipMiddleware,
        minimum_size=1000,
    )

    app.add_middleware(  # 2. Host validation — reject unknown hosts early
        TrustedHostsMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS,
        environment=settings.ENVIRONMENT,
    )

    app.add_middleware(  # 3. Security headers — set before response is finalised
        SecurityHeadersMiddleware,
        environment=settings.ENVIRONMENT,
    )

    app.add_middleware(  # 4. Request ID + logging context
        RequestIDMiddleware,
    )

    app.add_middleware(  # 5. Correlation ID — trace across service boundaries
        CorrelationIDMiddleware,
    )

    app.add_middleware(  # 6. Timing — measure request duration
        RequestTimingMiddleware,
    )

    app.add_middleware(  # 7. Rate limit — stub
        RateLimitMiddleware,
    )

    # ── Outer middleware (added last, runs first) ────────────────────

    app.add_middleware(  # 8. CORS — outermost; handles OPTIONS preflight
                         #    before any inner middleware can reject it
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # ── Exception Handlers ─────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routes ─────────────────────────────────────────────────────
    app.include_router(v1_router)

    # ── Backward-Compatible Routes ─────────────────────────────────
    # These mirror the pre-v1 endpoints for clients that have not
    # yet updated to the /api/v1/ prefix.

    @app.get('/health', tags=['infrastructure'], include_in_schema=False)
    async def legacy_health(request: Request) -> dict:
        """Backward-compatible health check (pre-v1)."""
        request_id = getattr(request.state, 'request_id', str(uuid4()))
        return {
            'success': True,
            'message': 'Service is healthy',
            'data': {
                'status': 'healthy',
                'version': settings.APP_VERSION,
                'environment': settings.ENVIRONMENT,
            },
            'errors': None,
            'timestamp': datetime.now(UTC).isoformat(),
            'request_id': request_id,
        }

    @app.get('/', tags=['infrastructure'], include_in_schema=False)
    async def legacy_root(request: Request) -> dict:
        """Backward-compatible root endpoint (pre-v1)."""
        request_id = getattr(request.state, 'request_id', str(uuid4()))
        return {
            'success': True,
            'message': 'SV-OS API',
            'data': {
                'name': settings.APP_NAME,
                'version': settings.APP_VERSION,
                'documentation': '/docs',
            },
            'errors': None,
            'timestamp': datetime.now(UTC).isoformat(),
            'request_id': request_id,
        }

    return app


app = create_app()
