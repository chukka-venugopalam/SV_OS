'use client';

import { Card, CardContent, Badge, Button, Progress, Skeleton } from '@sv-os/ui';
import {
  BookOpen,
  TrendingUp,
  Award,
  Flame,
  Compass,
  Briefcase,
  FolderGit2,
  Bookmark,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Target,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { PageTransition } from '@/components/shared/animations';
import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useActivityFeed } from '@/hooks/use-activity';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useGraphStats } from '@/hooks/use-graph';
import { usePopularNodes } from '@/hooks/use-knowledge';
import { useProgressStats, useProgressList } from '@/hooks/use-progress';
import { useTrendingSearches } from '@/hooks/use-search';
import { cn, formatRelativeTime, slugToTitle } from '@/lib';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/providers/auth-provider';

// ── Stat Card ─────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  isLoading?: boolean;
}

function StatCard({ icon, label, value, sublabel, color, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton variant="circular" className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {value}
            </p>
            {sublabel && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{sublabel}</p>
            )}
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: string;
}

function QuickAction({ icon, label, description, href, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-start gap-4 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{label}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Continue Learning Card ────────────────────────────────────────

function ContinueLearningCard({
  title,
  description,
  progress,
}: {
  title: string;
  description: string;
  progress: number;
}) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
            <p className="line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          </div>
          <PlayCircle className="text-primary-500 h-5 w-5 shrink-0" />
        </div>
        <Progress value={progress} size="sm" />
        <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          {Math.round(progress)}% complete
        </p>
      </CardContent>
    </Card>
  );
}

// ── Activity Item ─────────────────────────────────────────────────

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  time: string;
  type: 'started' | 'completed' | 'bookmarked' | 'mastered' | 'favorited';
}

function ActivityItem({ icon, title, time, type }: ActivityItemProps) {
  const colors = {
    started: 'text-info-500 bg-info-50 dark:bg-info-950/30',
    completed: 'text-success-500 bg-success-50 dark:bg-success-950/30',
    bookmarked: 'text-primary-500 bg-primary-50 dark:bg-primary-950/30',
    mastered: 'text-graph-subject bg-purple-50 dark:bg-purple-950/30',
    favorited: 'text-primary-500 bg-primary-50 dark:bg-primary-950/30',
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          colors[type],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{time}</p>
      </div>
    </div>
  );
}

