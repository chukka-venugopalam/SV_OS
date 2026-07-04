# SV-OS API — Backend

The Silicon Valley Learning OS backend API, built with **FastAPI**, **Python 3.12**, **SQLAlchemy** (async), **PostgreSQL**, and **Alembic**.

## Getting Started

### Prerequisites

- Python >= 3.12
- PostgreSQL 16
- uv (recommended) or pip

### Setup

```bash
cd apps/api

# Create a virtual environment
uv venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# Install dependencies
uv pip install -r pyproject.toml

# For development dependencies
uv pip install -r pyproject.toml --extra dev
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` with your database credentials.

### Database

Start PostgreSQL (via Docker):

```bash
docker compose up -d postgres
```

Run migrations:

```bash
alembic upgrade head
```

Seed data (optional):

```bash
../../database/scripts/seed.sh
```

### Development

```bash
uvicorn app.main:app --reload --port 8000
```

API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### Test

```bash
pytest
```

With coverage:

```bash
coverage run -m pytest && coverage report
```

## Project Structure

```
app/
├── api/            # FastAPI routers and dependencies
│   └── v1/         # Version 1 endpoints
├── core/           # Configuration, database, logging
├── exceptions/     # Exception classes and handlers
├── middleware/     # Request middleware (CORS, security, timing)
├── models/         # SQLAlchemy ORM models
├── repositories/   # Data access layer
├── schemas/        # Pydantic DTOs
├── services/       # Business logic layer
├── startup/        # Application lifecycle
├── telemetry/      # Health, metrics, tracing
└── utils/          # Shared utilities

tests/              # Test suite
alembic/            # Database migrations
```

## Architecture

```
Client → FastAPI → Middleware → Router → Service → Repository → Database
                              ↘ Exception Handlers
```

- **Services** contain all business logic
- **Repositories** handle data access via SQLAlchemy
- **Endpoints** are thin controllers delegating to services
- **Unit of Work** manages transactions across repositories

## Related

- [Web README](../web/README.md)
- [Project README](../../README.md)
