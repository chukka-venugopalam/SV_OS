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
from typing import Annotated
from uuid import uuid4

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.exceptions.handlers import register_exception_handlers
from app.middleware import (
    CorrelationIDMiddleware,
    CSRFMiddleware,
    RateLimitMiddleware,
    RequestIDMiddleware,
    RequestTimingMiddleware,
    SecurityHeadersMiddleware,
    TrustedHostsMiddleware,
)
from app.repositories import UnitOfWork
from app.startup.lifespan import lifespan

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
        lifespan=lifespan,
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

    # ── Startup Diagnostics ──────────────────────────────────────────
    logger.info(
        'startup_config',
        cors_origins=settings.CORS_ORIGINS,
        cors_origins_count=len(settings.CORS_ORIGINS),
        environment=settings.ENVIRONMENT,
        trusted_hosts=settings.TRUSTED_HOSTS,
        root_path=settings.ROOT_PATH,
        is_production=settings.is_production,
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

    app.add_middleware(  # 7. Rate limit
        RateLimitMiddleware,
    )

    app.add_middleware(  # 8. CSRF — double-submit cookie pattern
        CSRFMiddleware,
        cookie_secure=settings.is_production,
    )

    # ── Outer middleware (added last, runs first) ────────────────────

    app.add_middleware(  # 9. CORS — outermost; handles OPTIONS preflight
        #    before any inner middleware can reject it
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # Log CORS config after middleware is registered
    logger.info(
        'middleware_cors_registered',
        origins=settings.CORS_ORIGINS,
        credentials=True,
        methods='*',
        headers='*',
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

    # ── Debug Endpoints ──────────────────────────────────────────────
    # These expose runtime configuration for production debugging.
    # Disable in production by removing include_in_schema or guarding
    # with settings.is_production check if sensitive info is exposed.

    @app.get('/debug/cors', tags=['debug'], include_in_schema=False)
    async def debug_cors(request: Request) -> dict:
        """Debug endpoint: inspect current CORS configuration at runtime.

        This is intentionally gated behind ``/debug/`` so it is not
        accessible from the public API schema (``include_in_schema=False``).
        Safe for production — only exposes non-sensitive config values
        (CORS origins, environment name, trusted hosts).
        """
        request_id = getattr(request.state, 'request_id', str(uuid4()))
        return {
            'success': True,
            'message': 'CORS debug info',
            'data': {
                'cors_origins': settings.CORS_ORIGINS,
                'cors_origins_count': len(settings.CORS_ORIGINS),
                'cors_origins_type': type(settings.CORS_ORIGINS).__name__,
                'environment': settings.ENVIRONMENT,
                'is_production': settings.is_production,
                'trusted_hosts': settings.TRUSTED_HOSTS,
                'root_path': settings.ROOT_PATH,
            },
            'errors': None,
            'timestamp': datetime.now(UTC).isoformat(),
            'request_id': request_id,
        }

    # ── Database Diagnostic Endpoint ────────────────────────────────
    # Captures the exact SQLAlchemy/PostgreSQL exception that occurs
    # when running the same query AuthService.login() uses.
    # Hit GET /debug/db-check after deploying to see the actual error.

    @app.get('/debug/db-check', tags=['debug'], include_in_schema=False)
    async def debug_db_check() -> dict:
        """Diagnose database execution failures.

        Runs progressive checks:
        1. Basic connection (``SELECT 1``)
        2. Check if ``users`` table exists in information_schema
        3. Run the exact ``SELECT ... FROM users WHERE email = ?`` query
           that ``AuthService.login() / UserRepository.find_by_email()`` uses
        4. Attempt to run the query as the ``BaseRepository`` would
           (with soft-delete filter)

        Returns the full exception type and message at the first failure,
        allowing you to see the exact PostgreSQL/SQLAlchemy error.
        """
        import traceback

        from sqlalchemy import select, text

        from app.core.config import settings
        from app.core.database import async_session_factory
        from app.models.user import User

        results: list[dict] = []

        test_email = 'diagnostic@sv-os.com'

        async def run_check(name: str, sql_or_coro, is_query: bool = True) -> dict:
            """Run a check and return result or error."""
            try:
                if is_query:
                    async with async_session_factory() as session:
                        result = await session.execute(sql_or_coro)
                        rows = list(result.fetchmany(5))
                        return {
                            'check': name,
                            'status': 'PASS',
                            'result': [str(r) for r in rows],
                        }
                else:
                    result = await sql_or_coro
                    return {
                        'check': name,
                        'status': 'PASS',
                        'result': str(result),
                    }
            except Exception as e:
                tb = traceback.format_exc()
                return {
                    'check': name,
                    'status': 'FAIL',
                    'error': f'{type(e).__name__}: {e}',
                    'traceback': tb.split('\n')[-10:],
                }

        # Check 1: Basic connectivity
        results.append(
            await run_check(
                '1. Basic connection (SELECT 1)',
                text('SELECT 1'),
            )
        )

        # Check 2: Check users table exists
        results.append(
            await run_check(
                '2. Check users table exists',
                text(
                    'SELECT table_name FROM information_schema.tables '
                    "WHERE table_schema = 'public' AND table_name = 'users'"
                ),
            )
        )

        # Check 3: List all tables
        results.append(
            await run_check(
                '3. List all public tables',
                text(
                    'SELECT table_name FROM information_schema.tables '
                    "WHERE table_schema = 'public' ORDER BY table_name"
                ),
            )
        )

        # Check 4: Run the EXACT same query as find_by_email()
        # This reproduces the crash from AuthService.login()
        async def run_login_query() -> str:
            async with async_session_factory() as session:
                stmt = select(User).where(User.email == test_email)
                result = await session.execute(stmt)
                row = result.scalar_one_or_none()
                return f'Query executed. Row found: {row is not None}'

        results.append(
            await run_check(
                f'4. Exact find_by_email query (email={test_email})',
                run_login_query(),
                is_query=False,
            )
        )

        # Check 5: Run the query with soft-delete filter (as BaseRepository does)
        async def run_filtered_query() -> str:
            async with async_session_factory() as session:
                stmt = (
                    select(User).where(User.email == test_email).where(User.is_deleted.is_(False))
                )
                result = await session.execute(stmt)
                row = result.scalar_one_or_none()
                return f'Filtered query executed. Row found: {row is not None}'

        results.append(
            await run_check(
                '5. find_by_email with is_deleted filter',
                run_filtered_query(),
                is_query=False,
            )
        )

        # Check 6: Verify alembic version vs head
        async def check_alembic() -> str:
            try:
                import asyncio
                import sys
                from io import StringIO
                from pathlib import Path

                from alembic.config import Config
                from alembic.script import ScriptDirectory

                import app as app_module
                from alembic import command

                app_base = Path(app_module.__file__).resolve().parent
                alembic_ini = app_base.parent / 'alembic.ini'
                if not alembic_ini.exists():
                    alembic_ini = app_base / 'alembic.ini'

                cfg = Config(str(alembic_ini))

                # Get current revision from DB
                out = StringIO()
                old_stdout = sys.stdout
                sys.stdout = out
                try:
                    await asyncio.to_thread(command.current, cfg, verbose=True)
                finally:
                    sys.stdout = old_stdout
                current_output = out.getvalue()

                # Get head revision
                script = ScriptDirectory.from_config(cfg)
                head = script.get_current_head()

                return f'Current: {current_output.strip() or "(none)"} | Head: {head or "(none)"}'
            except Exception as e:
                return f'Alembic check failed: {type(e).__name__}: {e}'

        results.append(
            await run_check(
                '6. Alembic current vs head',
                check_alembic(),
                is_query=False,
            )
        )

        # Check 7: Attempt to create a test user (capture any insert failure)
        async def check_insert() -> str:
            from app.models.enums import UserRole
            from app.services.auth import hash_password

            async with async_session_factory() as session:
                from app.repositories.user import UserRepository

                repo = UserRepository(session)
                existing = await repo.find_by_email('diagnostic@sv-os.com')
                if existing:
                    return 'Test user already exists (cleanup: delete this user)'
                new_user = await repo.create(
                    email='diagnostic@sv-os.com',
                    username='diagnostic_user',
                    display_name='Diagnostic User',
                    password_hash=hash_password('Diagnostic123!'),
                    role=UserRole.LEARNER,
                    preferences={},
                )
                await session.commit()
                return f'Test user created: id={new_user.id}'

        # Check 8: Step 1 Table Counts
        results.append(
            await run_check(
                '8. COUNT knowledge_nodes', text('SELECT COUNT(*) FROM knowledge_nodes')
            )
        )
        results.append(await run_check('9. COUNT careers', text('SELECT COUNT(*) FROM careers')))
        results.append(
            await run_check('10. COUNT categories', text('SELECT COUNT(*) FROM categories'))
        )
        results.append(await run_check('11. COUNT projects', text('SELECT COUNT(*) FROM projects')))
        results.append(
            await run_check('12. alembic_version rows', text('SELECT * FROM alembic_version'))
        )
        results.append(
            await run_check(
                '14. Check specific node slugs',
                text(
                    'SELECT slug FROM knowledge_nodes WHERE slug IN ('
                    "'prog-basics', 'dsa-arrays-strings', 'algo-dp', 'linear-algebra')"
                ),
            )
        )
        results.append(
            await run_check(
                '13. pg_policies for content tables',
                text(
                    'SELECT tablename, policyname, roles, cmd '
                    'FROM pg_policies '
                    "WHERE tablename IN ('knowledge_nodes', 'careers', 'projects', 'categories')"
                ),
            )
        )

        # Determine overall status
        all_pass = all(r['status'] == 'PASS' for r in results)
        first_fail = next(
            (r for r in results if r['status'] == 'FAIL'),
            None,
        )

        return {
            'success': all_pass,
            'message': (
                'All database checks passed'
                if all_pass
                else f'First failure at check {first_fail["check"]}: {first_fail["error"]}'
            ),
            'data': {
                'database_url': (
                    settings.DATABASE_URL.split('@')[1]
                    if '@' in settings.DATABASE_URL
                    else settings.DATABASE_URL
                ),
                'environment': settings.ENVIRONMENT,
                'engine_echo': settings.DB_ECHO,
                'checks': results,
            },
            'errors': None if all_pass else first_fail.get('traceback', []),
            'timestamp': datetime.now(UTC).isoformat(),
            'request_id': str(uuid4()),
        }

    @app.api_route(
        '/debug/seed-database',
        methods=['GET', 'POST'],
        tags=['debug'],
        include_in_schema=False,
    )
    async def debug_seed_database(
        uow: Annotated[UnitOfWork, Depends(get_uow)],
    ) -> dict:
        """Run Phase 0 database seed script on active production database."""
        import importlib.util
        import sys
        import traceback
        from pathlib import Path

        curr = Path(__file__).resolve()
        seed_file = None
        for p in [curr, *list(curr.parents)]:
            candidate = p / 'database' / 'seed_phase0.py'
            if candidate.exists():
                seed_file = candidate
                break

        if not seed_file:
            return {
                'success': False,
                'message': 'Could not locate database/seed_phase0.py',
                'timestamp': datetime.now(UTC).isoformat(),
            }

        root_dir = seed_file.parent.parent
        if str(root_dir) not in sys.path:
            sys.path.insert(0, str(root_dir))

        try:
            spec = importlib.util.spec_from_file_location('seed_phase0', str(seed_file))
            if not spec or not spec.loader:
                raise ImportError(f'Could not load spec for {seed_file}')
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            import io
            from contextlib import redirect_stdout

            f = io.StringIO()
            with redirect_stdout(f):
                await module._main(uow.session)
            logs = f.getvalue().splitlines()
            return {
                'success': True,
                'message': (
                    'Database seeded successfully '
                    '(categories, careers, 221 nodes, requirements, projects)'
                ),
                'logs': logs[-30:],
                'timestamp': datetime.now(UTC).isoformat(),
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Seeding failed: {type(e).__name__}: {e}',
                'traceback': traceback.format_exc().splitlines()[-10:],
                'timestamp': datetime.now(UTC).isoformat(),
            }

    @app.get('/debug/projects-count', include_in_schema=False)
    async def debug_projects_count() -> dict:
        from sqlalchemy import text

        from app.core.database import async_session_factory

        async with async_session_factory() as session:
            stmt = text('SELECT slug, is_published, is_deleted FROM projects ORDER BY slug')
            res = await session.execute(stmt)
            rows = res.fetchall()
            return {
                'total_in_db': len(rows),
                'projects': [
                    {'slug': r[0], 'is_published': r[1], 'is_deleted': r[2]} for r in rows
                ],
            }

    return app


app = create_app()
