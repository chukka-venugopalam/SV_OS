/**
 * Graph state store — Zustand store for graph UI state.
 *
 * Manages selected nodes, edges, viewport, and graph exploration state.
 */

'use client';

import { create } from 'zustand';

import type { GraphNode, GraphEdge } from '@/lib/graph-client';

export interface GraphViewState {
  /** Currently selected node ID */
  selectedNodeId: string | null;
  /** Currently selected edge ID */
  selectedEdgeId: string | null;
  /** Hovered node ID */
  hoveredNodeId: string | null;
  /** Focused (center of viewport) node ID */
  focusedNodeId: string | null;
  /** Currently visible nodes in the viewport */
  visibleNodes: GraphNode[];
  /** Currently visible edges in the viewport */
  visibleEdges: GraphEdge[];
  /** Search query filter */
  searchQuery: string;
  /** Active node type filter */
  nodeTypeFilter: string | null;
  /** Whether the graph is loading */
  isGraphLoading: boolean;
  /** Selected difficulty filter */
  difficultyFilter: string | null;

  // Actions
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  focusNode: (nodeId: string | null) => void;
  setVisibleNodes: (nodes: GraphNode[]) => void;
  setVisibleEdges: (edges: GraphEdge[]) => void;
  setSearchQuery: (query: string) => void;
  setNodeTypeFilter: (nodeType: string | null) => void;
  setDifficultyFilter: (difficulty: string | null) => void;
  setGraphLoading: (loading: boolean) => void;
  clearSelection: () => void;
  resetView: () => void;
}

export const useGraphStore = create<GraphViewState>((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  hoveredNodeId: null,
  focusedNodeId: null,
  visibleNodes: [],
  visibleEdges: [],
  searchQuery: '',
  nodeTypeFilter: null,
  isGraphLoading: false,
  difficultyFilter: null,

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId }),
  hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),
  focusNode: (nodeId) => set({ focusedNodeId: nodeId }),
  setVisibleNodes: (nodes) => set({ visibleNodes: nodes }),
  setVisibleEdges: (edges) => set({ visibleEdges: edges }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setNodeTypeFilter: (nodeType) => set({ nodeTypeFilter: nodeType }),
  setDifficultyFilter: (difficulty) => set({ difficultyFilter: difficulty }),
  setGraphLoading: (loading) => set({ isGraphLoading: loading }),

  clearSelection: () =>
    set({
      selectedNodeId: null,
      selectedEdgeId: null,
      hoveredNodeId: null,
    }),

  resetView: () =>
    set({
      focusedNodeId: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      hoveredNodeId: null,
      searchQuery: '',
      nodeTypeFilter: null,
      difficultyFilter: null,
    }),
}));
