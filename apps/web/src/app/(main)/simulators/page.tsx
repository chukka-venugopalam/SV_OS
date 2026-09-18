'use client';

import { Card, Badge, Button } from '@sv-os/ui';
import { Cpu, Play } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Shell } from '@/components/shared/shell';
import { apiClient } from '@/lib/api-client';
import simulatorMap from '@/lib/simulator-map.json';

interface SimulatorData {
  id: string;
  title: string;
  domain: string;
  target_node_slug: string;
  description: string;
  component_name: string;
  badge: string;
}

const FALLBACK_SIMULATORS: SimulatorData[] = Object.entries(
  simulatorMap as Record<string, { file: string; chapters: string[] }>,
).map(([slug, info]) => {
  const targetSlug = info.chapters[0] ?? slug;
  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    id: `sim-${targetSlug}`,
    title,
    domain: 'Computer Science',
    target_node_slug: targetSlug,
    description: `Interactive simulation for ${title}.`,
    component_name: slug,
    badge: 'Interactive',
  };
});

export default function SimulatorsPage() {
  const [simulators, setSimulators] = useState<SimulatorData[]>(FALLBACK_SIMULATORS);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  useEffect(() => {
    // Fetch live inventory from API, fallback to client inventory
    apiClient
      .get<SimulatorData[]>('/simulators')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSimulators(res.data);
        }
      })
      .catch(() => {
        // use fallback
      });
  }, []);

  const domains = Array.from(new Set(simulators.map((s) => s.domain)));

  const filtered =
    selectedDomain === 'all' ? simulators : simulators.filter((s) => s.domain === selectedDomain);

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary-500 h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Interactive Simulators & Visualizers Catalog
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
            Explore {simulators.length} interactive, step-by-step algorithms, memory systems,
            network protocols, and digital logic visualizers wired directly to SV-OS Knowledge Graph
            nodes.
          </p>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedDomain === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedDomain('all')}
            className="text-xs"
          >
            All Simulators ({simulators.length})
          </Button>
          {domains.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={selectedDomain === d ? 'default' : 'outline'}
              onClick={() => setSelectedDomain(d)}
              className="text-xs"
            >
              {d}
            </Button>
          ))}
        </div>

        {/* Simulators Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sim) => (
            <Card
              key={sim.id}
              className="hover:border-primary-500/50 flex flex-col justify-between border-neutral-200 bg-white transition-all duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-primary-600 dark:text-primary-400 text-[10px] font-semibold uppercase"
                  >
                    {sim.badge || sim.domain}
                  </Badge>
                  <Cpu className="h-4 w-4 text-neutral-400" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {sim.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {sim.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link href={`/explore/${sim.target_node_slug}`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2 text-xs font-semibold"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Launch Visualizer</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
