# SV-OS AI Context

> **⚠️ EVERY AI ASSISTANT MUST READ THIS FILE BEFORE WRITING CODE**

---

## Project Identity

| Attribute       | Value                                     |
| --------------- | ----------------------------------------- |
| **Name**        | SV-OS (Silicon Valley Learning OS)        |
| **Description** | Google Maps for Computer Science Learning |
| **Version**     | 0.3.0 (API) / 0.2.0 (monorepo)            |
| **Status**      | Infrastructure v1 — Stable                |
| **License**     | MIT                                       |
| **Repository**  | https://github.com/sv-os/sv-os            |

---

## Project Philosophy

1. **Graph-First**: The knowledge graph is THE core data structure. Everything derives from it.
2. **Deterministic > AI**: Recommendations use priority-based rules, not ML. AI is for assistance, not decisions.
3. **Explain Everything**: Every recommendation must say WHY. Every API error must be descriptive.
4. **Developer Experience**: Clean APIs, comprehensive docs, modern tooling.
5. **Open by Default**: Public knowledge graph, community-contributed content, MIT-licensed.

---

## Architecture Rules (Non-Negotiable)

### Layer Rules

```
API Endpoints  →  Must NOT contain business logic
Services       →  Must NOT access HTTP concerns
Repositories   →  Must NOT commit transactions
Engines        →  Must NOT import FastAPI, SQLAlchemy, or HTTP modules
Domain Models  →  Must NOT import from app.models (ORM)
```

### Dependency Direction

```
Outer → Inner ONLY: API → Service → Repository → Database
                      API → Service → Engine → Event Bus
Inner → Outer:         NEVER
```

### Engine Rules

- Every engine extends `EngineBase`
- Engines go through: `UNINITIALIZED → INITIALIZING → READY → RUNNING → STOPPING → STOPPED → FAILED`
- Engines communicate via EventBus, not direct calls
- Every engine implements `health_impl()` and `validate_configuration()`

### Repository Rules

- Every repository extends `BaseRepository[ModelT]`
- Repositories set `model = ModelClass` as a class attribute
- Repositories use `UnitOfWork` for transactions
- Soft delete by default (`is_deleted`)
- Optimistic locking via `version` field

---

## Naming Conventions

### Python (Backend)

| Element           | Convention            | Example                 |
| ----------------- | --------------------- | ----------------------- |
| Files/Dirs        | `snake_case`          | `knowledge_node.py`     |
| Classes           | `PascalCase`          | `GraphEngine`           |
| Functions/Methods | `snake_case`          | `create_access_token()` |
| Variables         | `snake_case`          | `user_id`               |
| Constants         | `UPPER_SNAKE_CASE`    | `MAX_DEPTH`             |
| Private           | `_leading_underscore` | `_initialize_impl()`    |

### TypeScript (Frontend & Packages)

| Element    | Convention                    | Example                |
| ---------- | ----------------------------- | ---------------------- |
| Files/Dirs | `kebab-case`                  | `knowledge-node.ts`    |
| Components | `PascalCase`                  | `KnowledgeNode`        |
| Hooks      | `camelCase` with `use` prefix | `useAuth()`            |
| Functions  | `camelCase`                   | `formatRelativeTime()` |
| Interfaces | `PascalCase`                  | `UserProfile`          |
| Constants  | `UPPER_SNAKE_CASE`            | `NODE_TYPE_COLORS`     |

---

## Folder Conventions

### Backend Module Structure

```
apps/api/app/
├── api/v1/endpoints/     # Thin handlers → delegate to services
├── core/                 # Config, database, logging
├── domain/               # Pure dataclasses (no framework deps)
├── engines/              # EngineBase subclasses
├── events/bus/           # Event bus
├── exceptions/           # Error hierarchy
├── infrastructure/       # Cache, container, registries
├── middleware/           # FastAPI middleware
├── models/               # SQLAlchemy ORM models
├── repositories/         # Data access layer
├── schemas/              # Pydantic validation
├── services/             # Business logic
├── startup/              # Lifespan, diagnostics
├── telemetry/            # Health, metrics
└── utils/                # Helpers
```

