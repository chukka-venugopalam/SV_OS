'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@sv-os/ui';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  CheckCircle2,
  BookOpen,
  Star,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { Shell } from '@/components/shared/shell';
import { useCareer, useCareerRoadmap } from '@/hooks/use-careers';
import { slugToTitle } from '@/lib';

const demandColors: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  growing: 'success',
  high_demand: 'success',
  stable: 'info',
  declining: 'danger',
};



export default function CareerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: career, isLoading, isError } = useCareer(slug);
  const { data: roadmap } = useCareerRoadmap(slug);

  if (isLoading) {
    return (
      <Shell maxWidth="4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (isError || !career) {
    return (
      <Shell>
        <ErrorState
          title="Career not found"
          message="This career path doesn't exist or has been removed."
        />
      </Shell>
    );
  }

  return (
    <Shell maxWidth="4xl">
      <Link
        href="/careers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to careers
      </Link>

      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-career-50 text-career-600 dark:bg-career-950/30 dark:text-career-400 flex h-12 w-12 items-center justify-center rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
          <Badge
            variant={demandColors[career.demand] ?? 'secondary'}
            size="sm"
            className="capitalize"
          >
            {career.demand.replace(/_/g, ' ')}
          </Badge>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          {career.title}
        </h1>
        <p className="mb-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          {career.description}
        </p>

        {career.salary_range && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
            <DollarSign className="text-success-500 h-4 w-4" />
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {career.salary_range}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500">/year</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-error-50 text-error-600 dark:bg-error-950/30 dark:text-error-400 flex h-10 w-10 items-center justify-center rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {roadmap?.required.length ?? 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Required concepts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-info-50 text-info-600 dark:bg-info-950/30 dark:text-info-400 flex h-10 w-10 items-center justify-center rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {roadmap?.recommended.length ?? 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Recommended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-warning-50 text-warning-600 dark:bg-warning-950/30 dark:text-warning-400 flex h-10 w-10 items-center justify-center rounded-lg">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {roadmap?.bonus.length ?? 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Bonus skills</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap */}
      <Tabs defaultValue="required">
        <TabsList>
          <TabsTrigger value="required" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Required
            <Badge variant="secondary" size="sm">
              {roadmap?.required.length ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="recommended" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Recommended
            <Badge variant="secondary" size="sm">
              {roadmap?.recommended.length ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bonus" className="gap-2">
            <Star className="h-4 w-4" />
            Bonus
            <Badge variant="secondary" size="sm">
              {roadmap?.bonus.length ?? 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {(['required', 'recommended', 'bonus'] as const).map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            {roadmap && roadmap[type].length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {roadmap[type].map((node) => (
                  <Link key={node.id} href={`/explore/${node.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:shadow-md">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{
                            backgroundColor:
                              NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)',
                          }}
                        >
                          {node.title.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 transition-colors dark:text-neutral-100">
                            {node.title}
                          </p>
                          <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                            {slugToTitle(node.node_type)} · {slugToTitle(node.difficulty)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 dark:text-neutral-600" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title={`No ${type} concepts`}
                description={`No ${type} learning concepts have been defined for this career yet.`}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Metadata */}
      {career.metadata && Object.keys(career.metadata).length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(career.metadata as Record<string, string>).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium capitalize text-neutral-500 dark:text-neutral-400">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}
