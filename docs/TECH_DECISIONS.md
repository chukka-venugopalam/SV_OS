# SV-OS — Technology Decisions

## Frontend

### Next.js 15 (App Router)

- **Why**: Industry-standard React framework with SSR, SSG, ISR, Server Components, Server Actions, and excellent developer experience
- **Alternative considered**: Remix (less ecosystem support), SPA-only like Vite (poor SEO)
- **Decision**: App Router provides the best balance of SEO, performance, and developer productivity. Server Components improve initial load. Server Actions simplify mutations.

### TypeScript (Strict Mode)

- **Why**: Type safety across the entire stack prevents runtime errors and improves developer experience
- **Strict mode**: Enabled for maximum safety: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Decision**: Non-negotiable for a production application

### Tailwind CSS v4

- **Why**: Utility-first CSS framework enables rapid UI development with consistent design tokens
- **Decision**: Best balance of speed, performance, and maintainability for modern SaaS UIs

### shadcn/ui (Radix UI Primitives)

- **Why**: Beautiful, accessible, customizable component library built on Radix UI primitives. Copy-paste ownership model means we control every line of component code
- **Decision**: Gives us production-grade accessible components without vendor lock-in

### TanStack React Query

- **Why**: Declarative server state management with caching, background refetching, optimistic updates, and request deduplication
- **Alternative considered**: RTK Query (Redux coupling), SWR (less feature-rich), plain fetch/useEffect (manual cache management)
- **Decision**: React Query handles all server state — knowledge graph, nodes, careers, projects, search. Eliminates manual cache logic, loading states, and error states.

### Zustand

- **Why**: Minimal, scalable client state management with excellent TypeScript support and no boilerplate
- **Alternative considered**: Redux (excessive boilerplate), Jotai (less ecosystem), Context (re-render issues)
- **Decision**: Zustand for client-only state: UI preferences, graph viewport position, filter state, active selections. React Query handles server state.

### React Hook Form + Zod

- **Why**: Performant form library with minimal re-renders. Zod provides schema-based validation that's type-safe and composable.
- **Alternative considered**: Formik (more re-renders, larger bundle), plain useState (no validation, manual)
- **Decision**: Combined, they provide performant forms with automatic type inference from Zod schemas that mirror backend Pydantic schemas.

### Framer Motion

- **Why**: Declarative animation library with great React support and gesture handling
- **Decision**: Standard for React animations — used for page transitions, graph node animations, micro-interactions

### React Flow

- **Why**: Mature, feature-rich graph visualization library for React with custom nodes, edge rendering, zoom, pan, and minimap
- **Decision**: Core of the knowledge graph experience. Custom node types for each entity category.

### Lucide React

- **Why**: Clean, consistent, tree-shakeable icon library
- **Decision**: Best balance of quality, quantity, and performance

### next-themes

- **Why**: SSR-safe theme switching with system preference detection and no flash on load
- **Decision**: Dark mode is default. System preference detection for accessibility.

## Backend

### FastAPI (Python 3.12+)

- **Why**: High-performance async framework with automatic OpenAPI docs, Pydantic validation, and dependency injection
- **Decision**: Modern standard for Python APIs. Recursive CTE support for graph traversal.

### Python 3.12

- **Why**: Latest stable Python with improved performance, better error messages, and type parameter syntax (`list[int]` not `List[int]`)

### SQLAlchemy 2.0+

- **Why**: Mature, feature-rich ORM with async support (`AsyncSession`), excellent PostgreSQL compatibility
- **Decision**: Industry standard. The `select()` style and `mapped_column()` syntax provide clean, type-safe database access.

### Pydantic v2

- **Why**: Blazing fast data validation (Rust-based core), excellent serialization, OpenAPI integration
- **Decision**: All request/response validation. Configuration management. Zod on frontend mirrors Pydantic schemas on backend for end-to-end type safety.

### Alembic

- **Why**: Database migration tool built by SQLAlchemy's author
- **Decision**: Standard for schema migrations with auto-generation capability

### structlog

- **Why**: Structured JSON logging with context preservation and async support
- **Decision**: All logs are structured JSON for log aggregation and debugging

## Database

### PostgreSQL 16

- **Why**: Mature relational database with JSONB support, full-text search (tsvector), recursive CTEs, and GiST/GIN indexes
- **Decision**: Adjacency list + recursive CTEs handles the knowledge graph. No graph database complexity needed for MVP.

### Supabase PostgreSQL

- **Why**: Managed PostgreSQL with built-in auth, RLS, auto-generated REST APIs, and generous free tier
- **Decision**: Single provider for database + auth reduces operational overhead

## State Management Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Server State (TanStack React Query)                       │
│  • Knowledge graph data                                    │
│  • Node details, careers, projects                         │
│  • Search results                                          │
│  • User progress                                           │
│  • Bookmarks & favorites                                   │
├────────────────────────────────────────────────────────────┤
│  Client State (Zustand)                                    │
│  • Graph viewport (zoom, pan, selected node)               │
│  • UI preferences (sidebar open, theme)                    │
│  • Active filters and search query                         │
│  • Transient UI state                                      │
├────────────────────────────────────────────────────────────┤
│  Form State (React Hook Form + Zod)                        │
│  • Login/signup forms                                      │
│  • Settings forms                                          │
│  • Search filters                                          │
│  • Any data input                                          │
├────────────────────────────────────────────────────────────┤
│  Auth State (Supabase Auth + Context)                      │
│  • Session token                                           │
│  • User profile                                            │
│  • Login/logout actions                                    │
└────────────────────────────────────────────────────────────┘
```

## Validation Architecture (End-to-End Type Safety)

```
Zod Schema (Frontend) ───── type inference ────→ TypeScript Type
     │
     │ HTTP request
     ▼
Pydantic Schema (Backend) ──→ validation ──→ Python Type
```

Forms use React Hook Form with Zod resolvers. Zod schemas are designed to mirror the Pydantic schemas on the backend, providing end-to-end validation with a single source of truth.

## Authentication

### Supabase Auth

- **Why**: Built-in auth with email/password, OAuth providers, JWT session management, and RLS
- **Decision**: Seamless integration with database. Row-level security for multi-tenant data isolation.

## Deployment

### Vercel (Frontend)

- **Why**: First-class Next.js support, automatic preview deployments, ISR, edge functions
- **Decision**: Built by Next.js creators — optimal hosting for the framework

### Render (Backend)

- **Why**: Easy FastAPI deployment, auto HTTPS, managed PostgreSQL option, auto-scaling
- **Decision**: Simplest FastAPI deployment with native Docker support

## Development Tools

### Ruff (Linting/Formatting)

- **Why**: 100x faster than Flake8/Black, single tool for linting and formatting

### ESLint + Prettier (Frontend)

- **Why**: Follows Next.js conventions with strict TypeScript rules

### Docker Compose

- **Why**: Local PostgreSQL 16 instance ensures consistent database environment across the team
