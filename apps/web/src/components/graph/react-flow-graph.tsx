'use client';

import { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle,
  Position,
  type NodeProps,
  type Node as FlowNode,
  type Edge as FlowEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/cn';
import { FLOW_CONFIG, DEFAULT_EDGE_OPTIONS, NODE_TYPE_COLORS } from './flow-config';

// ── Custom Node ───────────────────────────────────────────────────

function KnowledgeNode({ data, selected }: NodeProps) {
  const color = NODE_TYPE_COLORS[data.nodeType] ?? 'var(--color-neutral-400)';
  const typeLabel = data.nodeType as string;

  return (
    <div
      className={cn(
        'group relative rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-all duration-200 dark:bg-neutral-900',
        selected
          ? 'border-primary-500 shadow-lg shadow-primary-500/20 dark:border-primary-400'
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
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight truncate max-w-[140px]">
            {data.label}
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 capitalize leading-tight">
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
  nodes: Array<{ id: string; title: string; node_type: string; slug: string }>;
  edges: Array<{ id: string; source_id: string; target_id: string; relationship_type: string }>;
  selectedNodeId: string | null;
  onNodeSelect: (id: string | null) => void;
}

// ── Internal Component (wrapped with ReactFlowProvider) ───────────

function ReactFlowGraphInner({
  nodes: rawNodes,
  edges: rawEdges,
  selectedNodeId,
  onNodeSelect,
}: ReactFlowGraphProps) {
  const flowNodes: FlowNode[] = useMemo(
    () =>
      rawNodes.map((node, index) => {
        const angle = (2 * Math.PI * index) / rawNodes.length;
        const radius = Math.min(rawNodes.length * 60, 400);
        return {
          id: node.id,
          type: 'knowledgeNode',
          position: {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          },
          data: {
            label: node.title,
            nodeType: node.node_type,
            slug: node.slug,
          },
          selected: node.id === selectedNodeId,
        };
      }),
    [rawNodes, selectedNodeId],
  );

  const flowEdges: FlowEdge[] = useMemo(
    () =>
      rawEdges.map((edge) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        type: 'smoothstep',
        animated: edge.relationship_type === 'prerequisite',
        style: {
          strokeWidth: 2,
          stroke: 'var(--color-neutral-300)',
          ...(edge.relationship_type === 'prerequisite' ? { strokeDasharray: '5 5' } : {}),
        },
      })),
    [rawEdges],
  );

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
      <Background
        color="var(--color-neutral-200)"
        gap={24}
        size={1}
        className="dark:opacity-30"
      />
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
