/**
 * Bookmarks & Favorites API service.
 *
 * Provides functions for bookmarking and favoriting nodes,
 * projects, and careers.
 */

import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@sv-os/types';

// ── Types ─────────────────────────────────────────────────────────

export interface Bookmark {
  id: string;
  user_id: string;
  node_id: string;
  node_title: string;
  node_type: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  node_id: string;
  node_title: string;
  node_type: string;
  created_at: string;
}

// ── Service ───────────────────────────────────────────────────────

export const bookmarkService = {
  // ── Bookmarks ─────────────────────────────────────────────────

  /** Get the current user's bookmarks */
  listBookmarks(params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Bookmark>> {
    return apiClient
      .get<PaginatedResponse<Bookmark>>('/bookmarks', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Toggle a bookmark for a specific node */
  toggleBookmark(nodeId: string): Promise<{ bookmarked: boolean }> {
    return apiClient
      .post<{ bookmarked: boolean }>('/bookmarks/toggle', { node_id: nodeId })
      .then((res) => res.data!);
  },

  /** Check if a node is bookmarked */
  isBookmarked(nodeId: string): Promise<{ bookmarked: boolean }> {
    return apiClient
      .get<{ bookmarked: boolean }>('/bookmarks/check', { params: { node_id: nodeId } })
      .then((res) => res.data!);
  },

  // ── Favorites ─────────────────────────────────────────────────

  /** Get the current user's favorites */
  listFavorites(params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Favorite>> {
    return apiClient
      .get<PaginatedResponse<Favorite>>('/favorites', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Add a node to favorites */
  addFavorite(nodeId: string): Promise<Favorite> {
    return apiClient.post<Favorite>('/favorites', { node_id: nodeId }).then((res) => res.data!);
  },

  /** Remove a node from favorites */
  removeFavorite(nodeId: string): Promise<void> {
    return apiClient.delete(`/favorites/${nodeId}`).then(() => undefined);
  },

  /** Check if a node is favorited */
  isFavorited(nodeId: string): Promise<{ favorited: boolean }> {
    return apiClient
      .get<{ favorited: boolean }>('/favorites/check', { params: { node_id: nodeId } })
      .then((res) => res.data!);
  },
};
