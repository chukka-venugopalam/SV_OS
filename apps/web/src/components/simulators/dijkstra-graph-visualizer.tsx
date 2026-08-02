'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Play, RotateCcw, SkipForward } from 'lucide-react';
import { useState } from 'react';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

const NODES: GraphNode[] = [
  { id: 'A', label: 'A (Start)', x: 60, y: 120 },
  { id: 'B', label: 'B', x: 200, y: 60 },
  { id: 'C', label: 'C', x: 200, y: 180 },
  { id: 'D', label: 'D', x: 360, y: 60 },
  { id: 'E', label: 'E', x: 360, y: 180 },
  { id: 'F', label: 'F (Target)', x: 500, y: 120 },
];

const EDGES: Edge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'B', to: 'C', weight: 1 },
  { from: 'B', to: 'D', weight: 5 },
  { from: 'C', to: 'E', weight: 8 },
  { from: 'C', to: 'D', weight: 10 },
  { from: 'D', to: 'E', weight: 2 },
  { from: 'D', to: 'F', weight: 6 },
  { from: 'E', to: 'F', weight: 3 },
];

export function DijkstraGraphVisualizer() {
  const [step, setStep] = useState(0);
  const [distances, setDistances] = useState<Record<string, number>>({
    A: 0,
    B: 4,
    C: 2,
    D: 9,
    E: 10,
    F: 15,
  });
  const [visited, setVisited] = useState<string[]>(['A']);
  const [current, setCurrent] = useState<string>('A');

  const stepsInfo = [
    {
      curr: 'A',
      visited: ['A'],
      dist: { A: 0, B: 4, C: 2, D: Infinity, E: Infinity, F: Infinity },
      log: 'Initialize A with distance 0. Inspect neighbors B (4) and C (2).',
    },
    {
      curr: 'C',
      visited: ['A', 'C'],
      dist: { A: 0, B: 3, C: 2, D: 12, E: 10, F: Infinity },
      log: 'Visit C (smallest unvisited dist=2). Update B via C: min(4, 2+1=3). Update E: 2+8=10.',
    },
    {
      curr: 'B',
      visited: ['A', 'C', 'B'],
      dist: { A: 0, B: 3, C: 2, D: 8, E: 10, F: Infinity },
      log: 'Visit B (dist=3). Update D via B: min(12, 3+5=8).',
    },
    {
      curr: 'D',
      visited: ['A', 'C', 'B', 'D'],
      dist: { A: 0, B: 3, C: 2, D: 8, E: 10, F: 14 },
      log: 'Visit D (dist=8). Update F via D: min(inf, 8+6=14).',
    },
    {
      curr: 'E',
      visited: ['A', 'C', 'B', 'D', 'E'],
      dist: { A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 },
      log: 'Visit E (dist=10). Update F via E: min(14, 10+3=13).',
    },
    {
      curr: 'F',
      visited: ['A', 'C', 'B', 'D', 'E', 'F'],
      dist: { A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 },
      log: 'Target F reached! Shortest path A -> C -> B -> D -> E -> F calculated (Total Weight: 13).',
    },
  ];

  const handleNext = () => {
    if (step < stepsInfo.length - 1) {
      const nextStep = step + 1;
      const target = stepsInfo[nextStep];
      if (target) {
        setStep(nextStep);
        setCurrent(target.curr);
        setVisited(target.visited);
        setDistances(target.dist as Record<string, number>);
      }
    }
  };

  const handleReset = () => {
    setStep(0);
    setCurrent('A');
    setVisited(['A']);
    setDistances({ A: 0, B: 4, C: 2, D: Infinity, E: Infinity, F: Infinity });
  };

  const currentLog = stepsInfo[step]?.log || '';

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Dijkstra's Shortest Path Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Graph Algorithms — Priority Queue Greedy Exploration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="gap-1.5 text-xs text-black dark:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={step >= stepsInfo.length - 1}
              className="gap-1.5 text-xs"
            >
              <SkipForward className="h-3.5 w-3.5" /> Next Step
            </Button>
          </div>
        </div>

        {/* SVG Graph Canvas */}
        <div className="relative flex h-64 w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950">
          <svg className="h-full w-full">
            {EDGES.map((e, idx) => {
              const fromNode = NODES.find((n) => n.id === e.from) || NODES[0];
              const toNode = NODES.find((n) => n.id === e.to) || NODES[0];
              const fromX = fromNode?.x ?? 0;
              const fromY = fromNode?.y ?? 0;
              const toX = toNode?.x ?? 0;
              const toY = toNode?.y ?? 0;
              const isPath = visited.includes(e.from) && visited.includes(e.to);
              return (
                <g key={idx}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={isPath ? '#EC4899' : '#475569'}
                    strokeWidth={isPath ? 3 : 1.5}
                  />
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 6}
                    fill="#94A3B8"
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {e.weight}
                  </text>
                </g>
              );
            })}
            {NODES.map((n) => {
              const isCurr = n.id === current;
              const isVis = visited.includes(n.id);
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                  <circle
                    r="20"
                    fill={isCurr ? '#3B82F6' : isVis ? '#10B981' : '#1E293B'}
                    stroke={isCurr ? '#93C5FD' : isVis ? '#6EE7B7' : '#475569'}
                    strokeWidth="2"
                  />
                  <text textAnchor="middle" dy="4" fill="#FFFFFF" fontSize="12" fontWeight="bold">
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Distance Table */}
        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          {NODES.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border border-neutral-700 bg-neutral-800/80 p-2.5"
            >
              <div className="font-mono text-neutral-400">Node {n.id}</div>
              <div className="text-primary-300 mt-1 text-sm font-bold">
                {distances[n.id] === Infinity || distances[n.id] === undefined
                  ? '∞'
                  : distances[n.id]}
              </div>
            </div>
          ))}
        </div>

        {/* Execution Log */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
          Step {step + 1}/{stepsInfo.length}: {currentLog}
        </div>
      </CardContent>
    </Card>
  );
}
