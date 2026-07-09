'use client';

import { Badge, Button, Card, CardContent, LoadingState } from '@sv-os/ui';
import { ArrowLeft, Minimize2 } from 'lucide-react';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { useGraphExplore, useGraphStats } from '@/hooks/use-graph';
import { useGraph } from '@/providers/graph-provider';

export const dynamic = 'force-dynamic';


// Dynamically import React Flow to avoid SSR issues
const ReactFlowGraph = dynamicImport(() => import('@/components/graph/react-flow-graph'), {
  ssr: false,
  loading: () => <LoadingState message="Loading graph..." />,
});

export const dynamicParams = true;

export default function GraphPage() {
  const { data: graphData, isLoading, isError, refetch } = useGraphExplore({ depth: 2 });
  const { data: stats } = useGraphStats();
  const { selectedNodeId, setSelectedNodeId } = useGraph();

  const nodes = useMemo(() => graphData?.nodes ?? [], [graphData]);
  const edges = useMemo(() => graphData?.edges ?? [], [graphData]);

  // Count node types
  const nodeTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const node of nodes) {
      counts[node.node_type] = (counts[node.node_type] ?? 0) + 1;
    }
    return counts;
  }, [nodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white/80 px-4 py-2 backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-950/80">
        <Link
          href="/explore"
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Knowledge Graph
        </span>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <span>{nodes.length} nodes</span>
          <span>·</span>
          <span>{edges.length} connections</span>
        </div>

        <div className="flex-1" />

        <div className="hidden items-center gap-1 sm:flex">
          {Object.entries(nodeTypeCounts)
            .slice(0, 5)
            .map(([type, count]) => (
              <Badge
                key={type}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1 capitalize"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: NODE_TYPE_COLORS[type] ?? 'var(--color-neutral-400)' }}
                />
                {type} {count}
              </Badge>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-1">
        {/* Graph Area */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingState message="Loading graph data..." />
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-error-600 dark:text-error-400 text-sm">Failed to load graph</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex-1">
            <ReactFlowGraph
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
            />
          </div>
        )}

        {/* Node Detail Panel */}
        {selectedNode && (
          <div className="animate-slide-up absolute right-4 top-4 z-10 w-72">
            <Card className="shadow-xl">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Badge variant="secondary" size="sm" className="capitalize">
                    {selectedNode.node_type}
                  </Badge>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    aria-label="Close panel"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedNode.title}
                </h3>
                <p className="mb-3 line-clamp-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedNode.description}
                </p>

                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {selectedNode.difficulty}
                  </Badge>
                </div>

                <Link href={`/explore/${selectedNode.slug}`}>
                  <Button variant="default" size="sm" className="w-full">
                    View details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
