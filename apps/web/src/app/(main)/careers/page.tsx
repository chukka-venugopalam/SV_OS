'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  DollarSign,
  Users,
} from 'lucide-react';
import { useCareers } from '@/hooks/use-careers';
import { Shell } from '@/components/shared/shell';
import { PageHeader } from '@/components/shared/page-header';
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
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/utils/number';

const demandIcons: Record<string, React.ReactNode> = {
  growing: <TrendingUp className="h-3.5 w-3.5" />,
  high_demand: <TrendingUp className="h-3.5 w-3.5" />,
  stable: <Minus className="h-3.5 w-3.5" />,
  declining: <TrendingDown className="h-3.5 w-3.5" />,
};

const demandColors: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  growing: 'success',
  high_demand: 'success',
  stable: 'info',
  declining: 'danger',
};

const CareerCard = memo(function CareerCard({ career }: { career: { id: string; slug: string; title: string; description: string; salary_range: string; demand: string; icon_name: string } }) {
  return (
    <Link href={`/careers/${career.slug}`}>
      <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-career-50 text-career-600 dark:bg-career-950/30 dark:text-career-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <Badge variant={demandColors[career.demand] ?? 'secondary'} size="sm" className="flex items-center gap-1 capitalize">
              {demandIcons[career.demand]}
              {career.demand.replace(/_/g, ' ')}
            </Badge>
          </div>
          <h3 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {career.title}
          </h3>
          <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 flex-1">
            {career.description}
          </p>
          <div className="flex items-center justify-between">
            {career.salary_range && (
              <span className="text-xs font-medium text-success-600 dark:text-success-400">
                {career.salary_range}
              </span>
            )}
            <ArrowRight className="h-4 w-4 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 dark:text-neutral-600" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default function CareersPage() {
  const [search, setSearch] = useState('');
  const [demand, setDemand] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useCareers({
    page,
    page_size: 12,
    search: debouncedSearch || undefined,
    demand: demand || undefined,
  });

  return (
    <Shell>
      <PageHeader
        title="Career Explorer"
        description="Discover career paths and their learning roadmaps"
        breadcrumbs={[{ label: 'Careers' }]}
      />

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search careers..."
            className="pl-9"
            aria-label="Search careers"
          />
        </div>
        <Select value={demand} onValueChange={(v) => { setDemand(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All demand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All demand</SelectItem>
            <SelectItem value="high_demand">High demand</SelectItem>
            <SelectItem value="growing">Growing</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="declining">Declining</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-sm text-error-600 dark:text-error-400 mb-3">Failed to load careers</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="mb-4 text-xs text-neutral-400 dark:text-neutral-500">
            {data.total} career{data.total !== 1 ? 's' : ''} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((career) => (
              <CareerCard key={career.id} career={career} />
            ))}
          </div>
          {data.total_pages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={data.page} totalPages={data.total_pages} onPageChange={setPage} />
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="No careers found"
              description={debouncedSearch ? `No careers matching "${debouncedSearch}"` : 'No careers available yet'}
              action={search || demand ? { label: 'Clear filters', onClick: () => { setSearch(''); setDemand(''); setPage(1); } } : undefined}
            />
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}
