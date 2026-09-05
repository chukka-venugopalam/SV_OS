'use client';

import { Badge, Button, Card, CardContent, EmptyState, ErrorState, Skeleton } from '@sv-os/ui';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

import { useCurriculumPath } from '@/hooks/use-knowledge';

/**
 * Guided Path — GATE-core curriculum sequence.
 *
 * Previously a static array (src/data/gate-path-nodes.ts) frozen at whatever
 * the DB looked like months ago: 82% of its slugs pointed at nodes that have
 * since been soft-deleted and superseded by the Act 1-7 fine-grained
 * restructuring. This now queries /nodes/curriculum-path live, ordered by
 * (act, district, chapter_number), so it always reflects current published
 * content. Scoped to tier=gate_core — Act 8 career-track nodes live under
 * the Careers section instead, once learning_goal_nodes gets populated.
 */
export default function LearningPathPage() {
  const { data, isLoading, isError, refetch } = useCurriculumPath('gate_core');
  const nodes = useMemo(() => data?.items ?? [], [data]);

  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('svos_gate_completed_nodes');
      if (saved) {
        setCompletedSlugs(JSON.parse(saved));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleComplete = (slug: string) => {
    const next = completedSlugs.includes(slug)
      ? completedSlugs.filter((s) => s !== slug)
      : [...completedSlugs, slug];
    setCompletedSlugs(next);
    try {
      localStorage.setItem('svos_gate_completed_nodes', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Group by act -> district for display, and for the filter tab list.
  const districts = useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (n.district) set.add(n.district);
    }
    return Array.from(set);
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (activeFilter === 'all') return nodes;
    return nodes.filter((n) => n.district === activeFilter);
  }, [activeFilter, nodes]);

  const progressPercent =
    nodes.length > 0 ? Math.round((completedSlugs.length / nodes.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl space-y-4 px-4 py-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <ErrorState
          title="Couldn't load the guided path"
          message="Something went wrong fetching the curriculum sequence."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <EmptyState
          title="No published GATE-core content yet"
          description="Once nodes are published with an act/district/chapter assignment, they'll appear here in order."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Header Banner */}
      <div className="via-primary-950 relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-900 p-8 text-white shadow-xl dark:border dark:border-neutral-800">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="bg-primary-500/20 text-primary-300 border-primary-500/30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>GATE Computer Science Core Curriculum</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Guided CS Learning Path
            </h1>
            <p className="text-sm leading-relaxed text-neutral-300">
              Master Computer Science from absolute mathematical foundations to advanced systems.
              Ordered by Act &rarr; District &rarr; Chapter, always reflecting the current published
              curriculum.
            </p>
          </div>

          {/* Progress Card */}
          <div className="flex min-w-[200px] flex-col items-center justify-center rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="text-primary-400 text-3xl font-extrabold">{progressPercent}%</div>
            <div className="mt-1 text-xs font-medium text-neutral-300">
              {completedSlugs.length} of {nodes.length} Nodes Mastered
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="bg-primary-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs — by district */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <button
          onClick={() => setActiveFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          All Nodes ({nodes.length})
        </button>
        {districts.map((d) => (
          <button
            key={d}
            onClick={() => setActiveFilter(d)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === d
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Node Stream */}
      <div className="space-y-4">
        {filteredNodes.map((node, idx) => {
          const isDone = completedSlugs.includes(node.slug);
          const stepNumber = idx + 1;
          const estimatedHours = node.estimated_minutes
            ? Math.round((node.estimated_minutes / 60) * 10) / 10
            : null;

          return (
            <Card
              key={node.slug}
              className={`hover:border-primary-500/50 transition-all duration-200 ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10'
                  : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
              }`}
            >
              <CardContent className="flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
                <div className="flex flex-1 items-start gap-4">
                  {/* Step Number & Check */}
                  <button
                    onClick={() => toggleComplete(node.slug)}
                    className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as mastered'}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : stepNumber}
                  </button>

                  {/* Node Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {node.act != null && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold uppercase tracking-wide"
                        >
                          Act {node.act}
                        </Badge>
                      )}
                      {node.district && (
                        <Badge
                          variant="outline"
                          className="text-primary-600 dark:text-primary-400 border-primary-500/30 text-[10px] font-semibold uppercase tracking-wide"
                        >
                          {node.district}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {node.difficulty}
                      </Badge>
                      {estimatedHours != null && (
                        <span className="font-mono text-[11px] text-neutral-400">
                          ~{estimatedHours}h
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {stepNumber}. {node.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {node.summary || node.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
                  <Link href={`/explore/${node.slug}`}>
                    <Button variant="default" size="sm" className="gap-1.5 text-xs font-semibold">
                      <span>Study Concept</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
