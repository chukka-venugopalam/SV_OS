/**
 * Graph API client — Graph Platform capability-based queries.
 *
 * All requests go through the /api/v1/graph-platform/* endpoints.
 */

import { apiClient } from './api-client';

export interface GraphStatistics {
  node_count: number;
  edge_count: number;
  type_counts: Record<string, number>;
  relationship_counts: Record<string, number>;
  density: number;
  avg_degree: number;
  graph_version: string;
  graph_name: string;
  is_loaded: boolean;
}

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  node_type: string;
  difficulty: string;
  description: string;
  metadata: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  weight: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ShortestPathResult {
  path: Array<{ node_id: string; edge: GraphEdge; from_id: string }>;
  found: boolean;
  steps: number;
  source: string;
  target: string;
  algorithm: string;
}

export interface ValidationResult {
  valid: boolean;
  report: {
    id: string;
    passed: boolean;
    errors: Array<Record<string, unknown>>;
    warnings: string[];
    summary: Record<string, unknown>;
  };
}

export interface SearchResult {
  items: GraphNode[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  query: string;
  mode: string;
}

export interface CacheStats {
  stats: Record<
    string,
    { hits: number; misses: number; hit_rate: number; size: number; invalidations: number }
  >;
  total_size: number;
  graph_version: number;
}

export const graphClient = {
  /** Get comprehensive graph statistics */
  getStatistics: () => apiClient.get<GraphStatistics>('/graph-platform/statistics'),

  /** Get a single node by ID */
  getNode: (nodeId: string) => apiClient.get<GraphNode>(`/graph-platform/node/${nodeId}`),

  /** Get a single edge by ID */
  getEdge: (edgeId: string) => apiClient.get<GraphEdge>(`/graph-platform/edge/${edgeId}`),

  /** Find the shortest path between two nodes */
  findShortestPath: (sourceId: string, targetId: string, maxDepth = 10) =>
    apiClient.post<ShortestPathResult>('/graph-platform/query/shortest-path', {
      source_id: sourceId,
      target_id: targetId,
      max_depth: maxDepth,
    }),

  /** Get the prerequisite chain for a node */
  findDependencyChain: (nodeId: string, maxDepth = 5) =>
    apiClient.post('/graph-platform/query/dependency-chain', {
      node_id: nodeId,
      max_depth: maxDepth,
    }),

  /** Get the reverse dependency chain */
  findReverseChain: (nodeId: string, maxDepth = 5) =>
    apiClient.post('/graph-platform/query/reverse-chain', {
      node_id: nodeId,
      max_depth: maxDepth,
    }),

  /** Find related nodes */
  findRelatedNodes: (nodeId: string, relationshipType?: string, maxDepth = 2) =>
    apiClient.post('/graph-platform/query/related', {
      node_id: nodeId,
      relationship_type: relationshipType,
      max_depth: maxDepth,
    }),

  /** Find common neighbor nodes of two nodes */
  findCommonNodes: (nodeIdA: string, nodeIdB: string, maxDepth = 3) =>
    apiClient.post('/graph-platform/query/common', {
      node_id_a: nodeIdA,
      node_id_b: nodeIdB,
      max_depth: maxDepth,
    }),

  /** Extract a subgraph around a center node */
  findSubgraph: (centerNodeId: string, depth = 2, relationshipType?: string) =>
    apiClient.post('/graph-platform/query/subgraph', {
      center_node_id: centerNodeId,
      depth,
      relationship_type: relationshipType,
    }),

  /** Validate graph structure */
  validateGraph: (data: Record<string, unknown>) =>
    apiClient.post<ValidationResult>('/graph-platform/query/validate', data),

  /** Search nodes */
  search: (query: string, page = 1, perPage = 20) =>
    apiClient.post<SearchResult>('/graph-platform/query/search', {
      query,
      page,
      per_page: perPage,
    }),

  /** Get cache statistics */
  getCacheStats: () => apiClient.get<CacheStats>('/graph-platform/cache/stats'),

  /** Get learning bottlenecks */
  getBottlenecks: (limit = 10) =>
    apiClient.get('/graph-platform/analytics/bottlenecks', {
      params: { limit },
    }),

  /** Get orphan nodes */
  getOrphanNodes: () => apiClient.get('/graph-platform/analytics/orphans'),

  /** Detect cycles */
  getCycles: () => apiClient.get('/graph-platform/analytics/cycles'),
};
