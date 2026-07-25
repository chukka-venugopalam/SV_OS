# SV-OS — Frontend Architecture

## Overview

The frontend is a **Next.js 15** application using the **App Router** with a hybrid architecture. Server Components handle data fetching and SEO-critical content. Client Components handle interactivity. React Query manages server state. Zustand manages client state. React Hook Form + Zod handles forms. Server Actions simplify mutations.

The UI follows an Apple-quality design system: minimal, elegant, dark mode first, smooth transitions, readable typography, and purposeful motion.

---

## Core Architectural Pillars

### 1. Server Components First

Default to Server Components. Only add `'use client'` when browser APIs, state, or interactivity are needed.

| Layer         | Server Component                                  | Client Component                            |
| ------------- | ------------------------------------------------- | ------------------------------------------- |
| Data fetching | Direct server-side fetch or React Query prefetch  | React Query from client                     |
| Rendering     | SSR/SSG at request/build time                     | CSR in browser                              |
| State         | None (static)                                     | Zustand / React Query / RHF                 |
| Examples      | Landing, Node detail, Career list, Search results | Knowledge Graph, SearchBar, Progress, Forms |

### 2. State Management Triad

```
┌────────────────────────────────────────────────────────────────┐
│                    Server State (React Query)                   │
│  Data from the API — cached, background-refetched, optimistic  │
│  Stores: nodes, edges, careers, projects, progress, bookmarks  │
├────────────────────────────────────────────────────────────────┤
│                    Client State (Zustand)                       │
│  UI-only state — persisted across navigation, no API calls     │
│  Stores: graphViewport, uiPreferences, activeFilters, theme    │
├────────────────────────────────────────────────────────────────┤
│                    Form State (React Hook Form + Zod)           │
│  Form inputs — validated, typed, minimal re-renders            │
│  Forms: login, signup, settings, search filters                │
└────────────────────────────────────────────────────────────────┘
```

### 3. Server Actions for Mutations

Mutations (create, update, delete) use Next.js Server Actions where the form lives in a Server Component. For client-heavy mutations, React Query mutations with optimistic updates.

```typescript
// Server Action example
'use server';

import { z } from 'zod';

const bookmarkSchema = z.object({
  nodeId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export async function addBookmark(formData: FormData) {
  const validated = bookmarkSchema.parse({
    nodeId: formData.get('nodeId'),
    notes: formData.get('notes'),
  });
  // ... database mutation
  revalidatePath('/bookmarks');
}
```

### 4. Suspense Boundaries Everywhere

Every data-dependent component is wrapped in a Suspense boundary with a skeleton loader. This provides instant visual feedback while data loads.

```typescript
// Page with Suspense boundary
export default function NodePage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<NodeDetailSkeleton />}>
            <NodeContent slug={params.slug} />
        </Suspense>
    );
}
```

### 5. Zod + Pydantic End-to-End Validation

```typescript
// Frontend Zod schema mirrors backend Pydantic schema
const nodeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  node_type: z.enum(['subject', 'concept', 'technology', 'tool', 'career', 'project']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  estimated_minutes: z.number(),
  prerequisites: z.array(z.object({ slug: z.string(), title: z.string() })),
});

type Node = z.infer<typeof nodeSchema>; // Automatic TypeScript type
```

---

## Data Flow

### Page Load (Server Component)

```
User Requests Page
    │
    ▼
Server Component
    │
    ├── React Query .prefetchOnServer() → FastAPI → PostgreSQL
    │
    ├── Dehydrate query cache to client
    │
    └── Render HTML with data pre-filled
```

### Interactive Action (Client Component)

```
User Clicks/Submits
    │
    ▼
Client Component
    │
    ├── React Query mutation (for API mutations)
    │   ├── Optimistic update → UI updates instantly
    │   ├── Background API call → actual mutation
    │   └── On error → rollback optimistic update
    │
    ├── Server Action (for form submissions)
    │   ├── Validate with Zod on client
    │   ├── Send FormData to Server Action
    │   └── Server Action returns result → revalidate
    │
    └── Zustand update (for UI-only state)
        ├── No API call needed
        └── State persists in memory
```

### Graph Interaction Flow

