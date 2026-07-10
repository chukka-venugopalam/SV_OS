'use client';

import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  EmptyState,
  Pagination,
} from '@sv-os/ui';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowRight,
  BookText,
  Code2,
  Wrench,
  Briefcase,
  FolderGit2,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearch as useSearchHook , useSearchSuggestions, useTrendingSearches } from '@/hooks/use-search';
import { slugToTitle, truncate } from '@/lib';
import { ROUTES } from '@/lib/constants';

const NODE_TYPES = ['subject', 'concept', 'technology', 'tool', 'career', 'project'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const PAGE_SIZE = 12;

const typeIcons: Record<string, React.ReactNode> = {
  subject: <BookText className="h-4 w-4" />,
  concept: <Compass className="h-4 w-4" />,
  technology: <Code2 className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />,
  career: <Briefcase className="h-4 w-4" />,
  project: <FolderGit2 className="h-4 w-4" />,
};

interface ResultItemProps {
  node: {
    id: string;
    slug: string;
    title: string;
    description: string;
    node_type: string;
    difficulty: string;
  };
  query: string;
}

function ResultItem({ node, query }: ResultItemProps) {
  const color = NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)';

  // Highlight matching text
  const highlight = useCallback(
    (text: string) => {
      if (!query) return text;
      const parts = text.split(
        new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
      );
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-200 rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
    },
    [query],
  );

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
            <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {highlight(node.title)}
            </h3>
            <Badge
              variant="secondary"
              size="sm"
              className="flex shrink-0 items-center gap-1 capitalize"
            >
              {typeIcons[node.node_type]}
              {node.node_type}
            </Badge>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
            {highlight(truncate(node.description, 100))}
          </p>
        </div>
        <Badge
          variant={
            node.difficulty === 'beginner'
              ? 'success'
              : node.difficulty === 'intermediate'
                ? 'info'
                : node.difficulty === 'advanced'
                  ? 'warning'
                  : 'danger'
          }
          size="sm"
        >
          {slugToTitle(node.difficulty)}
        </Badge>
        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 dark:text-neutral-600" />
      </div>
    </Link>
  );
}

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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [nodeType, setNodeType] = useState(searchParams.get('node_type') ?? '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') ?? '');
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, isError, refetch } = useSearchHook({
    q: debouncedQuery,
    page,
    page_size: PAGE_SIZE,
    node_type: nodeType || undefined,
    difficulty: difficulty || undefined,
  });

  const { data: suggestions } = useSearchSuggestions(debouncedQuery);
  const { data: trending } = useTrendingSearches();

  const hasFilters = nodeType || difficulty;

  const clearFilters = useCallback(() => {
    setNodeType('');
    setDifficulty('');
    setPage(1);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router],
  );

  return (
    <Shell>
      <PageHeader
        title="Search"
        description="Find concepts, technologies, careers, and projects"
        breadcrumbs={[{ label: 'Search' }]}
      />

      {/* Search Input */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search everything..."
            className="h-12 pl-12 pr-4 text-base"
            aria-label="Search"
            autoFocus
          />
        </div>

        {/* Suggestions dropdown */}
        {suggestions && suggestions.length > 0 && debouncedQuery.length >= 2 && !isLoading && (
          <Card className="animate-slide-down mt-2">
            <CardContent className="p-2">
              {suggestions.slice(0, 5).map((s) => (
                <button
                  key={s.text}
                  onClick={() => {
                    setQuery(s.text);
                    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(s.text)}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Search className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{s.text}</span>
                  <Badge variant="secondary" size="sm" className="ml-auto capitalize">
                    {s.type}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </form>

      {/* Search Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          variant={showAdvanced ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-fit gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="bg-primary-500 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
              !
            </span>
          )}
        </Button>

        {data && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {data.total} result{data.total !== 1 ? 's' : ''} for &ldquo;{data.query}&rdquo;
          </p>
        )}

        {/* Active filter tags */}
        {(hasFilters || debouncedQuery) && (
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
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="animate-slide-down mb-6">
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Type
              </label>
              <Select
                value={nodeType}
                onValueChange={(v) => {
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
                onValueChange={(v) => {
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
          </CardContent>
        </Card>
      )}

      {/* Trending (shown when no search) */}
      {!debouncedQuery && trending && trending.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Trending searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {trending.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(term)}`);
                }}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-error-600 dark:text-error-400 mb-3 text-sm">Search failed</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : data && data.nodes.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.nodes.map((node) => (
              <ResultItem key={node.id} node={node} query={debouncedQuery} />
            ))}
          </div>
          {data.total > PAGE_SIZE && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(data.total / PAGE_SIZE)}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : debouncedQuery ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No results found"
              description={`No results for "${debouncedQuery}". Try different keywords or adjust your filters.`}
              action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Search the knowledge graph"
              description="Type a query above to search across concepts, technologies, careers, and projects"
            />
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}
