# SV-OS Deployment Guide

> **Deployment procedures for all environments** | **Date**: July 22, 2026

---

## Environments

| Environment     | Purpose                   | URL                 | Infrastructure |
| --------------- | ------------------------- | ------------------- | -------------- |
| **Development** | Local development         | `localhost:3000`    | Docker Compose |
| **Testing**     | Automated tests           | CI ephemeral        | GitHub Actions |
| **Staging**     | Pre-production validation | `staging.sv-os.com` | Docker + Cloud |
| **Production**  | Live application          | `sv-os.com`         | Docker + Cloud |

---

## Development Deployment

### Prerequisites

```bash
# Required tools
node >= 20.0.0
pnpm >= 9.0.0
python >= 3.12
docker >= 24.0
docker-compose >= 2.20
```

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/sv-os/sv-os.git
cd sv-os
pnpm install

# 2. Start database
docker compose up -d postgres  # Starts PostgreSQL on port 5432

# 3. Run migrations
cd apps/api
cp .env.example .env  # Edit if needed
python -m venv .venv
.venv/Scripts/activate
pip install -e ".[dev]"
python -m alembic upgrade head

# 4. Seed data
cd ../..
./database/scripts/seed.sh

# 5. Start applications
pnpm dev  # Starts API (port 8000) + Web (port 3000)
```

### Docker Development

```bash
# Start all services
docker compose up -d

# Start with pgAdmin
docker compose --profile tools up -d

# Rebuild after dependency changes
docker compose build --no-cache
```

---

## Testing Environment (CI)

The CI environment is ephemeral — created for each PR and destroyed after.

```yaml
# .github/workflows/ci.yml (relevant section)
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: svos
      POSTGRES_PASSWORD: svos_dev_password
      POSTGRES_DB: svos
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### CI Pipeline Steps

```mermaid
graph LR
    CHECKOUT[Checkout] --> PNPM[pnpm Setup]
    PNPM --> PYTHON[Python Setup]
    PYTHON --> INSTALL_DEPS[Install Dependencies]
    INSTALL_DEPS --> TYPECHECK[TypeScript Check]
    TYPECHECK --> LINT[Lint]
    LINT --> BUILD[Build]
    BUILD --> TEST[Backend Tests]
    TEST --> DOCKER_BUILD[Docker Build]
```

---

## Staging Deployment

### Architecture

```
┌──────────────────┐
│   Load Balancer   │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   API Instance    │
│   (single node)   │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   PostgreSQL 16   │
│   (single node)   │
└──────────────────┘
```

### Deployment Steps

```bash
# 1. Build and push Docker images
docker build -f Dockerfile.api -t sv-os-api:staging .
docker build -f Dockerfile.web -t sv-os-web:staging .

# 2. Deploy with staging compose
docker compose -f docker-compose.prod.yml up -d

# 3. Run database migrations
docker exec sv-os-api alembic upgrade head

# 4. Smoke test
curl http://localhost:8000/api/v1/health
curl http://localhost:3000
```

---

## Production Deployment

### Architecture

```mermaid
graph TB
    subgraph "Cloudflare / CDN"
        CF[Cloudflare DNS + CDN]
        WAF[WAF Rules]
    end

    subgraph "Load Balancer"
        LB[NGINX / Cloudflare LB]
    end

    subgraph "Application Tier"
        API1[API Container 1]
        API2[API Container 2]
        WEB1[Web Container 1]
        WEB2[Web Container 2]
    end

    subgraph "Cache Tier"
        REDIS[Redis Cluster]
    end

    subgraph "Database Tier"
        PG_PRI[PostgreSQL Primary]
        PG_REP[PostgreSQL Read Replica]
    end

    subgraph "Monitoring"
        SENTRY[Sentry]
        GRAFANA[Grafana]
        PROM[Prometheus]
    end

    CF --> LB
    LB --> API1
    LB --> API2
    WEB1 --> API1
    WEB2 --> API2
    API1 --> REDIS
    API2 --> REDIS
    API1 --> PG_PRI
    API2 --> PG_REP
    API1 --> SENTRY
    API1 --> PROM
    PROM --> GRAFANA
```

### Production Configuration

```yaml
# docker-compose.prod.yml (key settings)
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U svos -d svos']

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: always
    ports:
      - '8000:8000'
    environment:
      DATABASE_URL: postgresql+asyncpg://svos:${POSTGRES_PASSWORD}@postgres:5432/svos
      ENVIRONMENT: production
      LOG_LEVEL: INFO
      CORS_ORIGINS: ${CORS_ORIGINS}

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    restart: always
    ports:
      - '3000:3000'
    environment:
      NEXT_PUBLIC_API_URL: http://api:8000
```

