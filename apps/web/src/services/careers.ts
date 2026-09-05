/**
 * Careers API service.
 *
 * Provides functions for interacting with career endpoints.
 */

import type {
  Career,
  CareerWithRequirements,
  KnowledgeNode,
  PaginatedResponse,
} from '@sv-os/types';

import { apiClient } from '@/lib/api-client';

// ── Service ───────────────────────────────────────────────────────

export const careerService = {
  /** Get a paginated list of careers */
  list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    demand?: string;
  }): Promise<PaginatedResponse<Career>> {
    return apiClient
      .get<PaginatedResponse<Career>>('/careers', {
        params: params as unknown as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },

  /** Get a single career by slug */
  getBySlug(slug: string): Promise<CareerWithRequirements> {
    return apiClient.get<CareerWithRequirements>(`/careers/${slug}`).then((res) => res.data!);
  },

  /**
   * Get the roadmap for a career: requirement rows grouped by type.
   *
   * NOTE: backed by the `career_requirements` table, which is currently
   * empty for all 12 careers (verified against live DB) — a separate,
   * also-empty mechanism from `learning_goal_nodes`/`learning_goals`
   * (goal_type='career_path'), which is the one the project's handoff docs
   * describe as the intended future home for per-career curriculum
   * sequencing. Two parallel unpopulated systems for the same concept —
   * flagged as DRIFT, not resolved here. Each requirement row only carries
   * a node_id, not a hydrated node — the caller must resolve node_ids
   * against /nodes if it wants titles/slugs to link to.
   */
  getRoadmap(slug: string): Promise<{
    career: Career;
    requirements: {
      required: { id: string; node_id: string; order_index: number }[];
      recommended: { id: string; node_id: string; order_index: number }[];
      bonus: { id: string; node_id: string; order_index: number }[];
    };
    total_requirements: number;
  }> {
    return apiClient
      .get<{
        career: Career;
        requirements: {
          required: { id: string; node_id: string; order_index: number }[];
          recommended: { id: string; node_id: string; order_index: number }[];
          bonus: { id: string; node_id: string; order_index: number }[];
        };
        total_requirements: number;
      }>(`/careers/${slug}/roadmap`)
      .then((res) => res.data!);
  },

  /** Get all knowledge nodes associated with a career */
  getNodes(slug: string): Promise<{ nodes: KnowledgeNode[] }> {
    return apiClient
      .get<{ nodes: KnowledgeNode[] }>(`/careers/${slug}/nodes`)
      .then((res) => res.data!);
  },
};
