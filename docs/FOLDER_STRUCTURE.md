# SV-OS — Folder Structure

```
sv-os/
│
├── frontend/                          # Next.js 15 Application
│   ├── public/                        # Static assets
│   │   ├── images/                    # Images, icons, logos
│   │   ├── fonts/                     # Custom fonts
│   │   └── favicon.ico               # Favicon
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── (auth)/               # Auth route group
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── signup/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── callback/
│   │   │   │       └── route.ts       # Auth callback handler
│   │   │   ├── (main)/               # Main app route group (authenticated)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── explore/
│   │   │   │   │   └── page.tsx       # Graph exploration page
│   │   │   │   ├── careers/
│   │   │   │   │   ├── page.tsx       # Career listing
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx   # Career detail
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx       # Project listing
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx   # Project detail
│   │   │   │   ├── knowledge/
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx   # Knowledge node detail
│   │   │   │   ├── progress/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── bookmarks/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── search/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── loading.tsx           # Root loading state
│   │   │   ├── error.tsx             # Root error boundary
│   │   │   ├── not-found.tsx         # 404 page
│   │   │   └── globals.css           # Global styles
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components (generated)
│   │   │   ├── layout/              # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   └── Breadcrumbs.tsx
│   │   │   ├── graph/               # Graph visualization components
│   │   │   │   ├── KnowledgeGraph.tsx       # Main graph wrapper
│   │   │   │   ├── GraphControls.tsx        # Zoom, pan, filter controls
│   │   │   │   ├── NodePanel.tsx            # Side panel on node click
│   │   │   │   ├── CustomNode.tsx           # Custom React Flow node
│   │   │   │   ├── NodeIcon.tsx             # Node type icons
│   │   │   │   ├── GraphLegend.tsx          # Color legend
│   │   │   │   ├── GraphMiniMap.tsx         # Minimap component
│   │   │   │   └── NodeTooltip.tsx          # Hover tooltip
│   │   │   ├── career/              # Career components
│   │   │   │   ├── CareerCard.tsx
│   │   │   │   ├── CareerList.tsx
│   │   │   │   ├── CareerRoadmap.tsx
│   │   │   │   └── SkillBadge.tsx
│   │   │   ├── project/             # Project components
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── ProjectRoadmap.tsx
│   │   │   │   └── DifficultyBadge.tsx
│   │   │   ├── landing/             # Landing page components
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── FeaturesSection.tsx
│   │   │   │   ├── GraphPreview.tsx
│   │   │   │   ├── CareerShowcase.tsx
│   │   │   │   ├── ProjectShowcase.tsx
│   │   │   │   └── TestimonialsSection.tsx
│   │   │   ├── progress/            # Progress components
│   │   │   │   ├── ProgressRing.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── NodeStatusBadge.tsx
│   │   │   │   └── StatsCard.tsx
│   │   │   ├── search/              # Search components
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   ├── SearchFilters.tsx
│   │   │   │   └── SearchSuggestion.tsx
│   │   │   ├── auth/                # Auth components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── AuthGuard.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   └── shared/              # Shared components
│   │   │       ├── EmptyState.tsx
│   │   │       ├── ErrorState.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── SkeletonLoader.tsx
│   │   │       ├── AnimatedSection.tsx
│   │   │       ├── GlassCard.tsx
│   │   │       ├── PageHeader.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   ├── lib/                     # Utilities and configurations
│   │   │   ├── api/                 # API client
│   │   │   │   ├── client.ts        # Axios/fetch wrapper
│   │   │   │   ├── nodes.ts         # Knowledge node API calls
│   │   │   │   ├── edges.ts         # Edge API calls
│   │   │   │   ├── careers.ts       # Career API calls
│   │   │   │   ├── projects.ts      # Project API calls
│   │   │   │   ├── progress.ts      # Progress API calls
│   │   │   │   └── search.ts        # Search API calls
│   │   │   ├── constants.ts         # App constants
│   │   │   ├── utils.ts             # Utility functions
│   │   │   ├── cn.ts                # cn() utility (clsx + twMerge)
│   │   │   └── supabase.ts          # Supabase client
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useGraph.ts
│   │   │   ├── useNodeDetails.ts
│   │   │   ├── useSearch.ts
│   │   │   ├── useProgress.ts
│   │   │   ├── useBookmarks.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useAuth.ts
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── node.ts              # Knowledge node types
│   │   │   ├── edge.ts              # Edge types
│   │   │   ├── career.ts            # Career types
│   │   │   ├── project.ts           # Project types
│   │   │   ├── progress.ts          # Progress types
│   │   │   ├── search.ts            # Search types
│   │   │   └── api.ts               # API response types
│   │   ├── providers/               # React context providers
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── GraphProvider.tsx
│   │   └── services/                # Service layer (business logic)
│   │       ├── auth.service.ts
│   │       ├── graph.service.ts
│   │       ├── career.service.ts
│   │       ├── project.service.ts
│   │       ├── progress.service.ts
│   │       └── search.service.ts
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.local.example
│   └── components.json              # shadcn/ui config
│
├── backend/                          # FastAPI Application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── api/                     # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── v1/                  # API version 1
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py        # Main v1 router
│   │   │   │   ├── auth.py          # Auth endpoints
│   │   │   │   ├── nodes.py         # Knowledge node endpoints
│   │   │   │   ├── edges.py         # Knowledge edge endpoints
│   │   │   │   ├── careers.py       # Career endpoints
│   │   │   │   ├── projects.py      # Project endpoints
│   │   │   │   ├── progress.py      # Progress endpoints
│   │   │   │   ├── search.py        # Search endpoints
│   │   │   │   ├── bookmarks.py     # Bookmark endpoints
│   │   │   │   └── dependencies.py  # Route dependencies
│   │   │   └── deps.py             # Global dependencies
│   │   ├── core/                    # Core configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py           # Application settings
│   │   │   ├── security.py         # Auth, JWT, password hashing
│   │   │   ├── database.py         # Database session management
│   │   │   ├── cache.py            # In-memory caching
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── logging.py          # Logging configuration
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Base model (UUID, timestamps)
│   │   │   ├── user.py
│   │   │   ├── knowledge_node.py
│   │   │   ├── knowledge_edge.py
│   │   │   ├── career.py
│   │   │   ├── project.py
│   │   │   ├── career_requirement.py
│   │   │   ├── project_requirement.py
│   │   │   ├── learning_resource.py
│   │   │   ├── user_progress.py
│   │   │   ├── bookmark.py
│   │   │   ├── favorite.py
│   │   │   ├── search_history.py
│   │   │   └── activity_log.py
│   │   ├── schemas/                 # Pydantic schemas (DTOs)
│   │   │   ├── __init__.py
│   │   │   ├── common.py           # Pagination, filters, messages
│   │   │   ├── auth.py             # Login, signup, token schemas
│   │   │   ├── node.py             # Knowledge node schemas
│   │   │   ├── edge.py             # Edge schemas
│   │   │   ├── career.py           # Career schemas
│   │   │   ├── project.py          # Project schemas
│   │   │   ├── progress.py         # Progress schemas
│   │   │   ├── bookmark.py         # Bookmark schemas
│   │   │   ├── search.py           # Search schemas
│   │   │   └── graph.py            # Graph traversal schemas
│   │   ├── services/                # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── node_service.py
│   │   │   ├── edge_service.py
│   │   │   ├── graph_service.py    # Graph traversal logic
│   │   │   ├── career_service.py
│   │   │   ├── project_service.py
│   │   │   ├── progress_service.py
│   │   │   ├── bookmark_service.py
│   │   │   ├── search_service.py
│   │   │   └── activity_service.py
│   │   ├── repositories/            # Data access layer
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Base repository (CRUD operations)
│   │   │   ├── node_repository.py
│   │   │   ├── edge_repository.py
│   │   │   ├── graph_repository.py # Graph traversal queries
│   │   │   ├── career_repository.py
│   │   │   ├── project_repository.py
│   │   │   ├── progress_repository.py
│   │   │   ├── bookmark_repository.py
│   │   │   ├── search_repository.py
│   │   │   └── user_repository.py
│   │   └── utils/                   # Utility functions
│   │       ├── __init__.py
│   │       ├── pagination.py
│   │       ├── slug.py
│   │       └── validators.py
│   ├── tests/                       # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py             # Fixtures and test configuration
│   │   ├── test_auth.py
│   │   ├── test_nodes.py
│   │   ├── test_edges.py
│   │   ├── test_graph.py
│   │   ├── test_careers.py
│   │   ├── test_projects.py
│   │   └── test_search.py
│   ├── alembic/                     # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/               # Migration files
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
│
├── database/                         # Database files
│   ├── schema.sql                   # Complete initial schema
│   ├── seeds/                       # Seed data
│   │   ├── subjects.sql             # Subject nodes
│   │   ├── concepts.sql             # Concept nodes
│   │   ├── technologies.sql         # Technology nodes
│   │   ├── careers.sql              # Career data
│   │   ├── projects.sql             # Project data
│   │   ├── edges.sql                # Graph edges
│   │   └── learning_resources.sql   # Learning resources
│   └── migrations/                  # Raw SQL migrations
│
├── shared/                           # Shared contracts
│   ├── constants.ts                 # Shared constants
│   ├── types.ts                     # Shared type definitions
│   └── enums.ts                     # Shared enumerations
│
├── scripts/                          # Utility scripts
│   ├── seed.sh                      # Database seeding script
│   ├── reset-db.sh                  # Database reset script
│   └── setup.sh                     # Full project setup
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md
│   ├── TECH_DECISIONS.md
│   ├── FOLDER_STRUCTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── BACKEND_ARCHITECTURE.md
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── INSTALLATION.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── docker-compose.yml                # Local PostgreSQL
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── README.md
└── LICENSE
```
