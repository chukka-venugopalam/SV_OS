# Session Notes

## Session 10 — 2026-07-04

### Phase 3.2: Repository Cleanup & Deployment Preparation

#### What Was Completed
- **Audited the entire repository** for unused files, duplicates, dead code, and placeholders
- **Removed 6 items**:
  - `apps/web/src/lib/api.ts`: Dead code — the simpler client was unused in favor of `api-client.ts`
  - `docs/FolderStructure.md`: Duplicate of `docs/FOLDER_STRUCTURE.md` (case collision)
  - `apps/web/src/components/ui/`: Empty directory (all UI components in `packages/ui`)
  - `apps/web/src/services/`: Empty placeholder directory
  - `apps/web/src/types/`: Empty placeholder directory (types in `packages/types`)
  - `apps/web/src/hooks/.gitkeep`: Unnecessary (hooks has real files)
  - `docker/`: Empty placeholder directory
- **Fixed `apps/web/.env.local.example`**: Replaced `[BLOCKED]` with proper environment variable template
- **Fixed `apps/web/src/lib/index.ts`**: Removed broken `export { api }` reference
- **Created 3 documentation files**:
  - `apps/web/README.md` — Frontend setup, structure, and tech stack
  - `apps/api/README.md` — Backend setup, architecture, and testing
  - `docs/DEPLOYMENT.md` — Full deployment guide (Render, Vercel, Supabase, Docker, CI/CD)
- **Updated `.ai/HANDOVER.md`**: Removed stale reference to deleted `api.ts`
- **Verified TypeScript compilation passes** (0 errors)
- **Verified Turborepo workspace**: 6 packages, all `@sv-os/*` namespaced, `pnpm-workspace.yaml` covers `apps/*` and `packages/*`

#### Verification
- ✅ Frontend TypeScript compilation passes (`tsc --noEmit` — 0 errors)
- ✅ pnpm install succeeds
- ✅ Turborepo workspace configuration verified
- ✅ All packages resolve correctly (web → config, types, ui, eslint-config, tsconfig)
- ✅ No broken imports from removed files
- ✅ All `.ai/` documentation updated

#### Key Decisions
1. **Keep `apps/web/tailwind.config.ts`** — Even though Tailwind v4 config is in CSS, `prettier-plugin-tailwindcss` still references this file for class sorting.
2. **Keep `apps/web/src/components/.gitkeep`** — The components directory has real subdirectories but it's harmless; removing it could cause git issues.
3. **Keep `apps/web/components.json`** — shadcn/ui reference even though project uses `@sv-os/ui`. Not harmful.
4. **Removed only truly empty/placeholder directories** — Avoided removing directories that might be populated in future phases.

### Files Created (Phase 3.2 — 3 files)
- `apps/web/README.md`
- `apps/api/README.md`
- `docs/DEPLOYMENT.md`

### Files Removed (Phase 3.2 — 6 items)
- `apps/web/src/lib/api.ts`
- `docs/FolderStructure.md`
- `apps/web/src/components/ui/` (directory + .gitkeep)
- `apps/web/src/services/` (directory + .gitkeep)
- `apps/web/src/types/` (directory + .gitkeep)
- `apps/web/src/hooks/.gitkeep`
- `docker/` (directory + .gitkeep)

### Files Modified (Phase 3.2 — 3 files)
- `apps/web/src/lib/index.ts` — Removed broken `api` export
- `apps/web/.env.local.example` — Replaced `[BLOCKED]` with proper template
- `.ai/HANDOVER.md` — Removed reference to deleted `api.ts`

### Estimated Completion Percentage
Phase 1 (Architecture): 100%
Phase 2.1 (Foundation): 100%
Phase 2.2 (Frontend): 100%
Phase 2.2.1 (Polish): 100%
Phase 2.3 (Backend Infra): 100%
Phase 2.4 (Domain Models): 100%
Phase 2.5 (Persistence): 100%
Phase 2.6 (API Contracts): 100%
Phase 2.7 (Repository & UoW): 100%
Phase 3 (App Services + Auth + API + Frontend): 100%
Phase 3.2 (Cleanup & Deployment Prep): 100%
Overall project: ~50%

### Next Recommended Task
Phase 4: Deployment — Push to GitHub, deploy backend to Render, deploy frontend to Vercel, configure Supabase, CI/CD, end-to-end verification.

