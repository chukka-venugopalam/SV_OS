/**
 * Knowledge Node API service.
 *
 * Provides functions for interacting with knowledge node endpoints.
 */

import { apiClient } from '@/lib/api-client';
import type { KnowledgeNode, LearningResource } from '@sv-os/types';
import type { PaginatedResponse } from '@sv-os/types';

// ── Service ───────────────────────────────────────────────────────

export const knowledgeService = {
  /** Get a paginated list of knowledge nodes */
  list(params?: {
    page?: number;
    page_size?: number;
    node_type?: string;
    difficulty?: string;
    search?: string;
  }): Promise<PaginatedResponse<KnowledgeNode>> {
    return apiClient
      .get<PaginatedResponse<KnowledgeNode>>('/nodes', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Get a single node by slug */
  getBySlug(slug: string): Promise<KnowledgeNode> {
    return apiClient.get<KnowledgeNode>(`/nodes/${slug}`).then((res) => res.data!);
  },

  /** Get popular nodes */
  getPopular(): Promise<KnowledgeNode[]> {
    return apiClient.get<KnowledgeNode[]>('/nodes/popular').then((res) => res.data!);
  },

  /** Get prerequisites for a node */
  getPrerequisites(slug: string): Promise<KnowledgeNode[]> {
    return apiClient.get<KnowledgeNode[]>(`/nodes/${slug}/prerequisites`).then((res) => res.data!);
  },

  /** Get related nodes */
  getRelated(slug: string): Promise<KnowledgeNode[]> {
    return apiClient.get<KnowledgeNode[]>(`/nodes/${slug}/related`).then((res) => res.data!);
  },

  /** Get learning resources for a node */
  getResources(slug: string): Promise<LearningResource[]> {
    return apiClient.get<LearningResource[]>(`/nodes/${slug}/resources`).then((res) => res.data!);
  },

  /** Get careers associated with a node */
  getCareers(slug: string): Promise<{ careers: Array<{ id: string; title: string }> }> {
    return apiClient
      .get<{ careers: Array<{ id: string; title: string }> }>(`/nodes/${slug}/careers`)
      .then((res) => res.data!);
  },
};
