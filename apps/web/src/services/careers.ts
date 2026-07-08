/**
 * Careers API service.
 *
 * Provides functions for interacting with career endpoints.
 */

import { apiClient } from '@/lib/api-client';
import type {
  Career,
  CareerWithRequirements,
  KnowledgeNode,
} from '@sv-os/types';
import type { PaginatedResponse } from '@sv-os/types';

// ── Service ───────────────────────────────────────────────────────

export const careerService = {
  /** Get a paginated list of careers */
  list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    demand?: string;
  }): Promise<PaginatedResponse<Career>> {
    return apiClient
      .get<PaginatedResponse<Career>>('/careers', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Get a single career by slug */
  getBySlug(slug: string): Promise<CareerWithRequirements> {
    return apiClient.get<CareerWithRequirements>(`/careers/${slug}`).then((res) => res.data!);
  },

  /** Get the roadmap for a career (required/recommended/bonus nodes) */
  getRoadmap(slug: string): Promise<{
    required: KnowledgeNode[];
    recommended: KnowledgeNode[];
    bonus: KnowledgeNode[];
  }> {
    return apiClient
      .get<{ required: KnowledgeNode[]; recommended: KnowledgeNode[]; bonus: KnowledgeNode[] }>(`/careers/${slug}/roadmap`)
      .then((res) => res.data!);
  },

  /** Get all knowledge nodes associated with a career */
  getNodes(slug: string): Promise<{ nodes: KnowledgeNode[] }> {
    return apiClient
      .get<{ nodes: KnowledgeNode[] }>(`/careers/${slug}/nodes`)
      .then((res) => res.data!);
  },
};
