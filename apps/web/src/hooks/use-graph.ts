/**
 * Graph hooks — React hooks for Graph Platform queries.
 *
 * Provides TanStack Query hooks for all graph operations.
 */

'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import { graphClient } from '@/lib/graph-client';

export function useGraphStatistics() {
  return useQuery({
    queryKey: ['graph', 'statistics'],
    queryFn: async () => {
      const response = await graphClient.getStatistics();
      return response.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useGraphNode(nodeId: string | null) {
  return useQuery({
    queryKey: ['graph', 'node', nodeId],
    queryFn: async () => {
      if (!nodeId) return null;
      const response = await graphClient.getNode(nodeId);
      return response.data;
    },
    enabled: !!nodeId,
    staleTime: 60_000,
  });
}

export function useGraphEdge(edgeId: string | null) {
  return useQuery({
    queryKey: ['graph', 'edge', edgeId],
    queryFn: async () => {
      if (!edgeId) return null;
      const response = await graphClient.getEdge(edgeId);
      return response.data;
    },
    enabled: !!edgeId,
    staleTime: 60_000,
  });
}

export function useShortestPath(sourceId: string | null, targetId: string | null) {
  return useQuery({
    queryKey: ['graph', 'shortest-path', sourceId, targetId],
    queryFn: async () => {
      if (!sourceId || !targetId) return null;
      const response = await graphClient.findShortestPath(sourceId, targetId);
      return response.data;
    },
    enabled: !!sourceId && !!targetId,
    staleTime: 120_000,
  });
}

export function useDependencyChain(nodeId: string | null) {
  return useQuery({
    queryKey: ['graph', 'dependency-chain', nodeId],
    queryFn: async () => {
      if (!nodeId) return null;
      const response = await graphClient.findDependencyChain(nodeId);
      return response.data;
    },
    enabled: !!nodeId,
    staleTime: 120_000,
  });
}

export function useReverseChain(nodeId: string | null) {
  return useQuery({
    queryKey: ['graph', 'reverse-chain', nodeId],
    queryFn: async () => {
      if (!nodeId) return null;
      const response = await graphClient.findReverseChain(nodeId);
      return response.data;
    },
    enabled: !!nodeId,
    staleTime: 120_000,
  });
}

export function useRelatedNodes(nodeId: string | null, relationshipType?: string) {
  return useQuery({
    queryKey: ['graph', 'related', nodeId, relationshipType],
    queryFn: async () => {
      if (!nodeId) return null;
      const response = await graphClient.findRelatedNodes(nodeId, relationshipType);
      return response.data;
    },
    enabled: !!nodeId,
    staleTime: 60_000,
  });
}

export function useSubgraph(centerNodeId: string | null, depth = 2) {
  return useQuery({
    queryKey: ['graph', 'subgraph', centerNodeId, depth],
    queryFn: async () => {
      if (!centerNodeId) return null;
      const response = await graphClient.findSubgraph(centerNodeId, depth);
      return response.data;
    },
    enabled: !!centerNodeId,
    staleTime: 60_000,
  });
}

export function useGraphValidation() {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await graphClient.validateGraph(data);
      return response.data;
    },
  });
}

export function useGraphSearch() {
  return useMutation({
    mutationFn: async ({
      query,
      page,
      perPage,
    }: {
      query: string;
      page?: number;
      perPage?: number;
    }) => {
      const response = await graphClient.search(query, page, perPage);
      return response.data;
    },
  });
}

export function useCacheStats() {
  return useQuery({
    queryKey: ['graph', 'cache', 'stats'],
    queryFn: async () => {
      const response = await graphClient.getCacheStats();
      return response.data;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function useBottlenecks(limit = 10) {
  return useQuery({
    queryKey: ['graph', 'bottlenecks', limit],
    queryFn: async () => {
      const response = await graphClient.getBottlenecks(limit);
      return response.data;
    },
    staleTime: 120_000,
  });
}

export function useOrphanNodes() {
  return useQuery({
    queryKey: ['graph', 'orphans'],
    queryFn: async () => {
      const response = await graphClient.getOrphanNodes();
      return response.data;
    },
    staleTime: 120_000,
  });
}

export function useCycles() {
  return useQuery({
    queryKey: ['graph', 'cycles'],
    queryFn: async () => {
      const response = await graphClient.getCycles();
      return response.data;
    },
    staleTime: 120_000,
  });
}
