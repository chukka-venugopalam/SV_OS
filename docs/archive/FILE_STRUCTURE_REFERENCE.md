# SV-OS File Structure Reference

> **Complete repository map** | **Date**: July 22, 2026 | **Total tracked files**: ~400+

---

## Root Structure

```
sv-os/
├── .ai/                    # AI context and project memory
├── .github/                # GitHub configuration and CI/CD
├── .husky/                 # Git hooks
├── apps/                   # Application packages
│   ├── api/                # FastAPI backend
│   └── web/                # Next.js frontend
├── database/               # Database schema and scripts
├── docs/                   # Documentation (30+ files)
├── packages/               # Shared library packages
├── scripts/                # Utility scripts
├── .dockerignore
├── .editorconfig
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc
├── commitlint.config.js
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile.api
├── Dockerfile.web
├── eslint.config.mjs
├── LICENSE
├── package.json            # Root workspace config
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json
```

---

## `.ai/` — AI Context Directory

**Purpose**: Project memory and state tracking for AI assistants.  
**Owner**: All contributors  
**Dependencies**: None — documentation only

| File                        | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `AI_CONTEXT.md`             | Complete AI onboarding context             |
| `API_STATUS.md`             | API stability tracking                     |
| `ARCHITECTURE_DECISIONS.md` | All architecture decisions with rationales |
| `BUG_TRACKER.md`            | Known bugs and their status                |
| `CHANGELOG.md`              | Per-session change log                     |
| `COMPONENT_REGISTRY.md`     | Frontend component inventory               |
| `DATABASE_STATUS.md`        | Database migration status                  |
| `DECISION_LOG.md`           | Implementation decisions                   |
| `DEPENDENCY_MAP.md`         | Module dependency relationships            |
| `DEVELOPMENT_ROADMAP.md`    | Development phase tracking                 |
| `ERROR_LOG.md`              | Error patterns and solutions               |
| `HANDOVER.md`               | Session handover documentation             |
| `KNOWN_ISSUES.md`           | Known technical issues                     |
| `PROJECT_MEMORY.md`         | Long-term project memory                   |
| `PROJECT_STATE.md`          | Current project state snapshot             |
| `SESSION_NOTES.md`          | Per-session development notes              |
| `TECH_DEBT.md`              | Technical debt tracking                    |

**Future files**: None planned

---

## `.github/` — GitHub Configuration

**Purpose**: CI/CD workflows, issue templates, PR templates, Code Owners  
**Owner**: DevOps  
**Dependencies**: None

| Path                                | Purpose                      |
| ----------------------------------- | ---------------------------- |
| `CODEOWNERS`                        | PR review routing            |
| `dependabot.yml`                    | Automated dependency updates |
| `ISSUE_TEMPLATE/bug_report.md`      | Bug report template          |
| `ISSUE_TEMPLATE/feature_request.md` | Feature request template     |
| `PULL_REQUEST_TEMPLATE.md`          | PR description template      |
| `workflows/ci.yml`                  | Full CI pipeline (8 steps)   |
| `workflows/lint.yml`                | Lint-only workflow           |

**Future files**: `workflows/deploy.yml`, `workflows/release.yml`

---

## `apps/api/` — Backend Application

**Purpose**: FastAPI backend — all business logic, data access, and API endpoints  
**Owner**: Backend team  
**Dependencies**: None external; depends on PostgreSQL runtime

### Directory Tree

