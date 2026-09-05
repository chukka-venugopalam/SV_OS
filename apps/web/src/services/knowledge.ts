/**
 * Knowledge Node API service.
 *
 * Provides functions for interacting with knowledge node endpoints.
 */

import type { KnowledgeNode, LearningResource, PaginatedResponse } from '@sv-os/types';

import { apiClient } from '@/lib/api-client';

// ── Service ───────────────────────────────────────────────────────

export const knowledgeService = {
  /** Get a paginated list of knowledge nodes */
  list(params?: {
    page?: number;
    per_page?: number;
    node_type?: string;
    difficulty?: string;
    search?: string;
    act?: number;
    district?: string;
    tier?: string;
  }): Promise<PaginatedResponse<KnowledgeNode>> {
    return apiClient
      .get<PaginatedResponse<KnowledgeNode>>('/nodes', {
        params: params as unknown as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },

  /** Get the full ordered curriculum sequence for a tier. Replaces the old
   * static gate-path-nodes.ts array — this is a live, always-current query. */
  getCurriculumPath(tier: 'gate_core' | 'career_track' = 'gate_core'): Promise<{
    items: KnowledgeNode[];
    total: number;
  }> {
    return apiClient
      .get<{ items: KnowledgeNode[]; total: number }>('/nodes/curriculum-path', {
        params: { tier },
      })
      .then((res) => res.data!);
  },

  /** List distinct published districts, optionally scoped to an act. */
  getDistricts(act?: number): Promise<{
    items: { act: number; district: string; node_count: number }[];
  }> {
    return apiClient
      .get<{ items: { act: number; district: string; node_count: number }[] }>('/nodes/districts', {
        params: act != null ? { act } : undefined,
      })
      .then((res) => res.data!);
  },

  /** Get a single node by slug */
  getBySlug(slug: string): Promise<KnowledgeNode> {
    return apiClient.get<KnowledgeNode>(`/nodes/${slug}`).then((res) => res.data!);
  },

  /** Get popular nodes */
  getPopular(): Promise<KnowledgeNode[]> {
    return apiClient
      .get<{ items: KnowledgeNode[] }>('/nodes/popular')
      .then((res) => (Array.isArray(res.data) ? res.data : (res.data?.items ?? [])));
  },

  /** Get prerequisites for a node */
  getPrerequisites(slug: string): Promise<KnowledgeNode[]> {
    return apiClient
      .get<{ items: KnowledgeNode[] }>(`/nodes/${slug}/prerequisites`)
      .then((res) => (Array.isArray(res.data) ? res.data : (res.data?.items ?? [])));
  },

  /** Get related nodes */
  getRelated(slug: string): Promise<KnowledgeNode[]> {
    return apiClient
      .get<
        | { outgoing?: KnowledgeNode[]; incoming?: KnowledgeNode[]; items?: KnowledgeNode[] }
        | KnowledgeNode[]
      >(`/nodes/${slug}/related`)
      .then((res) => {
        if (!res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.items)) return res.data.items;
        const outgoing = res.data.outgoing ?? [];
        const incoming = res.data.incoming ?? [];
        const seen = new Set<string>();
        const combined: KnowledgeNode[] = [];
        for (const n of [...outgoing, ...incoming]) {
          if (n && n.id && !seen.has(n.id)) {
            seen.add(n.id);
            combined.push(n);
          }
        }
        return combined;
      });
  },

  /** Get learning resources for a node */
  getResources(slug: string): Promise<LearningResource[]> {
    return apiClient
      .get<{ items: LearningResource[] }>(`/nodes/${slug}/resources`)
      .then((res) => (Array.isArray(res.data) ? res.data : (res.data?.items ?? [])));
  },

  /** Get careers associated with a node */
  getCareers(slug: string): Promise<{ careers: Array<{ id: string; title: string }> }> {
    return apiClient
      .get<
        | {
            items?: Array<{ id: string; title: string }>;
            careers?: Array<{ id: string; title: string }>;
          }
        | Array<{ id: string; title: string }>
      >(`/nodes/${slug}/careers`)
      .then((res) => {
        if (!res.data) return { careers: [] };
        if (Array.isArray(res.data)) return { careers: res.data };
        return {
          careers: res.data.careers ?? res.data.items ?? [],
        };
      });
  },
};