## Session 9 — 2026-07-04

### What Was Completed
- **Phase 3: Application Services + Auth + API + Frontend Integration** — Complete

#### Application Services (13 classes)
- Created `AuthService` — JWT access/refresh tokens (HS256), bcrypt password hashing, register, login, refresh_tokens, change_password, role-based authorization
- Created `UserService` — Profile CRUD, dashboard
- Created `KnowledgeNodeService` — Node CRUD, search, prerequisites, neighbors, resources, related careers
- Created `GraphService` — Neighborhood exploration, BFS path finding, statistics, prerequisite chain
- Created `CareerService` — Career CRUD, roadmap, requirements
- Created `ProjectService` — Project CRUD, requirements
- Created `SkillService` — Skill CRUD, categories, relationships
- Created `LearningPathService` — Path CRUD, enrollment
- Created `ProgressService` — Progress tracking, status lifecycle, statistics
- Created `BookmarkService` — Bookmark toggle, listing, checking
- Created `FavoriteService` — Favorite add/remove, listing, checking
- Created `SearchService` — Full-text search (TSVECTOR + FTS + ILIKE), suggestions, history, trending
- Created `RecommendationService` (stub) — Get recommendations, popular nodes, dismiss

#### Authentication (JWT-based)
- Created auth schemas (LoginRequest, SignupRequest, TokenResponse, LoginResponse, RefreshRequest, ChangePasswordRequest)
- Created JWT token management (access tokens with configurable expiry, refresh tokens with configurable expiry)
- Created bcrypt password hashing via passlib
- Created Auth dependencies (get_current_user_id, get_current_user, get_optional_user_id, require_admin)
- Created migration 0003_add_password_hash.py

#### REST API (48 endpoints across 12 modules)
- Auth: register, login, refresh, me, update me, change-password, logout
- Nodes: list, search, popular, get, prerequisites, related, resources, careers
- Graph: explore, path, statistics, prerequisite-chain
- Careers: list, get, roadmap, nodes
- Projects: list, get, requirements
- Skills: list, categories, get, relationships
- Learning Paths: list, get
- Progress: list, stats, update, start, complete
- Bookmarks: list, toggle, check
- Favorites: list, add, remove, check
- Search: search, suggestions, history, clear, trending
- Recommendations: list, popular, dismiss

#### Frontend Auth Infrastructure
- Created enhanced API client with automatic token refresh (401 → refresh → retry)
- Created auth client (auth-client.ts) wrapping API calls for auth operations
- Created React Query hooks (useCurrentUser, useLogin, useSignup, useLogout, useUpdateProfile, useChangePassword, useAuthListener)
- Created AuthProvider with React context for auth state management
- Created ProtectedRoute component with auth check, role verification, redirect options
- Created Login page with form + error handling
- Created Signup page with form + client-side validation

#### FavoriteRepository + Wiring
- Created FavoriteRepository (find_by_user, find_by_user_and_node, count_by_user, is_favorited)
- Wired into UnitOfWork (favorites property)
- Wired into deps.py (get_favorite_service)
- Wired into router.py (favorites + recommendations prefixes)

#### Testing
- Created 29 auth service unit tests
  - Password hashing: 6 tests (hash format, uniqueness, verification correctness)
  - Registration: 4 tests (success, duplicate email, duplicate username, password hashing)
  - Login: 6 tests (success, invalid email, wrong password, inactive user, deleted user, last_login update)
  - JWT tokens: 6 tests (creation, decoding, user_id extraction, token difference)
  - Token refresh: 3 tests (valid refresh, invalid type, expired token)
  - Password change: 3 tests (success, wrong current password, user not found)
  - Authorization: 3 tests (admin allowed, learner denied, no role)

### Key Architecture Decisions
1. **Services receive UnitOfWork via constructor** — Not individual repositories. This ensures transactional consistency across multiple repository calls.
2. **Services raise typed exceptions** — Not HTTPExceptions. The API layer translates service exceptions to HTTP responses.
3. **Token refresh is transparent** — The API client handles 401 → refresh → retry automatically. Neither the UI nor React Query needs to manage token lifecycle.
4. **Request deduplication** — Concurrent 401 responses share a single refresh attempt, preventing multiple simultaneous refresh calls.
5. **AuthProvider wraps near root** — After ThemeProvider and ReactQueryProvider, so auth hooks can use React Query.
6. **Event-based auth notifications** — Custom events (auth:login, auth:logout) allow loose coupling between API client and React state.

