'use client';

import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Skeleton,
  EmptyState,
  Pagination,
} from '@sv-os/ui';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Compass,
  BookText,
  Code2,
  Wrench,
  Briefcase,
  FolderGit2,
  X,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, memo } from 'react';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { PageHeader, PageTransition } from '@/components/shared';
import { Shell } from '@/components/shared/shell';
import { useDebounce } from '@/hooks/use-debounce';
import { useKnowledgeNodes } from '@/hooks/use-knowledge';
import { cn, slugToTitle, truncate } from '@/lib';

const NODE_TYPES = ['subject', 'concept', 'technology', 'tool', 'career', 'project'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const SORT_OPTIONS = [
  { label: 'Title A-Z', value: 'title_asc' },
  { label: 'Title Z-A', value: 'title_desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
] as const;

const typeIcons: Record<string, React.ReactNode> = {
  subject: <BookText className="h-4 w-4" />,
  concept: <Compass className="h-4 w-4" />,
  technology: <Code2 className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />,
  career: <Briefcase className="h-4 w-4" />,
  project: <FolderGit2 className="h-4 w-4" />,
};

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" size="sm" className="flex items-center gap-1 capitalize">
      {typeIcons[type]}
      {type}
    </Badge>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    beginner: 'success',
    intermediate: 'info',
    advanced: 'warning',
    expert: 'danger',
  };

  return (
    <Badge variant={colors[difficulty] ?? 'secondary'} size="sm">
      {slugToTitle(difficulty)}
    </Badge>
  );
}

// ── Node Card ─────────────────────────────────────────────────────

const NodeCard = memo(function NodeCard({
  node,
}: {
  node: {
    id: string;
    slug: string;
    title: string;
    description: string;
    node_type: string;
    difficulty: string;
  };
}) {
  const color = NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)';

  return (
    <Link href={`/explore/${node.slug}`}>
      <Card className="group h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-3 flex items-start justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {node.title.charAt(0)}
            </div>
            <TypeBadge type={node.node_type} />
          </div>
          <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-1 text-base font-semibold text-neutral-900 transition-colors dark:text-neutral-100">
            {node.title}
          </h3>
          <p className="mb-3 line-clamp-2 flex-1 text-xs text-neutral-500 dark:text-neutral-400">
            {truncate(node.description, 120)}
          </p>
          <div className="flex items-center justify-between">
            <DifficultyBadge difficulty={node.difficulty} />
            <ArrowRight className="h-4 w-4 text-neutral-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-neutral-600" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

// ── Node Row ──────────────────────────────────────────────────────

const NodeRow = memo(function NodeRow({
  node,
}: {
  node: {
    id: string;
    slug: string;
    title: string;
    description: string;
    node_type: string;
    difficulty: string;
  };
}) {
  const color = NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)';

  return (
    <Link href={`/explore/${node.slug}`}>
      <div className="hover:border-primary-200 dark:hover:border-primary-700 group flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {node.title.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 text-sm font-semibold text-neutral-900 transition-colors dark:text-neutral-100">
              {node.title}
            </h3>
            <TypeBadge type={node.node_type} />
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
            {node.description}
          </p>
        </div>
        <DifficultyBadge difficulty={node.difficulty} />
        <ArrowRight className="h-4 w-4 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 dark:text-neutral-600" />
      </div>
    </Link>
  );
});

// ── Active Filter Tags ────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary-200 dark:hover:bg-primary-800 ml-0.5 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function ExplorePage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [nodeType, setNodeType] = useState(searchParams.get('node_type') ?? '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') ?? '');
  const [sort, setSort] = useState('title_asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useKnowledgeNodes({
    page,
    page_size: 12,
    node_type: nodeType || undefined,
    difficulty: difficulty || undefined,
    search: debouncedSearch || undefined,
  });

  const hasActiveFilters = nodeType || difficulty || debouncedSearch;

  const clearFilters = () => {
    setNodeType('');
    setDifficulty('');
    setSearch('');
    setPage(1);
  };

  return (
    <PageTransition>
      <Shell>
        <PageHeader
          title="Knowledge Explorer"
          description="Browse concepts, technologies, careers, and projects"
          breadcrumbs={[{ label: 'Explore' }]}
        />

        {/* Search + Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search concepts, technologies, careers..."
                className="pl-9"
                aria-label="Search knowledge nodes"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-primary-500 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
                    {(nodeType ? 1 : 0) + (difficulty ? 1 : 0)}
                  </span>
                )}
              </Button>
              <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-600">
                <button
                  onClick={() => setView('grid')}
                  className={cn(
                    'rounded-l-lg p-2 transition-colors',
                    view === 'grid'
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300',
                  )}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'rounded-r-lg p-2 transition-colors',
                    view === 'list'
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300',
                  )}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {nodeType && (
                <FilterTag
                  label={`Type: ${slugToTitle(nodeType)}`}
                  onRemove={() => setNodeType('')}
                />
              )}
              {difficulty && (
                <FilterTag
                  label={`Difficulty: ${slugToTitle(difficulty)}`}
                  onRemove={() => setDifficulty('')}
                />
              )}
              {debouncedSearch && (
                <FilterTag label={`Search: "${debouncedSearch}"`} onRemove={() => setSearch('')} />
              )}
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <Card className="animate-slide-down">
              <CardContent className="flex flex-wrap items-end gap-4 p-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Type
                  </label>
                  <Select
                    value={nodeType}
                    onValueChange={(v: string) => {
                      setNodeType(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {NODE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Difficulty
                  </label>
                  <Select
                    value={difficulty}
                    onValueChange={(v: string) => {
                      setDifficulty(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d} className="capitalize">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Sort
                  </label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                    <Skeleton className="mb-2 h-5 w-3/4" />
                    <Skeleton className="mb-3 h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          )
        ) : isError ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-error-600 dark:text-error-400 text-sm">
                  Failed to load knowledge nodes
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : data && data.items.length > 0 ? (
          <>
            <p className="mb-4 text-xs text-neutral-400 dark:text-neutral-500">
              Showing {data.items.length} of {data.total} nodes
            </p>

            {view === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.items.map((node) => (
                  <NodeCard key={node.id} node={node} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data.items.map((node) => (
                  <NodeRow key={node.id} node={node} />
                ))}
              </div>
            )}

            {data.total_pages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={data.page}
                  totalPages={data.total_pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon={<Compass className="h-12 w-12" />}
                title="No nodes found"
                description={
                  debouncedSearch
                    ? `No results for "${debouncedSearch}"`
                    : 'No knowledge nodes match your filters'
                }
                action={
                  hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined
                }
              />
            </CardContent>
          </Card>
        )}
      </Shell>
    </PageTransition>
  );
}