### Environment Variables (Production)

```bash
# Required (no defaults)
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=<64-char-random-string>
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
CORS_ORIGINS=https://sv-os.com

# Optional (with production-safe defaults)
ENVIRONMENT=production
LOG_LEVEL=INFO
API_RATE_LIMIT=100
CACHE_TTL_SECONDS=300
SENTRY_DSN=https://...
```

---

## Vercel Deployment (Frontend)

Vercel is the recommended platform for deploying the Next.js frontend independently.

### Architecture

```
┌───────────────────┐
│   Vercel Edge CDN  │
│   (global cache)    │
└────────┬──────────┘
         │
┌────────▼──────────┐
│   Vercel Serverless │
│   - Static export   │
│   - API routes      │
│   - ISR revalidation│
└────────┬──────────┘
         │
┌────────▼──────────┐
│   Backend API      │
│   (Render / Docker) │
└───────────────────┘
```

### Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build:web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.sv-os.com/api/v1/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Environment Variables (Vercel)

```bash
# Project Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://api.sv-os.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
NEXT_PUBLIC_APP_URL=https://sv-os.com
```

### Deployment Steps

```bash
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Link project
vercel link --project sv-os-web

# 3. Deploy preview (for PRs — auto-configured via GitHub integration)
git push origin feature/my-feature

# 4. Deploy production
vercel --prod

# 5. Verify
get https://sv-os.com/api/health-proxy
```

### Monorepo Configuration

Vercel requires explicit monorepo settings:

```bash
# Root vercel.json for monorepo
{
  "projects": {
    "apps/web": {
      "framework": "nextjs",
      "rootDirectory": "apps/web"
    }
  }
}
```

**Root Directory**: Set to `apps/web` in Vercel project settings or use the root-level `vercel.json`.  
**Build Command**: `pnpm build:web` (runs Turbo pipeline for web only).

### Preview Deployments

Every PR automatically gets a preview deployment:

| Event             | Deployment Type    | URL Pattern                        |
| ----------------- | ------------------ | ---------------------------------- |
| PR opened         | Preview            | `pr-123.sv-os-web.vercel.app`      |
| PR updated        | Preview update     | Same URL, redeployed               |
| PR merged to main | Production         | `sv-os.com`                        |
| Branch deploy     | Preview (optional) | `branch-name.sv-os-web.vercel.app` |

---

## Render Deployment (Backend)

Render is the recommended platform for deploying the FastAPI backend.

### Architecture

```
┌───────────────────────┐
│     Render Web Service  │
│   - FastAPI (Uvicorn)   │
│   - Docker container    │
└────────┬──────────────┘
         │
┌────────▼──────────────┐
│   Render PostgreSQL     │
│   - Managed database    │
│   - Automated backups   │
│   - 256 MB RAM (starter)│
└───────────────────────┘
```

### Configuration

```yaml
# render.yaml (Infrastructure as Code)
services:
  - type: web
    name: sv-os-api
    env: docker
    dockerfilePath: Dockerfile.api
    repo: https://github.com/sv-os/sv-os
    branch: main
    healthCheckPath: /api/v1/health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: sv-os-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ENVIRONMENT
        value: production
      - key: LOG_LEVEL
        value: INFO
      - key: CORS_ORIGINS
        value: https://sv-os.com
      - key: API_RATE_LIMIT
        value: '100'
    domains:
      - api.sv-os.com

databases:
  - name: sv-os-db
    plan: starter
    databaseName: svos
    user: svos
    ipAllowList:
      - source: 0.0.0.0/0
        description: everywhere
```

### Deployment Steps

```bash
# 1. Push Dockerfile.api to repo (already done)
# 2. Connect GitHub repo to Render
#    - New Blueprint → Select repo → Use render.yaml
# 3. Configure custom domain
#    - Settings → Custom Domain → api.sv-os.com
# 4. Set DNS
#    - Add CNAME record pointing to render.com
# 5. Initial deployment (automatic)
# 6. Verify
curl https://api.sv-os.com/api/v1/health
```

### Environment Variables (Render)

| Variable       | Source            | Notes                                |
| -------------- | ----------------- | ------------------------------------ |
| `DATABASE_URL` | Render PostgreSQL | Auto-populated from database service |
| `SECRET_KEY`   | Manual / Generate | Must be 64+ character random string  |
| `ENVIRONMENT`  | Manual            | `production`                         |
| `LOG_LEVEL`    | Manual            | `INFO`                               |
| `CORS_ORIGINS` | Manual            | Frontend domain                      |
| `SENTRY_DSN`   | Optional          | Error tracking                       |

### Blue-Green Deployments on Render

Render natively supports blue-green deployments:

