# Monorepo Guide

SV-OS uses a **Turborepo** monorepo managed by **pnpm**.

## Structure

```
sv-os/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # FastAPI backend
├── packages/
│   ├── ui/           # Shared design system
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared constants & env vars
│   ├── eslint-config/# Shared ESLint configs
│   └── tsconfig/     # Shared TypeScript configs
├── database/         # PostgreSQL schema & seeds
├── docs/             # Project documentation
└── scripts/          # Utility scripts
```

## Key Commands

| Command          | Description                |
| ---------------- | -------------------------- |
| `pnpm dev`       | Start all apps in dev mode |
| `pnpm dev:web`   | Start only the web app     |
| `pnpm dev:api`   | Start only the API         |
| `pnpm build`     | Build all apps             |
| `pnpm lint`      | Lint all apps              |
| `pnpm typecheck` | TypeScript type checking   |
| `pnpm test`      | Run all tests              |
| `pnpm format`    | Format all files           |

## Adding Dependencies

```bash
# Add to web app
pnpm add <package> --filter @sv-os/web

# Add to API (Python)
cd apps/api && pip install <package>

# Add shared dev dependency
pnpm add -D <package> -w

# Add workspace dependency
pnpm add @sv-os/types --filter @sv-os/web
```

## Workspace Conventions

- All npm packages use the `@sv-os/` scope
- Internal dependencies use `workspace:*` protocol
- TypeScript strict mode is enforced everywhere
- Each package/app must have `lint`, `typecheck`, `clean`, and `build` scripts
