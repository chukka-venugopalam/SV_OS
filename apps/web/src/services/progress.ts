/**
 * Progress API service.
 *
 * Provides functions for tracking user learning progress.
 */

import type { UserProgress, ProgressStats , PaginatedResponse } from '@sv-os/types';

import { apiClient } from '@/lib/api-client';

// ── Service ───────────────────────────────────────────────────────

export const progressService = {
  /** Get the current user's progress entries */
  list(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<UserProgress>> {
    return apiClient
      .get<PaginatedResponse<UserProgress>>('/progress', {
        params: params as unknown as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },

  /** Get progress statistics */
  getStats(): Promise<ProgressStats> {
    return apiClient.get<ProgressStats>('/progress/stats').then((res) => res.data!);
  },

  /** Update progress for a specific node */
  update(nodeId: string, status: UserProgress['status']): Promise<UserProgress> {
    return apiClient
      .put<UserProgress>('/progress', { node_id: nodeId, status })
      .then((res) => res.data!);
  },

  /** Mark a node as started */
  start(nodeId: string): Promise<UserProgress> {
    return apiClient
      .post<UserProgress>('/progress/start', { node_id: nodeId })
      .then((res) => res.data!);
  },

  /** Mark a node as completed */
  complete(nodeId: string): Promise<UserProgress> {
    return apiClient
      .post<UserProgress>('/progress/complete', { node_id: nodeId })
      .then((res) => res.data!);
  },
};
