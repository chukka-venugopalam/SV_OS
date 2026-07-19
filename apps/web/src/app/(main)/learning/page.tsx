'use client';

import { Card, CardContent, Button, Badge, Progress, Skeleton } from '@sv-os/ui';
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { StaggerGrid, SlideUp } from '@/components/shared/animations';
import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useNextRecommendations, useDailyRecommendations } from '@/hooks/use-learning';
import { useProgressStats, useProgressList } from '@/hooks/use-progress';
import { formatRelativeTime } from '@/lib';
import { ROUTES } from '@/lib/constants';

export default function LearningDashboardPage() {
  const { data: progressStats, isLoading: statsLoading } = useProgressStats();
  const { data: progressList } = useProgressList({ page_size: 10, status: 'learning' });
  const { data: nextRecs } = useNextRecommendations(5);
  const { data: dailyRecs } = useDailyRecommendations(8);

  const totalNodes = progressStats?.total_nodes ?? 0;
  const completedCount = (progressStats?.completed ?? 0) + (progressStats?.mastered ?? 0);
  const learningCount = progressStats?.learning ?? 0;
  const completionRate = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  const nextItems = nextRecs?.items ?? [];
  const progressItems = progressList?.items ?? [];

  return (
    <Shell>
      <PageHeader
        title="Learning Dashboard"
        description="Track your progress, review schedules, and daily goals"
        breadcrumbs={[{ label: 'Learning' }]}
        actions={
          <Link href={ROUTES.EXPLORE}>
            <Button variant="default" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" /> Continue Learning
            </Button>
          </Link>
        }
      />

      {/* Stats Row */}
      <StaggerGrid className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SlideUp delay={0}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 text-primary-600 flex h-11 w-11 items-center justify-center rounded-xl">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Completion</p>
                  <p className="text-xl font-bold">{statsLoading ? '...' : `${completionRate}%`}</p>
                  <Progress value={completionRate} size="sm" className="mt-1 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.05}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="bg-success-50 text-success-600 flex h-11 w-11 items-center justify-center rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Completed</p>
                  <p className="text-xl font-bold">{statsLoading ? '...' : completedCount}</p>
                  <p className="text-[10px] text-neutral-400">of {totalNodes} total nodes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.1}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 text-warning-600 flex h-11 w-11 items-center justify-center rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">In Progress</p>
                  <p className="text-xl font-bold">{statsLoading ? '...' : learningCount}</p>
                  <p className="text-[10px] text-neutral-400">nodes being learned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.15}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="bg-info-50 text-info-600 flex h-11 w-11 items-center justify-center rounded-xl">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Learning Streak</p>
                  <p className="text-xl font-bold">
                    {learningCount > 0 ? `${learningCount} days` : 'Start!'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {learningCount > 0 ? 'Keep going!' : 'Begin your journey'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      </StaggerGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Recommendations */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <Zap className="mr-1.5 inline h-3.5 w-3.5" /> Recommended Next
            </h2>
            <Link
              href={ROUTES.EXPLORE}
              className="text-primary-600 hover:text-primary-500 text-xs font-medium"
            >
              View all <ChevronRight className="inline h-3 w-3" />
            </Link>
          </div>

          {nextItems.length > 0 ? (
            <div className="space-y-2">
              {nextItems.map((rec, i) => (
                <SlideUp key={rec.node_id} delay={i * 0.05}>
                  <Card className="group cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-primary-50 text-primary-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {rec.title}
                          </p>
                          <p className="text-xs text-neutral-400">{rec.reason?.slice(0, 60)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          {rec.difficulty}
                        </Badge>
                        <span className="text-xs text-neutral-400">{rec.estimated_minutes}m</span>
                      </div>
                    </CardContent>
                  </Card>
                </SlideUp>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-neutral-400">
                No recommendations yet. Start exploring to get personalized suggestions.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Daily Overview */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            <Calendar className="mr-1.5 inline h-3.5 w-3.5" /> Daily Overview
          </h2>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success-50 text-success-600 flex h-9 w-9 items-center justify-center rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Today's Progress</p>
                  <p className="text-sm font-semibold">{completedCount} nodes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-info-50 text-info-600 flex h-9 w-9 items-center justify-center rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Estimated Time</p>
                  <p className="text-sm font-semibold">{learningCount * 15} min remaining</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 text-warning-600 flex h-9 w-9 items-center justify-center rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Learning Velocity</p>
                  <p className="text-sm font-semibold">
                    {Math.round(completedCount / Math.max(learningCount, 1))} nodes/day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Goals */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <Target className="mr-1 inline h-3 w-3" /> Weekly Goals
              </h3>
              <Progress value={completionRate} size="sm" />
              <p className="mt-1 text-xs text-neutral-400">
                {completionRate >= 100
                  ? 'All goals achieved! 🎉'
                  : `${completionRate}% toward this week's goal`}
              </p>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="space-y-2">
            <Link href="/versions">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" /> Version History
              </Button>
            </Link>
            <Link href="/health">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" /> System Health
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          <BookOpen className="mr-1.5 inline h-3.5 w-3.5" /> In Progress
        </h2>
        {progressItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progressItems.slice(0, 6).map((entry, i) => (
              <SlideUp key={entry.id} delay={i * 0.05}>
                <Card className="group cursor-pointer transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {entry.node_id?.slice(0, 16)}
                      </p>
                      <Badge variant="info" size="sm">
                        {entry.status}
                      </Badge>
                    </div>
                    <Progress value={Math.random() * 100} size="sm" />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-neutral-400">
                        Started {formatRelativeTime(entry.created_at)}
                      </p>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardContent>
                </Card>
              </SlideUp>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-400">Nothing in progress yet</p>
              <Link href={ROUTES.EXPLORE}>
                <Button variant="outline" size="sm" className="mt-3">
                  Start Learning
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
