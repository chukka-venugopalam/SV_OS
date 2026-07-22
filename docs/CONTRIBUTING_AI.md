# SV-OS Contributing Guide for AI Assistants

> **Purpose**: This document instructs every AI coding assistant how to contribute to the SV-OS codebase correctly and consistently.
> **Last Updated**: July 22, 2026

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Coding Standards](#coding-standards)
3. [Repository Conventions](#repository-conventions)
4. [Naming Rules](#naming-rules)
5. [Folder Rules](#folder-rules)
6. [Architecture Principles](#architecture-principles)
7. [Performance Guidelines](#performance-guidelines)
8. [Security Guidelines](#security-guidelines)
9. [Dependency Rules](#dependency-rules)
10. [Testing Rules](#testing-rules)
11. [Documentation Rules](#documentation-rules)
12. [Pull Request Standards](#pull-request-standards)
13. [Things AI Must Never Change](#things-ai-must-never-change)
14. [How New Features Should Be Implemented](#how-new-features-should-be-implemented)
15. [How to Preserve Architecture Consistency](#how-to-preserve-architecture-consistency)

---

## Core Principles

1. **Read the codebase first** — Before making any change, read the relevant files to understand existing conventions, patterns, and architecture.
2. **Follow existing patterns** — Every file, function, and component should look like it belongs. Match the style of surrounding code.
3. **Make minimal changes** — Prefer small, focused changes over large rewrites. One PR = one concern.
4. **Never break backward compatibility** — Public APIs, database schemas, and exported interfaces must remain backward-compatible unless explicitly approved.
5. **Test everything** — Every new feature must have tests. Every bug fix must have a regression test.
6. **Document as you go** — Public APIs, architectural decisions, and non-obvious logic must be documented.
7. **Type safety first** — Use strict types. Avoid `any`, `Any`, unchecked casts, and `# type: ignore` unless absolutely necessary.

---

## Coding Standards

### Python (Backend — `apps/api/`)

| Rule           | Standard                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| Python version | 3.12+                                                                     |
| Type hints     | Required on all functions, methods, and public attributes                 |
| Linter         | Ruff (select: E, F, I, N, W, UP, B, SIM, ARG, RUF)                        |
| Formatter      | Ruff (line length: 100, single quotes)                                    |
| Docstrings     | Google-style ("""Summary.\n\nArgs:\n ...\nReturns:\n ...\n""")            |
| Async          | All database operations must use async/await with asyncpg                 |
| Imports        | Standard library → Third-party → First-party (alphabetical within groups) |
| Error handling | Raise specific exceptions from the `AppError` hierarchy                   |
| Logging        | Use structlog (`get_logger(__name__)`) — never `print()`                  |

#### Example

```python
"""Calculate the prerequisite depth for a knowledge node."""

from __future__ import annotations

from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

logger = get_logger(__name__)


async def calculate_depth(
    node_id: UUID,
    graph_service: GraphService,
    *,
    max_depth: int = 5,
) -> int:
    \"\"\"Calculate the depth of a node in the prerequisite chain.

    Args:
        node_id: The UUID of the target node.
        graph_service: Service for graph operations.
        max_depth: Maximum traversal depth (default: 5).

    Returns:
        The calculated depth as an integer.

    \"\"\"
    chain = await graph_service.get_prerequisite_chain(node_id)
    depth = len(chain)
    logger.info('prerequisite_depth_calculated', node_id=str(node_id), depth=depth)
    return min(depth, max_depth)
```

### TypeScript/React (Frontend — `apps/web/` & `packages/`)

| Rule            | Standard                                                 |
| --------------- | -------------------------------------------------------- |
| TypeScript      | strict mode with `noUncheckedIndexedAccess: true`        |
| Target          | ES2022                                                   |
| Module          | ESNext with bundler resolution                           |
| JSX             | `preserve` (handled by Next.js)                          |
| Components      | Functional components with hooks — no class components   |
| Props interface | Define explicit interfaces, prefer `Readonly<Props>`     |
| Styling         | Tailwind CSS v4 utility classes — no CSS modules         |
| Icons           | Use `lucide-react` — no inline SVGs for icons            |
| Animations      | Use `framer-motion` or CSS `@keyframes` from globals.css |

#### Example

```tsx
'use client';

import { Button } from '@sv-os/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface QuickActionProps {
  /** Icon to display (lucide-react component) */
  icon: React.ReactNode;
  /** Short label text */
  label: string;
  /** Link href */
  href: string;
  /** CSS color value for the accent */
  color: string;
}

export function QuickAction({ icon, label, href, color }: Readonly<QuickActionProps>) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="group w-full justify-start gap-3 px-3 py-2"
        style={{ '--accent-color': color } as React.CSSProperties}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </span>
        <span className="flex-1 text-left text-sm font-medium">{label}</span>
        <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </Link>
  );
}
```

---

## Repository Conventions

### Git Commit Messages

Use **conventional commits** (`type(scope): description`):

```
feat(engine): add traversal engine with BFS support
fix(api): handle null user preferences in profile endpoint
chore(deps): update react-query to v5.75
docs(architecture): add engine dependency diagram
refactor(repository): extract base pagination logic
test(auth): add password reset flow tests
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`, `revert`

### Branch Naming

```
feat/engine-traversal
fix/auth-null-handling
chore/update-deps
docs/add-mermaid-diagrams
```

### Pull Requests

- Every PR must reference an issue
- PR title must follow conventional commits format
- PR description must explain WHAT and WHY (not HOW)
- Include screenshots for UI changes
- All CI checks must pass before merge
- At least one reviewer must approve

---

## Naming Rules

### Python (Backend)

| Element              | Convention                         | Example                                             |
| -------------------- | ---------------------------------- | --------------------------------------------------- |
| Files/directories    | `snake_case`                       | `knowledge_node.py`, `graph_engine.py`              |
| Classes              | `PascalCase`                       | `GraphEngine`, `KnowledgeNodeRepository`            |
| Functions/methods    | `snake_case`                       | `create_access_token()`, `get_prerequisite_chain()` |
| Variables            | `snake_case`                       | `user_id`, `access_token`                           |
| Constants            | `UPPER_SNAKE_CASE`                 | `MAX_DEPTH`, `DEFAULT_PAGE_SIZE`                    |
| Private methods      | `_snake_case` (leading underscore) | `_initialize_impl()`, `_bump_version()`             |
| Type variables       | `PascalCase` with `T` suffix       | `ModelT`, `ServiceT`                                |
| Modules (re-exports) | `__init__.py`                      | Use `__all__` for explicit exports                  |

### TypeScript (Frontend & Packages)

| Element           | Convention                          | Example                                |
| ----------------- | ----------------------------------- | -------------------------------------- |
| Files/directories | `kebab-case`                        | `knowledge-node.ts`, `graph-engine.ts` |
| React components  | `PascalCase`                        | `KnowledgeNode`, `AuthProvider`        |
| Functions/hooks   | `camelCase`                         | `useAuth()`, `formatRelativeTime()`    |
| Interfaces/types  | `PascalCase`                        | `UserProfile`, `GraphNode`             |
| Type aliases      | `PascalCase`                        | `ProgressStatus`, `NodeType`           |
| Constants         | `UPPER_SNAKE_CASE`                  | `NODE_TYPE_COLORS`, `API_VERSION`      |
| CSS classes       | `kebab-case` (Tailwind conventions) | `glass-card`, `focus-ring`             |

---

## Folder Rules

### Backend (`apps/api/app/`)

```
app/
├── api/v1/endpoints/     # FastAPI route handlers — thin, delegate to services
├── core/                 # Application config, database setup, logging
├── domain/               # Pure domain dataclasses (no framework deps)
├── engines/              # EngineBase subclasses with lifecycle
├── events/bus/           # Event bus infrastructure
├── exceptions/           # Exception hierarchy + FastAPI handlers
├── infrastructure/       # Cache, container, registries, runtime
├── middleware/            # FastAPI middleware components
├── models/               # SQLAlchemy ORM models
├── repositories/         # Data access layer (one per entity)
├── schemas/              # Pydantic request/response schemas
├── services/             # Business logic layer
├── startup/              # App lifespan, diagnostics
├── telemetry/            # Health, metrics, tracing
└── utils/                # Shared helper functions
```

**Rules:**

- Endpoints must NOT contain business logic — delegate to services
- Services must NOT access HTTP concerns — delegate to endpoints
- Repositories must NOT commit transactions — delegate to UnitOfWork
- Engines must NOT depend on FastAPI, SQLAlchemy, or HTTP — pure in-memory
- Domain dataclasses must NOT import from `app.models` (ORM)

### Frontend (`apps/web/src/`)

```
src/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable React components
│   ├── graph/            # Graph visualization components
│   ├── layout/           # App shell components
│   └── shared/           # Shared/page-level components
├── features/             # Feature-specific component bundles
├── hooks/                # Custom React hooks
├── lib/                  # Utilities, API clients, constants
├── providers/            # React context providers
├── services/             # API service functions
├── stores/               # Zustand stores
├── types/                # Local type definitions
└── utils/                # Pure utility functions
```

**Rules:**

- Pages in `app/` must be thin — compose components and hooks
- Components in `components/` must be reusable — no page-specific logic
- Hooks in `hooks/` must encapsulate state logic and API calls
- Providers in `providers/` must wrap context and expose hooks
- Stores in `stores/` must be Zustand — one store per domain

### Packages (`packages/`)

```
packages/
├── config/src/           # Constants, env definitions, tokens
├── types/src/            # TypeScript interfaces only
├── ui/src/              # React components only
├── eslint-config/       # ESLint configs only
└── tsconfig/            # TypeScript configs only
```

---

## Architecture Principles

### Layered Architecture

```
API Endpoints (routing, HTTP concerns)
    → Services (business logic, orchestration)
        → Repositories (data access via UnitOfWork)
        → Engines (in-memory computation)
            → Event Bus (cross-engine communication)
```

### Dependency Direction

```
API Layer → Service Layer → Repository Layer → Database
API Layer → Service Layer → Engine Layer → Event Bus
```

- Dependencies flow **inward** — outer layers can depend on inner layers
- Inner layers must **never** depend on outer layers
- Engines must **never** import from `app.api`, `app.repositories`, or `app.models`

### Engine Principles

1. **Stateless lifecycle** — Engines transition through formal lifecycle states
2. **In-memory operations** — Engines operate on in-memory data; persistence is through repositories
3. **No HTTP dependencies** — Engines must not import FastAPI or HTTP modules
4. **Event-driven communication** — Cross-engine communication must go through EventBus
5. **Health reporting** — Every engine must implement `health_impl()` returning `EngineHealth`

### Repository Principles

1. **UnitOfWork owns transactions** — Repositories flush but never commit
2. **Soft delete by default** — All entities with `is_deleted` are filtered automatically
3. **Optimistic locking** — Use `version` field for concurrent modification detection
4. **Consistent pagination** — Use `paginate()` or `paginate_cursor()` from BaseRepository
5. **No business logic** — Repositories are data access only

---

## Performance Guidelines

### Database

- Use **selective column queries** instead of `SELECT *` where possible
- Use **batch operations** (`create_many`, `delete_many`) for bulk data
- Use **cursor pagination** for large datasets (>10K rows)
- Always add appropriate **database indexes** based on query patterns
- Use **JOINs sparingly** — prefer repository composition when possible
- Enable **connection pooling** (Pool_size=10, max_overflow=20)

### API

- Use **pagination** on all list endpoints (default: 20, max: 100)
- Use **cursor-based pagination** for real-time feeds
- Set appropriate **`Cache-Control` headers** for static or slowly-changing data
- **Compress responses** (GZip middleware for responses >1KB)

### Frontend

- Use **React Query** for server state caching and deduplication
- Use **`Suspense`** for data-dependent components
- **Lazy-load** heavy components (React Flow, chat) with `dynamic()`
- Use **`optimizePackageImports`** in `next.config.ts` for large icon libraries
- **Memoize** expensive computations with `useMemo` and `useCallback`
- Use **virtual scrolling** for large lists (future)

### Engines

- **In-memory indexes** provide O(1) lookups (slug, type, relationship)
- **GraphEngine** uses adjacency lists with pre-computed indexes
- **Snapshot history** is limited to 10 to prevent memory growth
- **Cache invalidation** happens on mutation (write-through)

---

## Security Guidelines

### Authentication

- All passwords must be hashed with **bcrypt** (via passlib) — never store plaintext
- JWT tokens use **HS256** algorithm with a strong, unique `SECRET_KEY`
- Access tokens expire in **60 minutes**; refresh tokens in **7 days**
- Password reset tokens expire in **1 hour** and are **single-use**
- Token validation happens in FastAPI dependencies, not in endpoint handlers

### API Security

- **CORS** restricts origins to configured whitelist
- **CSRF protection** via double-submit cookie pattern (production)
- **Rate limiting** — 100 req/min (authenticated), 20 req/min (anonymous)
- **Security headers** set on all responses (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- **Host header validation** rejects requests to unknown hosts

### Data Security

- **SQL injection** prevented by SQLAlchemy parameterized queries
- **Input validation** via Pydantic schemas on all endpoints
- **Soft delete** prevents accidental data loss
- **Audit logging** tracks all entity modifications

### AI Security

- **Prompt injection detection** in AI chat service
- **Input sanitization** before sending to external providers
- **Rate limiting** on AI endpoints

### Frontend Security

- **Never expose secrets** in client-side code (use NEXT_PUBLIC_ prefix only for public vars)
- **XSS protection** via React's built-in escaping and CSP headers
- **Authentication tokens** stored securely (httpOnly cookies when possible)
- **Environment validation** on all public-facing variables

---

## Dependency Rules

### Adding Python Dependencies

1. Add to `apps/api/pyproject.toml` under `[project.dependencies]` (production) or `[project.optional-dependencies]` (dev)
2. Pin major version ranges (e.g., `fastapi>=0.115.0`)
3. Run `pip install -e ".[dev]"` to update the environment
4. Run `pip freeze > requirements.txt` if a requirements file is needed

### Adding Node.js Dependencies

1. Use `pnpm add <package>` (production) or `pnpm add -D <package>` (dev) in the correct workspace
2. For shared packages, add to the specific package directory: `pnpm --filter @sv-os/web add <package>`
3. Never commit `pnpm-lock.yaml` changes without corresponding `package.json` changes
4. Keep the lockfile consistent: `pnpm install --frozen-lockfile` in CI

### Internal Dependency Rules

- `@sv-os/web` may depend on `@sv-os/config`, `@sv-os/types`, `@sv-os/ui`
- `@sv-os/ui` may depend on `@sv-os/config` (for cn utility)
- `@sv-os/types` and `@sv-os/config` must have zero internal dependencies
- Do NOT add circular dependencies between packages
- Use `workspace:*` protocol for monorepo packages

### Prohibited Dependencies

- Do NOT add jQuery, Bootstrap, or other heavy UI frameworks (use Tailwind + Radix)
- Do NOT add additional state management libraries (React Query + Zustand are sufficient)
- Do NOT add additional ORM or database drivers (SQLAlchemy + asyncpg are the standard)
- Do NOT add additional UI component libraries (Radix UI is the standard)

---

## Testing Rules

### Backend Tests (`apps/api/tests/`)

- Use **pytest** with `asyncio_mode = "auto"`
- Use **httpx** `AsyncClient` for API integration tests
- Use **faker** for generating test data
- Write tests in `tests/services/` for service layer tests
- Write tests in `tests/repositories/` for repository tests
- Mark database-dependent tests with `@pytest.mark.db`
- Mark slow tests with `@pytest.mark.slow`
- Run: `cd apps/api && python -m pytest tests/ -vv`

### Frontend Tests (`apps/web/vitest.config.ts`)

- Use **vitest** with React Testing Library
- Use **jsdom** for browser environment simulation
- Write component tests in `__tests__/` directories near components
- Write hook tests alongside hooks
- Write utility tests in `lib/__tests__/`
- Run: `cd apps/web && pnpm test`

### Test Coverage Requirements

| Layer         | Coverage Target | Priority |
| ------------- | --------------- | -------- |
| Repositories  | 90%+            | High     |
| Services      | 85%+            | High     |
| API endpoints | 80%+            | Medium   |
| Engines       | 75%+            | Medium   |
| UI components | 70%+            | Medium   |
| Hooks         | 70%+            | Medium   |

### Test Patterns

- **Repository tests**: Use a test database, test CRUD + pagination + soft delete
- **Service tests**: Mock repositories, test business logic
- **API tests**: Use TestClient, test response format + status codes + auth
- **Engine tests**: Test lifecycle (init → start → stop), test core operations
- **Component tests**: Test rendering + user interactions + accessibility

---

## Documentation Rules

### Code Documentation

- Every public API function needs a **docstring** (Google-style for Python, JSDoc for TypeScript)
- Every module needs a **module-level docstring** explaining its purpose
- Complex algorithms need **inline comments** explaining the approach
- Configuration schemas need **field-level comments** explaining each field

### Architecture Documentation

- Architecture decisions must be recorded in `.ai/ARCHITECTURE_DECISIONS.md`
- API changes must update `docs/API.md`
- Database schema changes must update `database/schema.sql` AND add an Alembic migration
- New features must be reflected in `docs/SV_OS_MASTER_SPEC.md`

### Documentation Standards

- Use **professional Markdown** with proper heading hierarchy
- Use **tables** for structured data (configuration, endpoints, types)
- Use **Mermaid diagrams** for architecture and flow visualization
- **Cross-reference** related documents
- Keep documentation **up to date** with code changes

---

## Pull Request Standards

### PR Checklist

- [ ] Code follows coding standards (lint passes)
- [ ] TypeScript/Python type checks pass
- [ ] All existing tests pass
- [ ] New tests cover the change
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes without explicit approval
- [ ] PR description explains WHAT and WHY
- [ ] Branch is up to date with target branch

### Review Criteria

| Criterion     | Must Have                      | Nice to Have            |
| ------------- | ------------------------------ | ----------------------- |
| Correctness   | ✅ Logic is correct            | Edge cases handled      |
| Testing       | ✅ Tests exist for new code    | Tests cover error paths |
| Performance   | ✅ No obvious perf regressions | Benchmarks included     |
| Security      | ✅ No security vulnerabilities | Penetration testing     |
| Accessibility | ✅ Keyboard navigable          | Screen reader tested    |
| Documentation | ✅ Public API documented       | Usage examples included |

---

## Things AI Must Never Change

### Critical Infrastructure

1. **`apps/api/app/core/database.py`** — Database engine configuration, session factory, Base class. Only modify to add connection pool settings.
2. **`apps/api/app/core/config.py`** — Settings schema. Adding new env vars is OK; removing existing ones is forbidden.
3. **`apps/api/app/main.py`** — Application entry point. Middleware ordering must NOT be changed (it's intentionally ordered).
4. **`package.json` (root)** — Scripts, engines, packageManager version.
5. **`turbo.json`** — Task pipeline configuration. Only add new tasks, never remove existing ones.
6. **`pnpm-workspace.yaml`** — Workspace definition.
7. **`docker-compose.yml` / `docker-compose.prod.yml`** — Service definitions.
8. **`Dockerfile.api` / `Dockerfile.web`** — Build stages, multi-stage structure.

### Data Layer

9. **`database/schema.sql`** — The canonical schema reference. Changes must be reflected here AND in an Alembic migration.
10. **`apps/api/app/models/base.py`** — AppBaseMixin (UUID PK, timestamps, soft-delete, version). Must be present on every model.
11. **`apps/api/app/models/enums.py`** — Enum definitions. Adding new values is OK; renaming/removing existing values is forbidden without a migration.
12. **`apps/api/app/alembic/`** — Migration files. NEVER modify an existing migration — create a new one.

### Architecture

13. **`apps/api/app/engines/base.py`** — EngineBase ABC. The lifecycle (init → start → stop) is standardized.
14. **`apps/api/app/repositories/base.py`** — BaseRepository interface. CRUD methods must remain stable.
15. **`apps/api/app/repositories/unit_of_work.py`** — UnitOfWork pattern. Transaction management must remain consistent.
16. **`apps/api/app/infrastructure/container/container.py`** — PlatformContainer engine registrations. Engine dependency order must be maintained.
17. **`apps/api/app/services/auth.py`** — Auth service interface (register, login, refresh, reset). Must remain backward-compatible for Supabase migration.

### Frontend

18. **`apps/web/src/app/globals.css`** — Design tokens, CSS custom properties, base styles. Color system and animation tokens must remain consistent.
19. **`apps/web/src/app/layout.tsx`** — Root layout with provider hierarchy. Provider ordering must remain consistent.
20. **`apps/web/src/app/(main)/layout.tsx`** — AppShell wrapper for authenticated pages.

### CI/CD

21. **`.github/workflows/ci.yml`** — CI pipeline steps. Adding new steps is OK; removing existing checks is forbidden.
22. **`.github/workflows/lint.yml`** — Lint workflow.

---

## How New Features Should Be Implemented

### Step-by-Step Process

1. **Understand the existing architecture**
   - Read relevant files in the same domain
   - Check existing patterns in similar features
   - Review `.ai/ARCHITECTURE_DECISIONS.md` for relevant decisions

2. **Plan the implementation**
   - Backend: Model → Repository → Service → Schema → Endpoint
   - Frontend: Types → Service → Hook → Component → Page
   - Consider: error handling, validation, pagination, auth, tests

3. **Implement backend first**
   - Start with the data layer (model + migration if needed)
   - Add repository methods
   - Implement service logic
   - Create API endpoint
   - Add Pydantic schemas

4. **Implement frontend second**
   - Add TypeScript types to shared packages if needed
   - Create/update API service functions
   - Build React hook
   - Create component
   - Add page

5. **Add tests**
   - Repository tests for new data access
   - Service tests for business logic
   - API tests for endpoint behavior
   - Component tests for UI rendering

6. **Document**
   - Update relevant documentation files
   - Add JSDoc/docstrings to public APIs
   - Update `.ai/` files if architecture decisions change

### Feature Implementation Template

```python
# apps/api/app/models/new_entity.py
class NewEntity(AppBaseMixin, Base):
    __tablename__ = 'new_entities'
    ...

# apps/api/app/repositories/new_entity.py
class NewEntityRepository(BaseRepository[NewEntity]):
    model = NewEntity
    ...

# apps/api/app/services/new_entity.py
class NewEntityService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
    ...

# apps/api/app/schemas/new_entity.py
class NewEntityCreate(BaseModel):
    ...

# apps/api/app/api/v1/endpoints/new_entity.py
router = APIRouter(prefix='/new-entities', tags=['new-entities'])
@router.get('/')
async def list_new_entities(...):
    ...
```

---

## How to Preserve Architecture Consistency

### Before Making Changes

1. **Check the architectural decisions**

   ```bash
   cat .ai/ARCHITECTURE_DECISIONS.md
   cat .ai/DEPENDENCY_MAP.md
   ```

2. **Check existing implementations**
   - Look at similar features in the same layer
   - Match the pattern exactly (imports, error handling, response format)

3. **Verify interface contracts**
   - Check `packages/types/src/` for TypeScript interfaces
   - Check `app/schemas/` for Pydantic models
   - Check `app/repositories/base.py` for repository interface

### Consistency Rules

1. **Response format**: All API responses must use `success_response()` from `app.schemas.response`
2. **Error format**: All errors must use the unified `{ success, message, data, errors, timestamp, request_id }` envelope
3. **Repository pattern**: All data access must go through a repository within a UnitOfWork
4. **Service pattern**: All business logic must be in a service class, not in an endpoint
5. **Engine pattern**: All engine-like functionality must extend `EngineBase`
6. **Hook pattern**: All data fetching must use custom hooks with React Query
7. **Component pattern**: All UI must use Tailwind CSS + Radix UI primitives

### Common Anti-Patterns to Avoid

| Anti-Pattern                               | Correct Approach                                 |
| ------------------------------------------ | ------------------------------------------------ |
| Business logic in API endpoints            | Move to service layer                            |
| Direct database access in services         | Use repositories via UnitOfWork                  |
| Hard-coded strings for API routes          | Use constants from `@sv-os/config`               |
| `any` type in TypeScript                   | Define explicit interfaces                       |
| CSS modules or styled-components           | Use Tailwind CSS v4 utility classes              |
| Direct state mutation                      | Use Zustand actions or React Query cache updates |
| Long functions (>50 lines)                 | Extract helper functions or sub-services         |
| Catching generic `Exception`               | Catch specific exception types                   |
| Ignoring type errors with `# type: ignore` | Fix the underlying type issue                    |
| Committing in repositories                 | Let UnitOfWork handle commits                    |

---

_Cross-reference: [SV_OS_MASTER_SPEC.md](./SV_OS_MASTER_SPEC.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)_
