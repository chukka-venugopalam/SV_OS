# SV-OS — Backend Architecture

## Overview

The backend is a **FastAPI** application following **Clean Architecture** principles with a **Service-Repository** pattern. The API is versioned (`/api/v1/`). Request validation uses Pydantic. Response format follows a strict contract: every response includes `success`, `message`, `data`, `errors`, `timestamp`, and `request_id`.

---

## Project Structure

```text
apps/api/
├── app/
│   ├── __init__.py
│   ├── main.py                        — FastAPI application factory
│   ├── api/
│   │   ├── deps.py                    — Dependency injection (DB, settings, context)
│   │   ├── v1/
│   │   │   ├── router.py              — Versioned router, health endpoints
│   │   │   └── endpoints/             — Business route modules (Phase 3+)
│   ├── core/
│   │   ├── config.py                  — Pydantic Settings (env loading, validation)
│   │   ├── database.py                — Async engine, session, Base, health checks
│   │   └── logging.py                 — Structured logging (structlog)
│   ├── middleware/
│   │   ├── request_id.py              — Unique request ID per request
│   │   ├── correlation_id.py          — Trace-wide correlation ID
│   │   ├── request_timing.py          — Request duration measurement
│   │   ├── security.py                — Security HTTP headers
│   │   ├── trusted_hosts.py           — Host header validation
│   │   └── rate_limit.py              — Rate limiting (stub)
│   ├── exceptions/
│   │   ├── base.py                    — AppException hierarchy (404, 409, 422, etc.)
│   │   └── handlers.py                — Global exception handlers
│   ├── schemas/
│   │   └── response.py                — APIResponse, ErrorDetail, PaginatedData
│   ├── services/                      — Business logic layer (Phase 3+)
│   ├── repositories/
│   │   ├── base.py                    — BaseRepository[T] (CRUD, pagination)
│   │   └── __init__.py
│   ├── models/                        — SQLAlchemy models (Phase 2.4+)
│   ├── utils/
│   │   ├── pagination.py              — PaginationParams, Page, paginate()
│   │   ├── response.py                — success_response(), error_response()
│   │   ├── uuid_utils.py              — new_uuid(), is_valid_uuid()
│   │   ├── date_utils.py              — utc_now(), format_iso(), parse_iso()
│   │   ├── context.py                 — DatabaseTransaction, timer()
│   │   └── security_utils.py          — Password validation, CSP helpers
│   ├── telemetry/
│   │   ├── health.py                  — HealthChecker, HealthStatus
│   │   ├── metrics.py                 — MetricsCollector (stub)
│   │   ├── tracing.py                 — Tracer (stub)
│   │   └── performance.py             — PerformanceTimer
│   └── startup/
│       ├── lifespan.py                — Application lifecycle (startup/shutdown)
│       └── diagnostics.py             — Startup diagnostics
└── tests/
    ├── conftest.py                    — pytest fixtures (app, client)
    ├── test_health.py                 — Health endpoint tests (17 tests)
    └── factories/                     — Test data factories (Phase 3+)
```

---

## Architecture Layers

