# SV-OS Troubleshooting Guide

## Deployment Issues

### Login returns 403 Forbidden

**Root cause**: CSRF middleware blocking auth POST requests.

**Fix**: Auth endpoints are now exempt from CSRF validation. Ensure you're running the latest code.

**If still failing**: Check the `X-CSRF-Token` header is not being sent from the frontend — the frontend uses Bearer tokens, so CSRF should not apply to auth endpoints.

### Login returns 0 / CORS error in browser console

**Root cause**: `NEXT_PUBLIC_API_URL` points to wrong URL or `CORS_ORIGINS` doesn't include the frontend domain.

**Fix**:

1. Verify `NEXT_PUBLIC_API_URL` on Vercel matches the Render backend URL
2. Verify `CORS_ORIGINS` on Render includes the Vercel domain
3. Check browser network tab for `Access-Control-Allow-Origin` header

### Login returns 500 Internal Server Error

**Root cause**: Database connection failure or missing `SECRET_KEY`.

**Fix**:

1. Check `DATABASE_URL` is correct and database is reachable
2. Check `SECRET_KEY` is set and not the default `change-me-in-production`
3. View backend logs for the full error trace

### Health check returns 503

**Root cause**: Database not reachable.

**Fix**:

1. Check PostgreSQL service is running
2. Verify `DATABASE_URL` connection string
3. For Supabase: check IP allowlist and project status

## Docker Issues

### Docker build fails for web

**Root cause**: Missing build arguments.

**Fix**: Pass required ARGs:

```bash
docker build -f Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -t sv-os-web .
```

### Docker container exits immediately

**Root cause**: Missing environment variables.

**Fix**: Ensure all required env vars are passed via `docker run -e` or `docker-compose.yml`.

### Database container won't start

**Root cause**: Port conflict or volume permissions.

**Fix**:

1. Check port 5432 is not in use: `lsof -i :5432`
2. Remove stale volume: `docker volume rm sv-os_postgres_data`

## Development Issues

### pip install fails

**Root cause**: Python version mismatch or missing build tools.

**Fix**: Use Python 3.12+ and install build dependencies:

```bash
pip install -e ".[dev]"
```

### pnpm install fails

**Root cause**: Lockfile mismatch or Node version.

**Fix**: Use Node 22+ and run with frozen lockfile:

```bash
pnpm install --frozen-lockfile
```

### TypeScript errors in IDE but not in CI

**Root cause**: IDE using different TypeScript version.

**Fix**: Ensure VSCode uses the workspace TypeScript version:

1. Open any `.ts` file
2. Click the TypeScript version in the status bar
3. Select "Use Workspace Version"
