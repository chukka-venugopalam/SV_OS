'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@sv-os/ui';
import { Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { TopoSortMode, MstMode } from './graph-algorithms-extension';

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

export type GraphMode = 'BFS' | 'DFS' | 'topo' | 'mst';

export function GraphTraversalVisualizer({ initialMode = 'BFS' }: { initialMode?: GraphMode }) {
  const [mode, setMode] = useState<GraphMode>(initialMode);
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

  const handleModeChange = (newMode: GraphMode) => {
    setMode(newMode);
    handleReset();
  };

  return (
    <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <CardTitle className="text-lg">Graph Algorithms Visualizer</CardTitle>
          <p className="mt-1 text-xs text-neutral-500">
            Interactive step-by-step traversal, topological sorting, and spanning tree algorithms
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={mode === 'BFS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('BFS')}
            className="text-xs"
          >
            BFS
          </Button>
          <Button
            variant={mode === 'DFS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('DFS')}
            className="text-xs"
          >
            DFS
          </Button>
          <Button
            variant={mode === 'topo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('topo')}
            className="text-xs"
          >
            Topological Sort
          </Button>
          <Button
            variant={mode === 'mst' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('mst')}
            className="text-xs"
          >
            MST
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {mode === 'BFS' || mode === 'DFS' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* SVG Graph Canvas */}
            <div className="flex h-64 items-center justify-center rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
              <svg viewBox="0 0 240 180" className="h-full w-full max-w-[300px]">
                {/* Draw Edges */}
                {EDGES.map((edge, idx) => {
                  const fromNode = NODES.find((n) => n.id === edge.from);
                  const toNode = NODES.find((n) => n.id === edge.to);
                  if (!fromNode || !toNode) return null;
                  return (
                    <line
                      key={idx}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="var(--color-neutral-300, #d4d4d4)"
                      strokeWidth={2}
                    />
                  );
                })}

                {/* Draw Nodes */}
                {NODES.map((node) => {
                  const isVisited = visited.includes(node.id);
                  const isActive = activeNode === node.id;

                  let fillColor = '#ffffff';
                  let strokeColor = '#a3a3a3';
                  let textColor = '#171717';

                  if (isActive) {
                    fillColor = '#f59e0b';
                    strokeColor = '#d97706';
                    textColor = '#ffffff';
                  } else if (isVisited) {
                    fillColor = '#10b981';
                    strokeColor = '#059669';
                    textColor = '#ffffff';
                  }

                  return (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={16}
                        fill={fillColor}
                        stroke={strokeColor}
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
        ) : (
          <div className="rounded-lg bg-[#FAF7F0] p-6 text-neutral-900">
            {mode === 'topo' && <TopoSortMode />}
            {mode === 'mst' && <MstMode />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GraphTraversalVisualizer;
