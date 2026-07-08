/**
 * React Query hooks for knowledge nodes.
 *
 * Provides hooks for listing, searching, and getting detail
 * on knowledge nodes including prerequisites, related nodes,
 * and learning resources.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { knowledgeService } from '@/services/knowledge';

// ── Query Key Factory ─────────────────────────────────────────────

export const knowledgeKeys = {
  all: ['knowledge'] as const,
  list: (params?: Record<string, unknown>) => [...knowledgeKeys.all, 'list', params] as const,
  detail: (slug: string) => [...knowledgeKeys.all, 'detail', slug] as const,
  popular: () => [...knowledgeKeys.all, 'popular'] as const,
  prerequisites: (slug: string) => [...knowledgeKeys.all, 'prerequisites', slug] as const,
  related: (slug: string) => [...knowledgeKeys.all, 'related', slug] as const,
  resources: (slug: string) => [...knowledgeKeys.all, 'resources', slug] as const,
  careers: (slug: string) => [...knowledgeKeys.all, 'careers', slug] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Get a paginated list of knowledge nodes */
export function useKnowledgeNodes(params?: {
  page?: number;
  page_size?: number;
  node_type?: string;
  difficulty?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: knowledgeKeys.list(params),
    queryFn: () => knowledgeService.list(params),
    staleTime: 10 * 60 * 1000,
  });
}

/** Get a single knowledge node by slug */
export function useKnowledgeNode(slug: string) {
  return useQuery({
    queryKey: knowledgeKeys.detail(slug),
    queryFn: () => knowledgeService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get popular knowledge nodes */
export function usePopularNodes() {
  return useQuery({
    queryKey: knowledgeKeys.popular(),
    queryFn: knowledgeService.getPopular,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get prerequisites for a node */
export function useNodePrerequisites(slug: string) {
  return useQuery({
    queryKey: knowledgeKeys.prerequisites(slug),
    queryFn: () => knowledgeService.getPrerequisites(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

/** Get related nodes */
export function useRelatedNodes(slug: string) {
  return useQuery({
    queryKey: knowledgeKeys.related(slug),
    queryFn: () => knowledgeService.getRelated(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get learning resources for a node */
export function useNodeResources(slug: string) {
  return useQuery({
    queryKey: knowledgeKeys.resources(slug),
    queryFn: () => knowledgeService.getResources(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get careers associated with a node */
export function useNodeCareers(slug: string) {
  return useQuery({
    queryKey: knowledgeKeys.careers(slug),
    queryFn: () => knowledgeService.getCareers(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}
