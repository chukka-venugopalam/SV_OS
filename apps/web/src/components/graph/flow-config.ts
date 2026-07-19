import { MarkerType, type ConnectionLineType, type DefaultEdgeOptions } from 'reactflow';

export const FLOW_CONFIG = {
  /** Default viewport when graph loads */
  defaultViewport: { x: 0, y: 0, zoom: 1.5 },
  /** Minimum zoom level */
  minZoom: 0.1,
  /** Maximum zoom level */
  maxZoom: 4,
  /** Snap to grid */
  snapToGrid: false,
  /** Grid spacing in px */
  snapGrid: [20, 20] as [number, number],
  /** Connection line type */
  connectionLineType: 'smoothstep' as ConnectionLineType,
  /** Whether nodes are draggable */
  nodesDraggable: true,
  /** Whether nodes are connectable */
  nodesConnectable: false,
  /** Whether nodes are focusable */
  elementsSelectable: true,
  /** Fit view on init */
  fitView: true,
  /** Padding for fit view */
  fitViewPadding: 0.2,
} as const;

export const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: {
    strokeWidth: 2,
    stroke: 'var(--color-neutral-300)',
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: 'var(--color-neutral-400)',
  },
};

export const NODE_TYPE_COLORS: Record<string, string> = {
  subject: 'var(--color-graph-subject)',
  concept: 'var(--color-graph-concept)',
  technology: 'var(--color-graph-technology)',
  tool: 'var(--color-graph-tool)',
  career: 'var(--color-graph-career)',
  project: 'var(--color-graph-project)',
};

/** Graph layout strategies */
export type GraphLayout = 'force' | 'hierarchical' | 'radial' | 'dependency-tree';

export const GRAPH_LAYOUTS: Array<{ value: GraphLayout; label: string; description: string }> = [
  { value: 'force', label: 'Force-Directed', description: 'Natural cluster-based layout' },
  { value: 'hierarchical', label: 'Hierarchical', description: 'Top-down dependency tree' },
  { value: 'radial', label: 'Radial', description: 'Concentric rings around center' },
  { value: 'dependency-tree', label: 'Dependency Tree', description: 'Prerequisite chain view' },
];

/** Custom node types to register with React Flow */
export const CUSTOM_NODE_TYPES = {
  // Will be populated when custom nodes are implemented
} as const;

/** Custom edge types to register with React Flow */
export const CUSTOM_EDGE_TYPES = {
  // Will be populated when custom edges are implemented
} as const;
