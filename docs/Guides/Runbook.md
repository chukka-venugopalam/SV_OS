# SV-OS Production Runbook

## Service Overview

| Service  | Platform          | Port | Health Check           |
| -------- | ----------------- | ---- | ---------------------- |
| API      | Render / Docker   | 8000 | `/api/v1/health`       |
| Web      | Vercel / Docker   | 3000 | N/A (frontend)         |
| Database | Supabase / Docker | 5432 | `/api/v1/health/ready` |

## Startup Sequence

1. Database starts and becomes healthy
2. API waits for database (up to 30s with retries)
3. API runs diagnostics (checks SECRET_KEY, DATABASE_URL, CORS_ORIGINS)
4. API initializes 19 engines in dependency order
5. API starts all engines
6. API becomes ready (`/api/v1/health/ready` returns healthy)
7. Frontend can now make API calls

## Monitoring

### Health Endpoints

- `/api/v1/health` — Overall system health (all checks)
- `/api/v1/health/live` — Liveness probe (process alive)
- `/api/v1/health/ready` — Readiness probe (database connected)
- `/api/v1/health/checks` — Detailed check results

### Health Checks Registered

| Check             | What it tests         | Healthy when                    |
| ----------------- | --------------------- | ------------------------------- |
| `database`        | PostgreSQL connection | SELECT 1 succeeds               |
| `cache`           | In-memory cache       | Always healthy (memory backend) |
| `engine_registry` | Engine registration   | All 19 engines registered       |
| `event_bus`       | Event bus             | Event bus initialized           |

## Common Operations

### Restart API

```bash
# Render: Dashboard → Service → Manual Deploy
# Docker: docker compose -f docker-compose.prod.yml restart api
```

### Run Database Migrations

```bash
cd apps/api
alembic upgrade head
```

### Roll Back Migration

```bash
cd apps/api
alembic downgrade -1
```

### View Logs

```bash
# Render: Dashboard → Service → Logs
# Docker: docker compose -f docker-compose.prod.yml logs -f api
```

## Incident Response

### API won't start

1. Check `DATABASE_URL` is correct
2. Check `SECRET_KEY` is not the default
3. Check migrations are up to date
4. View startup logs for diagnostics warnings

### Login failing

1. Check browser network tab — look for 403 (CSRF) or 401 (auth) or 0 (CORS)
2. Verify `NEXT_PUBLIC_API_URL` points to backend
3. Verify `CORS_ORIGINS` includes frontend domain
4. Check backend logs for authentication errors

### Database connection errors

1. Verify Supabase IP allowlist
2. Check connection string uses `asyncpg` driver
3. Verify database is not paused (Supabase free tier)