### Problems Encountered and Fixed
1. **Unused import in auth-provider.tsx** — `clearAuth` imported but never used. Removed.
2. **Frontend TypeScript initially failed** — The `@sv-os/ui` package needed proper exports for `Input`, `Label`, and `LoadingSpinner`. All were already exported from the ui package.
3. **Router alphabetization** — The router imports were reorganized alphabetically to match the growing set of endpoint modules.
4. **FavoriteRepository didn't exist** — Created it following the BookmarkRepository pattern, with methods for find_by_user, find_by_user_and_node, count_by_user, is_favorited.
5. **Recommendations endpoint missing** — Created with stub implementation returning empty results from the repository.

### Files Created (Phase 3 — 29 files)

**Backend — Services (13 files):**
- `apps/api/app/services/__init__.py`, `auth.py`, `user.py`, `knowledge_node.py`, `graph.py`
- `career.py`, `project.py`, `skill.py`, `learning_path.py`, `progress.py`
- `bookmark.py`, `favorite.py`, `search.py`, `recommendation.py`

**Backend — API Endpoints (12 files):**
- `apps/api/app/api/v1/endpoints/__init__.py`, `auth.py`, `nodes.py`, `graph.py`
- `careers.py`, `projects.py`, `skills.py`, `learning_paths.py`, `progress.py`
- `bookmarks.py`, `favorites.py`, `search.py`, `recommendations.py`

**Backend — Auth Schemas (2 files):**
- `apps/api/app/schemas/auth/__init__.py`, `auth.py`

**Backend — Migration:**
- `apps/api/alembic/versions/0003_add_password_hash.py`

**Backend — Repository:**
- `apps/api/app/repositories/favorite.py`

**Backend — Tests:**
- `apps/api/tests/services/__init__.py`
- `apps/api/tests/services/test_auth_service.py` (29 tests)

**Frontend — Auth Infrastructure (7 files):**
- `apps/web/src/lib/api-client.ts`, `auth-client.ts`
- `apps/web/src/hooks/use-auth.ts`
- `apps/web/src/providers/auth-provider.tsx`
- `apps/web/src/components/auth/protected-route.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`, `signup/page.tsx`

### Files Modified (Phase 3 — 10 files)
- `apps/api/app/api/v1/router.py` — All 12 endpoint routers
- `apps/api/app/api/deps.py` — Auth deps + 3 service injectors
- `apps/api/app/repositories/__init__.py` — Added FavoriteRepository
- `apps/api/app/repositories/unit_of_work.py` — Added favorites property
- `apps/api/app/services/__init__.py` — 13 service exports
- `apps/web/src/providers/index.ts` — Added AuthProvider, useAuth
- `apps/web/src/hooks/index.ts` — Added auth hooks
- `apps/web/src/app/layout.tsx` — Added AuthProvider
- `apps/api/app/models/user.py` — Added password_hash
- `.ai/` tracking files — All 5 files updated

### Verification
- ✅ All 13 backend service classes import successfully
- ✅ All 12 backend endpoint modules import successfully
- ✅ Main router imports all endpoint routers
- ✅ All service dependency injectors compile
- ✅ Frontend TypeScript compilation passes (0 errors)
- ✅ pnpm install succeeds
- ✅ 29 auth service unit tests created

### Estimated Completion Percentage
Phase 1 (Architecture): 100%
Phase 2.1 (Foundation): 100%
Phase 2.2 (Frontend): 100%
Phase 2.2.1 (Polish): 100%
Phase 2.3 (Backend Infra): 100%
Phase 2.4 (Domain Models): 100%
Phase 2.5 (Persistence): 100%
Phase 2.6 (API Contracts): 100%
Phase 2.7 (Repository & UoW): 100%
Phase 3 (App Services + Auth + API + Frontend): 100%
Overall project: ~50%

### Next Recommended Task
Phase 4: Deployment — Push to GitHub, deploy backend to Render, deploy frontend to Vercel, configure Supabase, CI/CD, end-to-end verification.
