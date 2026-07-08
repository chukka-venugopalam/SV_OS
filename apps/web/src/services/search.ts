/**
 * Search API service.
 *
 * Provides functions for full-text search across knowledge nodes.
 */

import { apiClient } from '@/lib/api-client';
import type { KnowledgeNode } from '@sv-os/types';

// ── Types ─────────────────────────────────────────────────────────

export interface SearchResult {
  nodes: KnowledgeNode[];
  total: number;
  query: string;
  suggestion?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'node' | 'career' | 'project';
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
}

// ── Service ───────────────────────────────────────────────────────

export const searchService = {
  /** Full-text search across knowledge nodes */
  search(params: {
    q: string;
    node_type?: string;
    difficulty?: string;
    page?: number;
    page_size?: number;
  }): Promise<SearchResult> {
    return apiClient
      .get<SearchResult>('/search', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Get search suggestions for autocomplete */
  getSuggestions(query: string): Promise<SearchSuggestion[]> {
    return apiClient
      .get<SearchSuggestion[]>('/search/suggestions', { params: { q: query } })
      .then((res) => res.data!);
  },

  /** Get the current user's search history */
  getHistory(): Promise<SearchHistoryItem[]> {
    return apiClient.get<SearchHistoryItem[]>('/search/history').then((res) => res.data!);
  },

  /** Clear the current user's search history */
  clearHistory(): Promise<void> {
    return apiClient.delete('/search/history').then(() => undefined);
  },

  /** Get trending searches */
  getTrending(): Promise<string[]> {
    return apiClient.get<string[]>('/search/trending').then((res) => res.data!);
  },
};
