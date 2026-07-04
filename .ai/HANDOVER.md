# HANDOVER — Phase 3 Complete

## Current State
SV-OS has completed Phase 3 (Application Services + Auth + REST API + Frontend Integration).

The application now has a complete backend service layer, JWT-based authentication,
48 REST API endpoints, and frontend auth infrastructure. The project is ready for
Phase 4: Deployment (GitHub, Render, Vercel, Supabase).

## What Was Built (Phase 3)

### Architecture Overview
```
Frontend (Next.js 15 + TypeScript)
    ↓  API client with auto token refresh
Backend (FastAPI + Python)
    ↓  12 endpoint modules
Application Services (13 service classes)
    ↓  Unit of Work
Repositories (16 repositories)
    ↓  SQLAlchemy ORM
PostgreSQL
```

### Authentication Flow
1. User registers/logs in via `/auth/register` or `/auth/login`
2. Backend returns JWT access token (short-lived) + refresh token (long-lived)
3. Frontend stores tokens in `localStorage`
4. API client automatically attaches `Authorization: Bearer <token>` header
5. On 401 response, API client automatically refreshes the access token
6. If refresh fails, clears auth and redirects to login

### Service Layer (13 classes)

| Service | Purpose |
|---------|---------|
| `AuthService` | JWT management, bcrypt hashing, register/login/refresh/change_password |
| `UserService` | Profile CRUD, dashboard |
| `KnowledgeNodeService` | Node CRUD, search, prerequisites, neighbors, resources |
| `GraphService` | Neighborhood exploration, path finding, statistics |
| `CareerService` | Career CRUD, roadmap, requirements |
| `ProjectService` | Project CRUD, requirements |
| `SkillService` | Skill CRUD, categories, relationships |
| `LearningPathService` | Path CRUD, enrollment |
| `ProgressService` | Progress tracking, status lifecycle, statistics |
| `BookmarkService` | Bookmark toggle, listing, checking |
| `FavoriteService` | Favorite add/remove, listing, checking |
| `SearchService` | Full-text search, suggestions, history, trending |
| `RecommendationService` | Stub for future recommendation engine |

### REST API (48 endpoints across 12 modules)

| Module | Endpoints | Auth |
|--------|-----------|------|
| Auth (7) | register, login, refresh, me, update me, change-password, logout | Mixed |
| Nodes (8) | list, search, popular, get, prerequisites, related, resources, careers | Mixed |
| Graph (4) | explore, path, statistics, prerequisite-chain | No |
| Careers (4) | list, get, roadmap, nodes | No |
| Projects (3) | list, get, requirements | No |
| Skills (4) | list, categories, get, relationships | No |
| Learning Paths (2) | list, get | No |
| Progress (5) | list, stats, update, start, complete | Required |
| Bookmarks (3) | list, toggle, check | Required |
| Favorites (4) | list, add, remove, check | Required |
| Search (5) | search, suggestions, history, clear, trending | Mixed |
| Recommendations (3) | list, popular, dismiss | Mixed |

### Frontend Auth Infrastructure

| File | Purpose |
|------|---------|
| `lib/api-client.ts` | Enhanced fetch client with automatic token refresh |
| `lib/auth-client.ts` | Auth operations (login, signup, refresh, profile) |
| `hooks/use-auth.ts` | React Query hooks (useCurrentUser, useLogin, useSignup, etc.) |
| `providers/auth-provider.tsx` | AuthContext + AuthProvider |
| `components/auth/protected-route.tsx` | Route guard with auth/role checks |
| `app/(auth)/login/page.tsx` | Login form with error handling |
| `app/(auth)/signup/page.tsx` | Signup form with validation |

## Key Decisions

### Service Layer
- Services own all business logic — endpoints are thin controllers
- Services receive `UnitOfWork` via constructor (not individual repositories)
- Services do NOT convert ORM models to DTOs (prefer consuming models directly)
- Errors are raised as typed exceptions (not HTTPExceptions from services)

