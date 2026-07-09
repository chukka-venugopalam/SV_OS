/**
 * React Query hooks for career exploration.
 *
 * Provides hooks for listing careers, getting career details,
 * roadmaps, and career-specific knowledge nodes.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { careerService } from '@/services/careers';

// ── Query Key Factory ─────────────────────────────────────────────

export const careerKeys = {
  all: ['careers'] as const,
  list: (params?: Record<string, unknown>) => [...careerKeys.all, 'list', params] as const,
  detail: (slug: string) => [...careerKeys.all, 'detail', slug] as const,
  roadmap: (slug: string) => [...careerKeys.all, 'roadmap', slug] as const,
  nodes: (slug: string) => [...careerKeys.all, 'nodes', slug] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Get a paginated list of careers */
export function useCareers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  demand?: string;
}) {
  return useQuery({
    queryKey: careerKeys.list(params),
    queryFn: () => careerService.list(params),
    staleTime: 10 * 60 * 1000,
  });
}

/** Get a single career by slug */
export function useCareer(slug: string) {
  return useQuery({
    queryKey: careerKeys.detail(slug),
    queryFn: () => careerService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get the roadmap for a career */
export function useCareerRoadmap(slug: string) {
  return useQuery({
    queryKey: careerKeys.roadmap(slug),
    queryFn: () => careerService.getRoadmap(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

/** Get knowledge nodes associated with a career */
export function useCareerNodes(slug: string) {
  return useQuery({
    queryKey: careerKeys.nodes(slug),
    queryFn: () => careerService.getNodes(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}
