# SV-OS Web — Frontend

The Silicon Valley Learning OS frontend, built with **Next.js 15**, **TypeScript**, **Tailwind CSS v4**, **React Query**, and **Turborepo**.

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Starts the Next.js dev server at [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
```

### Typecheck

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

### Test

```bash
pnpm test
```

## Environment Variables

Copy `.env.local.example` to `.env.local`:

| Variable                        | Required | Default                 | Description           |
| ------------------------------- | -------- | ----------------------- | --------------------- |
| `NEXT_PUBLIC_API_URL`           | Yes      | `http://localhost:8000` | Backend API URL       |
| `NEXT_PUBLIC_SUPABASE_URL`      | No       | —                       | Supabase project URL  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No       | —                       | Supabase anon key     |
| `NEXT_PUBLIC_APP_URL`           | No       | `http://localhost:3000` | App URL for redirects |

## Project Structure

```
src/
├── app/            # Next.js App Router pages and layouts
├── components/     # React components (auth, graph, layout)
├── hooks/          # Custom React hooks
├── lib/            # Utilities, API client, helpers
├── providers/      # React context providers
└── stores/         # Zustand stores
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand, React Query (TanStack Query v5)
- **UI Components**: Radix UI primitives in `@sv-os/ui`
- **Auth**: JWT tokens with automatic refresh
- **Package Manager**: pnpm

## Related

- [API README](../api/README.md)
- [Project README](../../README.md)