// ── Difficulty Badge ──────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    beginner: 'success' as const,
    intermediate: 'info' as const,
    advanced: 'warning' as const,
    expert: 'danger' as const,
  };

  return (
    <Badge variant={colors[difficulty] ?? 'secondary'} size="sm">
      {slugToTitle(difficulty)}
    </Badge>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: progressStats, isLoading: statsLoading } = useProgressStats();
  const { data: progressList } = useProgressList({ page_size: 5, status: 'learning' });
  const { data: popularNodes, isLoading: popularLoading } = usePopularNodes();
  const { data: graphStats, isLoading: graphLoading } = useGraphStats();
  const { data: trendingSearches } = useTrendingSearches();
  const { data: bookmarks } = useBookmarks({ page_size: 3 });
  const { data: activityFeed } = useActivityFeed({ page_size: 5 });

  const displayName = user?.display_name ?? user?.username ?? 'Learner';
  const completionRate = progressStats ? Math.round(progressStats.completion_percentage) : 0;
  const masteredCount = progressStats?.mastered ?? 0;
  const completedCount = progressStats?.completed ?? 0;
  const learningCount = progressStats?.learning ?? 0;
  const totalNodes = graphStats?.total_nodes ?? 0;
  const nodeTypeCounts = graphStats?.node_type_counts ?? {};

  return (
    <PageTransition>
      <Shell>
        {/* Welcome */}
        <div className="mb-8">
          <PageHeader
            title={`Welcome back, ${displayName}`}
            description="Here's your learning overview"
            actions={
              <Link href={ROUTES.EXPLORE}>
                <Button variant="default" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Start exploring
                </Button>
              </Link>
            }
          />
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Completion Rate"
            value={statsLoading ? '—' : `${completionRate}%`}
            sublabel={`${completedCount + masteredCount} of ${progressStats?.total_nodes ?? 0} nodes`}
            color="var(--color-primary-500)"
            isLoading={statsLoading}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Completed"
            value={statsLoading ? '—' : completedCount + masteredCount}
            sublabel={`${masteredCount} mastered`}
            color="var(--color-success-500)"
            isLoading={statsLoading}
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="In Progress"
            value={statsLoading ? '—' : learningCount}
            sublabel="Currently learning"
            color="var(--color-graph-concept)"
            isLoading={statsLoading}
          />
          <StatCard
            icon={<Award className="h-5 w-5" />}
            label="Knowledge Nodes"
            value={graphLoading ? '—' : totalNodes}
            sublabel={`${Object.keys(nodeTypeCounts).length} types`}
            color="var(--color-graph-subject)"
            isLoading={graphLoading}
          />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <QuickAction
                icon={<Compass className="h-5 w-5" />}
                label="Explore Knowledge"
                description="Browse the knowledge graph"
                href={ROUTES.EXPLORE}
                color="var(--color-graph-concept)"
              />
              <QuickAction
                icon={<Briefcase className="h-5 w-5" />}
                label="Career Paths"
                description="Find your learning roadmap"
                href={ROUTES.CAREERS}
                color="var(--color-graph-career)"
              />
              <QuickAction
                icon={<FolderGit2 className="h-5 w-5" />}
                label="Projects"
                description="Build real-world projects"
                href={ROUTES.PROJECTS}
                color="var(--color-graph-project)"
              />
              <QuickAction
                icon={<BarChart3 className="h-5 w-5" />}
                label="Track Progress"
                description="View your learning stats"
                href={ROUTES.PROGRESS}
                color="var(--color-graph-tool)"
              />
            </div>
          </div>

          {/* Continue Learning */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Continue Learning
              </h2>
              <Link
                href={ROUTES.PROGRESS}
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 text-xs font-medium"
              >
                View all
              </Link>
            </div>

            {progressList && progressList.items.length > 0 ? (
              <div className="space-y-3">
                {progressList.items.slice(0, 3).map((entry) => (
                  <ContinueLearningCard
                    key={entry.id}
                    title={entry.node_id.slice(0, 8)}
                    description={slugToTitle(entry.status)}
                    progress={65}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <BookOpen className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Start learning to see your progress here
                    </p>
                    <Link href={ROUTES.EXPLORE}>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Compass className="mr-1.5 h-3.5 w-3.5" />
                        Explore
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Recent Activity
            </h2>
            <Card>
              <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {activityFeed && activityFeed.items.length > 0 ? (
                  activityFeed.items
                    .slice(0, 4)
                    .map((a) => (
                      <ActivityItem
                        key={a.id}
                        icon={
                          a.type === 'bookmarked' ? (
                            <Bookmark className="h-4 w-4" />
                          ) : a.type === 'completed' || a.type === 'mastered' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )
                        }
                        title={a.node_title}
                        time={formatRelativeTime(a.created_at)}
                        type={a.type}
                      />
                    ))
                ) : bookmarks && bookmarks.items.length > 0 ? (
                  bookmarks.items
                    .slice(0, 3)
                    .map((b) => (
                      <ActivityItem
                        key={b.id}
                        icon={<Bookmark className="h-4 w-4" />}
                        title={`Bookmarked ${b.node_title}`}
                        time={formatRelativeTime(b.created_at)}
                        type="bookmarked"
                      />
                    ))
                ) : (
                  <ActivityItem
                    icon={<Compass className="h-4 w-4" />}
                    title="Start exploring to see activity"
                    time="—"
                    type="started"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Grid: Popular + Trending */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Popular Nodes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <TrendingUp className="mr-1.5 inline h-3.5 w-3.5" />
                Popular Knowledge
              </h2>
              <Link
                href={ROUTES.EXPLORE}
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 text-xs font-medium"
              >
                Browse all
              </Link>
            </div>

            {popularLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : popularNodes && popularNodes.length > 0 ? (
              <Card>
                <CardContent className="divide-y divide-neutral-100 p-2 dark:divide-neutral-800">
                  {popularNodes.slice(0, 5).map((node) => (
                    <Link
                      key={node.id}
                      href={`/explore/${node.slug}`}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)',
                        }}
                      >
                        {node.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {node.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-neutral-400 dark:text-neutral-500">
                          {node.description}
                        </p>
                      </div>
                      <DifficultyBadge difficulty={node.difficulty} />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                  No popular nodes yet
                </CardContent>
              </Card>
            )}
          </div>

          {/* Trending Searches */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
              Trending
            </h2>
            <Card>
              <CardContent className="p-4">
                {trendingSearches && trendingSearches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term) => (
                      <Link
                        key={term}
                        href={`${ROUTES.EXPLORE}?search=${encodeURIComponent(term)}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <TrendingUp className="text-primary-500 h-3 w-3" />
                        {term}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {[
                      'JavaScript',
                      'React',
                      'Python',
                      'Machine Learning',
                      'System Design',
                      'Docker',
                    ].map((term) => (
                      <Link
                        key={term}
                        href={`${ROUTES.EXPLORE}?search=${encodeURIComponent(term)}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <TrendingUp className="text-primary-500 h-3 w-3" />
                        {term}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Learning Paths */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <Target className="mr-1.5 inline h-3.5 w-3.5" />
                Quick Stats
              </h3>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Flame className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Learning Streak
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {learningCount > 0
                          ? `${learningCount} nodes in progress`
                          : 'Start learning to build your streak'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-success-50 text-success-600 dark:bg-success-950/30 dark:text-success-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Completion Goal
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {completionRate >= 100
                          ? 'All nodes completed! 🎉'
                          : `${100 - completionRate}% remaining to complete all nodes`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Shell>
    </PageTransition>
  );
}