```
apps/api/
├── alembic/                    # Database migration framework
│   ├── env.py                  # Alembic environment config
│   ├── script.py.mako          # Migration template
│   └── versions/               # Migration files
│       ├── 0001_create_extensions.py
│       ├── 0002_initial_schema.py
│       ├── 0003_add_password_hash.py
│       ├── 0004_create_ai_chat_tables.py
│       ├── 0005_add_password_reset_tokens.py
│       └── 0006_convert_enums_to_varchar_with_check.py
├── alembic.ini                 # Alembic configuration
├── app/                        # Application source
│   ├── __init__.py
│   ├── main.py                 # FastAPI entry point
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # FastAPI dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py       # Main router (registers all endpoints)
│   │       └── endpoints/      # 25+ endpoint modules
│   ├── capabilities/           # Platform capabilities
│   ├── core/                   # Core infrastructure
│   │   ├── config.py           # Pydantic Settings
│   │   ├── database.py         # SQLAlchemy engine + Base
│   │   └── logging.py          # structlog config
│   ├── domain/                 # Pure domain dataclasses
│   ├── engines/                # Engine system (20 files)
│   │   ├── base.py             # EngineBase ABC
│   │   ├── graph_engine.py     # Graph runtime
│   │   ├── traversal_engine.py # Graph algorithms
│   │   ├── search_engine.py    # Search (not wired in container)
│   │   ├── recommendation_engine.py
│   │   ├── learning_path_engine.py
│   │   └── ... (14 more)
│   ├── events/bus/             # Event bus
│   ├── exceptions/             # Exception hierarchy
│   ├── infrastructure/         # Platform infrastructure
│   │   ├── cache/              # In-memory cache + graph cache
│   │   ├── container/          # DI container
│   │   ├── registries/         # Engine, capability, plugin registries
│   │   └── runtime/            # Platform runtime
│   ├── middleware/              # 9 middleware modules
│   ├── models/                  # SQLAlchemy ORM models (15+)
│   ├── repositories/           # Data access (18+ files)
│   ├── schemas/                # Pydantic schemas (20+ files)
│   ├── services/               # Business logic (15+ files)
│   │   ├── ai/                 # AI services (embedding, RAG, chat, etc.)
│   │   └── graph/              # Graph services
│   ├── startup/                # Lifespan, diagnostics
│   ├── telemetry/              # Health, metrics, tracing
│   └── utils/                  # Helper utilities
├── tests/                      # pytest test suite
│   ├── conftest.py
│   ├── factories/
│   ├── migrations/
│   ├── repositories/
│   ├── services/               # 12+ service test files
│   ├── test_engine_lifecycle.py
│   ├── test_graph_platform.py
│   ├── test_health.py
│   └── test_platform_foundation.py
├── Dockerfile
├── pyproject.toml              # Python project config
└── README.md
```

**Future files**: `app/import/` (knowledge import pipeline), `app/validation/` (dedicated validation modules)

---

## `apps/web/` — Frontend Application

**Purpose**: Next.js 15 frontend — all UI components, pages, and client logic  
**Owner**: Frontend team  
**Dependencies**: packages/_, @sv-os/_

### Directory Tree

```
apps/web/
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (main)/             # Authenticated route group
│   │   │   ├── layout.tsx
│   │   │   ├── ai-chat/page.tsx
│   │   │   ├── bookmarks/page.tsx
│   │   │   ├── careers/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── explore/page.tsx
│   │   │   ├── graph/page.tsx
│   │   │   ├── health/page.tsx
│   │   │   ├── import-export/page.tsx
│   │   │   ├── learning/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── progress/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── account/page.tsx
│   │   │   │   ├── preferences/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   └── versions/page.tsx
│   │   ├── error.tsx
│   │   ├── globals.css         # Design system + tokens
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── auth/               # Auth components
│   │   ├── graph/              # React Flow components
│   │   ├── layout/             # AppShell, Sidebar, TopNav, Footer
│   │   └── shared/             # ErrorBoundary, PageHeader, Shell
│   ├── features/               # Feature bundles
│   ├── hooks/                  # 20+ custom hooks
│   ├── lib/                    # Utilities, clients, constants
│   ├── providers/              # Context providers
│   ├── services/               # API service functions
│   ├── stores/                 # Zustand stores
│   ├── types/                  # Local type definitions
│   └── utils/                  # Pure utilities
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

**Future files**: PWA service worker, offline manifest, more feature pages

---

## `database/` — Database Resources

**Purpose**: Schema reference, seed data, and operational scripts  
**Owner**: Backend team / DevOps  
**Dependencies**: PostgreSQL 16

```
database/
├── migrations/
│   └── README.md               # Migration strategy docs
├── schema.sql                  # Canonical schema reference
├── scripts/
│   ├── backup.sh               # Database backup
│   ├── health_check.sql        # Health query
│   ├── reset.sh                # Drop + create + seed
│   ├── restore.sh              # Restore from backup
│   └── seed.sh                 # Load seed data
└── seeds/
    ├── 01_subjects.sql
    ├── 02_concepts.sql
    ├── 03_technologies.sql
    ├── 04_careers.sql
    ├── 05_projects.sql
    ├── 06_edges.sql
    ├── 07_learning_resources.sql
    ├── 08_skills.sql
    └── 09_tags.sql