```
User Pans/Zoom/Clicks Node
    │
    ▼
React Flow (internal state)
    │
    ▼
Zustand (graphStore): { selectedNodeId, viewport }
    │
    ▼
React Query: Fetch subgraph data if needed
    │
    ▼
Node Panel opens with prefetched data
```

---

## Component Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Layout Components                        │
│  Header (client: auth state, search), Sidebar (server:     │
│  navigation), Footer (server), Breadcrumbs (client:        │
│  dynamic path), MobileNav (client: hamburger)              │
├────────────────────────────────────────────────────────────┤
│                    Page Components                          │
│  Landing (server), Dashboard (server + client),            │
│  Explore (client-heavy), Careers (server + client),        │
│  Projects (server + client), Node Details (server,         │
│  Suspense), Progress (client), Bookmarks (client),         │
│  Search (client), Settings (client), Auth (client)         │
├────────────────────────────────────────────────────────────┤
│                    Feature Components                       │
│  Graph, Career, Project, Progress, Search, Auth            │
├────────────────────────────────────────────────────────────┤
│                    Shared/UI Components                     │
│  GlassCard, LoadingSpinner, EmptyState, ErrorState,        │
│  SkeletonLoader, AnimatedSection, PageHeader, Badge,       │
│  ConfirmDialog, Toast                                      │
└────────────────────────────────────────────────────────────┘
```

---

## React Query Configuration

```typescript
// lib/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Query Key Structure

```typescript
export const queryKeys = {
  nodes: {
    all: ['nodes'] as const,
    list: (filters: NodeFilters) => ['nodes', 'list', filters] as const,
    detail: (slug: string) => ['nodes', 'detail', slug] as const,
    prerequisites: (slug: string) => ['nodes', 'prerequisites', slug] as const,
    unlocks: (slug: string) => ['nodes', 'unlocks', slug] as const,
  },
  graph: {
    subgraph: (nodeId: string, depth: number) => ['graph', 'subgraph', nodeId, depth] as const,
    path: (source: string, target: string) => ['graph', 'path', source, target] as const,
  },
  careers: {
    all: ['careers'] as const,
    detail: (slug: string) => ['careers', 'detail', slug] as const,
    roadmap: (slug: string) => ['careers', 'roadmap', slug] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (slug: string) => ['projects', 'detail', slug] as const,
  },
  progress: {
    all: ['progress'] as const,
    stats: ['progress', 'stats'] as const,
  },
  bookmarks: {
    all: ['bookmarks'] as const,
  },
  search: {
    results: (query: string, filters: SearchFilters) => ['search', query, filters] as const,
  },
};
```

### Custom Hooks

```typescript
// hooks/useNodeDetails.ts
export function useNodeDetails(slug: string) {
  return useQuery({
    queryKey: queryKeys.nodes.detail(slug),
    queryFn: () => nodeService.getNodeDetails(slug),
    enabled: !!slug,
  });
}

// hooks/useBookmarks.ts
export function useBookmarks() {
  const queryClient = useQueryClient();

  const { data: bookmarks } = useQuery({
    queryKey: queryKeys.bookmarks.all,
    queryFn: () => bookmarkService.list(),
  });

  const addBookmark = useMutation({
    mutationFn: (nodeId: string) => bookmarkService.add(nodeId),
    onMutate: async (nodeId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks.all });
      const previous = queryClient.getQueryData(queryKeys.bookmarks.all);
      queryClient.setQueryData(queryKeys.bookmarks.all, (old) => [
        ...(old || []),
        { nodeId, optimistic: true },
      ]);
      return { previous };
    },
    onError: (err, nodeId, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.bookmarks.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    },
  });

  return { bookmarks, addBookmark };
}
```

---

## Zustand Stores

```typescript
// stores/graph-store.ts
interface GraphState {
  selectedNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  activeFilters: {
    nodeTypes: NodeType[];
    difficulty: Difficulty[];
  };
  // Actions
  selectNode: (id: string | null) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  toggleFilter: (type: 'nodeTypes' | 'difficulty', value: string) => void;
  resetFilters: () => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set) => ({
      selectedNodeId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      activeFilters: { nodeTypes: [], difficulty: [] },

      selectNode: (id) => set({ selectedNodeId: id }),
      setViewport: (viewport) => set({ viewport }),
      toggleFilter: (type, value) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [type]: state.activeFilters[type].includes(value as any)
              ? state.activeFilters[type].filter((v) => v !== value)
              : [...state.activeFilters[type], value as any],
          },
        })),
      resetFilters: () => set({ activeFilters: { nodeTypes: [], difficulty: [] } }),
    }),
    {
      name: 'graph-store',
      partialize: (state) => ({ viewport: state.viewport, activeFilters: state.activeFilters }),
    },
  ),
);
```

