/**
 * React Query hooks for project exploration.
 *
 * Provides hooks for listing projects, getting project details,
 * and project knowledge requirements.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projects';

// ── Query Key Factory ─────────────────────────────────────────────

export const projectKeys = {
  all: ['projects'] as const,
  list: (params?: Record<string, unknown>) => [...projectKeys.all, 'list', params] as const,
  detail: (slug: string) => [...projectKeys.all, 'detail', slug] as const,
  requirements: (slug: string) => [...projectKeys.all, 'requirements', slug] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Get a paginated list of projects */
export function useProjects(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  difficulty?: string;
}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectService.list(params),
    staleTime: 10 * 60 * 1000,
  });
}

/** Get a single project by slug */
export function useProject(slug: string) {
  return useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: () => projectService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get the knowledge requirements for a project */
export function useProjectRequirements(slug: string) {
  return useQuery({
    queryKey: projectKeys.requirements(slug),
    queryFn: () => projectService.getRequirements(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}