```
┌────────────────────────────────────────────────────────────┐
│           HTTP Layer (FastAPI Routes + Middleware)         │
│  Middleware stack:                                         │
│    1. CORSMiddleware     — CORS preflight                  │
│    2. GZipMiddleware     — Response compression            │
│    3. TrustedHosts       — Host header validation          │
│    4. SecurityHeaders    — Secure HTTP headers             │
│    5. RequestID          — Unique request ID               │
│    6. CorrelationID      — Trace-wide correlation ID       │
│    7. RequestTiming      — Duration measurement            │
│    8. RateLimit          — Rate limiting (stub)            │
│  Routes validate input, call services, return responses.   │
├────────────────────────────────────────────────────────────┤
│                    Service Layer                           │
│  Contains all business rules, orchestrates repositories.   │
│  NO direct database access.                                │
├────────────────────────────────────────────────────────────┤
│                Repository Layer                            │
│  Abstracts database operations. One repository per entity. │
│  All inherit from BaseRepository[T].                       │
├────────────────────────────────────────────────────────────┤
│                 Database Layer                             │
│  SQLAlchemy 2.0+ async ORM, Alembic migrations, sessions. │
└────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Endpoints

| Endpoint                | Method | Purpose                                     | Implemented |
| ----------------------- | ------ | ------------------------------------------- | ----------- |
| `/api/v1/`              | GET    | API metadata (name, version, docs link)     | ✅          |
| `/api/v1/health`        | GET    | Unified health check with dependency status | ✅          |
| `/api/v1/health/live`   | GET    | Liveness probe (minimal)                    | ✅          |
| `/api/v1/health/ready`  | GET    | Readiness probe (checks database)           | ✅          |
| `/api/v1/health/checks` | GET    | Detailed health check results               | ✅          |
| `/health`               | GET    | Legacy backward-compatible health           | ✅          |
| `/`                     | GET    | Legacy backward-compatible root             | ✅          |

---

## Universal API Response Format

Every API response — success or error — follows this exact contract:

```json
{
    "success": true,
    "message": "Node retrieved successfully",
    "data": { ... },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

### Response Schema

```python
class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: T | None = None
    errors: list[ErrorDetail] | None = None
    timestamp: datetime
    request_id: str

class ErrorDetail(BaseModel):
    field: str | None = None
    message: str

class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int
```

---

## Exception Hierarchy

```
AppException (base)
├── NotFoundError          — 404
├── ConflictError          — 409
├── ValidationError        — 422
├── UnauthorizedError      — 401
├── ForbiddenError         — 403
├── RateLimitedError       — 429
├── InternalError          — 500
└── ServiceUnavailableError — 503
```

All exceptions are caught by global handlers that return the standard error response format with no stack trace leakage.

---

## Dependency Injection (`app/api/deps.py`)

```python
async def get_db() -> AsyncSession          # Database session
async def get_settings() -> Settings         # Application config
async def get_request_context() -> RequestContext  # Request metadata
async def get_base_repository() -> BaseRepository  # Repository (stub)
```

---

## Database Infrastructure

- **Engine**: Async SQLAlchemy with asyncpg driver
- **Session**: `async_sessionmaker` with `expire_on_commit=False`
- **Base**: `DeclarativeBase` for all models
- **Health**: `check_database_connection()` + `get_database_health()`
- **Transaction**: `DatabaseTransaction` context manager
- **Migrations**: Alembic configured for async URL

---

## Logging

Configured via `app/core/logging.py` using structlog:

- **Development**: Coloured console output via `ConsoleRenderer`
- **Production**: JSON output via `JSONRenderer`
- **Auto-detect**: Checks `sys.stderr.isatty()` to choose format
- **Context**: Request ID and correlation ID bound via `structlog.contextvars`
- **Rotation**: Handler can be replaced with `RotatingFileHandler`

```python
logger.info(
    "request_completed",
    method=request.method,
    path=str(request.url.path),
    status_code=response.status_code,
    duration_ms='45.23',
    request_id='abc-123',
)
```

---

## Security

- **Headers**: X-Content-Type-Options, X-Frame-Options, CSP, HSTS (production)
- **CORS**: Configurable origins from settings
- **Host validation**: Trusted hosts middleware
- **Input validation**: Pydantic schemas
- **Secret handling**: Environment variables, validated at startup
- **Rate limiting**: Interface ready, stub implementation

---

## Rate Limiting (Stub)

The `RateLimitMiddleware` is registered but passes all requests through without limiting. The settings define:

- `API_RATE_LIMIT`: 100 req/min (authenticated)
- `API_RATE_LIMIT_ANON`: 20 req/min (anonymous)
- `GRAPH_RATE_LIMIT`: 30 req/min (graph endpoints)

---

## Graph Traversal (Recursive CTEs)

See `database/schema.sql` for the full SQL definitions. The graph uses relational adjacency list with recursive CTEs (not Neo4j).

---

## Caching Strategy

- Cache TTL: 300 seconds (configurable)
- Cache max size: 1000 entries (configurable)
- Actual cache implementation pending (Phase 3+)
