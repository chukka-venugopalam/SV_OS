'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@sv-os/ui';
import { Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const NODES: GraphNode[] = [
  { id: 'A', label: 'A', x: 120, y: 30 },
  { id: 'B', label: 'B', x: 60, y: 90 },
  { id: 'C', label: 'C', x: 180, y: 90 },
  { id: 'D', label: 'D', x: 30, y: 150 },
  { id: 'E', label: 'E', x: 90, y: 150 },
  { id: 'F', label: 'F', x: 150, y: 150 },
  { id: 'G', label: 'G', x: 210, y: 150 },
];

const EDGES: GraphEdge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'B', to: 'E' },
  { from: 'C', to: 'F' },
  { from: 'C', to: 'G' },
];

const BFS_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const DFS_ORDER = ['A', 'B', 'D', 'E', 'C', 'F', 'G'];

export function GraphTraversalVisualizer() {
  const [mode, setMode] = useState<'BFS' | 'DFS'>('BFS');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [visited, setVisited] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const targetOrder = mode === 'BFS' ? BFS_ORDER : DFS_ORDER;

  const handleStep = () => {
    if (stepIndex >= targetOrder.length) return;
    const nextNode = targetOrder[stepIndex];
    if (!nextNode) return;
    setActiveNode(nextNode);
    setVisited((prev) => (prev.includes(nextNode) ? prev : [...prev, nextNode]));
    setStepIndex((prev) => prev + 1);
  };

  const handleReset = () => {
    setStepIndex(0);
    setVisited([]);
    setActiveNode(null);
  };

  return (
    <Card className="border-info-200 bg-white/90 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              ⚡ Interactive Simulator: Graph Traversal Visualizer
            </CardTitle>
            <Badge variant="secondary" size="sm">
              Tree & Graph Traversals (BFS / DFS)
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'BFS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('BFS');
                handleReset();
              }}
            >
              BFS (Breadth-First)
            </Button>
            <Button
              variant={mode === 'DFS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('DFS');
                handleReset();
              }}
            >
              DFS (Depth-First)
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Graph Visualizer Canvas */}
          <div className="relative flex h-52 items-center justify-center rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
            <svg className="h-full w-full max-w-[260px]">
              {/* Edges */}
              {EDGES.map((edge, idx) => {
                const fromNode = NODES.find((n) => n.id === edge.from)!;
                const toNode = NODES.find((n) => n.id === edge.to)!;
                const isTraversed = visited.includes(edge.from) && visited.includes(edge.to);
                return (
                  <line
                    key={idx}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isTraversed ? '#3B82F6' : '#CBD5E1'}
                    strokeWidth={isTraversed ? 3 : 2}
                  />
                );
              })}

              {/* Nodes */}
              {NODES.map((node) => {
                const isVisited = visited.includes(node.id);
                const isActive = activeNode === node.id;

                let fill = '#FFFFFF';
                let stroke = '#94A3B8';
                let textColor = '#0F172A';

                if (isActive) {
                  fill = '#F59E0B';
                  stroke = '#D97706';
                  textColor = '#FFFFFF';
                } else if (isVisited) {
                  fill = '#3B82F6';
                  stroke = '#2563EB';
                  textColor = '#FFFFFF';
                }

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={16}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={2}
                      className="transition-all duration-300"
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Execution State & Queue/Stack Inspector */}
          <div className="flex flex-col justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {mode === 'BFS' ? 'Queue State (FIFO)' : 'Stack State (LIFO)'}
              </h4>

              <div className="mb-4 flex min-h-[36px] flex-wrap items-center gap-1.5 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                {visited.length === 0 ? (
                  <span className="text-xs text-neutral-400">Click Step to start traversal</span>
                ) : (
                  visited.map((n, idx) => (
                    <Badge key={idx} variant={n === activeNode ? 'warning' : 'default'} size="sm">
                      {n}
                    </Badge>
                  ))
                )}
              </div>

              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold">Visit Order: </span>
                <span className="font-mono">{visited.join(' ➔ ') || 'None'}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleStep}
                disabled={stepIndex >= targetOrder.length}
                className="gap-1.5"
              >
                <Play className="h-4 w-4" />
                {stepIndex >= targetOrder.length ? 'Completed' : 'Step Next Node'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
