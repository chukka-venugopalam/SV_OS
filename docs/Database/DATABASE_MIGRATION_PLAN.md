# SV-OS Database Migration Plan — Render PostgreSQL Replacement

> **Date**: July 25, 2026 | **Status**: Plan
> **Current provider**: Render (free tier — being discontinued)
> **Target provider**: **Neon** (recommended) or **Supabase** (alternative)

---

## 1. Provider Comparison Summary

### Evaluation Criteria

| Factor                   | Weight | Why                                                   |
| ------------------------ | ------ | ----------------------------------------------------- |
| Always-on behavior       | High   | SV-OS is a learning platform; cold starts degrade UX  |
| Free tier viability      | High   | Project is pre-revenue; need free tier to continue    |
| PostgreSQL compatibility | High   | Must work with SQLAlchemy 2.0 async, FastAPI, Alembic |
| Storage (min 500MB)      | Medium | 40-node graph + schema = ~50MB target                 |
| Connection limits        | Medium | Dev usage: 5-10 concurrent connections                |
| Vercel compatibility     | Medium | Frontend deploys on Vercel                            |
| Migration ease           | Medium | Must support pg_dump/pg_restore                       |
| Production upgrade path  | Low    | Can be solved later when funded                       |

### Final Comparison

| Provider       | Free Tier     | Always-on?                           | Storage         | Connection Limit         | Migration Ease                    | Verdict                       |
| -------------- | ------------- | ------------------------------------ | --------------- | ------------------------ | --------------------------------- | ----------------------------- |
| **Neon**       | ✅ Permanent  | ✅ Autoscale to zero (no cold start) | 0.5GB           | 100 connections          | ⭐ Excellent — pg_dump compatible | ⭐ **RECOMMENDED**            |
| Supabase       | ✅ Permanent  | ❌ Sleep after 1 week (cold start)   | 500MB           | 15 connections           | Good — pg_dump compatible         | 🥈 Alternative                |
| Aiven          | ✅ Permanent  | ✅ Always-on                         | 1GB             | 3 connections (dev only) | Good — standard PostgreSQL        | ⚠️ 3-connection limit too low |
| Railway        | ❌ Trial only | ❌ Usage-based                       | N/A ($5 credit) | N/A                      | Good                              | ❌ No free tier               |
| Crunchy Bridge | ❌ Paid only  | ✅ Always-on                         | N/A             | N/A                      | Excellent                         | ❌ No free tier               |

### Recommendation: **Neon**

**Reasons**:

1. **Autoscale to zero** — Unlike Supabase (which sleeps after 1 week), Neon's compute can scale to zero and resume on demand in ~500ms. This means no cold-start delay when a user visits after a break.
2. **Branching** — Industry-leading database branching (Git-like workflow). Create a branch for staging/testing without affecting production. Transformative for the 5-stage development workflow.
3. **100 connections** — Generous for a free tier. More than enough for SV-OS's current needs.
4. **pg_dump compatible** — Migration from Render is straightforward. No proprietary extensions to work around.
5. **SQLAlchemy 2.0 + async** — Fully compatible with existing `asyncpg`-based connection.
6. **Serverless-friendly** — Pooler support (port 5432 vs 6543) for Vercel/Edge function compatibility.
7. **FastAPI compatible** — Standard PostgreSQL connection string. No SDK changes needed.

### Alternative: Supabase (Choose if you want Auth + Realtime)

**When to choose Supabase instead**:

- If you want to replace custom JWT auth with Supabase Auth (reduces auth code)
- If you need real-time subscriptions (Supabase Realtime)
- If you want a managed backend with storage and edge functions
- The 1-week sleep is manageable with a cron-job ping every 5 days

---

## 2. Migration Steps

### Step 1: Create Neon Account & Database

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended — same as existing repo)
3. Create a new project named `sv-os`
4. Choose region closest to Render's existing region
5. Copy the connection string from the dashboard

### Step 2: Export from Render

```bash
# 1. Get Render PostgreSQL connection details from Render dashboard
# 2. Export the database
pg_dump \
  --host=[render-host] \
  --port=5432 \
  --username=[render-username] \
  --dbname=[render-db-name] \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=svos_backup.dump
```

**Note**: If Render PostgreSQL is already empty or only has test data, skip the export and just run schema + seeds on Neon.

### Step 3: Import to Neon

```bash
# 1. Get the Neon connection string from Neon dashboard
# 2. Restore the dump (if you exported from Render)
pg_restore \
  --host=[neon-host] \
  --port=5432 \
  --username=[neon-username] \
  --dbname=[neon-db-name] \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  svos_backup.dump

# OR: fresh init (if no data to migrate)
# Apply schema
psql [neon-connection-string] -f database/schema.sql

# Apply seeds
bash database/scripts/seed.sh
```