### Frontend Module Structure

```
apps/web/src/
├── app/                  # Next.js App Router pages
├── components/           # React components (graph/, layout/, shared/)
├── features/             # Feature bundles
├── hooks/                # Custom hooks
├── lib/                  # Utilities, clients
├── providers/            # Context providers
├── services/             # API service functions
├── stores/               # Zustand stores
├── types/                # Local type definitions
└── utils/                # Pure utilities
```

### Package Structure

```
packages/
├── config/src/           # Constants, env, tokens
├── types/src/            # TS interfaces only
├── ui/src/               # React components only
├── eslint-config/        # ESLint presets
└── tsconfig/             # TS config presets
```

---

## Things Never to Change

| #   | File                                                 | Reason                                                   |
| --- | ---------------------------------------------------- | -------------------------------------------------------- |
| 1   | `apps/api/app/core/database.py`                      | Engine config, session factory, Base class               |
| 2   | `apps/api/app/core/config.py`                        | Settings schema — add new, don't remove                  |
| 3   | `apps/api/app/main.py`                               | Middleware ordering fixed                                |
| 4   | `package.json` (root)                                | Scripts, engines, packageManager                         |
| 5   | `turbo.json`                                         | Task pipeline configuration                              |
| 6   | `pnpm-workspace.yaml`                                | Workspace definition                                     |
| 7   | `docker-compose.yml` / `.prod.yml`                   | Service definitions                                      |
| 8   | `Dockerfile.api` / `Dockerfile.web`                  | Build stages structure                                   |
| 9   | `database/schema.sql`                                | Canonical schema reference                               |
| 10  | `apps/api/app/models/base.py`                        | AppBaseMixin (UUID PK, timestamps, soft-delete, version) |
| 11  | `apps/api/app/models/enums.py`                       | Enum definitions (add, don't remove/rename)              |
| 12  | `apps/api/app/alembic/`                              | NEVER modify existing migrations — create new ones       |
| 13  | `apps/api/app/engines/base.py`                       | EngineBase lifecycle standardized                        |
| 14  | `apps/api/app/repositories/base.py`                  | BaseRepository CRUD interface                            |
| 15  | `apps/api/app/repositories/unit_of_work.py`          | UnitOfWork pattern                                       |
| 16  | `apps/api/app/infrastructure/container/container.py` | Engine dependency order                                  |
| 17  | `apps/api/app/services/auth.py`                      | Auth interface (for Supabase migration)                  |
| 18  | `apps/web/src/app/globals.css`                       | Design tokens, animations                                |
| 19  | `apps/web/src/app/layout.tsx`                        | Provider hierarchy order                                 |
| 20  | `.github/workflows/ci.yml`                           | CI pipeline steps                                        |

---

## Coding Standards

### Python

- **Type hints**: Required on ALL functions
- **Async**: All DB operations async/await
- **Linter**: Ruff (E, F, I, N, W, UP, B, SIM, ARG, RUF)
- **Line length**: 100
- **Quotes**: Single quotes
- **Docstrings**: Google-style

### TypeScript

- **strict**: true with `noUncheckedIndexedAccess`
- **Target**: ES2022, **Module**: ESNext
- **All components**: Functional + hooks
- **All data fetching**: React Query hooks
- **All client state**: Zustand stores

### General

- **Commits**: Conventional commits (`type(scope): description`)
- **Formatting**: Prettier
- **Pre-commit**: Husky + lint-staged

---

## Performance Requirements

| Criteria                | Requirement                |
| ----------------------- | -------------------------- |
| API response time (p95) | < 200ms for simple queries |
| Graph load time         | < 2s for 500 nodes         |
| Search response         | < 500ms                    |
| Page load (initial)     | < 3s                       |
| Page load (subsequent)  | < 1s                       |
| Bundle size (initial)   | < 200KB JS                 |

---

## Security Requirements

| Area             | Requirement                                |
| ---------------- | ------------------------------------------ |
| Passwords        | bcrypt via passlib                         |
| Auth tokens      | JWT HS256, 60-min access, 7-day refresh    |
| Password reset   | SHA-256 hash, 1-hour expiry, single-use    |
| API protection   | Rate limiting, CSRF, CORS, host validation |
| Input validation | Pydantic on all endpoints                  |
| SQL injection    | Prevented by SQLAlchemy param queries      |
| XSS              | React escaping + CSP headers               |
| Sensitive data   | Never in client-side code                  |

---

## Scalability Constraints

| Constraint              | Current         | Target                     |
| ----------------------- | --------------- | -------------------------- |
| Graph nodes (in-memory) | 100K            | 1M+                        |
| GraphEngine             | In-memory       | In-memory + optional Redis |
| Event bus               | In-process      | Redis Pub/Sub              |
| Rate limiter            | Per-process     | Redis-based                |
| Cache                   | In-memory       | Redis                      |
| Database                | Single instance | Read replicas              |

---

## Current Status

| Metric           | Status                                   |
| ---------------- | ---------------------------------------- |
| Docker builds    | ✅ Green                                 |
| CI pipeline      | ✅ Green                                 |
| Architecture     | ✅ Stabilized                            |
| Database schema  | ✅ Finalized                             |
| Engine system    | ✅ 19 registered                         |
| Graph engine     | ✅ Complete                              |
| Traversal engine | ✅ 15 algorithms                         |
| Search engine    | ✅ 6 modes                               |
| Recommendations  | ✅ 8 priority rules                      |
| Next phase       | 🔴 **Knowledge Import** — ready to begin |

---

## Next Priority

**Knowledge Import System** — The most important missing piece. The graph has storage and computation but no content. Build the import pipeline to populate it from external sources.

See: [KNOWLEDGE_IMPORT_PLAN.md](./KNOWLEDGE_IMPORT_PLAN.md)

---

## Common Mistakes to Avoid

| Mistake                       | Correct                            |
| ----------------------------- | ---------------------------------- |
| Business logic in endpoints   | Put it in a service                |
| Direct DB access in services  | Use repositories via UnitOfWork    |
| Hard-coded API routes         | Use constants from `@sv-os/config` |
| `any` in TypeScript           | Define explicit interfaces         |
| CSS modules/styled-components | Use Tailwind CSS v4                |
| Direct state mutation         | Use Zustand actions or React Query |
| Catching generic `Exception`  | Catch specific types               |
| `# type: ignore`              | Fix the underlying type            |
| Committing in repositories    | Let UnitOfWork handle commits      |
| Modifying existing migrations | Create a NEW migration             |

---

## Important Files (Quick Reference)

| File                                                 | Purpose                   |
| ---------------------------------------------------- | ------------------------- |
| `apps/api/app/main.py`                               | FastAPI entry point       |
| `apps/api/app/core/config.py`                        | All environment variables |
| `apps/api/app/core/database.py`                      | DB engine, session, Base  |
| `apps/api/app/api/v1/router.py`                      | All routes registered     |
| `apps/api/app/engines/base.py`                       | EngineBase ABC            |
| `apps/api/app/infrastructure/container/container.py` | DI container              |
| `apps/api/app/repositories/base.py`                  | BaseRepository            |
| `apps/api/app/repositories/unit_of_work.py`          | UnitOfWork                |
| `apps/api/app/services/auth.py`                      | Auth logic (JWT, bcrypt)  |
| `apps/web/src/app/layout.tsx`                        | Provider hierarchy        |
| `apps/web/src/app/globals.css`                       | Design system             |
| `packages/config/src/constants.ts`                   | Shared constants          |
| `packages/types/src/index.ts`                        | TS type definitions       |
| `packages/ui/src/index.ts`                           | UI component library      |
| `database/schema.sql`                                | Complete schema           |

---

_Cross-reference: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [KNOWLEDGE_IMPORT_PLAN.md](./KNOWLEDGE_IMPORT_PLAN.md)_