```

**Future files**: More seed data files, migration scripts

---

## `docs/` — Documentation

**Purpose**: Complete project documentation  
**Owner**: All contributors

| File                              | Purpose                         |
| --------------------------------- | ------------------------------- |
| `PROJECT_OVERVIEW.md`             | Vision, mission, target users   |
| `CURRENT_PROGRESS.md`             | Per-area completion status      |
| `ARCHITECTURE.md`                 | Full system architecture        |
| `KNOWLEDGE_GRAPH_DESIGN.md`       | Knowledge entity design         |
| `DATABASE_BLUEPRINT.md`           | Database table design           |
| `API_BLUEPRINT.md`                | API endpoint catalog            |
| `FRONTEND_BLUEPRINT.md`           | Frontend component architecture |
| `BACKEND_BLUEPRINT.md`            | Backend layer architecture      |
| `KNOWLEDGE_SCHEMA.md`             | 30+ entity types                |
| `GRAPH_RELATIONSHIPS.md`          | 22 edge types                   |
| `SEARCH_ARCHITECTURE.md`          | Search system                   |
| `RECOMMENDATION_ENGINE.md`        | Recommendation algorithms       |
| `LEARNING_PATH_ENGINE.md`         | Learning path engine            |
| `KNOWLEDGE_VALIDATION.md`         | Validation rules                |
| `KNOWLEDGE_IMPORT_SPEC.md`        | Import format spec              |
| `CONTENT_AUTHORING_GUIDE.md`      | Content writing standards       |
| `IMPLEMENTATION_GUIDE.md`         | Engineering playbook            |
| `FILE_STRUCTURE_REFERENCE.md`     | This file                       |
| `ENGINEERING_STANDARDS.md`        | SOLID, patterns, standards      |
| `TESTING_STRATEGY.md`             | Testing architecture            |
| `PERFORMANCE_GUIDE.md`            | Scaling and optimization        |
| `SECURITY_GUIDE.md`               | Security architecture           |
| `DEPLOYMENT_GUIDE.md`             | Deployment procedures           |
| `CONTRIBUTING_GUIDE_ADVANCED.md`  | Advanced contribution guide     |
| `PRODUCT_EVOLUTION.md`            | Future product vision           |
| `MASTER_ENGINEERING_CHECKLIST.md` | Complete task checklist         |
| `SV_OS_MASTER_SPEC.md`            | Complete project encyclopedia   |
| `DEVELOPMENT_ROADMAP.md`          | Phase-by-phase plan             |
| `CONTRIBUTING_AI.md`              | AI assistant standards          |
| `IMPLEMENTATION_ROADMAP.md`       | Phase tasks and milestones      |
| `MASTER_TODO.md`                  | 265-task checklist              |
| `AI_CONTEXT.md`                   | AI onboarding                   |

---

## `packages/` — Shared Library Packages

**Purpose**: Reusable packages shared across workspaces  
**Owner**: Platform team

| Package          | Purpose                | Files | Dependencies |
| ---------------- | ---------------------- | ----- | ------------ |
| `config/`        | Constants, env, tokens | 4     | None         |
| `types/`         | TypeScript interfaces  | 7     | None         |
| `ui/`            | React UI components    | 25+   | config       |
| `eslint-config/` | ESLint presets         | 3     | None         |
| `tsconfig/`      | TypeScript configs     | 4     | None         |

---

## `scripts/` — Utility Scripts

**Purpose**: Automation and maintenance scripts  
**Owner**: DevOps  
**Dependencies**: Node.js (for .ts scripts), bash

| File                   | Purpose               |
| ---------------------- | --------------------- |
| `repository-doctor.ts` | Monorepo health check |
| `seed.sh`              | Database seeding      |
| `setup.sh`             | Project setup wizard  |

**Future files**: `import-wikipedia.sh`, `validate-content.sh`, `backup-all.sh`

---

## Root Configuration Files

| File                      | Purpose                            |
| ------------------------- | ---------------------------------- |
| `package.json`            | Workspace scripts, devDependencies |
| `pnpm-workspace.yaml`     | Workspace definition               |
| `turbo.json`              | Build pipeline configuration       |
| `tsconfig.base.json`      | Shared TypeScript base config      |
| `eslint.config.mjs`       | Root ESLint configuration          |
| `.prettierrc`             | Code formatting config             |
| `.prettierignore`         | Files to skip formatting           |
| `.editorconfig`           | Cross-editor settings              |
| `.gitignore`              | Git ignore patterns                |
| `.npmrc`                  | npm/pnpm configuration             |
| `.dockerignore`           | Docker context exclusion           |
| `docker-compose.yml`      | Dev Docker setup                   |
| `docker-compose.prod.yml` | Production Docker setup            |
| `Dockerfile.api`          | API Docker build                   |
| `Dockerfile.web`          | Web Docker build                   |
| `commitlint.config.js`    | Commit message rules               |
| `LICENSE`                 | MIT license                        |

---

---

## Conceptual Folder Map

These folders do not exist as separate top-level directories but represent logical groupings within the existing repository structure. They are referenced throughout the documentation as conceptual areas.

### `backend/` — Backend Application

| Property              | Value                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| **Physical location** | `apps/api/`                                                           |
| **Purpose**           | FastAPI backend — all business logic, data access, and API endpoints  |
| **Owner**             | Backend team                                                          |
| **Dependencies**      | PostgreSQL, database schema, packages (none)                          |
| **Expected files**    | `app/` (engines, services, repositories, models, schemas, middleware) |
| **Future files**      | `app/import/`, `app/validation/`, `app/analytics/`                    |

### `frontend/` — Frontend Application

| Property              | Value                                                      |
| --------------------- | ---------------------------------------------------------- |
| **Physical location** | `apps/web/`                                                |
| **Purpose**           | Next.js 15 frontend — all UI, pages, client logic          |
| **Owner**             | Frontend team                                              |
| **Dependencies**      | `packages/*` (ui, types, config)                           |
| **Expected files**    | `src/app/`, `src/components/`, `src/hooks/`, `src/stores/` |
| **Future files**      | PWA service worker, offline manifest                       |

### `knowledge/` — Knowledge Content

| Property              | Value                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| **Physical location** | `database/seeds/` + future `knowledge/` directory                                |
| **Purpose**           | Structured knowledge content (subjects, concepts, skills, roadmaps)              |
| **Owner**             | Content team / Knowledge engineers                                               |
| **Dependencies**      | Database schema, import engine                                                   |
| **Expected files**    | SQL seed files, Markdown content, JSON definitions                               |
| **Future files**      | `subjects/`, `roadmaps/`, `skills/`, `resources/`, `tags/` as structured content |

### `imports/` — Import Pipeline

| Property              | Value                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| **Physical location** | `apps/api/app/engines/import_engine.py` + future `app/import/` package |
| **Purpose**           | Knowledge ingestion pipeline (batch, incremental, streaming)           |
| **Owner**             | Backend team                                                           |
| **Dependencies**      | Knowledge schema, graph engine, validation system                      |
| **Expected files**    | `import_engine.py`, `validators/`, `parsers/`, `transformers/`         |
| **Future files**      | `sources/` (Wikipedia, GitHub, OSS), `formats/` (JSON, YAML, CSV)      |

### `exports/` — Export Pipeline

| Property              | Value                                                          |
| --------------------- | -------------------------------------------------------------- |
| **Physical location** | `apps/api/app/export_engine.py` + future `app/export/` package |
| **Purpose**           | Knowledge export (JSON, Markdown, CSV, graph snapshots)        |
| **Owner**             | Backend team                                                   |
| **Dependencies**      | Knowledge schema, graph engine                                 |
| **Expected files**    | `export_engine.py`, `serializers/`, `formatters/`              |
| **Future files**      | `formats/` (PDF, HTML, interactive graph)                      |

### `graph/` — Graph System

| Property              | Value                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Physical location** | `apps/api/app/engines/graph_engine.py`, `apps/api/app/services/graph/`, `apps/web/src/components/graph/` |
| **Purpose**           | Knowledge graph runtime, traversal, visualization                                                        |
| **Owner**             | Backend team + Frontend team                                                                             |
| **Dependencies**      | Knowledge schema, database, React Flow (frontend)                                                        |
| **Expected files**    | `graph_engine.py`, `traversal_engine.py`, `react-flow-graph.tsx`                                         |
| **Future files**      | GraphQL federation, WebSocket subscriptions, offline graph cache                                         |

---

_Cross-reference: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md), [ARCHITECTURE.md](ARCHITECTURE.md)_