### Step 4: Run Alembic Migrations

```bash
cd apps/api

# Point to Neon
export DATABASE_URL="postgresql+asyncpg://user:pass@[neon-host]/[db-name]"

# Run migrations
alembic upgrade head
```

### Step 5: Verify

```bash
# 1. Check tables exist
psql [neon-connection-string] -c "\dt"

# 2. Check seed data
psql [neon-connection-string] -c "SELECT COUNT(*) FROM knowledge_nodes;"

# 3. Run backend tests
cd apps/api && python -m pytest tests/ -q

# 4. Start the API and verify health endpoint
uvicorn app.main:app --reload
curl http://localhost:8000/health
```

---

## 3. Environment Variables

### Current (Render)

```env
# apps/api/.env
DATABASE_URL=postgresql+asyncpg://svos:password@render-host:5432/svos
```

### New (Neon)

```env
# apps/api/.env
DATABASE_URL=postgresql+asyncpg://user:password@[neon-host]/[db-name]?sslmode=require

# Optional: Use Neon's pooled connection for serverless
# DATABASE_URL=postgresql+asyncpg://user:password@[neon-host].pooler.neon.tech/[db-name]?sslmode=require
```

### CI Update (GitHub Actions)

```yaml
# In .github/workflows/ci.yml, update the PostgreSQL service section:
services:
  postgres:
    image: postgres:16-alpine
    # This stays the same — CI uses its own PostgreSQL service
    # No change needed for CI
```

### Docker Compose Update

```yaml
# In docker-compose.yml, the local postgres service stays as-is.
# For docker-compose.prod.yml, update DATABASE_URL to use Neon:
services:
  api:
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@[neon-host]/[db-name]?sslmode=require
```

---

## 4. Backup Strategy

### Automated Backups (Neon provides)

- **Daily backups** included in free tier (7-day retention)
- **Point-in-time recovery** available
- No additional tooling needed

### Manual Backup (for extra safety)

```bash
# Weekly manual backup
pg_dump \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=svos_backup_$(date +%Y-%m-%d).dump \
  [neon-connection-string]
```

### Pre-Migration Backup

```bash
# Before migration, take the final Render backup
pg_dump \
  --host=[render-host] \
  --port=5432 \
  --username=[render-username] \
  --dbname=[render-db-name] \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=svos_render_final_backup.dump
```

---

## 5. Rollback Strategy

### If migration fails:

1. The Render database **still exists** until you delete it
2. Revert `DATABASE_URL` in all env files to Render's URL
3. Verify the app works with the old connection
4. Debug the migration issue, then retry with Neon

### If Neon is unstable:

1. Switch to Supabase as fallback (same pg_dump/pg_restore process)
2. Update `DATABASE_URL` to Supabase's connection string
3. No code changes needed — both are standard PostgreSQL

### Rollback steps:

```bash
# 1. Revert .env files to Render URL
# 2. Restart the API
# 3. Verify health endpoint
# 4. No data loss — Render DB is untouched
```

---

## 6. Production Considerations

| Concern            | Mitigation                                                                       |
| ------------------ | -------------------------------------------------------------------------------- |
| Connection pooling | Neon provides pooled connections (port 6543). Use for serverless/edge functions  |
| SSL enforcement    | Add `?sslmode=require` to connection string                                      |
| Cold start         | Neon's autoscale-to-zero is ~500ms — acceptable for a learning platform          |
| Rate limiting      | Neon free tier: 100 connections, 0.5GB storage — sufficient for current scale    |
| Upgrade path       | Neon Pro ($19/mo) offers 10GB storage, 300 connections, branching limits removed |

---

## 7. CI Changes

No CI changes needed. The CI pipeline (`ci.yml`) starts its own PostgreSQL 16 as a service container:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: svos
      POSTGRES_PASSWORD: svos_dev_password
      POSTGRES_DB: svos
```

This is local to the CI runner and unaffected by the production database provider change. The CI will continue to use its own PostgreSQL instance for tests.

---

## 8. Timeline

| Step                | Est. Time   | Description                       |
| ------------------- | ----------- | --------------------------------- |
| Create Neon account | 5 min       | Sign up, create project           |
| Export from Render  | 10 min      | pg_dump (if data exists)          |
| Import to Neon      | 10 min      | pg_restore or fresh init          |
| Update env vars     | 5 min       | DATABASE_URL in all env files     |
| Run migrations      | 5 min       | alembic upgrade head              |
| Verify              | 10 min      | Tests, health check, manual query |
| **Total**           | **~45 min** | If data migration is needed       |
| **Total (fresh)**   | **~25 min** | If no data to migrate             |

---

_End of Database Migration Plan. Execute after receiving approval._
