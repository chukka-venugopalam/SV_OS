/**
 * React Query hooks for learning progress tracking.
 *
 * Provides hooks for listing progress, getting stats,
 * updating progress status, and marking nodes as started/completed.
 */

'use client';

import type { UserProgress } from '@sv-os/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { progressService } from '@/services/progress';

// ── Query Key Factory ─────────────────────────────────────────────

export const progressKeys = {
  all: ['progress'] as const,
  list: (params?: Record<string, unknown>) => [...progressKeys.all, 'list', params] as const,
  stats: () => [...progressKeys.all, 'stats'] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Get the current user's progress entries */
export function useProgressList(params?: { page?: number; page_size?: number; status?: string }) {
  return useQuery({
    queryKey: progressKeys.list(params),
    queryFn: () => progressService.list(params),
    staleTime: 60 * 1000,
  });
}

/** Get progress statistics */
export function useProgressStats() {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: progressService.getStats,
    staleTime: 60 * 1000,
  });
}

/** Update progress for a specific node */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: string; status: UserProgress['status'] }) =>
      progressService.update(nodeId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

/** Mark a node as started */
export function useStartNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => progressService.start(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

/** Mark a node as completed */
export function useCompleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => progressService.complete(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}
