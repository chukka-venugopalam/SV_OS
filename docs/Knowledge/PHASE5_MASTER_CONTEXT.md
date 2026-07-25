# SV-OS Phase 5 — Master Context Document

> **Single Source of Truth for the Knowledge Engine**
>
> **Project**: Silicon Valley Learning OS (SV-OS)
> **Version**: 0.3.0 | **Date**: July 23, 2026 | **Phase**: 5 (Knowledge Engine Import Pipeline)
> **Status**: Infrastructure v1 ✅, Backend Foundation ✅, Frontend Foundation ✅, AI Integration ✅, Knowledge Import Pipeline 🟡 In Progress
>
> **Purpose**: Any AI (Claude, ChatGPT, Gemini, Freebuff, Copilot) can read ONLY this file and immediately understand the entire project to continue development without reading any other documentation.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Repository Status](#2-current-repository-status)
3. [Complete Repository Architecture](#3-complete-repository-architecture)
4. [Learning Philosophy](#4-learning-philosophy)
5. [Knowledge Engine](#5-knowledge-engine)
6. [Database](#6-database)
7. [API](#7-api)
8. [Current Progress](#8-current-progress)
9. [Phase 5 Roadmap](#9-phase-5-roadmap)
10. [Engineering Rules](#10-engineering-rules)
11. [AI Working Instructions](#11-ai-working-instructions)
12. [Master Checklist](#12-master-checklist)

---

# 1 Executive Summary

## Vision

**Become the definitive interactive map for Computer Science learning** — the "Google Maps for Computer Science" that every developer worldwide uses to navigate their learning journey.

## Mission

Provide an open, interactive knowledge graph platform that:

- **Maps** every CS concept, technology, tool, project, and career into a navigable graph
- **Guides** learners through clear prerequisite chains and optimal learning paths
- **Tracks** individual progress with detailed analytics and spaced repetition
- **Recommends** what to study next using deterministic, explainable rules
- **Connects** learning to real-world outcomes (careers, projects, skills)
- **Integrates** AI for contextual assistance without replacing human curation

## Problems Solved

| Problem                         | SV-OS Solution                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Fragmented learning**         | Most platforms treat CS as isolated courses. SV-OS treats it as a connected graph.                    |
| **No prerequisite visibility**  | Learners don't know what to learn next. SV-OS shows clear prerequisite chains.                        |
| **One-size-fits-all curricula** | Fixed curricula ignore learner velocity. SV-OS adapts paths in real-time.                             |
| **Theory without context**      | Concepts taught without real-world relevance. SV-OS shows why each node matters for careers/projects. |
| **No mastery tracking**         | Completion ≠ mastery. SV-OS tracks 5-dimensional mastery scores.                                      |
| **Knowledge decay ignored**     | Learned content is forgotten. SV-OS schedules spaced repetition reviews.                              |

## Target Users

| User                       | Need                                  | SV-OS Role                       |
| -------------------------- | ------------------------------------- | -------------------------------- |
| **CS Students**            | Navigate degree curriculum, fill gaps | Academic roadmap companion       |
| **Self-taught Developers** | Decide what to learn next             | Career-based pathfinding         |
| **Career Switchers**       | Transition into tech with a plan      | Personalized transition roadmaps |
| **Educators**              | Design curriculum, see dependencies   | Curriculum design tool           |
| **Interview Prep**         | Focus study on career requirements    | Targeted path generation         |

## Unique Value

1. **Graph-First Architecture**: The knowledge graph is the core data structure — everything else (careers, projects, learning paths) is derived from it.
2. **Deterministic Recommendations**: Rule-based, explainable recommendations (not black-box ML). Every recommendation includes a reasoning chain.
3. **Dual Representation**: Persistent adjacency list in PostgreSQL + in-memory graph with indexes for sub-millisecond traversal.
4. **Open by Default**: Public knowledge graph, community-contributed content, MIT-licensed.
5. **AI-Augmented, Not AI-Dependent**: All core capabilities work without ML. AI is additive — embeddings, RAG, and semantic search enhance but never replace deterministic algorithms.

## Key Metrics (Current)

- **Nodes in graph**: 40 (Stage 5.1 reference dataset), targeting 221 (Stage 5.2 full graph)
- **Backend endpoints**: 26 endpoint groups (21 authenticated)
- **Engines**: 19 registered (20 files, 19 wired into container)
- **Database tables**: 23 core + Phase 5 audit additions (domains, learning_goals, learning_goal_nodes)
- **Frontend pages**: 26 routes (21 authenticated)
- **Shared UI components**: 23+
- **Contributors**: Single developer (Phase 1-2), open for Phase 3+ contributions

---

# 2 Current Repository Status

## Architecture Completed

| Layer                   | Status         | Details                                                                    |
| ----------------------- | -------------- | -------------------------------------------------------------------------- |
| **Monorepo Structure**  | ✅ Complete    | pnpm workspaces + Turborepo, Python + TypeScript                           |
| **Backend Foundation**  | ✅ Complete    | FastAPI, SQLAlchemy 2.0, 18+ repositories, 15+ services                    |
| **Engine System**       | ✅ Complete    | 19 engines with lifecycle, EventBus, DI container, registries              |
| **Frontend Foundation** | ✅ Complete    | Next.js 15, Radix UI, Tailwind v4, 25+ pages, all components               |
| **AI Integration**      | ✅ Complete    | Embedding providers (OpenAI/Gemini/Ollama), RAG, semantic search           |
| **Infrastructure**      | ✅ Complete    | Middleware stack (9 layers), health monitoring, caching, telemetry         |
| **Knowledge Import**    | 🟡 In Progress | Stage 5.1 reference dataset (40 nodes) imported, validation pipeline built |

## Backend Completed

- **Models**: All 20+ SQLAlchemy ORM models (knowledge_node, knowledge_edge, career, project, user, progress, bookmarks, favorites, skills, tags, learning_paths, learning_sessions, activity_logs, recommendations, etc.)
- **Repositories**: 18+ repository classes with BaseRepository providing CRUD, pagination, soft-delete, and optimistic locking
- **Unit of Work**: Transaction management with async context manager
- **Services**: 15+ services including AuthService, GraphTraversalService, KnowledgeNodeService, SearchService, LearningPathService, CareerService, ProjectService, BookmarkService, ProgressService, SkillService, AI services (embedding, chat, RAG, semantic search, ranking, hybrid search)
- **Engines**: 19 registered engines (GraphEngine, KnowledgeEngine, TraversalEngine, RecommendationEngine, CareerEngine, LearningPathEngine, AnalyticsEngine, StateEngine, EventEngine, VersioningEngine, ValidationEngine, ImportEngine, ExportEngine, DependencyEngine, QueryEngine, AssessmentEngine, RevisionEngine, SchedulerEngine, PluginEngine)
- **Event Bus**: In-process async event bus with publish/subscribe pattern, idempotency dedup, dead letter queue
- **Middleware**: CORS, CSRF, Rate Limit, Timing, Correlation ID, Request ID, Security Headers, Trusted Hosts, GZip — 9 layers
- **API Endpoints**: 25+ endpoint groups covering health, auth, nodes, graph, careers, projects, learning paths, progress, search, bookmarks, favorites, skills, AI chat, activity, recommendations, import/export, platform

## Frontend Completed

- **Pages**: Landing, Login, Signup, Forgot/Reset Password, Dashboard, Explore, Graph (React Flow), Careers, Learning, Projects, Progress, Bookmarks, Search, AI Chat, Settings (Profile/Preferences/Account), Health, Versions, Import/Export, Notifications
- **Providers**: ThemeProvider, ReactQueryProvider, AuthProvider, TooltipProvider, ToastProvider, ModalProvider, CommandProvider, GraphProvider
- **Stores**: ui-store (sidebar, theme, modals), graph-store (selected nodes, viewport, filters), learning-store (active session, current path), platform-store (system status, feature flags)
- **Shared UI**: 23+ components (Button, Badge, Card, Input, Dialog, Popover, Tooltip, Tabs, DropdownMenu, Accordion, Table, Pagination, HoverCard, ContextMenu, CommandPalette, Skeleton, LoadingSpinner, EmptyState, ErrorState, etc.)
- **API Services**: Complete client service modules for graph, progress, careers, projects, search, settings, bookmarks, activity, knowledge

## CI Status

| Check                 | Status         | Details                                                                                                      |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Ruff (lint)**       | ✅ Passing     | 315 files clean                                                                                              |
| **Format**            | ✅ Passing     | Ruff format applied                                                                                          |
| **Compileall**        | ✅ Passing     | All Python files compile                                                                                     |
| **Mypy**              | ❌ 225 errors  | Pre-existing across 57 files (repositories, engines, services, endpoints)                                    |
| **Pytest**            | ⏸️ Requires DB | Needs PostgreSQL running                                                                                     |
| **Alembic**           | ⏸️ Requires DB | Needs PostgreSQL running                                                                                     |
| **GitHub Actions CI** | 🟡 Partial     | Runs on push/PR to main/develop; includes pnpm setup, TS typecheck, lint, build, Ruff, pytest, Docker builds |

## Docker Status

| Service        | Status        | Details                                                             |
| -------------- | ------------- | ------------------------------------------------------------------- |
| **PostgreSQL** | ✅ Configured | docker-compose.yml, port 5432                                       |
| **API**        | ✅ Configured | Dockerfile.api, port 8000, multi-stage build                        |
| **Web**        | ✅ Configured | Dockerfile.web, port 3000, multi-stage build with standalone output |
| **Production** | ✅ Configured | docker-compose.prod.yml with health checks                          |

## Testing Status

| Layer              | Status         | Details                                                                                                                                                   |
| ------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend tests**  | 🟡 Partial     | 7 test files (test_engine_lifecycle, test_graph_platform, test_health, test_ms56_engines, test_ms7_platform, test_ms8_platform, test_platform_foundation) |
| **Frontend tests** | 🟡 Not in CI   | vitest configured but not wired into GitHub Actions                                                                                                       |
| **Coverage**       | ⬜ Not tracked | No coverage configured                                                                                                                                    |

## Current Git Tag

- **No tags published** — repository at commit `main` branch
- **Latest commits**: Docker CI fixes, UI component type fixes, import pipeline work

## Completed Phases

| Phase         | Description                                                                        | Status      |
| ------------- | ---------------------------------------------------------------------------------- | ----------- |
| **Phase 0**   | Repository bootstrap, monorepo setup, initial toolchain                            | ✅ Complete |
| **Phase 1**   | Core infrastructure: FastAPI app, PostgreSQL schema, Alembic, Docker, CI/CD        | ✅ Complete |
| **Phase 2.0** | Backend foundation: All models, repositories, services, API endpoints, auth, graph | ✅ Complete |
| **Phase 2.1** | Engine system: 20 engines with lifecycle, event bus, DI container, registries      | ✅ Complete |
| **Phase 2.2** | Frontend foundation: Next.js 15, Radix UI, Tailwind v4, all pages and components   | ✅ Complete |
| **Phase 2.3** | Platform infrastructure: Health monitoring, telemetry, middleware stack, caching   | ✅ Complete |
| **Phase 2.4** | AI integration: Embedding providers, RAG engine, semantic search, context engine   | ✅ Complete |
| **Phase 5.0** | Knowledge import service design and implementation                                 | ✅ Complete |

## Pending Phases

| Phase         | Description                                                       | Status         |
| ------------- | ----------------------------------------------------------------- | -------------- |
| **Phase 3.0** | Learning path generation & recommendation engines (service layer) | 🟡 In Progress |
| **Phase 3.1** | Spaced repetition & revision engine                               | 🟡 In Progress |
| **Phase 3.2** | Plugin system & community features                                | ⬜ Planned     |
| **Phase 3.3** | Performance optimization & scaling                                | ⬜ Planned     |
| **Phase 3.4** | Mobile responsive & PWA                                           | ⬜ Planned     |
| **Phase 5.1** | Reference dataset import (40 nodes) — DONE                        | ✅ Complete    |
| **Phase 5.2** | 204-node full knowledge graph import                              | ⬜ Planned     |
| **Phase 5.3** | Read path UI for imported graph                                   | ⬜ Planned     |
| **Phase 5.4** | Graph visualization integration                                   | ⬜ Planned     |
| **Phase 5.5** | Learning goals → career path generation                           | ⬜ Planned     |
| **Phase 5.6** | Project recommendations from graph                                | ⬜ Planned     |
| **Phase 5.7** | Simulator integration                                             | ⬜ Planned     |
| **Phase 5.8** | Cross-domain relationship discovery                               | ⬜ Planned     |
| **Phase 5.9** | Learning path optimization                                        | ⬜ Planned     |

---

# 3 Complete Repository Architecture

## Repository Structure

```
sv-os/
├── .ai/                              # AI context & project memory
├── .github/                          # GitHub config, CI/CD workflows
│   ├── workflows/
│   │   ├── ci.yml                    # Full CI pipeline
│   │   └── lint.yml                  # Lint & format check
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .husky/                           # Git hooks (pre-commit, commit-msg)
├── apps/
│   ├── api/                          # FastAPI backend (Python 3.12)
│   │   ├── alembic/                  # Migration versions
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── deps.py           # FastAPI dependencies (DB, auth, UoW)
│   │   │   │   └── v1/
│   │   │   │       ├── router.py     # Main v1 router + health endpoints
│   │   │   │       └── endpoints/    # 25+ endpoint modules
│   │   │   ├── capabilities/         # Platform capabilities
│   │   │   ├── core/                 # Config, database, logging
│   │   │   ├── domain/               # Pure domain dataclasses
│   │   │   ├── engines/              # 20 engine files (19 registered)
│   │   │   ├── events/bus/           # Async event bus
│   │   │   ├── exceptions/           # AppError hierarchy + handlers
│   │   │   ├── infrastructure/       # Container, cache, registries, runtime
│   │   │   ├── middleware/           # 9 middleware modules
│   │   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── repositories/         # 18+ repository classes
│   │   │   ├── schemas/              # Pydantic schemas
│   │   │   ├── services/             # Business logic + AI services
│   │   │   ├── startup/              # Lifespan, diagnostics
│   │   │   ├── telemetry/            # Health, metrics, tracing
│   │   │   └── utils/                # Helpers
│   │   ├── tests/                    # pytest tests
│   │   ├── pyproject.toml            # Python dependencies
│   │   └── Dockerfile                # API Dockerfile
│   └── web/                          # Next.js 15 frontend (TypeScript)
│       └── src/
│           ├── app/                  # App Router pages & layouts
│           ├── components/           # React components
│           │   ├── auth/             # Protected route wrapper
│           │   ├── graph/            # React Flow components
│           │   ├── layout/           # AppShell, Sidebar, TopNav, Footer
│           │   └── shared/           # ErrorBoundary, animations, shell
│           ├── features/             # Feature-specific components
│           ├── hooks/                # 20+ custom hooks
│           ├── lib/                  # Utilities (api-client, auth-client)
│           ├── providers/            # React context providers
│           ├── services/             # API service functions
│           ├── stores/               # Zustand stores
│           ├── types/                # Local types
│           └── utils/                # Pure utilities
├── database/
│   ├── migrations/                   # Migration documentation
│   ├── scripts/                      # backup, restore, seed, reset
│   ├── seeds/                        # 9 seed SQL files
│   └── schema.sql                    # Canonical schema
├── docs/                             # Project documentation (63+ .md files)
├── packages/
│   ├── config/                       # Shared constants, env, tokens
│   │   └── src/
│   │       ├── constants.ts          # API version, pagination, graph config
│   │       ├── env.ts                # Environment variable definitions
│   │       └── tokens.ts             # Design tokens
│   ├── eslint-config/               # ESLint presets (base, next, react)
│   ├── tsconfig/                     # TS config presets
│   ├── types/                        # Shared TypeScript interfaces
│   │   └── src/
│   │       ├── graph.ts             # GraphNode, GraphEdge, GraphStatistics
│   │       ├── career.ts            # CareerPath, CareerRequirement
│   │       ├── project.ts           # Project, ProjectRequirement
│   │       ├── auth.ts              # User, AuthTokens
│   │       ├── progress.ts          # ProgressStatus, ProgressStats
│   │       └── api.ts               # APIResponse, PaginatedResponse
│   └── ui/                           # Shared UI component library (23 components)
├── scripts/                          # Utility scripts
├── docker-compose.yml               # Dev Docker setup
├── docker-compose.prod.yml          # Production Docker setup
├── Dockerfile.api                    # API Dockerfile (multi-stage)
├── Dockerfile.web                    # Web Dockerfile (multi-stage)
├── computer_science_map.json         # Stage 5.1 reference dataset (40 nodes)
├── package.json                      # Root package.json
├── pnpm-workspace.yaml              # pnpm workspace definition
├── turbo.json                        # Turborepo config
└── commitlint.config.js             # Commit lint rules
```

## Frontend Architecture

### Technology Stack

| Technology           | Version | Purpose                                |
| -------------------- | ------- | -------------------------------------- |
| TypeScript           | 5.8+    | Language                               |
| Next.js              | 15.3+   | React framework (App Router)           |
| React                | 19.1+   | UI library                             |
| Tailwind CSS         | 4.1+    | Styling (utility-first, @theme tokens) |
| Radix UI             | latest  | Accessible primitives                  |
| TanStack React Query | 5.75+   | Server state management                |
| Zustand              | 5.0+    | Client state management                |
| React Flow           | 11.11+  | Graph visualization                    |
| Framer Motion        | 12.8+   | Animations                             |
| Lucide React         | 0.487+  | Icons                                  |
| next-themes          | 0.4+    | Dark mode                              |
| zod                  | 3.24+   | Validation                             |
| react-hook-form      | 7.55+   | Forms                                  |

### State Management

| State Type         | Tool                     | Purpose                                               |
| ------------------ | ------------------------ | ----------------------------------------------------- |
| **Server state**   | React Query              | Data from API (user, graph, progress, search results) |
| **UI state**       | Zustand (ui-store)       | Sidebar toggle, theme, modals                         |
| **Graph state**    | Zustand (graph-store)    | Selected nodes, viewport, filters                     |
| **Learning state** | Zustand (learning-store) | Active session, current path                          |
| **Platform state** | Zustand (platform-store) | System status, feature flags                          |

### Data Flow Pattern

```
User Interaction → Hook (useGraph, useProgress)
    → Service (graph.ts, progress.ts)
        → API Client (api-client.ts)
            → HTTP Request → Backend
        ← JSON Response (unified envelope)
    ← React Query Cache
→ Component Re-render
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

### All Routes

| Route                   | Auth | Layout | Purpose                               |
| ----------------------- | ---- | ------ | ------------------------------------- |
| `/`                     | No   | None   | Landing page                          |
| `/login`                | No   | (auth) | Sign in                               |
| `/signup`               | No   | (auth) | Create account                        |
| `/forgot-password`      | No   | (auth) | Password reset request                |
| `/reset-password`       | No   | (auth) | Password reset                        |
| `/dashboard`            | Yes  | (main) | Main dashboard                        |
| `/explore`              | Yes  | (main) | Browse graph                          |
| `/explore/[slug]`       | Yes  | (main) | Node detail                           |
| `/graph`                | Yes  | (main) | Full graph visualization (React Flow) |
| `/careers`              | Yes  | (main) | Career paths                          |
| `/careers/[slug]`       | Yes  | (main) | Career detail                         |
| `/learning`             | Yes  | (main) | Learning paths                        |
| `/projects`             | Yes  | (main) | Projects                              |
| `/projects/[slug]`      | Yes  | (main) | Project detail                        |
| `/progress`             | Yes  | (main) | Learning analytics                    |
| `/bookmarks`            | Yes  | (main) | Saved bookmarks                       |
| `/search`               | Yes  | (main) | Search                                |
| `/notifications`        | Yes  | (main) | Notifications                         |
| `/ai-chat`              | Yes  | (main) | AI assistant                          |
| `/settings`             | Yes  | (main) | Settings hub                          |
| `/settings/profile`     | Yes  | (main) | Profile settings                      |
| `/settings/preferences` | Yes  | (main) | Preferences                           |
| `/settings/account`     | Yes  | (main) | Account settings                      |
| `/health`               | Yes  | (main) | System health                         |
| `/versions`             | Yes  | (main) | Graph versions                        |
| `/import-export`        | Yes  | (main) | Data management                       |

## Backend Architecture

### Technology Stack

| Technology        | Version        | Purpose                 |
| ----------------- | -------------- | ----------------------- |
| Python            | 3.12+          | Runtime                 |
| FastAPI           | 0.115+         | Web framework           |
| SQLAlchemy        | 2.0+ (asyncio) | ORM                     |
| asyncpg           | 0.30+          | PostgreSQL async driver |
| Alembic           | 1.14+          | Database migrations     |
| Pydantic v2       | 2.10+          | Validation & settings   |
| Pydantic-Settings | 2.7+           | Environment config      |
| python-jose       | 3.3+           | JWT tokens              |
| passlib[bcrypt]   | 1.7+           | Password hashing        |
| structlog         | 25.1+          | Structured logging      |
| httpx             | 0.28+          | HTTP client             |
| sentry-sdk        | 2.22+          | Error tracking          |

### Layer Architecture

```
──────────────────────────────────────────────
  MIDDLEWARE LAYER (9 layers, outer→inner)
  CORS → CSRF → Rate Limit → Timing →
  Correlation ID → Request ID → Security Headers →
  Trusted Hosts → GZip
──────────────────────────────────────────────
  API LAYER
  FastAPI Router → Endpoint Handlers →
  Pydantic Validation → Response Envelope
──────────────────────────────────────────────
  SERVICE LAYER
  AuthService, GraphService, UserService,
  SearchService, ProgressService, etc.
──────────────────────────────────────────────
  ENGINE LAYER (19 engines)
  Graph → Knowledge → Traversal → Search →
  Recommendation → Learning Path → Career →
  Analytics → Versioning → Import/Export → etc.
──────────────────────────────────────────────
  INFRASTRUCTURE LAYER
  Event Bus → Cache → Container → Registries →
  Audit → WebSocket → Workers
──────────────────────────────────────────────
  REPOSITORY LAYER (18+ repositories)
  BaseRepository → QueryBuilder → Pagination
  UserRepository, NodeRepository, EdgeRepository, etc.
  UnitOfWork → Transaction Management
──────────────────────────────────────────────
  DATA LAYER
  SQLAlchemy ORM Models → PostgreSQL 16
──────────────────────────────────────────────
```

### Middleware Stack (Outer to Inner)

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

All 20 engines inherit from `EngineBase`:

**Lifecycle States**: `UNINITIALIZED → INITIALIZING → READY → RUNNING → STOPPING → STOPPED → FAILED`

**19 Registered Engines** (20 files, 19 wired into PlatformContainer):

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

**Not wired**: `search_engine.py`, `simulator_engine.py` exist as files but are not registered in the container.

### Request Flow

```
Client → Middleware (9 layers) → Router → Endpoint Handler
    → Pydantic Validation → Service → Engine (if needed)
    → UnitOfWork → Repository → Database
    ← Response Envelope ← Client
```

### Event Bus

- **In-process** async event bus with publish/subscribe
- **Features**: At-least-once delivery, idempotency dedup (UUID v4 event_id), dead letter queue after 3 retries
- **Limitation**: Events are not persisted; a server restart loses queued events
- **Future**: Redis Pub/Sub or message queue adapter for distributed deployment

### Event Types

| Event                         | Publisher            | Subscribers      |
| ----------------------------- | -------------------- | ---------------- |
| `platform.started`            | Lifespan             | All engines      |
| `recommendation.generated.v1` | RecommendationEngine | Analytics, State |
| `engine.initialized`          | EngineRegistry       | Health checker   |
| `engine.started`              | EngineRegistry       | Health checker   |

## Packages Architecture

### `@sv-os/config`

- **constants.ts**: API version, pagination defaults, graph config, rate limits, auth config, difficulties, node/edge types, colors, search weights
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

23 reusable components: Button, Badge, Card, Input, Label, Textarea, Alert, Separator, Avatar, Skeleton, LoadingSpinner, LoadingState, EmptyState, ErrorState, Progress, ScrollArea, Breadcrumb, Dialog, Popover, Tooltip, Tabs, DropdownMenu, Accordion, Select, Table, Pagination, HoverCard, ContextMenu, CommandPalette

### Other Packages

- `@sv-os/eslint-config`: base.js, next.js, react.js presets
- `@sv-os/tsconfig`: base.json, api.json, nextjs.json, react-library.json presets

## Database Architecture

### Platform

- **PostgreSQL 16** with asyncpg driver
- **Extensions**: uuid-ossp, pgcrypto, pg_trgm, unaccent, btree_gin, btree_gist
- **Schema**: 20 core tables + v1.1 extensions, 13 enum types (now VARCHAR with CHECK constraints after migration 0006), full-text search, triggers, views

### Core Tables (20)

| Table                  | Purpose                      | Key Columns                                                             |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `users`                | User accounts                | email, username, password_hash, role, preferences (JSONB)               |
| `knowledge_nodes`      | Graph nodes                  | slug, title, description, content, node_type, difficulty, search_vector |
| `knowledge_edges`      | Graph edges (adjacency list) | source_node_id, target_node_id, relationship_type, weight               |
| `careers`              | Career paths                 | slug, title, description, demand_level, average_salary                  |
| `career_requirements`  | Career ↔ Node mappings       | career_id, node_id, requirement_type                                    |
| `projects`             | Learning projects            | slug, title, description, difficulty, tech_stack                        |
| `project_requirements` | Project ↔ Node mappings      | project_id, node_id, requirement_type                                   |
| `learning_resources`   | External resources           | node_id, title, url, resource_type, platform                            |
| `learning_paths`       | Curated learning paths       | title, strategy, milestones, completion percentage                      |
| `learning_sessions`    | Study sessions               | user_id, node_id, duration_minutes                                      |
| `skills`               | Discrete abilities           | name, category                                                          |
| `skill_relationships`  | Skill→Skill edges            | source_skill_id, target_skill_id, relationship_type                     |
| `user_progress`        | Learning progress            | user_id, node_id, status, time_spent_minutes                            |
| `bookmarks`            | User bookmarks               | user_id, node_id, notes                                                 |
| `favorites`            | User favorites               | user_id, node_id                                                        |
| `search_history`       | User search history          | user_id, query, filters, results_count                                  |
| `activity_logs`        | Audit trail                  | user_id, action, entity_type, entity_id, metadata                       |
| `recommendations`      | Content suggestions          | user_id, node_id, reason, score                                         |
| `tags`                 | Free-form labels             | name                                                                    |
| `node_tags`            | Node↔Tag join                | node_id, tag_id                                                         |

### v1.1 Extension Tables

| Table                    | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `categories`             | Domain/category groupings                                                          |
| `nodes`                  | Extended node storage (alternative schema for import pipeline)                     |
| `node_details`           | Detailed node metadata                                                             |
| `node_edges`             | Edge storage matching sv-os-database-schema.sql                                    |
| `simulators`             | Interactive simulation definitions                                                 |
| `node_simulators`        | Node↔Simulator many-to-many                                                        |
| `node_projects`          | Node↔Project many-to-many                                                          |
| `career_nodes`           | Career↔Node mapping with sequence_order                                            |
| `hidden_relationships`   | Cross-domain insight connections (not dependency edges)                            |
| `concept_decomposition`  | Hierarchical decomposition (Domain→Module→Topic→Concept→Micro-Concept→Atomic Unit) |
| `seniority_levels`       | 10-level seniority ladder (Complete Beginner→Innovator)                            |
| `career_seniority_nodes` | Career↔Seniority↔Node mapping                                                      |
| `learners`               | Learner profiles                                                                   |
| `learner_progress`       | Per-learner per-node progress tracking                                             |

### Index Strategy

Total: 30+ indexes across all tables. Key groups:

- **Graph Traversal**: knowledge_edges(source_node_id), knowledge_edges(target_node_id), composite (source_node_id, target_node_id), knowledge_edges(relationship_type)
- **Full-Text Search**: knowledge_nodes.search_vector (GIN)
- **Filtered Queries**: knowledge_nodes(is_published), knowledge_nodes(node_type), knowledge_nodes(difficulty)
- **User Data**: user_progress(user_id), bookmarks(user_id), favorites(user_id), search_history(user_id)

### Seed Data (9 files)

| File                        | Records | Description                     |
| --------------------------- | ------- | ------------------------------- |
| `01_subjects.sql`           | 12      | Top-level academic subjects     |
| `02_concepts.sql`           | 30      | Core CS concepts                |
| `03_technologies.sql`       | 17      | Technologies and frameworks     |
| `04_careers.sql`            | 9       | Professional career paths       |
| `05_projects.sql`           | 10      | Hands-on build exercises        |
| `06_edges.sql`              | ~70     | Knowledge graph relationships   |
| `07_learning_resources.sql` | 28      | External learning materials     |
| `08_skills.sql`             | 44      | Skills across 7 categories      |
| `09_tags.sql`               | 30      | Free-form categorisation labels |

### Alembic Migrations

| Revision | Description                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| `0001`   | Enable PostgreSQL extensions (uuid-ossp, pgcrypto, pg_trgm, unaccent, btree_gin, btree_gist) |
| `0002`   | Initial schema: 20 tables, 13 enums, indexes, constraints, triggers, views                   |
| Later    | Additional migrations for v1.1 extension tables, enum→VARCHAR conversion                     |

## Knowledge Graph Structure

The knowledge graph uses an **adjacency list** pattern (relational, not Neo4j):

- `knowledge_nodes` — vertices in the graph (subjects, concepts, technologies, tools, careers, projects)
- `knowledge_edges` — directed edges with type, direction, and weight
- **Traversal**: Recursive CTEs with depth limit of 10
- **8 relationship types**: prerequisite, depends_on, uses, enables, part_of, related_to, leads_to, requires

### The `unlocks` Rule

****CRITICAL**: `unlocks` is NEVER stored in the database. It is ALWAYS computed from `prerequisites` at query time via the `knowledge_node_unlocks` view (`knowledge_edges WHERE relationship_type = 'prerequisite'`). This prevents graph drift — if a prerequisite edge is edited, the unlock list automatically reflects the change.

## API Design

### Base URL

```
/api/v1/
```

### Response Format

All endpoints return a uniform envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-01-15T10:30:00.123456Z",
  "request_id": "req_abc123def456"
}
```

### Authentication

- **Mechanism**: JWT-based (HS256) with access (60min) + refresh (7 day) token pairs
- **Password hashing**: bcrypt via passlib
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Supabase ready**: AuthService designed for Supabase Auth swap without API layer changes

### Endpoint Groups

| Group               | Prefix                | Endpoints                                                                                                             |
| ------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Health**          | `/health`             | GET /health, /health/live, /health/ready, /health/checks                                                              |
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
| **Platform**        | (via platform router) | Status, versioning, **import/export**                                                                                 |
| **Import**          | `/api/v1/import`      | POST /import, POST /import/dry-run, GET /import/nodes, GET /import/report                                             |

## Repositories

18+ repository classes implementing the **Repository Pattern**:

- **BaseRepository** (`repositories/base.py`): Generic CRUD with pagination, soft-delete, optimistic locking. Generic type `ModelT: Base`.
- **UnitOfWork** (`repositories/unit_of_work.py`): Transaction management with async context manager. Provides `commit()`, `rollback()`, and `flush()`.
- **Entity Repositories**: UserRepository, KnowledgeNodeRepository, KnowledgeEdgeRepository, CareerRepository, ProjectRepository, LearningResourceRepository, UserProgressRepository, BookmarkRepository, FavoriteRepository, SearchHistoryRepository, SkillRepository, TagRepository, LearningPathRepository, LearningSessionRepository, RecommendationRepository, AuditLogRepository, PasswordResetRepository, GraphRepository

### Repository Pattern Rules

1. All repositories inherit from `BaseRepository[ModelT]`
2. Repositories are stateless — all state is in UnitOfWork
3. Repositories do NOT call commit() — the UnitOfWork handles commit on context exit
4. Repositories throw typed exceptions from `repositories/errors.py` (EntityNotFoundError, DuplicateEntityError, DatabaseConnectionError, QueryError)
5. All DB operations are async

## Services

15+ service classes implementing the **Service Layer**:

- **AuthService**: JWT auth, password management, token refresh
- **KnowledgeNodeService**: Node CRUD, prerequisite management, skill management
- **GraphTraversalService**: Graph analytics, pathfinding, statistics
- **GraphQueryService**: Cross-domain graph queries
- **LearningPathService**: Path generation strategies
- **CareerService**: Career CRUD, roadmap generation
- **ProjectService**: Project CRUD, requirements
- **BookmarkService**: Bookmark CRUD
- **ProgressService**: Progress tracking, statistics
- **SearchService**: Full-text search, semantic search
- **SkillService**: Skill CRUD, relationships
- **KnowledgeImportService**: Data import pipeline (Stage 5.1)
- **AI Services**: EmbeddingService, ChatService, SemanticSearchService, HybridSearchService, RankingService, CacheService, SecurityService, ObservabilityService

## DTOs & Schemas

- **Pydantic v2** for all request/response validation
- **Schemas organized by domain**: `schemas/knowledge/` (node, import_map), `schemas/auth/`, `schemas/career/`, etc.
- **Response wrapper**: `APIResponse[T]` generic type for all endpoints
- **Import schemas**: `ImportMap`, `ImportNode`, `ImportProject`, `ImportLearningGoal`, `ImportReport`, `ImportNodeResult` in `schemas/knowledge/import_map.py`

## Tests

Backend test files (7 total):

- `test_engine_lifecycle.py` — Engine lifecycle state machine tests
- `test_graph_platform.py` — Graph engine platform tests
- `test_health.py` — Health endpoint tests
- `test_ms56_engines.py` — MS5.6 milestone tests
- `test_ms7_platform.py` — MS7 platform tests
- `test_ms8_platform.py` — MS8 platform tests
- `test_platform_foundation.py` — Platform foundation tests

**Running tests**: Requires PostgreSQL running. `pytest` from `apps/api/` directory.

## Deployment

### Docker Architecture

**Development** (`docker-compose.yml`):

- PostgreSQL 16 + pgAdmin (tools profile)
- Schema managed via Alembic migrations

**Production** (`docker-compose.prod.yml`):

- PostgreSQL 16
- API (FastAPI via uvicorn, port 8000)
- Web (Next.js standalone server, port 3000)
- Health checks on all services

**API Dockerfile**: Multi-stage build with Python 3.12-slim, uv for package management, uvicorn runtime

**Web Dockerfile**: Multi-stage build with Node.js 22-alpine, corepack, pnpm, standalone output

### CI/CD

**GitHub Actions CI** (`.github/workflows/ci.yml`):

- Trigger: Push/PR to main/develop (excluding docs, .ai)
- Services: PostgreSQL 16
- Steps: pnpm setup + install → Python setup + pip install → TS typecheck → Lint → Build → Ruff → pytest + coverage → Docker builds

**Lint Pipeline** (`.github/workflows/lint.yml`):

- Trigger: Push/PR to non-main branches
- Steps: Format check → Lint

---

# 4 Learning Philosophy

## Manifesto

**Computer Science is not a collection of subjects. It is a connected ecosystem.**

Most learning platforms treat CS as a series of silos: "Complete the Python course," "Take the Algorithms course," "Move to the Machine Learning track." This is wrong. It teaches learners to see knowledge as isolated boxes rather than an interconnected web.

**SV-OS fundamentally rejects this model.** Instead, SV-OS treats every concept, every tool, every algorithm, every project as a node in a vast, interconnected graph. The learner navigates this graph like a traveler navigating a city — not like a student progressing through a syllabus.

## Google Maps for Computer Science

SV-OS treats knowledge navigation exactly like Google Maps treats physical navigation:

| Google Maps           | SV-OS                                    |
| --------------------- | ---------------------------------------- |
| Your current location | Your current knowledge state             |
| Destination           | Learning goal (career, skill, project)   |
| Routes                | Multiple possible learning paths         |
| Shortest route        | Minimum prerequisite chain               |
| Fastest route         | Minimum total time                       |
| Scenic route          | Foundation-heavy path                    |
| Traffic               | Learning velocity (struggling = traffic) |
| Alternate routes      | Branch paths when stuck                  |
| Landmarks             | Milestones (projects, checkpoints)       |
| ETA                   | Estimated completion time                |
| Re-routing            | Dynamic path adjustment                  |
| Recently viewed       | Review schedule                          |
| Saved places          | Bookmarks                                |

This is not an analogy. This is the **operating model** of SV-OS.

## Journey-Based Learning

SV-OS treats learning as a **journey through knowledge space**, not a checklist of courses:

- **Fixed courses** → **Dynamic journeys** that adapt in real-time
- **Whole courses as prerequisites** → **Individual concepts as prerequisites**
- **Instructor-paced** → **Millisecond-precision adaptive pacing**
- **Isolated courses** → **Every concept connected to every other**
- **"You need this for the course"** → **"You need this because X career requires it"**
- **"Complete the course"** → **"Master the knowledge space"**

## Cross-Subject Learning

Learners should never encounter a concept without context:

```python
# Traditional (WRONG)
Learner studies Python → completes Python course
Learner studies Data Structures → starts from scratch (no Python context)
Learner studies Algorithms → starts from scratch (no DS context)

# SV-OS (RIGHT)
Learner wants to become ML Engineer
Learning Engine generates path:
1. Python (with ML libraries as motivation)
2. NumPy (applies Python, enables data manipulation)
3. Linear Algebra (applied with NumPy examples)
4. Basic Statistics (with Python implementation)
5. Supervised Learning (uses Python + stats + linear algebra)
```

## Prerequisite Graph

The **prerequisite graph** is the core structure from which everything else derives:

- Every node knows what it requires (prerequisites) and what it enables (unlocks)
- **unlocks is ALWAYS computed from prerequisites** — never stored independently
- Cycle detection (Kahn's algorithm) prevents invalid prerequisite chains
- Graph traversal uses recursive CTEs with depth limit of 10

## Educational Design Principles

### 1. Problem-First Principle

Never start with an abstract concept. Start with a problem the learner already understands.

```python
# WRONG: "Today we'll learn about hash tables."
# RIGHT: "You need to store 10,000 records and look them up instantly. How? Let's explore hash tables."
```

### 2. Context Principle

Every piece of knowledge must answer: What, Why, Where, What depends on it, What careers require it, What project uses it, What mistakes are common?

### 3. Application Principle

Knowledge without application is trivia. Every concept must have a simulator, project, exercise, and real-world reference.

### 4. Scaffolding Principle

Knowledge should be taught at the edge of the learner's ability — not too easy (boredom) and not too hard (frustration).

### 5. Connection Principle

Every node should link to related nodes in multiple directions: parent subjects, child concepts, prerequisites, dependents, real-world uses, historical context, related fields.

### 6. Mastery-Not-Completion Principle

Completing content is not the goal. Mastering it is. The engine does not move on until the learner reaches at least **competent**.

### 7. Spiral Principle

Concepts should be revisited at increasing levels of depth: What → How → Internals → Optimization → Distributed.

### 8. Diversity Principle

Every concept should be taught in at least two different ways (video + interactive, reading + project, etc.).

## Visual Learning

The knowledge graph is rendered visually using **React Flow** (reactflow v11):

- Custom `KnowledgeNode` component with type-specific colors
- Smoothstep edges with animated prerequisites (dashed)
- Background grid, controls (zoom, fit), minimap
- Circular layout with configurable radius
- Type colors: Subject=Purple #7c3aed, Concept=Blue #2563eb, Technology=Green #16a34a, Tool=Amber #d97706, Career=Red #dc2626, Project=Pink #db2777

## Simulation Learning

Interactive simulations let learners manipulate concepts visually:

- **Tree Visualizer** — BST operations animation
- **Graph Traversal Visualizer** — BFS/DFS step-through
- **Sorting Visualizer** — Algorithm comparison
- **CPU Pipeline Visualizer** — Instruction execution
- **Memory Paging Simulator** — Page replacement algorithms
- **Neural Network Visualizer** — Forward propagation
- **Gradient Descent Visualizer** — Optimization landscape
- **SQL Query Simulator** — Query execution
- **Logic Circuit Simulator** — Boolean gate simulation
- **Attention Visualizer** — Self-attention mechanics
- **DP Visualizer** — Dynamic programming table fill
- **CPU Scheduler Simulator** — Process scheduling

## Project-Based Learning

Projects connect knowledge to practical application:

- **8 project levels**: Tiny Exercise, Mini, Intermediate, Portfolio, Production, Industry-scale, Startup, Research
- Projects are unlocked when ALL required nodes have mastery ≥ 0.6
- Projects interleave multiple skills for cross-concept reinforcement

## Mastery Model

Mastery is **multi-dimensional**, not binary:

| Dimension     | Weight | Description          |
| ------------- | ------ | -------------------- |
| Knowledge     | 15%    | Can recall           |
| Understanding | 25%    | Can explain          |
| Application   | 30%    | Can use              |
| Analysis      | 20%    | Can evaluate         |
| Creation      | 10%    | Can build new things |

**Mastery Scale**:

- 0.0-0.2: Not Started
- 0.2-0.4: Learning (can move to dependent topics)
- 0.4-0.6: Competent
- 0.6-0.8: Proficient (can teach others, skip review)
- 0.8-0.9: Advanced (unlocks advanced applications)
- 0.9-1.0: Mastered (unlocks teaching/mentoring)

**Progress Statuses**: `not_started → learning → completed → mastered`

## Adaptive Recommendations

The Recommendation Engine uses **decision rules**, not weighted formulas (8 priority rules):

1. **Urgent Review** — If any node needs revision, recommend it first (confidence: 0.9)
2. **Reinforce Weak** — If recent node has low confidence, reinforce it (confidence: 0.8)
3. **Continue Streak** — Continue current in-progress node (confidence: 0.75)
4. **Career Requirement** — Required node for active career path (confidence: 0.7)
5. **Unlock Potential** — Node that unlocks the most other nodes (confidence: 0.6)
6. **Widest Dependency** — Node with highest dependent count (confidence: 0.5)
7. **Shortest Time** — Node with shortest estimated time (confidence: 0.4)
8. **Easiest First** — Lowest-difficulty candidate (confidence: 0.3)

---

# 5 Knowledge Engine

## Nodes

Knowledge nodes are the vertices of the graph. Each node represents a single learnable concept.

### Node Types (6)

| Type       | Enum Value   | Color          | Example                               |
| ---------- | ------------ | -------------- | ------------------------------------- |
| Subject    | `subject`    | Purple #7c3aed | "Computer Science", "Data Science"    |
| Concept    | `concept`    | Blue #2563eb   | "Big O Notation", "Polymorphism"      |
| Technology | `technology` | Green #16a34a  | "React", "PostgreSQL", "Docker"       |
| Tool       | `tool`       | Amber #d97706  | "VS Code", "Git", "Figma"             |
| Career     | `career`     | Red #dc2626    | "Frontend Developer", "ML Engineer"   |
| Project    | `project`    | Pink #db2777   | "Build a REST API", "Deploy ML Model" |

### Node Attributes

| Attribute           | Type         | Required | Description                              |
| ------------------- | ------------ | -------- | ---------------------------------------- |
| `id`                | UUID         | ✅       | Auto-generated primary key               |
| `slug`              | VARCHAR(200) | ✅       | URL-safe unique identifier               |
| `title`             | VARCHAR(300) | ✅       | Human-readable title                     |
| `description`       | TEXT         | ✅       | Short summary (1-3 sentences)            |
| `content`           | TEXT         | ❌       | Detailed content / learning material     |
| `node_type`         | ENUM         | ✅       | One of 6 node types                      |
| `difficulty`        | ENUM         | ✅       | beginner, intermediate, advanced, expert |
| `estimated_minutes` | INTEGER      | ✅       | Estimated time to learn (default: 30)    |
| `icon`              | VARCHAR(50)  | ❌       | Icon identifier for UI                   |
| `color`             | VARCHAR(7)   | ❌       | Hex color for visualization              |
| `metadata`          | JSONB        | ✅       | Extensible metadata (default: `{}`)      |
| `search_vector`     | TSVECTOR     | ✅       | Full-text search (auto-updated)          |
| `is_deleted`        | BOOLEAN      | ✅       | Soft delete flag                         |
| `version`           | INTEGER      | ✅       | Optimistic locking counter               |

### Difficulty System

| Level        | Value          | Estimated Time | Target Audience     |
| ------------ | -------------- | -------------- | ------------------- |
| Beginner     | `beginner`     | 15-30 min      | New to topic        |
| Intermediate | `intermediate` | 30-60 min      | Has foundation      |
| Advanced     | `advanced`     | 60-120 min     | Solid understanding |
| Expert       | `expert`       | 120-180 min    | Deep specialization |

## Edges

### Core Edge Types (8)

| Type           | Direction | Description                                | Example                       |
| -------------- | --------- | ------------------------------------------ | ----------------------------- |
| `prerequisite` | A → B     | A must be learned before B                 | "JavaScript → React"          |
| `depends_on`   | A → B     | A depends on B (inverse of prerequisite)   | "React ← JavaScript"          |
| `uses`         | A → B     | A uses B in implementation                 | "React Hooks → Web APIs"      |
| `enables`      | A → B     | Learning A enables understanding B         | "React Hooks → Custom Hooks"  |
| `part_of`      | A → B     | A is component of B                        | "useState → React Hooks"      |
| `related_to`   | A ↔ B     | Related but not dependent                  | "React ↔ Vue Composition API" |
| `leads_to`     | A → B     | A naturally leads to B                     | "React Hooks → React Context" |
| `requires`     | A → B     | A requires B (alternative to prerequisite) | "React Hooks → JavaScript"    |

### Edge Attributes

| Attribute           | Type  | Required | Description                              |
| ------------------- | ----- | -------- | ---------------------------------------- |
| `id`                | UUID  | ✅       | Auto-generated primary key               |
| `source_node_id`    | UUID  | ✅       | Source node FK                           |
| `target_node_id`    | UUID  | ✅       | Target node FK                           |
| `relationship_type` | ENUM  | ✅       | One of 8 relationship types              |
| `direction`         | ENUM  | ✅       | forward, bidirectional, unidirectional   |
| `description`       | TEXT  | ✅       | Edge description                         |
| `weight`            | FLOAT | ✅       | Edge weight for traversal (default: 1.0) |

### Extended Edge Types (14 additional)

From the `GRAPH_RELATIONSHIPS.md` spec: 22 total edge types including SIMILAR_TO, CAREER_REQUIRES, PROJECT_REQUIRES, USES_TOOL, USES_LANGUAGE, USES_FRAMEWORK, LEARNS_AFTER, RECOMMENDED_AFTER, HAS_RESOURCE, HAS_EXAMPLE, HAS_EXERCISE, HAS_PROJECT, IMPLEMENTS, EXTENDS, BELONGS_TO, CONTAINS.

### The `unlocks` Invariant

**CRITICAL RULE**: `unlocks` is NEVER stored as data. It is ALWAYS computed from `prerequisites` at query time. The inverse of a prerequisite edge IS an unlock relationship. If node A has a prerequisite edge to node B, then B unlocks A. This is computed by reversing the prerequisite edge direction at query time.

This invariant prevents graph drift — if a prerequisite edge is edited or deleted, the unlock relationships automatically reflect the change. The import pipeline explicitly rejects any input that contains `unlocks` fields and warns about them.

## Domains / Categories

Domains are high-level groupings of nodes. Stage 5.1 reference dataset defines 12 domains:

1. Algorithms
2. Career Preparation
3. Computer Organization
4. Data Structures
5. Databases
6. Deep Learning
7. Generative AI
8. Machine Learning
9. Mathematics
10. Networks
11. Programming Fundamentals
12. Systems

Domains are stored in the canonical `domains` table (Phase 5 audit Task 4) with slug, display_name, aliases, and parent_id for hierarchy. The 40-domain resolved taxonomy replaces the previous free-form domain strings.

## Learning Goals

Learning goals represent target outcomes for a learning journey. In the Phase 5 audit, learning goals are stored in a **separate `learning_goals` table** (distinct from `careers`), with goal types: exam, certification, interview_prep, custom. The 4 learning goals in the reference dataset:

1. **AI Engineer** (career code: AI)
2. **Computer Science Engineer** (career code: CSE)
3. **GATE Preparation** (career code: GATE)
4. **General Interview Preparation** (career code: INT)

## Projects

Projects connect knowledge to application. In the Stage 5.1 reference dataset, 9 projects are defined:

| ID  | Title                                      | Difficulty   | Required Nodes                                    |
| --- | ------------------------------------------ | ------------ | ------------------------------------------------- |
| p1  | Python Capstone: Build a CLI Data Analyzer | beginner     | python-basics                                     |
| p2  | Sorting Visualizer                         | intermediate | dsa-arrays-strings, algo-complexity, algo-sorting |
| p3  | [reserved]                                 |              |                                                   |
| p4  | Mini OS: Process Scheduler                 | advanced     | os-fundamentals, os-process-memory                |
| p5  | Database Design for an E-Commerce Platform | intermediate | dbms-fundamentals                                 |
| p6  | Predictive Model for House Prices          | intermediate | ml-supervised                                     |
| p7  | CNN for Image Classification               | advanced     | dl-cnn                                            |
| p8  | Build an LLM-powered Chatbot               | advanced     | genai-llm-fundamentals                            |
| p9  | Build a Prompt Engineering Tool            | intermediate | genai-prompt-engineering                          |

## Resources

External learning materials linked to nodes. Resource types: video, article, course, book, documentation, tool, podcast, interactive.

In the import pipeline, resources are stored in the `learning_resources` table.

## Relationships

### Edge Validation Rules

| Rule                      | Description                            | Severity |
| ------------------------- | -------------------------------------- | -------- |
| No self-loops             | source_id != target_id                 | Blocking |
| No duplicate edges        | Same source+target+type cannot repeat  | Blocking |
| No circular prerequisites | PREREQUISITE_OF path must not cycle    | Blocking |
| Prerequisite weight ≥ 0.7 | Weak prerequisite weights flagged      | Warning  |
| Node existence            | Edge endpoints must exist              | Blocking |
| Type consistency          | Certain types restricted to node types | Blocking |

### Hidden Relationships (v1.1)

Cross-domain insight connections that do NOT participate in prerequisite/topological queries. Types include:
`structural_analogy`, `shared_theory`, `shared_infrastructure`, `applied_structure`, `direct_application`, `inverse_relationship`, `failure_mode_analogy`, `theoretical_foundation`, `emerging_structural_analogy`, `shared_skillset`, etc.

### Concept Decomposition (v1.1)

Hierarchical breakdown: Domain > Module > Topic > Concept > Micro-Concept > Atomic Knowledge Unit.
Stored in a single self-referencing `concept_decomposition` table with a `level` column.

## Search

Two search systems coexist:

1. **PostgreSQL Full-Text Search** — Weighted TSVECTOR on `knowledge_nodes` (title=A, description=B, content=C). Trigger-updated column with GIN index.
2. **SearchEngine** (in-memory) — Exact, prefix, fuzzy (Levenshtein ≤ 2), fulltext, tag, type-based search
3. **Hybrid Search** — Combines PostgreSQL FTS + vector similarity (when AI embedding providers configured)

## Recommendation

See [Section 4 — Adaptive Recommendations](#adaptive-recommendations).

## Unlock Logic

**unlocks = inverse of prerequisites.** Always computed, never stored.

The `knowledge_node_unlocks` database view provides:

```sql
CREATE VIEW knowledge_node_unlocks AS
SELECT source_node_id AS node_id, target_node_id AS unlocks_node_id
FROM knowledge_edges
WHERE relationship_type = 'prerequisite';
```

For a learner, a node is unlocked when ALL its prerequisites have mastery >= 0.5.

## Traversal

Graph traversal uses **recursive CTEs** with depth limit of 10:

```sql
WITH RECURSIVE prereq_chain AS (
    SELECT source_node_id, target_node_id, 1 AS depth
    FROM knowledge_edges
    WHERE target_node_id = :node_id AND relationship_type = 'prerequisite'
    UNION ALL
    SELECT e.source_node_id, e.target_node_id, pc.depth + 1
    FROM knowledge_edges e
    INNER JOIN prereq_chain pc ON e.target_node_id = pc.source_node_id
    WHERE e.relationship_type = 'prerequisite'
)
SELECT * FROM prereq_chain;
```

TraversalEngine provides: BFS, DFS, shortest path, multi-source BFS, reachable, topological sort, cycle detection, connected components.

---

# 6 Database

## Platform

- **PostgreSQL 16** with asyncpg driver
- **Extensions**: uuid-ossp, pgcrypto, pg_trgm, unaccent, btree_gin, btree_gist
- **Alembic** for migration management
- **Connection**: `postgresql+asyncpg://svos:svos_dev_password@localhost:5432/svos`

## All Major Tables

### Core Schema (20 tables)

```
users
├── id UUID PK
├── email VARCHAR(255) UNIQUE NOT NULL
├── username VARCHAR(100) UNIQUE NOT NULL
├── password_hash TEXT NOT NULL
├── role user_role_enum DEFAULT 'learner'
├── preferences JSONB DEFAULT '{}'
├── is_active BOOLEAN DEFAULT true
├── is_deleted BOOLEAN DEFAULT false
├── version INTEGER DEFAULT 1
└── created_at / updated_at / last_login_at TIMESTAMPTZ

knowledge_nodes
├── id UUID PK
├── slug VARCHAR(200) UNIQUE NOT NULL
├── title VARCHAR(300) NOT NULL
├── description TEXT
├── content TEXT
├── node_type node_type_enum NOT NULL
├── difficulty difficulty_enum NOT NULL DEFAULT 'beginner'
├── estimated_minutes INTEGER DEFAULT 30
├── icon VARCHAR(50)
├── color VARCHAR(7)
├── metadata JSONB DEFAULT '{}'
├── search_vector TSVECTOR (trigger-updated)
├── view_count INTEGER DEFAULT 0
├── is_published BOOLEAN DEFAULT true
├── is_deleted BOOLEAN DEFAULT false
└── version INTEGER DEFAULT 1

knowledge_edges
├── id UUID PK
├── source_node_id UUID FK → knowledge_nodes
├── target_node_id UUID FK → knowledge_nodes
├── relationship_type edge_type_enum NOT NULL
├── direction edge_direction_enum DEFAULT 'forward'
├── description TEXT DEFAULT ''
├── weight FLOAT DEFAULT 1.0
├── metadata JSONB DEFAULT '{}'
└── UNIQUE (source_node_id, target_node_id, relationship_type)

careers
├── id UUID PK
├── slug VARCHAR(200) UNIQUE
├── title VARCHAR(300) NOT NULL
├── description TEXT
├── demand_level demand_enum
├── average_salary NUMERIC(10,2)
├── is_deleted BOOLEAN DEFAULT false
└── version INTEGER DEFAULT 1

career_requirements
├── id UUID PK
├── career_id UUID FK → careers
├── node_id UUID FK → knowledge_nodes
├── requirement_type requirement_type_enum
├── order_index INTEGER
└── UNIQUE (career_id, node_id)

projects
├── id UUID PK
├── slug VARCHAR(200) UNIQUE
├── title VARCHAR(300) NOT NULL
├── description TEXT
├── difficulty difficulty_enum
├── estimated_hours INTEGER
├── tech_stack TEXT[]
├── is_deleted BOOLEAN DEFAULT false
└── version INTEGER DEFAULT 1

project_requirements
├── id UUID PK
├── project_id UUID FK → projects
├── node_id UUID FK → knowledge_nodes
├── requirement_type requirement_type_enum
├── order_index INTEGER
└── UNIQUE (project_id, node_id)

user_progress
├── user_id UUID FK → users
├── node_id UUID FK → knowledge_nodes
├── status progress_enum DEFAULT 'not_started'
├── time_spent_minutes INTEGER DEFAULT 0
├── started_at TIMESTAMPTZ
├── completed_at TIMESTAMPTZ
├── mastered_at TIMESTAMPTZ
└── PRIMARY KEY (user_id, node_id)

learning_resources
├── id UUID PK
├── node_id UUID FK → knowledge_nodes
├── title VARCHAR(300) NOT NULL
├── url TEXT NOT NULL
├── resource_type resource_type_enum NOT NULL
├── platform VARCHAR(100)
├── language VARCHAR(50) DEFAULT 'en'
├── is_free BOOLEAN DEFAULT false
└── is_deleted BOOLEAN DEFAULT false

learning_paths
├── id UUID PK
├── user_id UUID FK → users
├── title VARCHAR(300)
├── goal_title VARCHAR(300)
├── strategy VARCHAR(50)
├── milestones JSONB
├── completion_percentage FLOAT DEFAULT 0.0
├── is_published BOOLEAN DEFAULT false
└── is_deleted BOOLEAN DEFAULT false

bookmarks, favorites, search_history, activity_logs, recommendations, skills, skill_relationships, tags, node_tags, learning_sessions
```

### v1.1 Extension Tables

```
categories, nodes, node_details, node_edges, simulators, node_simulators,
node_projects, careers (extended), career_nodes, hidden_relationships,
concept_decomposition, seniority_levels, career_seniority_nodes,
learners, learner_progress
```

See `database/schema.sql` and `sv-os-database-schema.sql` for complete definitions.

## Graph Storage Pattern

The knowledge graph uses an **adjacency list** pattern in relational tables:

```
knowledge_nodes (vertices)
    id UUID PK
    slug VARCHAR UNIQUE
    title VARCHAR
    node_type ENUM
    difficulty ENUM

knowledge_edges (directed edges)
    source_node_id UUID FK → knowledge_nodes
    target_node_id UUID FK → knowledge_nodes
    relationship_type ENUM
    weight FLOAT (1.0 default)
```

## Import Pipeline

### Stage 5.1 Import Process

The `KnowledgeImportService` (`apps/api/app/services/knowledge_import.py`) implements the complete import pipeline:

1. **Schema Validation**: Required-field checks, type checks, duplicate ID detection
2. **Referential Integrity**: Prerequisites resolve to valid node IDs, project links resolve, learning goal references resolve
3. **Graph Building** (Kahn's algorithm): Computes topological order, detects cycles, computes longest prerequisite chain
4. **Persistence** (upsert by ID):
   - Nodes → `knowledge_nodes` (upsert by slug)
   - Prerequisite edges → `knowledge_edges` (upsert by source+target+type)
   - Projects → `projects` table + `project_requirements` table
   - Learning goals → `learning_goals` table (separate from careers — Phase 5 audit Task 5)
   - Resources → `learning_resources` table
5. **Report Generation**: Node count, domain breakdown, errors, warnings, topological order length, longest chain

### Import API Endpoints

- `POST /api/v1/import` — Full import with validation + persistence
- `POST /api/v1/import/dry-run` — Validate only, no persistence
- `POST /api/v1/import/validate` — Lightweight schema validation
- `GET /api/v1/import/nodes` — List imported nodes by domain with prerequisites/unlocks
- `GET /api/v1/import/report` — Aggregate counts and statistics

### Import Schema

The import accepts JSON in this format (defined in `schemas/knowledge/import_map.py`):

```json
{
  "map_version": "0.1-reference",
  "stage": "5.1 Computer Science Knowledge Map",
  "note": "...",
  "domains": ["Algorithms", "Data Structures", ...],
  "node_count": 40,
  "nodes": [
    {
      "id": "prog-basics",
      "title": "Programming Fundamentals",
      "summary": "...",
      "domain": "Programming Fundamentals",
      "difficulty": 1,
      "estimated_time": 15,
      "prerequisites": [],
      "skills": ["Variables & control flow"],
      "projects": [],
      "careers": ["AI", "CSE"],
      "resources": [],
      "simulators": [],
      "learning_outcomes": ["..."]
    }
  ],
  "projects": [
    {
      "id": "p1",
      "title": "...",
      "description": "...",
      "difficulty": "beginner",
      "estimated_hours": 3,
      "technologies": ["Python"],
      "type": "portfolio"
    }
  ],
  "learning_goals": [
    {
      "id": "AI",
      "title": "AI Engineer"
    }
  ]
}
```

### Safe Re-run Guarantees

- **Nodes/edges**: Find by slug → update (if exists) / create (if not)
- **Edges**: Check existence before creating (no IntegrityError rollbacks)
- **Requirements**: Check existing requirements before adding
- **Full validation runs before ANY writes** — no partial imports on failure
- **Cyclic graphs are rejected entirely** — Kahn's algorithm detects cycles before persistence

## Knowledge Schema

See `database/schema.sql` and `sv-os-database-schema.sql` for complete DDL.

Key design decisions:

- Native enums migrated to VARCHAR + CHECK constraints for compatibility
- JSONB columns for extensible metadata
- Soft delete (`is_deleted`) and optimistic locking (`version`) on all entities
- Auto-updating TSVECTOR search column via trigger
- Recursive CTE pattern for graph traversal
- View `node_unlocks` for inverse prerequisite lookups

---

# 7 API

## Base URL

```
/api/v1/
```

## Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-01-15T10:30:00.123456Z",
  "request_id": "req_abc123def456"
}
```

## Import Endpoints

### POST /api/v1/import

Full import with validation + persistence.

**Request**: JSON body matching `ImportMap` schema (from `schemas/knowledge/import_map.py`)

**Response 200**:

```json
{
  "success": true,
  "message": "Import completed successfully",
  "data": {
    "success": true,
    "nodes_created": 40,
    "nodes_updated": 0,
    "edges_created": 67,
    "projects_created": 9,
    "resources_created": 40,
    "learning_goals_imported": 4,
    "errors": [],
    "warnings": [],
    "domain_breakdown": {
      "Programming Fundamentals": 5,
      "Mathematics": 4,
      "Data Structures": 6,
      "Algorithms": 5,
      "Computer Organization": 2,
      "Systems": 3,
      "Databases": 1,
      "Networks": 1,
      "Machine Learning": 3,
      "Deep Learning": 5,
      "Generative AI": 2
      ...
    },
    "topological_order_length": 40,
    "cycles_detected": false,
    "deepest_node": "genai-prompt-engineering",
    "deepest_node_depth": 10
  }
}
```

### POST /api/v1/import/dry-run

Validate only — no persistence.

**Request**: Same as POST /import

**Response**: Same structure but with `validation_report` instead of persistence counts.

### POST /api/v1/import/validate

Lightweight schema validation.

**Request**: Same ImportMap JSON

**Response**: Validation results only.

### GET /api/v1/import/nodes

List imported nodes by domain with resolved prerequisites/unlocks.

**Query params**: `?domain=Algorithms` (optional filter)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "node_id": "prog-basics",
      "title": "Programming Fundamentals",
      "domain": "Programming Fundamentals",
      "difficulty": 1,
      "prerequisites": [],
      "unlocks": ["prog-functions"]
    }
  ]
}
```

### GET /api/v1/import/report

Aggregate import statistics.

**Response**: Counts by domain, total nodes, total edges, etc.

## Graph Endpoints

| Method | Path                             | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| GET    | `/graph/full`                    | Full graph (all nodes + edges) |
| GET    | `/graph/explore/{node_id}`       | Subgraph around a node         |
| GET    | `/graph/statistics`              | Graph-wide statistics          |
| GET    | `/graph/prerequisites/{node_id}` | Prerequisite chain             |

## Knowledge Nodes Endpoints

| Method | Path                          | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/nodes`                      | List nodes (paginated, filterable)  |
| GET    | `/nodes/{slug}`               | Get node details with relationships |
| GET    | `/nodes/{slug}/prerequisites` | Get prerequisite nodes              |
| GET    | `/nodes/{slug}/unlocks`       | Get nodes this unlocks              |
| GET    | `/nodes/{slug}/related`       | Get related nodes                   |
| GET    | `/nodes/{slug}/careers`       | Careers involving this node         |
| GET    | `/nodes/{slug}/projects`      | Projects using this node            |
| GET    | `/nodes/{slug}/resources`     | Learning resources                  |
| POST   | `/nodes`                      | Create node (Admin)                 |
| PUT    | `/nodes/{slug}`               | Update node (Admin)                 |
| DELETE | `/nodes/{slug}`               | Delete node (Admin)                 |

## Search Endpoints

| Method | Path               | Description                    |
| ------ | ------------------ | ------------------------------ |
| GET    | `/search`          | Full-text search               |
| GET    | `/search/suggest`  | Autocomplete suggestions       |
| POST   | `/search/semantic` | Semantic (vector) search       |
| POST   | `/search/hybrid`   | Combined FTS + semantic search |

## Recommendation Endpoints

| Method | Path                            | Description                          |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/recommendations`              | Get recommendations for current user |
| POST   | `/recommendations/next`         | Get next concept recommendation      |
| GET    | `/recommendations/{id}/explain` | Explanation of a recommendation      |

## Learning Path Endpoints

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| GET    | `/learning-paths`          | List learning paths          |
| POST   | `/learning-paths/generate` | Generate a new learning path |
| GET    | `/learning-paths/{id}`     | Get path details             |
| PUT    | `/learning-paths/{id}`     | Update path                  |
| DELETE | `/learning-paths/{id}`     | Delete path                  |

## Career Endpoints

| Method | Path                      | Description                   |
| ------ | ------------------------- | ----------------------------- |
| GET    | `/careers`                | List careers                  |
| GET    | `/careers/{slug}`         | Get career details            |
| GET    | `/careers/{slug}/roadmap` | Get phased learning roadmap   |
| GET    | `/careers/{slug}/nodes`   | Get all nodes for this career |

## Project Endpoints

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| GET    | `/projects`                | List projects                |
| GET    | `/projects/{slug}`         | Get project details          |
| GET    | `/projects/{slug}/roadmap` | Learning roadmap for project |

## Progress Endpoints

| Method | Path                  | Description             |
| ------ | --------------------- | ----------------------- |
| GET    | `/progress`           | Get all user progress   |
| GET    | `/progress/stats`     | Get progress statistics |
| PUT    | `/progress/{node_id}` | Update node progress    |

## Auth Endpoints

| Method | Path            | Description      |
| ------ | --------------- | ---------------- |
| POST   | `/auth/signup`  | Create account   |
| POST   | `/auth/login`   | Login            |
| POST   | `/auth/logout`  | Logout           |
| POST   | `/auth/refresh` | Refresh token    |
| GET    | `/auth/me`      | Get current user |
| PUT    | `/auth/me`      | Update profile   |

## Health Endpoints

| Method | Path             | Description                   |
| ------ | ---------------- | ----------------------------- |
| GET    | `/health`        | Unified health check          |
| GET    | `/health/live`   | Liveness probe                |
| GET    | `/health/ready`  | Readiness probe               |
| GET    | `/health/checks` | Detailed health check results |

---

# 8 Current Progress

## Completed (Infrastructure v1 — Phase 1, 2, 5.0, 5.1)

| Milestone     | Description                                                                        | Date     |
| ------------- | ---------------------------------------------------------------------------------- | -------- |
| **Phase 0**   | Repository bootstrap, monorepo setup, toolchain                                    | Complete |
| **Phase 1**   | Core infrastructure: FastAPI, PostgreSQL, Alembic, Docker, CI/CD                   | Complete |
| **Phase 2.0** | Backend foundation: All models, repositories, services, API endpoints, auth, graph | Complete |
| **Phase 2.1** | Engine system: 20 engines, lifecycle, event bus, DI container, registries          | Complete |
| **Phase 2.2** | Frontend foundation: Next.js 15, Radix UI, Tailwind v4, all pages & components     | Complete |
| **Phase 2.3** | Platform infrastructure: Health, telemetry, middleware (9 layers), caching         | Complete |
| **Phase 2.4** | AI integration: Embedding providers (OpenAI/Gemini/Ollama), RAG, semantic search   | Complete |
| **Phase 5.0** | Knowledge import service design and implementation                                 | Complete |
| **Phase 5.1** | Reference dataset import pipeline (40 nodes, full validation, graph building)      | Complete |

## In Progress

| Area                         | Description                                         | Status         |
| ---------------------------- | --------------------------------------------------- | -------------- |
| **Mypy fixes**               | 225 pre-existing type errors across 57 files        | ❌ Not Started |
| **Test coverage**            | Need more tests, need DB for testing                | 🟡 Blocked     |
| **Learning path generation** | Service layer exists, needs full engine integration | 🟡 In Progress |
| **Recommendation engine**    | Engine exists, needs service layer wiring           | 🟡 In Progress |
| **Spaced repetition**        | RevisionEngine exists, needs frontend integration   | 🟡 Planned     |
| **Full 204-node import**     | Richer schema dataset ready, import not yet run     | ⬜ Planned     |

## Key Metrics

| Metric               | Value                        |
| -------------------- | ---------------------------- |
| Backend Python files | 150+                         |
| Backend endpoints    | 25+ groups                   |
| Database tables      | 20 core + 14 v1.1 extensions |
| Alembic migrations   | 14                           |
| Imported nodes       | 40 (Stage 5.1)               |
| Engines registered   | 19                           |
| Frontend pages       | 25+ (17 authenticated)       |
| Shared UI components | 23+                          |
| Documentation files  | 63+                          |
| Seed SQL files       | 9                            |

## Known Issues

1. **Mypy**: 225 pre-existing type errors across 57 files (repositories, engines, services, endpoints). Requires systematic fix: add proper type annotations, fix `bool` vs `ColumnElement[bool]` patterns, fix generic type bounds.
2. **No CI for frontend tests**: vitest configured but not wired into GitHub Actions.
3. **GraphEngine is entirely in-memory**: All nodes and edges must fit in RAM. No persistence layer for the engine itself.
4. **Event bus is in-process**: Events not persisted; server restart loses queued events.
5. **No Redis/Memcached**: Production deployment needs dedicated cache.
6. **Rate limiting is in-memory**: Per-process counters; doesn't work across multiple API instances.
7. **WebSocket manager is stub**: Real-time features not yet implemented.
8. **Plugin system is scaffolded**: Plugin loading, sandboxing, lifecycle not yet implemented.

---

# 9 Phase 5 Roadmap

## Stage 5.0 — Knowledge Import Service Foundation ✅ COMPLETE

**Goal**: Build the import pipeline infrastructure.

- [x] Design `ImportMap`, `ImportNode`, `ImportProject`, `ImportLearningGoal` Pydantic schemas
- [x] Implement `KnowledgeImportService` with validation + graph building (Kahn's algorithm)
- [x] Port validation logic from reference `import_engine.py`
- [x] Implement upsert persistence (nodes, edges, projects, learning goals, resources)

## Stage 5.1 — Reference Dataset Import ✅ COMPLETE

**Goal**: Import 40-node reference dataset and prove the pipeline.

- [x] Create `computer_science_map.json` with 40 nodes, 12 domains, 4 learning goals, 9 projects
- [x] Build import API endpoints (POST /import, POST /import/dry-run, GET /import/nodes, GET /import/report)
- [x] Full validation pipeline: schema validation, referential integrity, cycle detection
- [x] `unlocks` computed from `prerequisites` (never stored independently)
- [x] Safe re-run: upsert by ID, no duplication on re-run
- [x] Read path: GET /import/nodes lists nodes by domain with prerequisites/unlocks

## Stage 5.2 — Full Knowledge Graph Import

**Goal**: Import the richer 204-node schema dataset.

- [ ] Create full 204-node knowledge graph JSON
- [ ] Handle richer field set (content_blocks, extended metadata, cross-domain connections)
- [ ] Import simulators and simulator-node mappings
- [ ] Import seniority levels and career-seniority mappings
- [ ] Import hidden relationships (cross-domain insight connections)
- [ ] Import concept decomposition hierarchy
- [ ] Validate full graph integrity
- [ ] Run topological sort on full 204-node graph
- [ ] Verify no cycles in full graph

## Stage 5.3 — Read Path UI

**Goal**: Display imported graph data in the frontend.

- [ ] Create `/explore` page showing nodes by domain
- [ ] Create node detail page showing prerequisites, unlocks, resources, projects
- [ ] Create domain/category sidebar filter
- [ ] Add search across imported nodes
- [ ] Show domain breakdown and statistics

## Stage 5.4 — Graph Visualization Integration

**Goal**: Visualize imported nodes in React Flow graph.

- [ ] Integrate imported nodes with existing React Flow graph
- [ ] Color-code nodes by domain
- [ ] Show prerequisite edges as directed connections
- [ ] Interactive exploration (click node → show details)
- [ ] Zoom, pan, minimap controls
- [ ] Dynamic layout (circular/force-directed)

## Stage 5.5 — Learning Goals → Career Path Generation

**Goal**: Generate career paths from the imported graph.

- [ ] Map learning goals to career paths
- [ ] Generate prerequisite-sorted node sequences for each career
- [ ] Show career roadmaps with milestone levels
- [ ] Compare career paths (common/unique nodes)
- [ ] Estimate completion time per career path

## Stage 5.6 — Project Recommendations from Graph

**Goal**: Recommend projects based on mastered nodes.

- [ ] Compute project readiness scores from node mastery
- [ ] Suggest next projects based on completed prerequisites
- [ ] Show project skill coverage (which skills each project exercises)
- [ ] Generate project roadmaps for career paths

## Stage 5.7 — Simulator Integration

**Goal**: Connect simulators to nodes and recommend them.

- [ ] Import simulator definitions
- [ ] Link simulators to nodes
- [ ] Recommend simulators based on learning state
- [ ] Simulator launch flow from node detail page

## Stage 5.8 — Cross-Domain Relationship Discovery

**Goal**: Surface hidden connections between domains.

- [ ] Import and display hidden relationships
- [ ] Show cross-domain connections on node detail
- [ ] Surface analogy-based relationships for deeper understanding
- [ ] Concept decomposition browser (drill down through hierarchy)

## Stage 5.9 — Learning Path Optimization

**Goal**: Optimize learning paths from the full graph.

- [ ] Multi-strategy path generation (shortest, fastest, foundation-first, project-first)
- [ ] Path comparison (side-by-side)
- [ ] Path re-optimization based on velocity
- [ ] Semester/daily/weekly planning
- [ ] Spaced repetition review scheduling

---

# 10 Engineering Rules

## SOLID Principles

| Principle                 | Backend Application                                                                              | Frontend Application                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **S**ingle Responsibility | Each engine has one responsibility. GraphEngine = structure. KnowledgeEngine = content.          | Each component has one purpose. Graph components render, hooks manage state, services call API. |
| **O**pen/Closed           | Add new engines without modifying existing ones. New edge types don't require engine changes.    | New pages added as new route segments. Components extended via composition.                     |
| **L**iskov Substitution   | All repositories inherit from BaseRepository safely. EngineBase guarantees consistent lifecycle. | All Radix UI primitives follow consistent patterns.                                             |
| **I**nterface Segregation | Engines expose only needed capabilities. Repositories expose only needed CRUD operations.        | Hooks return only needed state. Services expose only needed functions.                          |
| **D**ependency Inversion  | Engines depend on abstractions, not concrete implementations. Services depend on UoW interface.  | Components depend on hooks, not API directly. Hooks depend on service interfaces.               |

## DDD (Domain-Driven Design)

- **Entities**: KnowledgeNode, KnowledgeEdge, Career, Project, User — have identity (UUID) and lifecycle
- **Value Objects**: Difficulty, RelationshipType, NodeType — immutable, no identity
- **Aggregates**: Graph aggregate (nodes + edges), Learner aggregate (user + progress + bookmarks)
- **Repositories**: One per aggregate root
- **Domain Events**: Published through EventBus for cross-aggregate communication

## Repository Pattern

1. All repositories inherit from `BaseRepository[ModelT]`
2. Generic pattern: `class KnowledgeNodeRepository(BaseRepository[KnowledgeNode])`
3. BaseRepository provides: `create()`, `update()`, `delete()`, `get()`, `get_by_slug()`, `list()`, `paginate()`, `find_by()`, `exists_by()`, `soft_delete()`, `restore()`
4. Custom query methods added in entity repositories
5. Repositories are stateless — all state in UnitOfWork
6. No `commit()` calls in repositories — UnitOfWork manages transactions
7. Exceptions from `repositories/errors.py`: `RepositoryError`, `EntityNotFoundError`, `DuplicateEntityError`, `DatabaseConnectionError`, `QueryError`

## Unit of Work

```python
class UnitOfWork:
    async def __aenter__(self) -> Self  # Open transaction
    async def __aexit__(self, ...)       # Commit or rollback
    async def commit(self)               # Explicit commit
    async def rollback(self)             # Explicit rollback
    async def flush(self)                # Flush without commit
```

## Naming Conventions

### Python (Backend)

- **Classes**: PascalCase (`KnowledgeNodeService`)
- **Functions/methods**: snake_case (`validate_schema`, `update_mastery`)
- **Variables**: snake_case (`node_id`, `estimated_minutes`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DEPTH = 10`)
- **Files**: snake_case (`knowledge_node.py`, `unit_of_work.py`)
- **Private methods**: underscore prefix (`_validate_schema`, `_build_graph`)
- **Type hints**: Always present on all function signatures

### TypeScript/React (Frontend)

- **Components**: PascalCase (`KnowledgeNode`, `AppShell`)
- **Functions**: camelCase (`useGraph`, `fetchNodes`)
- **Variables**: camelCase (`selectedNode`, `estimatedMinutes`)
- **Files**: kebab-case for pages, camelCase for modules
- **Interfaces**: PascalCase with I-prefix not required
- **Types**: PascalCase

### Database

- **Tables**: snake_case, plural (`knowledge_nodes`, `user_progress`)
- **Columns**: snake_case (`node_type`, `estimated_minutes`)
- **Indexes**: `ix_table_column`
- **Triggers**: `trigger_action`

## Testing

- **Backend**: pytest with async tests
- **Test database**: Requires PostgreSQL running
- **Test fixtures**: In `tests/conftest.py`
- **Engine tests**: Test lifecycle state machine transitions
- **API tests**: Test endpoint responses with mocked services

## Performance Rules

- All engine algorithms document time complexity for V=10², V=10⁴, V=10⁶
- No algorithm with worse-than-O(V log V) complexity runs in a request path
- Graph traversal depth limit: 10
- Max nodes per traversal: 500
- Recursive CTE depth limit: 10
- Pagination defaults: 20 items per page, max 100
- In-memory GraphCache: ~30MB for 10K nodes
- LRU cache for node content: 10,000 entries
- CORS, GZip, connection pooling configured

## Security Rules

- JWT-based authentication (HS256) with 60-min access token expiry
- Password hashing: bcrypt via passlib
- CSRF protection via double-submit cookie pattern
- Rate limiting: 100 req/min authenticated, 20 req/min anonymous
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Trusted hosts validation
- Input validation via Pydantic v2
- Soft delete (not hard delete) on all entities
- Optimistic locking (`version` column) for concurrent mutation protection
- Prompt injection detection in AI services

## Coding Standards

### Python

- Python 3.12+ with type hints everywhere
- Ruff for linting (select: E, F, I, N, W, UP, B, SIM, ARG, RUF)
- Line length: 100 characters
- Single quotes (configured via Ruff)
- Async first: all DB operations use asyncpg + asyncio
- Pydantic v2 for all data validation
- Repository pattern with Unit of Work
- Engine lifecycle pattern for services
- No wildcard imports
- All files must `compileall` clean

### TypeScript/React

- TypeScript strict mode with `noUncheckedIndexedAccess`
- ES2022 target, ESNext modules, bundler resolution
- Functional components with hooks
- React Query for server state, Zustand for client state
- Tailwind CSS v4 (utility-first, @theme tokens)
- Radix UI primitives for accessibility
- Prettier for formatting

### General

- Conventional commits (`type(scope): description`)
- Prettier + Ruff for formatting
- Husky pre-commit hooks (lint-staged)
- commitlint for commit message validation
- No `noqa` abuse — fix root causes
- No TODOs, placeholders, or stubs in shipped code

---

# 11 AI Working Instructions

This section tells any future AI exactly how to continue the project.

## Coding Rules

1. **Read first, write second**: Always read existing models, repositories, services, and API endpoints before creating or modifying anything. Use file-picker, code-searcher, and read_files tools to understand the existing patterns.

2. **Extend, never rewrite**: Never rename models, break routes, or remove tables/services. Extend existing patterns. If tables matching a target schema already exist, extend those — don't create a second parallel schema.

3. **No placeholders**: No TODOs, no stubs, no placeholder functions in shipped code. Every function must have a real implementation.

4. **Match project naming conventions**: Follow the established naming patterns in the codebase. Python uses snake_case, TypeScript uses camelCase, components use PascalCase.

5. **Async everywhere**: All database operations use asyncpg + asyncio. All repository methods are async. All service methods are async.

6. **Type hints always**: Every Python function must have type hints. Every TypeScript function must have typed parameters and return types.

7. **Pydantic v2**: All data validation uses Pydantic v2 models. Request/response schemas are Pydantic models.

8. **Repository + UoW pattern**: Data access goes through repositories. Transactions are managed by UnitOfWork. Repositories never call commit().

9. **Unified response format**: All API endpoints return the standard `{success, message, data, errors, timestamp, request_id}` envelope.

## Architectural Rules

1. **The Knowledge Graph is the source of truth**: Every feature emerges from the graph. If it cannot be expressed as a graph operation, it does not belong in SV-OS.

2. **Engines own logic; services orchestrate**: Business logic lives in pure, testable engines. Services are thin orchestrators that wire engines to the outside world. No engine calls an API endpoint or HTTP service.

3. **State is explicit**: Learner knowledge, graph health, and recommendation quality are all modeled as explicit state machines with documented transitions.

4. **Validated before mutated**: Every graph mutation passes through the Validation Engine before being committed. Validation is not optional.

5. **Deterministic by default**: All core algorithms (recommendation, path-finding, gap analysis) must produce identical outputs for identical inputs. ML is additive, not foundational.

6. **`unlocks` is NEVER stored**: Always computed from `prerequisites` at query time. The import pipeline must reject any input containing `unlocks` fields.

7. **Engines communicate through events**: The Event Engine is the communication backbone. No engine directly calls another engine's methods for state-changing operations.

8. **Capabilities over CRUD**: APIs describe what the system can DO, not what data it stores.

## What Not to Change

1. **Do not rename models**: `KnowledgeNode`, `KnowledgeEdge`, `Career`, `Project`, `User`, `UserProgress` — these are referenced throughout the codebase.

2. **Do not change the response envelope**: `{success, message, data, errors, timestamp, request_id}` — every frontend service depends on this format.

3. **Do not remove middleware layers**: CORS, CSRF, Rate Limit, Timing, Correlation ID, Request ID, Security Headers, Trusted Hosts, GZip — all 9 layers are required.

4. **Do not bypass the import pipeline validation**: Cycle detection (Kahn's algorithm), referential integrity, and schema validation must run before every import commit.

5. **Do not add `unlocks` to the database schema**: The `node_unlocks` view exists for a reason. Never create an `unlocks` column.

6. **Do not lower strictness**: Never disable Ruff rules, never add `type: ignore` without explicit justification, never suppress tests.

## How to Verify Work

1. **Run Ruff**: `cd apps/api && python -m ruff check apps/api` — must pass with 0 errors
2. **Run format check**: `python -m ruff format --check apps/api` — must pass
3. **Run compileall**: `python -m compileall apps/api` — must pass with no errors
4. **Run mypy**: `python -m mypy apps/api` — target 0 errors (currently 225 errors)
5. **Run tests**: `pytest apps/api/tests` — requires PostgreSQL running
6. **Verify imports**: Import all new modules in Python REPL
7. **Verify API startup**: FastAPI app should start without ImportError
8. **Code review**: Use code-reviewer-deepseek-flash to review all changes

## How to Maintain Consistency

1. **One file per class**: Each model, repository, service, or schema gets its own file (with exceptions for closely related small classes).
2. **`__init__.py` exports**: Every package's `__init__.py` exports the key classes. Services are registered in `services/__init__.py`.
3. **API endpoint files**: Each endpoint group gets one file in `api/v1/endpoints/`. The router imports from these files.
4. **Model → Repository → Service → Endpoint**: This is the dependency chain. Services depend on repositories. Endpoints depend on services. Never reverse this.
5. **Docstrings on public methods**: Every public method should have a brief docstring explaining what it does.
6. **Cross-reference docs**: When creating documentation, cross-reference related docs using relative links (`[LEARNING_ENGINE.md](../Learning/LEARNING_ENGINE.md)`).

---

# 12 Master Checklist

## Import Pipeline — Complete

| #   | Task                                    | Dependencies     | Complexity | Acceptance Criteria                             | Status |
| --- | --------------------------------------- | ---------------- | ---------- | ----------------------------------------------- | ------ |
| 1   | ImportMap Pydantic schema               | None             | S          | Schema validates 40-node reference dataset      | ✅     |
| 2   | KnowledgeImportService with validation  | Schemas          | M          | Ports all logic from import_engine.py           | ✅     |
| 3   | Import API endpoints                    | ImportService    | M          | POST /import, /dry-run, GET /nodes, /report     | ✅     |
| 4   | Cycle detection (Kahn's algorithm)      | Graph building   | M          | Cyclic graphs rejected, acyclic graphs accepted | ✅     |
| 5   | Upsert persistence                      | Repositories     | M          | Re-running import is safe no-op                 | ✅     |
| 6   | `unlocks` computed from prerequisites   | Edge persistence | S          | Never stored independently                      | ✅     |
| 7   | Read path: nodes by domain with unlocks | Query service    | S          | Shows real DB data, not re-served JSON          | ✅     |

## Mypy Type Fixes

| #   | Task                                         | Dependencies | Complexity | Acceptance Criteria                                | Status |
| --- | -------------------------------------------- | ------------ | ---------- | -------------------------------------------------- | ------ |
| 8   | Fix `bool` vs `ColumnElement[bool]` patterns | None         | M          | All SQLAlchemy boolean comparisons typed correctly | ❌     |
| 9   | Fix generic type bounds in repositories      | None         | M          | BaseRepository[ModelT] bound properly              | ❌     |
| 10  | Fix engine container registration types      | None         | M          | Engine registry type-safe                          | ❌     |
| 11  | Fix async return type annotations            | None         | M          | All async functions return correct types           | ❌     |
| 12  | Fix Optional vs Union patterns               | None         | M          | Consistent Optional usage                          | ❌     |

## Tests

| #   | Task                           | Dependencies | Complexity | Acceptance Criteria                      | Status |
| --- | ------------------------------ | ------------ | ---------- | ---------------------------------------- | ------ |
| 13  | Add import pipeline unit tests | PostgreSQL   | M          | Test validation, upsert, cycle detection | ❌     |
| 14  | Add import API endpoint tests  | PostgreSQL   | M          | Test all 5 import endpoints              | ❌     |
| 15  | Wire frontend tests into CI    | None         | M          | `pnpm test` runs in GitHub Actions       | ❌     |
| 16  | Add coverage reporting         | Tests        | S          | pytest-cov configured                    | ❌     |

## Stage 5.2 — Full Knowledge Graph

| #   | Task                                      | Dependencies    | Complexity | Acceptance Criteria                  | Status |
| --- | ----------------------------------------- | --------------- | ---------- | ------------------------------------ | ------ |
| 17  | Create 204-node full knowledge graph JSON | Stage 5.1       | L          | Complete dataset with all node types | ❌     |
| 18  | Import simulators + node_simulators       | Import pipeline | M          | Simulators linked to nodes           | ❌     |
| 19  | Import seniority levels + career mappings | Import pipeline | M          | 10 levels, career→seniority→node     | ❌     |
| 20  | Import hidden relationships               | Import pipeline | M          | Cross-domain insight connections     | ❌     |
| 21  | Import concept decomposition              | Import pipeline | M          | 5-level hierarchy per node           | ❌     |
| 22  | Full graph integrity validation           | Import pipeline | M          | No cycles, all refs resolve          | ❌     |

## Stage 5.3 — Read Path UI

| #   | Task                         | Dependencies     | Complexity | Acceptance Criteria                            | Status |
| --- | ---------------------------- | ---------------- | ---------- | ---------------------------------------------- | ------ |
| 23  | Nodes-by-domain browse page  | Stage 5.2        | M          | Shows all domains with node counts             | ❌     |
| 24  | Node detail page             | Stage 5.2        | M          | Shows graph relationships, resources, projects | ❌     |
| 25  | Domain sidebar filter        | Node browse      | S          | Filter nodes by domain/category                | ❌     |
| 26  | Search across imported nodes | Full-text search | M          | Search by title, description, domain           | ❌     |

## Stage 5.4 — Graph Visualization

| #   | Task                                       | Dependencies | Complexity | Acceptance Criteria                           | Status |
| --- | ------------------------------------------ | ------------ | ---------- | --------------------------------------------- | ------ |
| 27  | Imported nodes in React Flow               | Stage 5.3    | L          | Nodes render with domain colors               | ❌     |
| 28  | Prerequisite edges as directed connections | Stage 5.3    | L          | Edge arrows show dependency direction         | ❌     |
| 29  | Interactive exploration                    | Graph viz    | M          | Click node → show detail, highlight neighbors | ❌     |
| 30  | Dynamic graph layout                       | Graph viz    | M          | Circular + force-directed layouts             | ❌     |

## Stage 5.5 — Career Path Generation

| #   | Task                               | Dependencies  | Complexity | Acceptance Criteria                             | Status |
| --- | ---------------------------------- | ------------- | ---------- | ----------------------------------------------- | ------ |
| 31  | Map learning goals to career paths | Stages 5.2    | M          | Each goal has prerequisite-sorted node sequence | ❌     |
| 32  | Career roadmap with milestones     | Career engine | M          | Seniority levels mapped to node groups          | ❌     |
| 33  | Career path comparison             | Career engine | M          | Side-by-side common/unique nodes                | ❌     |
| 34  | Completion time estimation         | Career engine | M          | Estimated hours per career path                 | ❌     |

## Stage 5.6 — Project Recommendations

| #   | Task                        | Dependencies          | Complexity | Acceptance Criteria                           | Status |
| --- | --------------------------- | --------------------- | ---------- | --------------------------------------------- | ------ |
| 35  | Project readiness scoring   | Stage 5.5             | M          | Score based on prerequisite mastery           | ❌     |
| 36  | Next project suggestion     | Recommendation engine | M          | Suggests projects with complete prerequisites | ❌     |
| 37  | Project skill coverage view | Project engine        | M          | Shows which skills each project exercises     | ❌     |

## Stage 5.7 — Simulator Integration

| #   | Task                              | Dependencies     | Complexity | Acceptance Criteria                           | Status |
| --- | --------------------------------- | ---------------- | ---------- | --------------------------------------------- | ------ |
| 38  | Simulator definitions imported    | Stage 5.2        | M          | All simulators in database                    | ❌     |
| 39  | Simulator recommendation          | Simulator engine | M          | Recommends simulators based on learning state | ❌     |
| 40  | Simulator launch from node detail | Frontend         | M          | Click to launch simulator                     | ❌     |

## Stage 5.8 — Cross-Domain Discovery

| #   | Task                             | Dependencies | Complexity | Acceptance Criteria                           | Status |
| --- | -------------------------------- | ------------ | ---------- | --------------------------------------------- | ------ |
| 41  | Display hidden relationships     | Stage 5.2    | M          | Show on node detail page                      | ❌     |
| 42  | Analogy browser                  | Hidden rels  | M          | Browse structural analogies between domains   | ❌     |
| 43  | Concept decomposition drill-down | Stage 5.2    | M          | Navigate hierarchy from domain to atomic unit | ❌     |

## Stage 5.9 — Learning Path Optimization

| #   | Task                                | Dependencies      | Complexity | Acceptance Criteria                                          | Status |
| --- | ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------ | ------ |
| 44  | Multi-strategy path generation      | Full graph        | L          | 5 strategies: shortest, fastest, foundation, project, career | ❌     |
| 45  | Path comparison                     | Path generation   | M          | Side-by-side path comparison                                 | ❌     |
| 46  | Velocity-based path re-optimization | Learning engine   | L          | Paths adjust based on learner velocity                       | ❌     |
| 47  | Daily/weekly/semester planning      | Scheduling engine | L          | Time-budgeted learning plans                                 | ❌     |
| 48  | Spaced repetition review scheduling | Revision engine   | M          | SM-2 based review intervals                                  | ❌     |

## Infrastructure

| #   | Task                         | Dependencies  | Complexity | Acceptance Criteria                   | Status |
| --- | ---------------------------- | ------------- | ---------- | ------------------------------------- | ------ |
| 49  | Redis for caching            | None          | M          | Learner state cache, query cache      | ❌     |
| 50  | PgBouncer connection pooling | None          | M          | Production database connection pool   | ❌     |
| 51  | CI frontend tests            | None          | M          | vitest wired into GitHub Actions      | ❌     |
| 52  | Plugin system                | Engine system | XL         | Plugin loading, sandboxing, lifecycle | ❌     |
| 53  | WebSocket real-time features | None          | L          | Live graph collaboration              | ❌     |

---

_End of PHASE5_MASTER_CONTEXT.md_
