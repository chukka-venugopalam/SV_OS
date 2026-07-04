# AI Context — SV-OS

## One-Line
**Google Maps for Computer Science Learning** — an interactive knowledge graph that maps CS concepts, technologies, projects, and careers.

## Tech Stack
- **Monorepo**: Turborepo v2, pnpm v10
- **Frontend**: Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4, shadcn/ui, TanStack React Query, Zustand, React Hook Form, Zod, Framer Motion, React Flow, Lucide, next-themes
- **Backend**: FastAPI, Python 3.12+, SQLAlchemy 2.0+, Pydantic v2, Alembic, structlog
- **Database**: PostgreSQL 16 with adjacency list graph model
- **Auth**: Supabase Auth (JWT, RLS)
- **Deploy**: Vercel + Render + Supabase
- **CI**: GitHub Actions (CI, Lint)

## Architecture
```
apps/web (Next.js 15) → REST API → apps/api (FastAPI) → Service Layer → Repository Layer → PostgreSQL
```
- Clean Architecture: Routes → Services → Repositories → Database
- State Management Triad: React Query (server) + Zustand (client) + RHF+Zod (forms)
- Graph: Adjacency list with recursive CTEs (not Neo4j)
- Response Format: `{success, message, data, errors, timestamp, request_id}`

## Repository Structure
```
sv-os/
├── apps/
│   ├── web/          — Next.js 15 App Router
│   └── api/          — FastAPI Clean Architecture
├── packages/
│   ├── ui/           — Design system (Radix + Tailwind)
│   ├── types/        — Shared TypeScript types
│   ├── config/       — Shared constants & env config
│   ├── eslint-config/— ESLint flat configs
│   └── tsconfig/     — TypeScript base configs
├── database/         — schema.sql + seeds/
├── docs/             — Architecture & development docs
├── scripts/          — setup.sh, seed.sh
├── .github/          — CI/CD, templates, CODEOWNERS
├── docker/           — Docker config files
└── .ai/              — AI tracking files
```

## Current Status
**Phase 2.3 — Complete.** Backend infrastructure layer is fully built: FastAPI Clean Architecture with middleware stack, exception system, structured logging, configuration management, dependency injection, database infrastructure, utilities, observability stubs, security foundation, and testing foundation. 17/17 Python tests pass.

## Key Decisions
1. **No Neo4j**: Relational adjacency list + recursive CTEs for MVP (simpler ops, sufficient performance)
2. **REST over GraphQL**: Simpler caching, broader tooling for MVP
3. **Supabase All-in-One**: Database + Auth + RLS from single provider
4. **React Query + Zustand, not Redux**: Server state (React Query) vs client state (Zustand)
5. **Pydantic + Zod**: End-to-end typed validation (Python backend → TypeScript frontend)
6. **Standard API Response**: Every endpoint returns `{success, message, data, errors, timestamp, request_id}`
7. **Suspense Boundaries Everywhere**: Every data-dependent component wrapped in Suspense + skeleton
8. **Turborepo Monorepo**: pnpm workspaces, shared packages, pipeline orchestration
9. **Tailwind CSS v4**: CSS-first configuration via `@theme` directive, config file retained for tooling
10. **Husky + lint-staged + commitlint**: Pre-commit quality gates and conventional commits
11. **Middleware Order Matters**: CORS → Compression → TrustedHosts → SecurityHeaders → RequestID → CorrelationID → Timing → RateLimit
12. **Async-First Database**: SQLAlchemy async engine with asyncpg, async session factory, async health checks
13. **Stub-First Observability**: Health check is real; metrics, tracing are stub interfaces ready for production

## Architecture Layers
```
Middleware (8 layers) → Routes (v1) → Services (Phase 3) → Repositories → Database
Exception handlers wrap everything for consistent error responses
```

## Backend Module Map
```
app/main.py                 — Application factory
app/core/config.py          — Settings (Pydantic)
app/core/database.py        — Engine, session, Base, health
app/core/logging.py         — structlog configuration
app/middleware/              — 6 middleware modules + stub
app/exceptions/              — 8 exception classes + handlers
app/api/v1/router.py        — 5 health endpoints + metadata
app/api/deps.py             — DI: DB, settings, context
app/schemas/response.py     — APIResponse, PaginatedData
app/repositories/base.py    — BaseRepository[T] CRUD
app/utils/                  — 6 utility modules
app/telemetry/              — Health, Metrics, Tracing, Performance
app/startup/                — Lifespan, Diagnostics
```

## Constraints
- No placeholder code, no TODOs, no pseudo-code
- Every file must compile and be production-ready
- Dark mode first, Apple-quality UI
- Accessibility (WCAG AA), SEO, performance

## Next Steps
Phase 2.4: Database foundation — SQLAlchemy models, Pydantic schemas, Alembic migration, repository implementations built on the existing infrastructure.
