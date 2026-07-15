/**
 * Graph API service.
 *
 * Provides functions for interacting with the knowledge graph endpoints.
 * All functions return typed responses via the shared API client.
 */

import type { GraphSubgraph, KnowledgeNode, KnowledgeEdge } from '@sv-os/types';

import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────

export interface GraphExploreParams {
  center_node_id?: string;
  depth?: number;
  node_types?: string[];
}

export interface GraphPathParams {
  source_id: string;
  target_id: string;
  max_depth?: number;
}

export interface GraphStats {
  total_nodes: number;
  total_edges: number;
  node_type_counts: Record<string, number>;
  edge_type_counts: Record<string, number>;
}

export interface FullGraphResponse {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  total_nodes: number;
  total_edges: number;
}

// ── Service ───────────────────────────────────────────────────────

export const graphService = {
  /** Get the full graph (all published nodes and edges) */
  getFullGraph(): Promise<FullGraphResponse> {
    return apiClient.get<FullGraphResponse>('/graph/full').then((res) => res.data!);
  },

  /** Explore the graph around a center node or retrieve the full graph */
  explore(params?: GraphExploreParams): Promise<GraphSubgraph> {
    if (params?.center_node_id) {
      // Get subgraph around a specific node
      return apiClient
        .get<GraphSubgraph>(`/graph/subgraph`, {
          params: {
            node_id: params.center_node_id,
            depth: params.depth ?? 2,
          } as Record<string, string | number | boolean | undefined>,
        })
        .then((res) => res.data!);
    }
    // Fall back to full graph — transform to match GraphSubgraph shape
    return this.getFullGraph().then((full) => ({
      nodes: full.nodes,
      edges: full.edges,
      center_node_id: '',
      depth: 0,
    }));
  },

  /** Find the shortest path between two nodes */
  findPath(params: GraphPathParams): Promise<{ path: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    return apiClient
      .get<{ path: KnowledgeNode[]; edges: KnowledgeEdge[] }>('/graph/path', {
        params: params as unknown as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },

  /** Get graph statistics */
  getStats(): Promise<GraphStats> {
    return apiClient.get<GraphStats>('/graph/statistics').then((res) => res.data!);
  },

  /** Get the prerequisite chain for a node */
  getPrerequisiteChain(
    nodeId: string,
  ): Promise<{ levels: Record<string, unknown>[]; depth: number }> {
    return apiClient
      .get<{ levels: Record<string, unknown>[]; depth: number }>(`/graph/prerequisites`, {
        params: { node_id: nodeId } as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },
};
