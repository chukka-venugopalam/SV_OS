# Environment Variables Reference

## Backend (`apps/api/.env`)

| Variable               | Required | Default                   | Description                                                                        |
| ---------------------- | -------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`         | ✅       | —                         | PostgreSQL async connection string (`postgresql+asyncpg://user:pass@host:port/db`) |
| `SECRET_KEY`           | ✅       | `change-me-in-production` | JWT signing secret (min 32 chars, blocked in production if default)                |
| `ENVIRONMENT`          | ❌       | `development`             | Runtime environment: `development`, `staging`, `production`, `test`                |
| `CORS_ORIGINS`         | ❌       | `http://localhost:3000`   | Comma-separated or JSON array of allowed CORS origins                              |
| `LOG_LEVEL`            | ❌       | `INFO`                    | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR`                                 |
| `LOG_FORMAT`           | ❌       | `auto`                    | Log format: `json`, `console`, `auto`                                              |
| `SUPABASE_URL`         | ❌       | —                         | Supabase project URL (required for Supabase Auth integration)                      |
| `SUPABASE_SERVICE_KEY` | ❌       | —                         | Supabase service role key                                                          |
| `SENTRY_DSN`           | ❌       | —                         | Sentry DSN for error monitoring                                                    |
| `ROOT_PATH`            | ❌       | —                         | Path prefix when behind a reverse proxy (e.g., `/api/v1`)                          |
| `FORWARDED_ALLOW_IPS`  | ❌       | `127.0.0.1`               | Allowed IPs for X-Forwarded-For header                                             |

### Database Pool

| Variable           | Default | Description                                   |
| ------------------ | ------- | --------------------------------------------- |
| `DB_POOL_SIZE`     | `10`    | Maximum connections in pool                   |
| `DB_MAX_OVERFLOW`  | `20`    | Maximum overflow connections beyond pool size |
| `DB_POOL_PRE_PING` | `True`  | Verify connection before use (recommended)    |
| `DB_ECHO`          | `False` | Log all SQL queries                           |

### JWT Settings

| Variable                      | Default | Description           |
| ----------------------------- | ------- | --------------------- |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`    | Access token TTL      |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `7`     | Refresh token TTL     |
| `BCRYPT_ROUNDS`               | `12`    | bcrypt hashing rounds |

### Rate Limiting

| Variable              | Default | Description                           |
| --------------------- | ------- | ------------------------------------- |
| `API_RATE_LIMIT`      | `100`   | Requests per minute (authenticated)   |
| `API_RATE_LIMIT_ANON` | `20`    | Requests per minute (anonymous)       |
| `GRAPH_RATE_LIMIT`    | `30`    | Requests per minute (graph endpoints) |

### Feature Flags

| Variable        | Default                              | Description                                      |
| --------------- | ------------------------------------ | ------------------------------------------------ |
| `FEATURE_FLAGS` | `analytics:on,search:on,plugins:off` | Feature flags as comma-separated key:value pairs |

### Cache

| Variable            | Default | Description           |
| ------------------- | ------- | --------------------- |
| `CACHE_TTL_SECONDS` | `300`   | Cache entry TTL       |
| `CACHE_MAX_SIZE`    | `1000`  | Maximum cache entries |

## Frontend (`apps/web/.env.local`)

| Variable                        | Required | Default                 | Description                  |
| ------------------------------- | -------- | ----------------------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL`           | ✅       | `http://localhost:8000` | Backend API base URL         |
| `NEXT_PUBLIC_SUPABASE_URL`      | ❌       | —                       | Supabase project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌       | —                       | Supabase anonymous API key   |
| `NEXT_PUBLIC_APP_URL`           | ❌       | `http://localhost:3000` | Public app URL for redirects |
| `NEXT_PUBLIC_ENVIRONMENT`       | ❌       | `development`           | Public environment flag      |

## Ollama / AI Embeddings

| Variable                 | Default                  | Description                               |
| ------------------------ | ------------------------ | ----------------------------------------- |
| `OLLAMA_URL`             | `http://localhost:11434` | Ollama server URL for embeddings and chat |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text`       | Model for embedding generation            |
| `OLLAMA_CHAT_MODEL`      | `llama3.2`               | Model for chat completions                |

## Deployment Platforms

### Render (Backend)

- **Build Command**: `pip install uv && uv pip install --system -r apps/api/pyproject.toml`
- **Start Command**: `cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `/api/v1/health`

### Vercel (Frontend)

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm build`
- **Node Version**: 20+ (managed by Vercel)
