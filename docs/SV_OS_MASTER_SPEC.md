# SV-OS Master Specification

> **Project**: Silicon Valley Learning OS (SV-OS)
> **Version**: 0.3.0
> **Status**: Phase 2 — Foundation Complete
> **Last Updated**: July 22, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Mission](#vision--mission)
3. [Product Goals](#product-goals)
4. [Current Status](#current-status)
5. [Repository Structure](#repository-structure)
6. [Technology Stack](#technology-stack)
7. [Architecture Overview](#architecture-overview)
8. [Backend Overview](#backend-overview)
9. [Frontend Overview](#frontend-overview)
10. [Shared Packages](#shared-packages)
11. [Database](#database)
12. [API Layer](#api-layer)
13. [Authentication](#authentication)
14. [Graph System](#graph-system)
15. [Engine System](#engine-system)
16. [AI Integration](#ai-integration)
17. [Learning System](#learning-system)
18. [Deployment](#deployment)
19. [CI/CD](#cicd)
20. [Build Process](#build-process)
21. [Coding Standards](#coding-standards)
22. [Environment Variables](#environment-variables)
23. [Future Expansion](#future-expansion)
24. [Risks & Known Limitations](#risks--known-limitations)

---

## Executive Summary

SV-OS (Silicon Valley Learning OS) is a **knowledge graph platform** designed to be the definitive interactive map of Computer Science education — conceptually, "Google Maps for Computer Science Learning." It maps CS concepts, technologies, tools, projects, and careers into a navigable, interactive graph, enabling learners to understand prerequisites, discover learning paths, track progress, and make informed decisions about what to study next.

The platform is built as a **monorepo** using **pnpm workspaces** and **Turborepo**, containing a **FastAPI** (Python 3.12) backend and a **Next.js 15** (TypeScript) frontend, with shared packages for configuration, types, UI components, ESLint rules, and TypeScript configurations.

---

## Vision & Mission

### Vision

Become the definitive interactive learning map for Computer Science — empowering every developer worldwide to navigate their learning journey with clarity and confidence.

### Mission

Provide a comprehensive, interactive knowledge graph that:

- Maps every CS concept, technology, tool, project, and career path
- Shows clear prerequisite relationships and dependencies
- Tracks individual learning progress with detailed analytics
- Generates personalized learning paths and recommendations
- Integrates AI assistance for contextual learning support

### Philosophy

1. **Graph-First**: The knowledge graph is the core data structure — everything else (careers, projects, learning paths) is derived from it.
2. **Open by Default**: Public knowledge graph, community-contributed content, MIT-licensed.
3. **Progress Over Perfection**: Iterative development with clear milestones.
4. **Developer Experience First**: Clean APIs, comprehensive documentation, modern tooling.
5. **AI-Augmented**: AI enhances but does not replace human-curated content.

---

## Product Goals

| Goal                                            | Status         | Priority |
| ----------------------------------------------- | -------------- | -------- |
| Interactive knowledge graph visualization       | ✅ Implemented | P0       |
| Graph exploration (neighborhood, prerequisites) | ✅ Implemented | P0       |
| User authentication (JWT + Supabase ready)      | ✅ Implemented | P0       |
| Progress tracking per node                      | ✅ Implemented | P0       |
| Career path mapping                             | ✅ Implemented | P0       |
| Project management                              | ✅ Implemented | P0       |
| Search (full-text + semantic)                   | ✅ Implemented | P0       |
| Bookmarking & favorites                         | ✅ Implemented | P0       |
| AI Chat integration                             | 🟡 In Progress | P1       |
| Learning path generation                        | 🟡 In Progress | P1       |
| Spaced repetition/revision engine               | 🟡 In Progress | P1       |
| Plugin system                                   | ⬜ Planned     | P2       |
| Community contributions                         | ⬜ Planned     | P2       |
| Mobile app                                      | ⬜ Planned     | P3       |
| Offline support                                 | ⬜ Planned     | P3       |

---

## Current Status

### Completed Milestones (Phase 1 & 2)

| Milestone     | Description                                                                        | Date     |
| ------------- | ---------------------------------------------------------------------------------- | -------- |
| **Phase 0**   | Repository bootstrap, monorepo setup, initial toolchain                            | Complete |
| **Phase 1**   | Core infrastructure: FastAPI app, PostgreSQL schema, Alembic, Docker, CI/CD        | Complete |
| **Phase 2.0** | Backend foundation: All models, repositories, services, API endpoints, auth, graph | Complete |
| **Phase 2.1** | Engine system: 20 engines with lifecycle, event bus, DI container, registries      | Complete |
| **Phase 2.2** | Frontend foundation: Next.js 15, Radix UI, Tailwind v4, all pages and components   | Complete |
| **Phase 2.3** | Platform infrastructure: Health monitoring, telemetry, middleware stack, caching   | Complete |
| **Phase 2.4** | AI integration: Embedding providers, RAG engine, semantic search, context engine   | Complete |

### Remaining Milestones (Phase 3+)

| Milestone     | Description                                       | Status         |
| ------------- | ------------------------------------------------- | -------------- |
| **Phase 3.0** | Learning path generation & recommendation engines | 🟡 In Progress |
| **Phase 3.1** | Spaced repetition & revision engine               | 🟡 In Progress |
| **Phase 3.2** | Plugin system & community features                | ⬜ Planned     |
| **Phase 3.3** | Performance optimization & scaling                | ⬜ Planned     |
| **Phase 3.4** | Mobile responsive & PWA                           | ⬜ Planned     |

---

## Repository Structure

```
sv-os/
├── .ai/                          # AI context & project memory
├── .github/                      # GitHub config, CI/CD workflows
│   ├── workflows/
│   │   ├── ci.yml                # Full CI pipeline
│   │   └── lint.yml              # Lint & format check
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .husky/                       # Git hooks
├── apps/
│   ├── api/                      # FastAPI backend
│   └── web/                      # Next.js frontend
├── database/
│   ├── migrations/               # Migration documentation
│   ├── scripts/                  # DB scripts (backup, restore, seed, etc.)
│   ├── seeds/                    # Seed SQL files
│   └── schema.sql               # Complete schema reference
├── docs/                         # Project documentation
├── packages/
│   ├── config/                   # Shared constants, env, tokens
│   ├── eslint-config/            # ESLint shared configs
│   ├── tsconfig/                 # TypeScript shared configs
│   ├── types/                    # Shared TypeScript type definitions
│   └── ui/                       # Shared UI component library
├── scripts/                      # Utility scripts
├── docker-compose.yml            # Dev Docker setup
├── docker-compose.prod.yml       # Production Docker setup
├── Dockerfile.api                # API Dockerfile
├── Dockerfile.web                # Web Dockerfile
├── package.json                  # Root package.json
├── pnpm-workspace.yaml           # pnpm workspace definition
├── turbo.json                    # Turborepo config
├── tsconfig.base.json            # Base TypeScript config
└── commitlint.config.js          # Commit lint rules
```

---

## Technology Stack

### Backend (`apps/api`)

| Technology        | Version        | Purpose                   |
| ----------------- | -------------- | ------------------------- |
| Python            | 3.12+          | Runtime                   |
| FastAPI           | 0.115+         | Web framework             |
| SQLAlchemy        | 2.0+ (asyncio) | ORM                       |
| asyncpg           | 0.30+          | PostgreSQL async driver   |
| Alembic           | 1.14+          | Database migrations       |
| Pydantic v2       | 2.10+          | Validation & settings     |
| Pydantic-Settings | 2.7+           | Environment config        |
| python-jose       | 3.3+           | JWT tokens                |
| passlib[bcrypt]   | 1.7+           | Password hashing          |
| structlog         | 25.1+          | Structured logging        |
| httpx             | 0.28+          | HTTP client               |
| sentry-sdk        | 2.22+          | Error tracking            |
| uv/uvicorn        | latest         | ASGI server / package mgr |

### Frontend (`apps/web`)

| Technology           | Version | Purpose                 |
| -------------------- | ------- | ----------------------- |
| TypeScript           | 5.8+    | Language                |
| Next.js              | 15.3+   | React framework         |
| React                | 19.1+   | UI library              |
| Tailwind CSS         | 4.1+    | Styling                 |
| Radix UI             | latest  | Accessible primitives   |
| TanStack React Query | 5.75+   | Server state management |
| Zustand              | 5.0+    | Client state management |
| React Flow           | 11.11+  | Graph visualization     |
| Framer Motion        | 12.8+   | Animations              |
| Lucide React         | 0.487+  | Icons                   |
| next-themes          | 0.4+    | Dark mode               |
| zod                  | 3.24+   | Validation              |
| react-hook-form      | 7.55+   | Forms                   |

### Shared Packages

| Package                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `@sv-os/config`        | Shared constants, env vars, design tokens                           |
| `@sv-os/types`         | TypeScript interfaces (graph, career, project, auth, progress, API) |
| `@sv-os/ui`            | Reusable UI components (23+ components)                             |
| `@sv-os/eslint-config` | ESLint configs (base, next, react)                                  |
| `@sv-os/tsconfig`      | TypeScript configs (base, api, nextjs, react-library)               |

### Infrastructure

| Technology              | Purpose            |
| ----------------------- | ------------------ |
| PostgreSQL 16           | Database           |
| Docker / Docker Compose | Containerization   |
| GitHub Actions          | CI/CD              |
| pnpm 10.8+              | Package manager    |
| Turborepo 2.5+          | Build orchestrator |
| Husky + commitlint      | Git hooks          |
| Prettier                | Code formatting    |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Web Frontend                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js 15 App Router                           │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │  │
│  │  │ Auth │ │Graph │ │Learn │ │Proj. │ │Other │  │  │
│  │  │Pages │ │Pages │ │Pages │ │Pages │ │Pages │  │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │       React Query + Zustand Stores        │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │       API Client (HTTP)                   │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    API Backend                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  FastAPI + Middleware Stack                      │  │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│  │
│  │  │C │ │S │ │R │ │C │ │R │ │T │ │R │ │R │ │C│  │  │
│  │  │O │ │e │ │a │ │o │ │e │ │i │ │a │ │a │ │S│  │  │
│  │  │R │ │c │ │t │ │r │ │q │ │m │ │t │ │t │ │R│  │  │
│  │  │S │ │ur│ │e │ │r │ │ID│ │in│ │eL│ │eL│ │F│  │  │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API v1 Router + Endpoints                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Service Layer                                   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Repository Layer (UoW + Repositories)           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Engine System (20 engines)                      │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │  │
│  │  │Gr  │ │Kno │ │Rec │ │Car │ │Ana │ │... │    │  │
│  │  │aph │ │wled│ │omm │ │eer │ │lyt │ │    │    │  │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  Event Bus + Platform Container           │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ORM Models → PostgreSQL Database                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AI Services (Embeddings, RAG, Chat)             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Overview

### Application Structure

```
apps/api/app/
├── api/
│   ├── deps.py                    # FastAPI dependencies (DB, auth, UoW)
│   └── v1/
│       ├── router.py              # Main v1 router + health endpoints
│       └── endpoints/             # 20+ endpoint modules
├── capabilities/                  # Platform capabilities (assessment, career, export, etc.)
├── core/
│   ├── config.py                  # Pydantic Settings
│   ├── database.py                # SQLAlchemy engine, session, Base
│   └── logging.py                 # structlog configuration
├── domain/                        # Pure domain dataclasses
├── engines/
│   ├── base.py                    # EngineBase ABC (lifecycle: init → start → stop)
│   ├── graph_engine.py            # Graph runtime with indexes
│   ├── knowledge_engine.py        # Knowledge management
│   ├── recommendation_engine.py   # Content recommendations
│   ├── career_engine.py           # Career path management
│   ├── analytics_engine.py        # Usage & graph analytics
│   ├── ... (20 engines total)
│   └── __init__.py
├── events/bus/event_bus.py        # In-process async event bus
├── exceptions/                    # AppError hierarchy + FastAPI handlers
├── infrastructure/
│   ├── audit.py                   # Audit logging
│   ├── cache/                     # In-memory cache + graph cache
│   ├── container/container.py     # DI container with all engines registered
│   ├── notifications.py           # Notification service (stub)
│   ├── registries/registries.py   # Engine, Capability, Plugin registries
│   ├── runtime/                   # Platform runtime + status API
│   ├── websocket.py               # WebSocket manager (stub)
│   └── workers.py                 # Worker manager (stub)
├── middleware/
│   ├── correlation_id.py          # Correlation ID propagation
│   ├── csrf.py                    # Double-submit cookie CSRF
│   ├── rate_limit.py              # Token bucket rate limiting
│   ├── request_id.py              # Unique request IDs
│   ├── request_timing.py          # Request duration tracking
│   ├── security.py                # Security headers (CSP, HSTS, etc.)
│   └── trusted_hosts.py          # Host header validation
├── models/                        # SQLAlchemy ORM models
├── persistence/                   # Repository pattern infrastructure
├── platform/                      # Backward-compat shims
├── repositories/                  # Data access layer
│   ├── base.py                    # BaseRepository (CRUD, pagination, soft-delete)
│   ├── unit_of_work.py            # UnitOfWork (transaction management)
│   └── ... (18+ entity repositories)
├── schemas/                       # Pydantic request/response schemas
├── services/                      # Business logic layer
│   ├── auth.py                    # JWT auth, password management
│   ├── graph/                     # Graph analytics & traversal
│   ├── ai/                        # AI services (embedding, RAG, chat, ranking)
│   └── ... (15+ services)
├── startup/                       # App lifespan, diagnostics
├── telemetry/                     # Health monitoring, metrics, tracing
└── utils/                         # Helpers (dates, UUIDs, pagination, etc.)
```

### Middleware Stack (Outer to Inner)

When a request arrives, it passes through these middleware layers (innermost added first, outermost runs first):

1. **CORSMiddleware** — Handles OPTIONS preflight; outermost layer
2. **CSRFMiddleware** — Double-submit cookie pattern (production)
3. **RateLimitMiddleware** — Token bucket (100 req/min authenticated, 20 anon)
4. **RequestTimingMiddleware** — Measures and logs request duration
5. **CorrelationIDMiddleware** — Propagates `X-Correlation-ID` header
6. **RequestIDMiddleware** — Assigns unique `X-Request-ID`
7. **SecurityHeadersMiddleware** — Sets CSP, HSTS, X-Frame-Options, etc.
8. **TrustedHostsMiddleware** — Rejects requests from unknown hosts
9. **GZipMiddleware** — Compresses responses > 1000 bytes

### Engine System

The engine system is a **pluggable service architecture** with formal lifecycle management. All 20 engines inherit from `EngineBase`:

**Lifecycle States**: `UNINITIALIZED → INITIALIZING → READY → RUNNING → STOPPING → STOPPED → FAILED`

**Engine Dependencies** (topological order):

```mermaid
graph TD
    Event[Event Engine] --> Scheduler[Scheduler Engine]
    Event --> Plugin[Plugin Engine]
    Graph[Graph Engine] --> Knowledge[Knowledge Engine]
    Graph --> Dependency[Dependency Engine]
    Graph --> Traversal[Traversal Engine]
    Graph --> Versioning[Versioning Engine]
    Graph --> Validation[Validation Engine]
    Traversal --> Query[Query Engine]
    Knowledge --> Query
    Graph --> Query
    Traversal --> LearningPath[Learning Path Engine]
    State[State Engine] --> LearningPath
    Graph --> LearningPath
    Graph --> Assessment[Assessment Engine]
    State --> Assessment
    Graph --> Career[Career Engine]
    Traversal --> Career
    State --> Career
    Graph --> Recommendation[Recommendation Engine]
    Traversal --> Recommendation
    State --> Recommendation
    Knowledge --> Recommendation
    Dependency --> Recommendation
    Graph --> Export[Export Engine]
    Traversal --> Export
    Graph --> Revision[Revision Engine]
    State --> Revision
    Graph --> Analytics[Analytics Engine]
    State --> Analytics
    Validation --> Import[Import Engine]
    Graph --> Import
    Knowledge --> Import
```

> **Note**: 19 engines are actively registered in the PlatformContainer. The engine directory also contains `search_engine.py` and `simulator_engine.py` files that are not yet wired into the container.

| Engine               | Name             | Purpose                  | Dependencies                                   |
| -------------------- | ---------------- | ------------------------ | ---------------------------------------------- |
| EventEngine          | `event`          | Async event backbone     | None                                           |
| GraphEngine          | `graph`          | Graph runtime w/ indexes | None                                           |
| KnowledgeEngine      | `knowledge`      | Knowledge management     | graph                                          |
| DependencyEngine     | `dependency`     | Dependency resolution    | graph                                          |
| TraversalEngine      | `traversal`      | Graph traversal          | graph                                          |
| QueryEngine          | `query`          | Query processing         | graph, traversal, knowledge                    |
| StateEngine          | `state`          | State management         | event (optional)                               |
| RecommendationEngine | `recommendation` | Content recommendations  | graph, traversal, state, dependency, knowledge |
| LearningPathEngine   | `learning_path`  | Learning path generation | graph, traversal, state                        |
| AssessmentEngine     | `assessment`     | Assessment capabilities  | state, graph (optional)                        |
| CareerEngine         | `career`         | Career path management   | graph, traversal, state, knowledge             |
| VersioningEngine     | `versioning`     | Graph versioning         | graph                                          |
| ExportEngine         | `export`         | Data export              | graph, traversal                               |
| SchedulerEngine      | `scheduler`      | Task scheduling          | event (optional)                               |
| RevisionEngine       | `revision`       | Spaced repetition        | state, graph (optional)                        |
| AnalyticsEngine      | `analytics`      | Usage analytics          | graph, state (optional)                        |
| PluginEngine         | `plugin`         | Plugin management        | event (optional)                               |
| ValidationEngine     | `validation`     | Data validation          | graph, knowledge                               |
| ImportEngine         | `import`         | Data import              | validation, graph, knowledge                   |

---

## Frontend Overview

### Application Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx                # Root layout (providers, fonts, metadata)
│   ├── page.tsx                  # Landing page (unauthenticated)
│   ├── globals.css               # Global styles (Tailwind v4, design tokens, animations)
│   ├── (auth)/                   # Auth route group
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── (main)/                   # Authenticated route group
│       ├── layout.tsx            # AppShell layout (sidebar + topnav)
│       ├── dashboard/page.tsx
│       ├── explore/page.tsx
│       ├── graph/page.tsx
│       ├── careers/page.tsx
│       ├── learning/page.tsx
│       ├── projects/page.tsx
│       ├── progress/page.tsx
│       ├── bookmarks/page.tsx
│       ├── search/page.tsx
│       ├── notifications/page.tsx
│       ├── settings/page.tsx
│       ├── ai-chat/page.tsx
│       └── versions/page.tsx
├── components/
│   ├── auth/                     # Auth components
│   ├── graph/                    # React Flow graph components
│   ├── layout/                   # AppShell, Sidebar, TopNav, Footer
│   └── shared/                   # ErrorBoundary, animations, page-header, shell
├── features/                     # Feature-specific components
├── hooks/                        # 20+ custom hooks (use-auth, use-graph, etc.)
├── lib/                          # Utilities (api-client, auth-client, constants, etc.)
├── providers/                    # React context providers (auth, theme, command, etc.)
├── services/                     # API service functions
├── stores/                       # Zustand stores (graph, learning, platform, UI)
├── types/                        # Local type definitions
└── utils/                        # Array, function, number, object, string utils
```

### Provider Hierarchy

```
ThemeProvider
└── ReactQueryProvider
    └── AuthProvider
        └── TooltipProvider (Radix)
            └── ToastProvider
                └── ModalProvider
                    └── CommandProvider
                        └── GraphProvider
                            └── SkipNavigation + ErrorBoundary + Children
```

### Key Pages

| Route            | Purpose                                       | Auth Required |
| ---------------- | --------------------------------------------- | ------------- |
| `/`              | Landing page                                  | No            |
| `/login`         | Sign in                                       | No            |
| `/signup`        | Create account                                | No            |
| `/dashboard`     | Main dashboard with stats                     | Yes           |
| `/explore`       | Knowledge graph exploration                   | Yes           |
| `/graph`         | Full graph visualization (React Flow)         | Yes           |
| `/careers`       | Career paths & roadmaps                       | Yes           |
| `/learning`      | Learning paths & sessions                     | Yes           |
| `/projects`      | Hands-on projects                             | Yes           |
| `/progress`      | Learning progress & analytics                 | Yes           |
| `/bookmarks`     | Saved bookmarks                               | Yes           |
| `/search`        | Search & discovery                            | Yes           |
| `/ai-chat`       | AI assistant chat                             | Yes           |
| `/settings/*`    | User settings (profile, preferences, account) | Yes           |
| `/versions`      | Graph version history                         | Yes           |
| `/health`        | System health status                          | Yes           |
| `/import-export` | Data import/export                            | Yes           |
| `/notifications` | User notifications                            | Yes           |

---

## Shared Packages

### `@sv-os/config`

- **constants.ts**: Shared constants (API version, pagination defaults, graph config, rate limits, auth config, difficulties, node/edge types, colors, search weights)
- **env.ts**: Environment variable definitions with required/optional markers
- **tokens.ts**: Design tokens (colors, border radii, shadows, breakpoints, fonts)

### `@sv-os/types`

- **graph.ts**: GraphNode, GraphEdge, GraphStatistics interfaces
- **career.ts**: CareerPath, CareerRequirement, CareerRoadmap interfaces
- **project.ts**: Project, ProjectRequirement interfaces
- **auth.ts**: User, AuthTokens, LoginResponse interfaces
- **progress.ts**: ProgressStatus, ProgressStats interfaces
- **api.ts**: APIResponse, PaginatedResponse, APIError interfaces

### `@sv-os/ui`

23 reusable components built on Radix UI primitives:
Button, Badge, Card, Input, Label, Textarea, Alert, Separator, Avatar, Skeleton, LoadingSpinner, LoadingState, EmptyState, ErrorState, Progress, ScrollArea, Breadcrumb, Dialog, Popover, Tooltip, Tabs, DropdownMenu, Accordion, Select, Table, Pagination, HoverCard, ContextMenu, CommandPalette

### `@sv-os/eslint-config`

Three config presets: `base.js`, `next.js`, `react.js`

### `@sv-os/tsconfig`

Four config presets: `base.json`, `api.json`, `nextjs.json`, `react-library.json`

---

## Database

### Database Platform

- **PostgreSQL 16** with `asyncpg` driver
- **Schema**: 20 tables, 13 enum types, full-text search, triggers, views

### Core Tables

| Table                   | Purpose                      | Key Columns                                                             |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `users`                 | User accounts                | email, username, password_hash, role, preferences (JSONB)               |
| `knowledge_nodes`       | Graph nodes                  | slug, title, description, content, node_type, difficulty, search_vector |
| `knowledge_edges`       | Graph edges (adjacency list) | source_node_id, target_node_id, relationship_type, weight               |
| `careers`               | Career paths                 | slug, title, description, demand_level, average_salary                  |
| `projects`              | Learning projects            | slug, title, description, difficulty, tech_stack                        |
| `career_requirements`   | Career ↔ Node mappings       | career_id, node_id, requirement_type                                    |
| `project_requirements`  | Project ↔ Node mappings      | project_id, node_id, requirement_type                                   |
| `user_progress`         | Learning progress            | user_id, node_id, status, time_spent_minutes                            |
| `bookmarks`             | User bookmarks               | user_id, node_id, notes                                                 |
| `favorites`             | User favorites               | user_id, node_id                                                        |
| `learning_resources`    | External resources           | node_id, title, url, resource_type, platform                            |
| `search_history`        | User search history          | user_id, query, filters, results_count                                  |
| `activity_logs`         | Audit trail                  | user_id, action, entity_type, entity_id, metadata                       |
| `password_reset_tokens` | Password reset               | user_id, token_hash, expires_at                                         |

### Graph Structure (Adjacency List)

The knowledge graph uses an **adjacency list** pattern with recursive CTEs for traversal:

- `knowledge_nodes` — entities in the graph (subjects, concepts, technologies, etc.)
- `knowledge_edges` — directed relationships between nodes with type, direction, and weight
- 8 relationship types: prerequisite, depends_on, uses, enables, part_of, related_to, leads_to, requires

### Key Features

- **Full-text search** on `knowledge_nodes` using weighted `TSVECTOR` (A=title, B=description, C=content)
- **Soft delete** (`is_deleted`) and **optimistic locking** (`version`) on all entities
- **Database-level CHECK constraints** for enum validation
- **pg_trgm extension** for trigram-based fuzzy search
- **Views**: `v_node_statistics`, `v_user_progress_summary`

---

## API Layer

### API Design

- **Base URL**: `/api/v1/`
- **Response Format**: Uniform envelope (`success`, `message`, `data`, `errors`, `timestamp`, `request_id`)
- **Authentication**: Bearer JWT tokens
- **Documentation**: Swagger UI at `/docs` (dev only)

### Endpoint Groups

| Group               | Prefix                | Endpoints                                                                                                             |
| ------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Health**          | `/health`             | `GET /health`, `/health/live`, `/health/ready`, `/health/checks`                                                      |
| **Auth**            | `/auth`               | POST login, register, refresh, logout, change-password, forgot-password, reset-password; GET/PUT /me, /me/preferences |
| **Graph**           | `/graph`              | GET /full, /explore/{id}, /statistics, /prerequisites/{id}                                                            |
| **Nodes**           | `/nodes`              | CRUD operations on knowledge nodes                                                                                    |
| **Careers**         | `/careers`            | List, detail, requirements, roadmaps                                                                                  |
| **Projects**        | `/projects`           | List, detail, requirements                                                                                            |
| **Learning Paths**  | `/learning-paths`     | CRUD + generation                                                                                                     |
| **Progress**        | `/progress`           | User progress CRUD + statistics                                                                                       |
| **Search**          | `/search`             | Full-text + semantic search                                                                                           |
| **Bookmarks**       | `/bookmarks`          | CRUD                                                                                                                  |
| **Favorites**       | `/favorites`          | CRUD                                                                                                                  |
| **Skills**          | `/skills`             | Skill management                                                                                                      |
| **AI**              | `/ai`                 | Chat, embeddings, recommendations                                                                                     |
| **Activity**        | `/activity`           | Activity feed                                                                                                         |
| **Recommendations** | `/recommendations`    | Content recommendations                                                                                               |
| **Platform**        | (via platform router) | Status, versioning, import/export                                                                                     |

### Response Envelope

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-07-22T12:00:00Z",
  "request_id": "abc-123-def"
}
```

### Error Handling

- Centralized exception handlers in `app/exceptions/handlers.py`
- Custom `AppError` hierarchy with `status_code` and `detail`
- Validation errors from Pydantic returned as 422

---

## Authentication

### Mechanism

- **JWT-based** (HS256) with access + refresh token pairs
- Access tokens: 60-minute expiry
- Refresh tokens: 7-day expiry
- Password hashing: **bcrypt** via passlib

### Auth Flow

```
Client                      Server
  │                          │
  │── POST /auth/register ──→│  Create user (role=learner)
  │←── { access_token,      │
  │      refresh_token }     │
  │                          │
  │── POST /auth/login ─────→│  Verify credentials
  │←── { access_token,      │
  │      refresh_token }     │
  │                          │
  │── GET /auth/me ─────────→│  Validate Bearer token
  │── Authorization: Bearer │  Return user profile
  │←── { user_profile }     │
  │                          │
  │── POST /auth/refresh ───→│  Issue new token pair
  │←── { new tokens }       │
```

### Password Reset Flow

```
Client                      Server
  │                          │
  │── POST /auth/forgot-password ──→│  Generate SHA-256 hashed token
  │←── { reset_token (dev) }        │  1-hour expiry
  │                                  │
  │── POST /auth/reset-password ───→│  Verify token, update password
  │←── { success }                  │  Mark token as used
```

### Supabase Integration Ready

The auth service is designed so Supabase Auth can replace internal JWT logic by swapping `AuthService` methods without changing the API layer or frontend.

---

## Graph System

### Dual Representation

The knowledge graph exists in **two representations**:

1. **Database (persistent)**: Adjacency list in `knowledge_nodes` + `knowledge_edges` tables
2. **GraphEngine (in-memory)**: Runtime graph with indexes for fast traversal

### GraphEngine Capabilities

- **Node CRUD**: Add, remove, update, get, get-by-slug, get-by-type
- **Edge CRUD**: Add, remove, update, get, get-by-type
- **Adjacency**: Outgoing, incoming, neighbors, reverse-neighbors
- **Indexes**: slug → node_id, node_type → node_ids, relationship_type → edge_ids
- **Statistics**: Counts, density, average degree, type/relationship distribution
- **Versioning**: Semantic version bumped on mutations, snapshot history (max 10)
- **Integrity**: Node/edge validation, full integrity checks, cache sync

### Frontend Visualization

React Flow (reactflow v11) renders the graph with:

- Custom `KnowledgeNode` component with type-specific colors
- Smoothstep edges with animated prerequisites (dashed)
- Background grid, controls (zoom, fit), minimap
- Circular layout with configurable radius

---

## AI Integration

### Architecture

```
┌───────────────────────┐
│   AI Services Layer   │
├───────────────────────┤
│ EmbeddingService      │  ← Uses pluggable providers
│ RAGEngine             │  ← Retrieval-augmented generation
│ SemanticSearch        │  ← Vector similarity search
│ ContextEngine         │  ← Context-aware AI responses
│ HybridSearch          │  ← Combines FTS + semantic
│ ChatService           │  ← AI chat sessions
│ SecurityService       │  ← Prompt injection protection
│ Observability         │  ← AI usage monitoring
└───────────────────────┘
```

### Embedding Providers (Pluggable)

| Provider | Model                  | Dimensions     | Status         |
| -------- | ---------------------- | -------------- | -------------- |
| OpenAI   | text-embedding-3-small | 1536           | ✅ Implemented |
| Gemini   | (configurable)         | (configurable) | ✅ Implemented |
| Ollama   | (local models)         | (configurable) | ✅ Implemented |

### AI Features

- **Semantic search** over knowledge nodes using vector embeddings
- **RAG engine** for context-aware responses about CS topics
- **Hybrid search** combining PostgreSQL full-text search + vector similarity
- **Ranking service** for result relevance scoring
- **AI chat** with session history and memory
- **Prompt injection detection** and security filtering

---

## Learning System

### Components

| Component                    | Status         | Description                                                       |
| ---------------------------- | -------------- | ----------------------------------------------------------------- |
| Progress Tracking            | ✅ Implemented | Track node status (not_started → learning → completed → mastered) |
| Learning Sessions            | ✅ Implemented | Per-node learning session management                              |
| Learning Resources           | ✅ Implemented | Curated external resources (videos, articles, courses, books)     |
| Learning Path Generation     | 🟡 In Progress | Auto-generate paths based on goals                                |
| Recommendation Engine        | 🟡 In Progress | Personalized content recommendations                              |
| Spaced Repetition (Revision) | 🟡 In Progress | Review scheduling for retention                                   |

### Progress Statuses

- `not_started` — Node not yet engaged
- `learning` — Currently studying
- `completed` — Content consumed, exercises done
- `mastered` — Can teach others, passed assessment

---

## Deployment

### Docker Architecture

**Development** (`docker-compose.yml`):

- PostgreSQL 16 + pgAdmin (tools profile)
- Schema managed via Alembic migrations

**Production** (`docker-compose.prod.yml`):

- PostgreSQL 16
- API (FastAPI via uvicorn)
- Web (Next.js standalone server)
- Health checks on all services

### Dockerfiles

**API** (`Dockerfile.api`): Multi-stage build

- **Builder**: Python 3.12-slim, installs deps via uv
- **Runner**: Python 3.12-slim, copies app code, runs uvicorn on port 8000

**Web** (`Dockerfile.web`): Multi-stage build

- **base**: Node.js 22-alpine with corepack
- **deps**: Package.json files → pnpm install (layer caching)
- **builder**: Source + deps → next build (standalone output)
- **runner**: Node.js 22-alpine, non-root user, port 3000

---

## CI/CD

### GitHub Actions Workflows

**CI Pipeline** (`.github/workflows/ci.yml`):

- Trigger: Push/PR to main/develop (excluding docs, .ai)
- Services: PostgreSQL 16
- Steps:
  1. pnpm setup + install (frozen lockfile)
  2. Python 3.12 setup + pip install (editable + dev)
  3. TypeScript type check (`pnpm typecheck`)
  4. Lint (`pnpm lint`)
  5. Build (`pnpm build`)
  6. Backend lint (Ruff)
  7. Backend tests (pytest with coverage)
  8. Docker builds (API + Web)

**Lint Pipeline** (`.github/workflows/lint.yml`):

- Trigger: Push/PR to non-main branches
- Steps: Format check (`pnpm format:check`), Lint (`pnpm lint`)

---

## Build Process

### Development

```bash
pnpm install                    # Install all dependencies
pnpm dev                        # Start all apps in dev mode
pnpm dev:web                    # Start only web
pnpm dev:api                    # Start only API (uvicorn)
```

### Build

```bash
pnpm build                      # Build all packages and apps
pnpm typecheck                  # TypeScript type checking
pnpm lint                       # Lint all workspaces
pnpm test                       # Run all tests
```

### Turbo Pipeline

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true, "dependsOn": ["^build"] },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
```

---

## Coding Standards

### Python (Backend)

- Python 3.12+ with type hints everywhere
- Ruff for linting (select: E, F, I, N, W, UP, B, SIM, ARG, RUF)
- Single quotes (configured via Ruff)
- Line length: 100 characters
- Async first: all DB operations use asyncpg + asyncio
- Pydantic v2 for all data validation
- Repository pattern with Unit of Work
- Engine lifecycle pattern for services

### TypeScript/React (Frontend)

- TypeScript strict mode with `noUncheckedIndexedAccess`
- ES2022 target, ESNext modules, bundler resolution
- Functional components with hooks
- React Query for server state, Zustand for client state
- Tailwind CSS v4 (utility-first, @theme tokens)
- Radix UI primitives for accessibility

### General

- Conventional commits (`type(scope): description`)
- Prettier for formatting
- Husky pre-commit hooks (lint-staged)
- commitlint for commit message validation

---

## Environment Variables

### Backend (`apps/api/.env`)

| Variable               | Required | Default                                                           | Description                  |
| ---------------------- | -------- | ----------------------------------------------------------------- | ---------------------------- |
| `DATABASE_URL`         | ✅       | `postgresql+asyncpg://svos:svos_dev_password@localhost:5432/svos` | PostgreSQL connection string |
| `SUPABASE_URL`         | ✅       | `''`                                                              | Supabase project URL         |
| `SUPABASE_SERVICE_KEY` | ✅       | `''`                                                              | Supabase service role key    |
| `SECRET_KEY`           | ✅       | `change-me-in-production`                                         | JWT signing secret           |
| `ENVIRONMENT`          | ❌       | `development`                                                     | Runtime environment          |
| `LOG_LEVEL`            | ❌       | `INFO`                                                            | Logging level                |
| `CORS_ORIGINS`         | ❌       | `http://localhost:3000`                                           | Allowed CORS origins         |
| `SENTRY_DSN`           | ❌       | `''`                                                              | Sentry error tracking DSN    |
| `OPENAI_API_KEY`       | ❌       | `''`                                                              | OpenAI API key               |
| `FEATURE_FLAGS`        | ❌       | `analytics:on,search:on,plugins:off`                              | Feature toggles              |

### Frontend (`apps/web/.env.local`)

| Variable                        | Required | Description                 |
| ------------------------------- | -------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`           | ✅       | Backend API base URL        |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | Supabase project URL        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | Supabase anon key           |
| `NEXT_PUBLIC_APP_URL`           | ❌       | Public app URL (production) |

---

## Future Expansion

### Near-term (Phase 3)

- ✅ **Learning path generation** — Auto-generate personalized paths from goal → current knowledge
- ✅ **Recommendation engine** — Context-aware content recommendations
- ✅ **Spaced repetition** — Revision scheduling using the RevisionEngine
- ⬜ **Plugin system** — Community-contributed engines and capabilities

### Medium-term

- ⬜ **Community features** — Public node contributions, reviews, ratings
- ⬜ **Gamification** — Achievements, streaks, leaderboards
- ⬜ **Social features** — Study groups, peer reviews, shared learning paths
- ⬜ **SSR & SEO optimization** — Enhanced server-side rendering for public content

### Long-term

- ⬜ **Mobile application** — Native iOS/Android apps
- ⬜ **Offline support** — Local-first architecture with sync
- ⬜ **AI tutoring** — Personalized AI tutor per learner
- ⬜ **Enterprise features** — Team management, SSO, compliance

---

## Risks

| Risk                                    | Impact | Mitigation                                                                      |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Graph scalability at large node counts  | High   | GraphEngine is in-memory — need sharding or DB-backed traversal for 100K+ nodes |
| In-process event bus not durable        | Medium | Events lost on crash — future: Redis Pub/Sub or message queue                   |
| Single database bottleneck              | Medium | Read replicas, connection pooling already configured                            |
| No caching layer for read-heavy queries | Medium | In-memory cache exists but limited — future: Redis                              |
| Authentication not extensible           | Low    | Service designed for Supabase Auth swap                                         |
| Frontend bundle size                    | Low    | Next.js transpilePackages, optimizePackageImports configured                    |

---

## Known Limitations

1. **GraphEngine is entirely in-memory** — All nodes and edges must fit in RAM. No persistence layer for the engine itself (persistence is through the database only).
2. **Event bus is in-process** — Events are not persisted; a server restart loses queued events.
3. **No Redis/Memcached** — Production deployment should include a dedicated cache.
4. **Rate limiting is in-memory** — Per-process counters; doesn't work across multiple API instances.
5. **WebSocket manager is a stub** — Real-time features like live graph collaboration not yet implemented.
6. **Plugin system is scaffolded** — Plugin loading, sandboxing, and lifecycle not yet implemented.
7. **No CI for frontend tests** — Frontend tests exist in vitest but not yet wired into CI pipeline.
8. **pgAdmin is dev-only** — Not included in production Docker Compose.
9. **Migration from native enums to VARCHAR** — Recent migration (0006) converts enums to VARCHAR with CHECK constraints for compatibility.
10. **No database connection pooling beyond SQLAlchemy pool** — PgBouncer or similar not configured.

---

_This document is cross-referenced with [ARCHITECTURE.md](./ARCHITECTURE.md), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md), and [CONTRIBUTING_AI.md](./CONTRIBUTING_AI.md)._
