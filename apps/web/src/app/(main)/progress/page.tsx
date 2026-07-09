'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  EmptyState,
} from '@sv-os/ui';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Award,
  Flame,
  Target,
  TrendingUp,
  Clock,
  PlayCircle,
  Trophy,
} from 'lucide-react';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useGraphStats } from '@/hooks/use-graph';
import { useProgressStats, useProgressList, useUpdateProgress } from '@/hooks/use-progress';
import { cn, slugToTitle } from '@/lib';

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="mb-1 h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
            <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-50">{value}</p>
            {sublabel && (
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{sublabel}</p>
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

export default function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useProgressStats();
  const { data: progressList, isLoading: listLoading } = useProgressList({ page_size: 50 });
  const { data: graphStats } = useGraphStats();
  const updateProgress = useUpdateProgress();

  const totalNodes = graphStats?.total_nodes ?? 0;
  const completionRate = stats ? Math.round(stats.completion_percentage) : 0;
  const mastered = stats?.mastered ?? 0;
  const completed = stats?.completed ?? 0;
  const learning = stats?.learning ?? 0;
  const notStarted = stats?.not_started ?? 0;

  // Calculate milestones
  const milestones = [
    { label: 'First concept', threshold: 1, icon: '🌱' },
    { label: 'Getting started', threshold: 5, icon: '🌿' },
    { label: 'Knowledge builder', threshold: 10, icon: '🌳' },
    { label: 'Dedicated learner', threshold: 25, icon: '📚' },
    { label: 'Halfway there', threshold: Math.ceil(totalNodes / 2), icon: '🎯' },
    { label: 'Almost complete', threshold: Math.ceil(totalNodes * 0.75), icon: '🚀' },
    { label: 'Mastery achieved', threshold: totalNodes > 0 ? totalNodes : 100, icon: '🏆' },
  ];

  const nextMilestone = milestones.find((m) => completed + mastered < m.threshold);
  const currentCount = completed + mastered;

  return (
    <Shell>
      <PageHeader
        title="Learning Progress"
        description="Track your learning journey"
        breadcrumbs={[{ label: 'Progress' }]}
      />

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Completion"
          value={statsLoading ? '—' : `${completionRate}%`}
          sublabel={`${completed + mastered} of ${totalNodes} nodes`}
          color="var(--color-primary-500)"
          isLoading={statsLoading}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={statsLoading ? '—' : completed + mastered}
          sublabel={`${mastered} mastered`}
          color="var(--color-success-500)"
          isLoading={statsLoading}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Learning"
          value={statsLoading ? '—' : learning}
          sublabel="In progress"
          color="var(--color-graph-concept)"
          isLoading={statsLoading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Not Started"
          value={statsLoading ? '—' : notStarted}
          sublabel="Remaining"
          color="var(--color-neutral-400)"
          isLoading={statsLoading}
        />
      </div>

      {/* Progress Bar + Milestones */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="text-primary-500 h-4 w-4" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={completionRate}
              size="lg"
              showLabel
              variant={
                completionRate >= 80 ? 'success' : completionRate >= 40 ? 'default' : 'warning'
              }
            />

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="text-success-500 flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  {mastered}
                </div>
                <p className="mt-0.5 text-neutral-400 dark:text-neutral-500">Mastered</p>
              </div>
              <div>
                <div className="text-primary-500 flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  {completed}
                </div>
                <p className="mt-0.5 text-neutral-400 dark:text-neutral-500">Completed</p>
              </div>
              <div>
                <div className="text-info-500 flex items-center justify-center gap-1 font-medium">
                  <PlayCircle className="h-3 w-3" />
                  {learning}
                </div>
                <p className="mt-0.5 text-neutral-400 dark:text-neutral-500">Learning</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 font-medium text-neutral-400">
                  <Clock className="h-3 w-3" />
                  {notStarted}
                </div>
                <p className="mt-0.5 text-neutral-400 dark:text-neutral-500">Not started</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="text-warning-500 h-4 w-4" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {milestones.slice(0, 5).map((milestone) => {
              const achieved = currentCount >= milestone.threshold;
              return (
                <div
                  key={milestone.label}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-2 transition-colors',
                    achieved ? 'bg-success-50 dark:bg-success-950/20' : 'opacity-50',
                  )}
                >
                  <span className="text-lg">{milestone.icon}</span>
                  <div className="flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        achieved
                          ? 'text-success-700 dark:text-success-300'
                          : 'text-neutral-500 dark:text-neutral-400',
                      )}
                    >
                      {milestone.label}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {milestone.threshold} {milestone.threshold === 1 ? 'node' : 'nodes'}
                    </p>
                  </div>
                  {achieved && (
                    <Badge variant="success" size="sm">
                      Done
                    </Badge>
                  )}
                </div>
              );
            })}
            {nextMilestone && currentCount < nextMilestone.threshold && (
              <p className="pt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
                {nextMilestone.threshold - currentCount} more to reach &ldquo;{nextMilestone.label}
                &rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Learning History
          </h2>
          {progressList && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {progressList.total} entries
            </p>
          )}
        </div>

        {listLoading ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ) : progressList && progressList.items.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
              {progressList.items.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        entry.status === 'mastered'
                          ? 'bg-success-50 text-success-600 dark:bg-success-950/30'
                          : entry.status === 'completed'
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30'
                            : entry.status === 'learning'
                              ? 'bg-info-50 text-info-600 dark:bg-info-950/30'
                              : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800',
                      )}
                    >
                      {entry.status === 'mastered' ? (
                        <Award className="h-4 w-4" />
                      ) : entry.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : entry.status === 'learning' ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Node {entry.node_id.slice(0, 8)}
                      </p>
                      <Badge
                        variant={
                          entry.status === 'mastered'
                            ? 'success'
                            : entry.status === 'completed'
                              ? 'default'
                              : entry.status === 'learning'
                                ? 'info'
                                : 'secondary'
                        }
                        size="sm"
                      >
                        {slugToTitle(entry.status)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {new Date(entry.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon={<BarChart3 className="h-12 w-12" />}
                title="No progress yet"
                description="Start learning to see your progress here"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
