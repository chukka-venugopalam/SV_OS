# Coding Standards

## TypeScript

- **Strict mode**: `strict: true` with `noUncheckedIndexedAccess`
- **No `any`**: Use `unknown` then narrow, or define proper types
- **Imports**: Use `type` prefix for type-only imports
- **Path aliases**: `@/` maps to `src/` in apps/web
- **Naming**: camelCase (variables/functions), PascalCase (types/components), kebab-case (files)
- **Exports**: Prefer named exports (no default exports except for pages)

## Python

- **Type hints**: Required on all function signatures
- **Naming**: snake_case (functions/variables), PascalCase (classes)
- **Imports**: Group by stdlib → third-party → local, alphabetically
- **Docstrings**: Google-style docstrings for all public functions

## React

- **Server First**: Default to Server Components, use `'use client'` only when needed
- **Hooks**: Custom hooks in `hooks/`, one hook per file
- **Components**: One component per file, named exports
- **State**: React Query (server) + Zustand (client) + RHF+Zod (forms)
- **Animation**: Framer Motion for all animations

## Git

- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- **Branches**: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- **PRs**: Small, focused, with linked issues

## Graph Conventions

- **Adjacency list**: All graph traversal via recursive CTEs
- **Depth limit**: Max 10 levels for recursive CTEs
- **Edge directions**: forward, bidirectional, unidirectional
- **Node colors**: subject (purple), concept (blue), technology (green), tool (amber), career (red), project (pink)
