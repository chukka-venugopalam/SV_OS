# Deployment Guide

This document covers deployment of SV-OS to production environments.

## Architecture Overview

```
                         ┌─────────────┐
                         │   Render     │
                         │  (Backend)   │
                         │  FastAPI +   │
                         │  Uvicorn     │
                         └──────┬──────┘
                                │
┌─────────────┐          ┌──────┴──────┐         ┌─────────────┐
│   Vercel    │◄────────►│  Supabase   │◄────────►│  PostgreSQL │
│  (Frontend) │          │  (Optional) │         │  (Database) │
│  Next.js    │          │  Auth /     │         │  16 Alpine  │
└─────────────┘          │  Storage    │         └─────────────┘
                         └─────────────┘
```

### Deployment Options

| Component | Recommended                     | Alternative                    |
| --------- | ------------------------------- | ------------------------------ |
| Frontend  | **Vercel**                      | Cloudflare Pages, Netlify      |
| Backend   | **Render (Web Service)**        | Railway, Fly.io, DigitalOcean  |
| Database  | **Supabase** (managed Postgres) | Neon, AWS RDS, Render Postgres |
| Auth      | **Built-in JWT**                | Supabase Auth (swappable)      |

## Prerequisites

### Accounts

- [Vercel](https://vercel.com) — for frontend hosting
- [Render](https://render.com) — for backend hosting
- [Supabase](https://supabase.com) — for managed PostgreSQL (optional)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/sv-os/sv-os.git
cd sv-os

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
```

---

## 1. Database — Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL**, **anon key**, and **service role key**
3. Get your database connection string from Project Settings → Database

### Run Migrations

```bash
cd apps/api

# Set DATABASE_URL to your Supabase PostgreSQL connection string
export DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:6543/postgres

# Run Alembic migrations
alembic upgrade head

# Seed data (optional)
bash ../../database/scripts/seed.sh
```

---

## 2. Backend — Render

### Create a Web Service on Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repository
3. Configure the service:

| Setting            | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Name**           | `sv-os-api`                                                            |
| **Environment**    | `Python`                                                               |
| **Build Command**  | `pip install uv && uv pip install --system -r apps/api/pyproject.toml` |
| **Start Command**  | `cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port $PORT`      |
| **Root Directory** | (leave blank — use monorepo root)                                      |

4. Add environment variables:

| Variable         | Value                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`   | `postgresql+asyncpg://...` (Supabase connection string)                       |
| `SECRET_KEY`     | Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ENVIRONMENT`    | `production`                                                                  |
| `CORS_ORIGINS`   | `https://your-app.vercel.app`                                                 |
| `LOG_LEVEL`      | `INFO`                                                                        |
| `API_RATE_LIMIT` | `100`                                                                         |

### Health Check

Render will ping `/api/v1/health` automatically. Configure a health check path in Render dashboard.

---

## 3. Frontend — Vercel

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Add New → Project
3. Import your GitHub repository
4. Configure:

| Setting              | Value        |
| -------------------- | ------------ |
| **Framework Preset** | `Next.js`    |
| **Root Directory**   | `apps/web`   |
| **Build Command**    | `pnpm build` |
| **Output Directory** | `.next`      |

5. Add environment variables:

| Variable                        | Value                            |
| ------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL`           | `https://sv-os-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key           |
| `NEXT_PUBLIC_APP_URL`           | `https://your-app.vercel.app`    |

### Monorepo Settings

Since this is a pnpm monorepo, Vercel will automatically detect and install workspace dependencies. Ensure the following settings:

- **Node.js Version**: 20.x (or higher)
- **Package Manager**: pnpm (auto-detected from `packageManager` in root `package.json`)

---

## 4. Docker Deployment (Alternative)

### Build and Run with Docker Compose

```bash
# Production build
docker compose -f docker-compose.prod.yml build

# Run
docker compose -f docker-compose.prod.yml up -d
```

### Individual Dockerfiles

**Backend:**

```bash
docker build -f Dockerfile.api -t sv-os-api .
docker run -p 8000:8000 --env-file .env sv-os-api
```

**Frontend:**

```bash
docker build -f Dockerfile.web -t sv-os-web .
docker run -p 3000:3000 --env-file apps/web/.env.local sv-os-web
```

---

## 5. CI/CD — GitHub Actions

The repository includes GitHub Actions workflows in `.github/workflows/`:

- **`ci.yml`**: Runs lint, typecheck, and test on push/PR
- **`lint.yml`**: Runs ESLint and Prettier checks

### Automatic Deployments

- **Vercel**: Automatically deploys on push to `main` (configured via Vercel Git integration)
- **Render**: Automatically deploys on push to `main` (configured via Render Git integration)

---

## 6. Post-Deployment Verification

### Health Checks

```bash
# Backend health
curl https://sv-os-api.onrender.com/api/v1/health

# Liveness probe
curl https://sv-os-api.onrender.com/api/v1/health/live

# Readiness probe (checks database)
curl https://sv-os-api.onrender.com/api/v1/health/ready
```

### Smoke Tests

1. Open the frontend URL in a browser
2. Verify the homepage loads
3. Create a test account (signup)
4. Log in with the test account
5. Verify the dashboard loads

---

## 7. Environment Variables Reference

### Backend (`apps/api/.env`)

| Variable                      | Required | Default                   | Description                                    |
| ----------------------------- | -------- | ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                | ✅       | —                         | PostgreSQL async connection string             |
| `SECRET_KEY`                  | ✅       | `change-me-in-production` | JWT signing secret (min 32 chars)              |
| `ENVIRONMENT`                 | ❌       | `development`             | `development`, `staging`, `production`, `test` |
| `CORS_ORIGINS`                | ❌       | `http://localhost:3000`   | Comma-separated allowed origins                |
| `LOG_LEVEL`                   | ❌       | `INFO`                    | `DEBUG`, `INFO`, `WARNING`, `ERROR`            |
| `SUPABASE_URL`                | ❌       | —                         | Supabase project URL                           |
| `SUPABASE_SERVICE_KEY`        | ❌       | —                         | Supabase service role key                      |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌       | `60`                      | JWT access token TTL                           |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | ❌       | `7`                       | JWT refresh token TTL                          |
| `API_RATE_LIMIT`              | ❌       | `100`                     | Requests per minute (authenticated)            |
| `API_RATE_LIMIT_ANON`         | ❌       | `20`                      | Requests per minute (anonymous)                |
| `ROOT_PATH`                   | ❌       | —                         | Path prefix behind reverse proxy               |

### Frontend (`apps/web/.env.local`)

| Variable                        | Required | Default                 | Description           |
| ------------------------------- | -------- | ----------------------- | --------------------- |
| `NEXT_PUBLIC_API_URL`           | ✅       | `http://localhost:8000` | Backend API URL       |
| `NEXT_PUBLIC_SUPABASE_URL`      | ❌       | —                       | Supabase project URL  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌       | —                       | Supabase anon key     |
| `NEXT_PUBLIC_APP_URL`           | ❌       | `http://localhost:3000` | App URL for redirects |

---

## 8. Troubleshooting

### Backend won't start

Check the logs for:

- Database connection issues — verify `DATABASE_URL` is correct
- Missing migrations — run `alembic upgrade head`
- Port conflicts — ensure port 8000 is available

### Frontend can't reach backend

- Verify `NEXT_PUBLIC_API_URL` includes the correct backend URL
- Check CORS settings — `CORS_ORIGINS` must include the frontend URL
- Ensure the backend is running and healthy

### CORS errors in browser

- Add the frontend domain to `CORS_ORIGINS` in the backend environment
- For local development: `CORS_ORIGINS=http://localhost:3000`

### Database connection fails

- Verify the connection string uses `asyncpg` driver: `postgresql+asyncpg://...`
- Check IP allowlist in Supabase (may need to allow all IPs or use a static IP)
- Ensure the database is not in pause mode (Supabase free tier)

---

## 9. Security Checklist

- [ ] `SECRET_KEY` changed from default (generate with `secrets.token_urlsafe(32)`)
- [ ] `CORS_ORIGINS` restricted to specific domains (not `*`)
- [ ] `ENVIRONMENT` set to `production`
- [ ] Database password is strong and unique
- [ ] HTTPS enabled (default with Vercel and Render)
- [ ] Rate limiting configured on auth endpoints
- [ ] Database IP restrictions applied (if using Supabase)
- [ ] JWT tokens have reasonable expiry times
