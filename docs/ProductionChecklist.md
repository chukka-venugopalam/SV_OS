# SV-OS Production Deployment Checklist

## Pre-Deployment

### Environment Variables — Backend (Render)

- [ ] `DATABASE_URL` set to Supabase PostgreSQL connection string (asyncpg driver)
- [ ] `SECRET_KEY` changed from default — generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] `ENVIRONMENT` set to `production`
- [ ] `CORS_ORIGINS` includes all frontend domains (comma-separated or JSON array)
- [ ] `LOG_LEVEL` set to `WARNING` or `INFO`
- [ ] `SENTRY_DSN` set (optional but recommended for error monitoring)
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set if using Supabase Auth

### Environment Variables — Frontend (Vercel)

- [ ] `NEXT_PUBLIC_API_URL` set to Render backend URL (e.g., `https://sv-os-api.onrender.com`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `NEXT_PUBLIC_APP_URL` set to Vercel deployment URL
- [ ] `NEXT_PUBLIC_ENVIRONMENT` set to `production`

### Localhost Audit

Verify no localhost references survive in production:

- [ ] `apps/web/src/lib/api-client.ts` — `API_URL` fallback (`http://localhost:8000`) only used when env var unset
- [ ] `apps/web/src/lib/url.ts` — base URL fallbacks only used when env vars unset
- [ ] `apps/web/src/lib/helpers.ts` — app URL fallback only used when env var unset
- [ ] `apps/api/app/core/config.py` — All defaults are dev-local; production values come from env vars
- [ ] `apps/api/app/services/ai/providers/ollama.py` — Ollama URL default is localhost (expected for local models)

## Deployment Steps

### Database

- [ ] Run Alembic migrations: `alembic upgrade head`
- [ ] Verify all 6 PostgreSQL extensions are enabled
- [ ] Seed data (optional): `bash database/scripts/seed.sh`
- [ ] Verify database connection from backend

### Backend (Render)

- [ ] Build command: `pip install uv && uv pip install --system -r apps/api/pyproject.toml`
- [ ] Start command: `cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Health check path: `/api/v1/health`
- [ ] Verify health endpoint returns 200
- [ ] Verify readiness endpoint returns 200

### Frontend (Vercel)

- [ ] Framework preset: Next.js
- [ ] Root directory: `apps/web`
- [ ] Build command: `pnpm build`
- [ ] Verify homepage loads
- [ ] Verify API connectivity (no CORS errors)

## Post-Deployment Verification

### Authentication

- [ ] Registration flow works end-to-end
- [ ] Login flow works (check browser network tab for 401/403/500)
- [ ] CORS headers present in browser (Access-Control-Allow-Origin matches frontend)
- [ ] Token refresh works after access token expiry
- [ ] Password reset flow works
- [ ] Logout clears tokens

### Core Features

- [ ] Graph exploration loads
- [ ] Career search returns results
- [ ] Learning path recommendations appear
- [ ] Health dashboard shows all engines healthy
- [ ] Notifications render
- [ ] Import/Export pages load

### Infrastructure

- [ ] `/api/v1/health` returns healthy
- [ ] `/api/v1/health/live` returns alive
- [ ] `/api/v1/health/ready` returns ready (database connected)
- [ ] Rate limiting active (test by rapid requests)
- [ ] CORS restricted to expected origins

## Security Checklist

- [ ] `SECRET_KEY` is unique, long (≥32 chars), and not the default
- [ ] `CORS_ORIGINS` restricted to specific domains (not `*`)
- [ ] `ENVIRONMENT` set to `production`
- [ ] HTTPS enabled (default with Vercel and Render)
- [ ] Database password is strong and unique
- [ ] Rate limiting configured
- [ ] JWT access tokens expire within reasonable time (default: 60 min)
- [ ] JWT refresh tokens expire within reasonable time (default: 7 days)
- [ ] `TRUSTED_HOSTS` configured for backend
- [ ] Security headers returned (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] Sentry DSN set for error monitoring (optional)

## Performance Notes

- In-memory cache only (no Redis) — each instance has its own cold cache
- No async worker queue — long operations run inline
- 19 engines initialize in dependency order at startup
- Database pool: 10 connections default, 20 overflow