1. A new service is provisioned alongside the current one
2. Traffic is switched once the new service passes health checks
3. The old service is terminated after a configurable drain period
4. **Rollback**: Immediate — switch back to the previous version in Render dashboard

### Render-Specific Considerations

| Consideration         | Details                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| **Free tier sleep**   | Free tier web services spin down after inactivity (not suitable for prod) |
| **Docker build time** | First build can take 5-15 minutes; use cache                              |
| **Database backup**   | Render Pro includes daily automated backups                               |
| **Custom domain**     | Requires Render paid plan for custom domain + SSL                         |
| **Logging**           | Render captures stdout; forward to Papertrail/Sentry for retention        |

---

## Blue-Green Deployment

```mermaid
sequenceDiagram
    participant LB as Load Balancer
    participant BLUE as Blue (current)
    participant GREEN as Green (new)
    participant DB as Database

    Note over BLUE,DB: Blue is serving traffic
    LB->>BLUE: All traffic

    Note over GREEN: Deploy new version
    GREEN->>DB: Run migrations (backward-compatible)

    Note over GREEN: Health check
    GREEN->>GREEN: Validate health endpoints

    LB->>GREEN: Switch 10% traffic (canary)
    Note over LB: Monitor for 15 minutes

    LB->>GREEN: 100% traffic
    LB->>BLUE: 0% traffic (drain)

    Note over BLUE: Keep for rollback
```

### Rollback Procedure

```bash
# If deployment fails:
# 1. Switch load balancer back to blue
# 2. Run rollback migration
docker exec sv-os-api alembic downgrade -1
# 3. Investigate failure cause
# 4. Fix and redeploy
```

---

## Monitoring & Observability

### Health Checks

```python
# Endpoints:
GET /api/v1/health           # Overall status
GET /api/v1/health/live      # Liveness (is process alive?)
GET /api/v1/health/ready     # Readiness (can accept traffic?)
GET /api/v1/health/checks    # Detailed component status

# Registered checks (in router.py):
- database (PostgreSQL connection)
- cache (in-memory cache)
- engine_registry (all engines registered and healthy)
- event_bus (subscriber count)
```

### Metrics to Monitor

| Metric                  | Source          | Alert Threshold |
| ----------------------- | --------------- | --------------- |
| API response time (p95) | Prometheus      | > 500ms         |
| Error rate              | Sentry          | > 1%            |
| Database connections    | PostgreSQL      | > 80% of pool   |
| Disk usage              | Infrastructure  | > 80%           |
| Memory usage            | Docker          | > 80%           |
| CPU usage               | Docker          | > 80% for 5 min |
| Uptime                  | Health endpoint | < 99.9%         |

### Logging

```python
# Structured JSON logging in production
LOG_FORMAT=json  # Machine-readable for log aggregation

# Log aggregation (future):
# - Send logs to stdout (Docker best practice)
# - Collect with Loki or ELK stack
# - Search and alert via Grafana
```

---

## Database Operations

### Migration Commands

```bash
# Create new migration
cd apps/api
.venv/Scripts/python -m alembic revision --autogenerate -m "description"

# Apply migrations
.venv/Scripts/python -m alembic upgrade head

# Rollback
.venv/Scripts/python -m alembic downgrade -1   # One step
.venv/Scripts/python -m alembic downgrade base  # All the way
```

### Backup & Restore

```bash
# Automated backup script
./database/scripts/backup.sh

# Manual backup
pg_dump -U svos -d svos -F custom -f backup_$(date +%Y%m%d).dump

# Restore
./database/scripts/restore.sh backup_file.dump
```

---

## Recovery Plan

### Incident Response

| Severity | Example                              | Response Time | Actions                                   |
| -------- | ------------------------------------ | ------------- | ----------------------------------------- |
| Critical | Service down, data loss              | < 15 min      | Alert team, rollback, restore from backup |
| High     | Feature broken, performance degraded | < 1 hour      | Rollback, fix staging, deploy             |
| Medium   | Non-critical bug                     | < 24 hours    | Schedule fix in next sprint               |
| Low      | Cosmetic issue                       | < 1 week      | Track in backlog                          |

### Disaster Recovery

```bash
# 1. Restore database from latest backup
./database/scripts/restore.sh latest_prod_backup.dump

# 2. Rebuild and deploy API
docker compose -f docker-compose.prod.yml up -d api

# 3. Rebuild and deploy Web
docker compose -f docker-compose.prod.yml up -d web

# 4. Verify health
curl http://localhost:8000/api/v1/health
curl http://localhost:3000

# Estimated RTO: 30 minutes
# Estimated RPO: 1 hour (backup interval)
```

---

_Cross-reference: [SECURITY_GUIDE.md](./SECURITY_GUIDE.md), [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)_
