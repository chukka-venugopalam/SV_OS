'use client';

import { Badge, Button, Card, CardContent, LoadingState } from '@sv-os/ui';
import { ArrowLeft, Compass, Minimize2, BookOpen, Layers, ExternalLink } from 'lucide-react';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { useGraphExplore, useGraphStats } from '@/hooks/use-graph';
import { useNodePrerequisites, useRelatedNodes } from '@/hooks/use-knowledge';
import { useGraph } from '@/providers/graph-provider';

export const dynamic = 'force-dynamic';

// Dynamically import React Flow to avoid SSR issues
const ReactFlowGraph = dynamicImport(() => import('@/components/graph/react-flow-graph'), {
  ssr: false,
  loading: () => <LoadingState message="Loading graph..." />,
});

export default function GraphPage() {
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const { selectedNodeId, setSelectedNodeId } = useGraph();

  // Fetch graph data — full graph or centered on a node
  const {
    data: graphData,
    isLoading,
    isError,
    refetch,
  } = useGraphExplore(centerNodeId ? { center_node_id: centerNodeId, depth: 2 } : undefined);

  const { data: stats } = useGraphStats();

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

  // Selected node + its details
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const { data: prerequisites } = useNodePrerequisites(selectedNode?.slug ?? '');
  const { data: relatedRaw } = useRelatedNodes(selectedNode?.slug ?? '');

  // Flatten related nodes — the API returns a flat array of KnowledgeNode[]
  const relatedNodes = useMemo(() => {
    return relatedRaw ?? [];
  }, [relatedRaw]);

  const handleNodeSelect = useCallback(
    (id: string | null) => {
      setSelectedNodeId(id);
    },
    [setSelectedNodeId],
  );

  const handleCenterNode = useCallback(
    (id: string) => {
      setCenterNodeId(id);
      setSelectedNodeId(id);
    },
    [setSelectedNodeId],
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

        {/* Stats */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <span>{stats?.total_nodes ?? nodes.length} nodes</span>
          <span>·</span>
          <span>{stats?.total_edges ?? edges.length} connections</span>
          {centerNodeId && (
            <>
              <span>·</span>
              <button
                onClick={() => {
                  setCenterNodeId(null);
                  setSelectedNodeId(null);
                }}
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
              >
                Show all
              </button>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Node type badges */}
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
              onNodeSelect={handleNodeSelect}
            />
          </div>
        )}

        {/* Node Detail Panel */}
        {selectedNode && (
          <div className="animate-slide-up absolute right-4 top-4 z-10 max-h-[calc(100vh-8rem)] w-80 overflow-y-auto">
            <Card className="shadow-xl">
              <CardContent className="p-4">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1 capitalize"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          NODE_TYPE_COLORS[selectedNode.node_type] ?? 'var(--color-neutral-400)',
                      }}
                    />
                    {selectedNode.node_type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCenterNode(selectedNode.id)}
                      className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                      aria-label="Center graph on this node"
                      title="Center graph on this node"
                    >
                      <Compass className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                      aria-label="Close panel"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedNode.title}
                </h3>
                <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {selectedNode.description}
                </p>

                {/* Meta badges */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="info" size="sm">
                    {selectedNode.difficulty}
                  </Badge>
                  {(selectedNode.metadata?.estimated_minutes as number | undefined) && (
                    <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {selectedNode.metadata?.estimated_minutes as number} min
                    </Badge>
                  )}
                </div>

                {/* Prerequisites */}
                {prerequisites && prerequisites.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      <Layers className="h-3 w-3" />
                      Prerequisites
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {prerequisites.slice(0, 5).map((p) => (
                        <Link
                          key={p.id}
                          href={`/explore/${p.slug}`}
                          className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          {p.title}
                        </Link>
                      ))}
                      {prerequisites.length > 5 && (
                        <span className="text-[11px] text-neutral-400">
                          +{prerequisites.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Related nodes */}
                {relatedNodes && relatedNodes.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Related
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {relatedNodes.slice(0, 4).map((n) => (
                        <Link
                          key={n.id}
                          href={`/explore/${n.slug}`}
                          className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          {n.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/explore/${selectedNode.slug}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleCenterNode(selectedNode.id)}
                  >
                    <Compass className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
