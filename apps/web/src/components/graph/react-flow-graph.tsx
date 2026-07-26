'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Handle,
  Position,
  type NodeProps,
  type Node as FlowNode,
  type Edge as FlowEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { FLOW_CONFIG, DEFAULT_EDGE_OPTIONS, NODE_TYPE_COLORS } from './flow-config';

import { cn } from '@/lib/cn';

// ── Custom Node ───────────────────────────────────────────────────

function KnowledgeNode({ data, selected }: NodeProps) {
  const color = NODE_TYPE_COLORS[data.nodeType] ?? 'var(--color-neutral-400)';
  const typeLabel = data.nodeType as string;

  return (
    <div
      className={cn(
        'group relative rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-all duration-200 dark:bg-neutral-900',
        selected
          ? 'border-primary-500 shadow-primary-500/20 dark:border-primary-400 shadow-lg'
          : 'border-neutral-200 hover:shadow-md dark:border-neutral-700',
      )}
      style={{ borderColor: selected ? undefined : `${color}40` }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!border-2 !border-neutral-300 !bg-white dark:!border-neutral-600 dark:!bg-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!border-2 !border-neutral-300 !bg-white dark:!border-neutral-600 dark:!bg-neutral-900"
      />

      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {data.label?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="max-w-[140px] truncate text-sm font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
            {data.label}
          </p>
          <p className="text-[10px] capitalize leading-tight text-neutral-400 dark:text-neutral-500">
            {typeLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { knowledgeNode: KnowledgeNode };

// ── Props ─────────────────────────────────────────────────────────

interface ReactFlowGraphProps {
  nodes: Array<{
    id: string;
    title: string;
    node_type: string;
    slug: string;
    depth?: number;
    domain?: string;
  }>;
  edges: Array<{
    id: string;
    source_id: string;
    target_id: string;
    relationship_type: string;
    edge_type?: string;
  }>;
  selectedNodeId: string | null;
  showCrossDomainOnly?: boolean;
  onNodeSelect: (id: string | null) => void;
}

// ── Internal Component (wrapped with ReactFlowProvider) ───────────

function ReactFlowGraphInner({
  nodes: rawNodes,
  edges: rawEdges,
  selectedNodeId,
  showCrossDomainOnly = false,
  onNodeSelect,
}: ReactFlowGraphProps) {
  // Group nodes by depth for topological depth layout
  const flowNodes: FlowNode[] = useMemo(() => {
    const depthGroups: Record<number, typeof rawNodes> = {};
    for (const node of rawNodes) {
      const d = node.depth ?? 0;
      if (!depthGroups[d]) depthGroups[d] = [];
      depthGroups[d].push(node);
    }

    return rawNodes.map((node) => {
      const d = node.depth ?? 0;
      const nodesAtDepth = depthGroups[d] ?? [node];
      const indexInDepth = nodesAtDepth.findIndex((n) => n.id === node.id);
      const totalAtDepth = nodesAtDepth.length;

      // Topological depth position: X = depth * 280, Y = centered vertical offset
      const x = d * 280;
      const y = (indexInDepth - (totalAtDepth - 1) / 2) * 110;

      return {
        id: node.id,
        type: 'knowledgeNode',
        position: { x, y },
        data: {
          label: node.title,
          nodeType: node.node_type,
          slug: node.slug,
          domain: node.domain,
          depth: d,
        },
        selected: node.id === selectedNodeId,
      };
    });
  }, [rawNodes, selectedNodeId]);

  // Filter edges and style prerequisite vs cross-domain differently
  const flowEdges: FlowEdge[] = useMemo(() => {
    const filtered = showCrossDomainOnly
      ? rawEdges.filter(
          (e) => e.relationship_type === 'cross_domain' || e.edge_type === 'cross_domain',
        )
      : rawEdges;

    return filtered.map((edge) => {
      const isCrossDomain =
        edge.relationship_type === 'cross_domain' || edge.edge_type === 'cross_domain';

      return {
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        type: 'smoothstep',
        animated: isCrossDomain,
        style: isCrossDomain
          ? {
              strokeWidth: 2.5,
              stroke: '#EC4899',
              strokeDasharray: '6 4',
            }
          : {
              strokeWidth: 2,
              stroke: '#94A3B8',
            },
      };
    });
  }, [rawEdges, showCrossDomainOnly]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      onNodeSelect(node.id === selectedNodeId ? null : node.id);
    },
    [onNodeSelect, selectedNodeId],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      defaultViewport={FLOW_CONFIG.defaultViewport}
      minZoom={FLOW_CONFIG.minZoom}
      maxZoom={FLOW_CONFIG.maxZoom}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      nodesDraggable={false}
      attributionPosition="bottom-left"
      className="bg-neutral-50 dark:bg-neutral-950"
    >
      <Background color="var(--color-neutral-200)" gap={24} size={1} className="dark:opacity-30" />
      <Controls
        className="!rounded-lg !border !border-neutral-200 !bg-white !shadow-md dark:!border-neutral-700 dark:!bg-neutral-900"
        showInteractive={false}
      />
      <MiniMap
        nodeStrokeColor="var(--color-neutral-300)"
        nodeColor={(node) => NODE_TYPE_COLORS[node.data?.nodeType] ?? 'var(--color-neutral-400)'}
        maskColor="rgba(0,0,0,0.1)"
        className="!rounded-lg !border !border-neutral-200 dark:!border-neutral-700"
        style={{ width: 120, height: 80 }}
      />
    </ReactFlow>
  );
}

// ── Exported Component (with provider) ────────────────────────────

export default function ReactFlowGraph(props: ReactFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
