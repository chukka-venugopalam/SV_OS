/**
 * React Query hooks for the knowledge graph.
 *
 * Provides hooks for graph exploration, path finding, stats,
 * and prerequisite chains.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { graphService, type GraphExploreParams, type GraphPathParams } from '@/services/graph';

// ── Query Key Factory ─────────────────────────────────────────────

export const graphKeys = {
  all: ['graph'] as const,
  explore: (params?: GraphExploreParams) => [...graphKeys.all, 'explore', params] as const,
  path: (params: GraphPathParams) => [...graphKeys.all, 'path', params] as const,
  stats: () => [...graphKeys.all, 'stats'] as const,
  prerequisiteChain: (slug: string) => [...graphKeys.all, 'prerequisites', slug] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Explore the knowledge graph around a center node */
export function useGraphExplore(params?: GraphExploreParams) {
  return useQuery({
    queryKey: graphKeys.explore(params),
    queryFn: () => graphService.explore(params),
    staleTime: 5 * 60 * 1000,
  });
}

/** Find the shortest path between two nodes */
export function useGraphPath(params: GraphPathParams) {
  return useQuery({
    queryKey: graphKeys.path(params),
    queryFn: () => graphService.findPath(params),
    enabled: !!params.source_id && !!params.target_id,
    staleTime: 30 * 60 * 1000,
  });
}

/** Get graph statistics */
export function useGraphStats() {
  return useQuery({
    queryKey: graphKeys.stats(),
    queryFn: graphService.getStats,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get the prerequisite chain for a node */
export function usePrerequisiteChain(slug: string) {
  return useQuery({
    queryKey: graphKeys.prerequisiteChain(slug),
    queryFn: () => graphService.getPrerequisiteChain(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}