### Authentication
- JWT tokens with HS256 signing
- Access token: short-lived (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Refresh token: long-lived (configurable via `REFRESH_TOKEN_EXPIRE_DAYS`)
- Password hashing: bcrypt via passlib
- Role-based: `require_admin` dependency checks `user.role == 'admin'`
- Designed to be swappable to Supabase Auth without API changes

### API Client
- Automatic `Bearer` header injection
- Transparent token refresh on 401 responses
- Request deduplication during concurrent refresh attempts
- Custom `ApiRequestError` class with status, message, errors
- `skipAuth` option for login/register endpoints

## Important Notes for Next Developer (Phase 4: Deployment)

### Backend Startup
```bash
cd apps/api

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Build
```bash
cd apps/web

# Dev server
pnpm dev

# Production build
pnpm build
```

### Environment Variables

**Backend (`apps/api/.env`):**
```
DATABASE_URL=postgresql+asyncpg://svos:password@localhost:5432/svos
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Frontend (`apps/web/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### File Map (Phase 3)
```
apps/api/app/services/
├── __init__.py              — 13 service exports
├── auth.py                  — AuthService (JWT, bcrypt, register, login, refresh)
├── user.py                  — UserService
├── knowledge_node.py        — KnowledgeNodeService
├── graph.py                 — GraphService
├── career.py                — CareerService
├── project.py               — ProjectService
├── skill.py                 — SkillService
├── learning_path.py         — LearningPathService
├── progress.py              — ProgressService
├── bookmark.py              — BookmarkService
├── favorite.py              — FavoriteService
├── search.py                — SearchService
└── recommendation.py        — RecommendationService (stub)

apps/api/app/api/v1/endpoints/
├── __init__.py
├── auth.py                  — 7 auth endpoints
├── nodes.py                 — 8 node endpoints
├── graph.py                 — 4 graph endpoints
├── careers.py               — 4 career endpoints
├── projects.py              — 3 project endpoints
├── skills.py                — 4 skill endpoints
├── learning_paths.py        — 2 learning path endpoints
├── progress.py              — 5 progress endpoints
├── bookmarks.py             — 3 bookmark endpoints
├── favorites.py             — 4 favorite endpoints
├── search.py                — 5 search endpoints
└── recommendations.py       — 3 recommendation endpoints

apps/web/src/lib/
├── api-client.ts            — Enhanced API client with token refresh
├── auth-client.ts            — Auth client

apps/web/src/hooks/
├── use-auth.ts              — React Query auth hooks

apps/web/src/providers/
├── auth-provider.tsx         — Auth context provider

apps/web/src/components/auth/
├── protected-route.tsx       — Route guard component

apps/web/src/app/(auth)/
├── login/page.tsx            — Login form
├── signup/page.tsx           — Signup form
```

### Potential Issues for Phase 4
1. **Error responses not standardized** — Many endpoints still use raw `HTTPException` instead of `build_error_response()`. Should be refactored for consistent error envelopes.
2. **Rate limiting not implemented** — Auth endpoints lack brute-force protection. Use slowapi or a custom dependency.
3. **Migration hasn't been run** — The `0003_add_password_hash` migration needs to be applied before auth works.
4. **Tests require PostgreSQL** — Only infrastructure tests and auth service unit tests exist. Full API tests need a running database.
5. **Token refresh events are no-ops** — `api-client.ts` dispatches `auth:login`/`auth:logout` events but React Query doesn't listen for them. Consider wiring `invalidateQueries` in the event listener.
6. **CORS configuration** — Make sure `CORS_ORIGINS` env var includes the production frontend URL.
7. **JWT secret rotation** — Add support for multiple JWT signing keys (one current, one previous) to allow zero-downtime secret rotation.
## Verified
- ✅ All 13 backend service classes import successfully
- ✅ All 12 backend endpoint modules import successfully
- ✅ Main router imports all endpoint routers
- ✅ All service dependency injectors compile
- ✅ Frontend TypeScript compilation passes (0 errors)
- ✅ pnpm install succeeds
- ✅ 29 auth service unit tests created