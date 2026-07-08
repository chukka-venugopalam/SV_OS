/**
 * Graph API service.
 *
 * Provides functions for interacting with the knowledge graph endpoints.
 * All functions return typed responses via the shared API client.
 */

import { apiClient } from '@/lib/api-client';
import type {
  GraphSubgraph,
  KnowledgeNode,
  KnowledgeEdge,
} from '@sv-os/types';
import type { PaginatedResponse } from '@sv-os/types';

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

// ── Service ───────────────────────────────────────────────────────

export const graphService = {
  /** Explore the graph around a center node or retrieve the full graph */
  explore(params?: GraphExploreParams): Promise<GraphSubgraph> {
    return apiClient
      .get<GraphSubgraph>('/graph/explore', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Find the shortest path between two nodes */
  findPath(params: GraphPathParams): Promise<{ path: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    return apiClient
      .get<{ path: KnowledgeNode[]; edges: KnowledgeEdge[] }>('/graph/path', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Get graph statistics */
  getStats(): Promise<GraphStats> {
    return apiClient.get<GraphStats>('/graph/stats').then((res) => res.data!);
  },

  /** Get the prerequisite chain for a node */
  getPrerequisiteChain(nodeSlug: string): Promise<{ chain: KnowledgeNode[] }> {
    return apiClient
      .get<{ chain: KnowledgeNode[] }>(`/graph/${nodeSlug}/prerequisites`)
      .then((res) => res.data!);
  },
};