```typescript
// stores/ui-store.ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light' | 'system';
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-store' },
  ),
);
```

---

## React Hook Form + Zod

```typescript
// components/auth/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        // Server Action or React Query mutation
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('email')} />
            {errors.email && <span>{errors.email.message}</span>}
            <input type="password" {...register('password')} />
            {errors.password && <span>{errors.password.message}</span>}
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
        </form>
    );
}
```

---

## Suspense Boundaries

### Pattern: Every Data-Dependent Component

```typescript
// Page wrapper
export default function CareerPage({ params }: { params: { slug: string } }) {
    return (
        <div className="space-y-8">
            <Suspense fallback={<PageHeaderSkeleton />}>
                <CareerHeader slug={params.slug} />
            </Suspense>

            <Suspense fallback={<RoadmapSkeleton />}>
                <CareerRoadmap slug={params.slug} />
            </Suspense>

            <Suspense fallback={<ProjectListSkeleton />}>
                <RelatedProjects slug={params.slug} />
            </Suspense>
        </div>
    );
}
```

### Skeleton Loaders

```typescript
function NodeDetailSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="h-32 bg-muted rounded-xl" />
                <div className="h-32 bg-muted rounded-xl" />
            </div>
        </div>
    );
}
```

---

## Design System

### Color Tokens

```typescript
// tailwind.config.ts
colors: {
    brand: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#3b82f6',
        900: '#1e3a5f',
    },
    node: {
        subject: '#8B5CF6',    // Purple
        concept: '#3B82F6',    // Blue
        technology: '#10B981', // Green
        tool: '#F59E0B',       // Amber
        career: '#EF4444',     // Red
        project: '#EC4899',    // Pink
    },
}
```

### Glassmorphism

```tsx
<div className="
    backdrop-blur-xl
    bg-white/10 dark:bg-white/5
    border border-white/20 dark:border-white/10
    rounded-2xl
    shadow-xl
">
```

### Motion Philosophy

- **Page transitions**: Framer Motion `AnimatePresence` with fade/slide — communicates navigation
- **Graph nodes**: Staggered entrance, spring physics on interactions — communicates hierarchy
- **Cards**: Hover lift (`hover:-translate-y-1`) — communicates interactivity
- **Progress**: Circular SVG animation — communicates achievement
- **No decorative animations**: Every animation must communicate meaning

---

## Performance

### Dynamic Imports

```typescript
const KnowledgeGraph = dynamic(
    () => import('@/components/graph/KnowledgeGraph'),
    {
        loading: () => <GraphSkeleton />,
        ssr: false,
    }
);
```

### React.memo

```typescript
const MemoizedGraphNode = memo(CustomNode, (prev, next) => {
  return prev.data === next.data && prev.selected === next.selected;
});
```

### Image Optimization

```typescript
import Image from 'next/image';
<Image src="/hero.png" alt="SV-OS" width={1200} height={800} priority />
```

---

## Accessibility

- Keyboard navigation for graph (arrow keys, tab, enter, escape)
- ARIA labels on all interactive elements
- Focus management for modals and panels
- WCAG AA color contrast
- Screen reader announcements for dynamic updates
- Skip-to-content link
- Semantic HTML with proper heading hierarchy

---

## SEO

- Unique `<title>` and `<meta name="description">` per page
- Open Graph / Twitter Card tags
- JSON-LD structured data
- Sitemap.xml generation
- robots.txt
- Canonical URLs

```typescript
export const metadata: Metadata = {
  title: 'Python Basics - SV-OS',
  description: 'Learn Python programming fundamentals with interactive visualizations',
  openGraph: {
    title: 'Python Basics - SV-OS',
    description: 'Interactive Python learning path',
    type: 'article',
  },
};
```
