'use client';

import { Badge, Button, Card, CardContent } from '@sv-os/ui';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

import { GATE_PATH_NODES } from '@/data/gate-path-nodes';

export default function LearningPathPage() {
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const n of GATE_PATH_NODES) {
      set.add(n.domain);
    }
    return Array.from(set);
  }, []);

  const filteredNodes = useMemo(() => {
    if (activeFilter === 'all') return GATE_PATH_NODES;
    return GATE_PATH_NODES.filter((n) => n.domain === activeFilter);
  }, [activeFilter]);

  const progressPercent = Math.round((completedSlugs.length / GATE_PATH_NODES.length) * 100);

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
              72-Node Guided CS Learning Path
            </h1>
            <p className="text-sm leading-relaxed text-neutral-300">
              Master Computer Science from absolute mathematical foundations to advanced systems.
              Follow our natural, prerequisite-ordered graph path designed for deep technical
              comprehension.
            </p>
          </div>

          {/* Progress Card */}
          <div className="flex min-w-[200px] flex-col items-center justify-center rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="text-primary-400 text-3xl font-extrabold">{progressPercent}%</div>
            <div className="mt-1 text-xs font-medium text-neutral-300">
              {completedSlugs.length} of {GATE_PATH_NODES.length} Nodes Mastered
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <button
          onClick={() => setActiveFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          All Nodes ({GATE_PATH_NODES.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === cat
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Node Stream */}
      <div className="space-y-4">
        {filteredNodes.map((node) => {
          const isDone = completedSlugs.includes(node.slug);

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
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : node.order}
                  </button>

                  {/* Node Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-primary-600 dark:text-primary-400 border-primary-500/30 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {node.domain}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {node.difficulty}
                      </Badge>
                      <span className="font-mono text-[11px] text-neutral-400">
                        ~{node.estimated_hours}h
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {node.order}. {node.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {node.summary}
                    </p>

                    {/* Prerequisite Tags */}
                    {node.prerequisites.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-medium text-neutral-400">Requires:</span>
                        {node.prerequisites.map((prereq) => (
                          <span
                            key={prereq}
                            className="inline-block rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {prereq}
                          </span>
                        ))}
                      </div>
                    )}
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
