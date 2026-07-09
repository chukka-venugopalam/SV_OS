/**
 * React Query hooks for bookmarks and favorites.
 *
 * Provides hooks for listing, adding, removing, and checking
 * the status of bookmarks and favorites.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { bookmarkService } from '@/services/bookmarks';

// ── Query Key Factory ─────────────────────────────────────────────

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  list: (params?: Record<string, unknown>) => [...bookmarkKeys.all, 'list', params] as const,
  check: (nodeId: string) => [...bookmarkKeys.all, 'check', nodeId] as const,
};

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: (params?: Record<string, unknown>) => [...favoriteKeys.all, 'list', params] as const,
  check: (nodeId: string) => [...favoriteKeys.all, 'check', nodeId] as const,
};

// ── Bookmark Hooks ──────────────────────────────────────────────

/** Get the current user's bookmarks */
export function useBookmarks(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: bookmarkKeys.list(params),
    queryFn: () => bookmarkService.listBookmarks(params),
    staleTime: 60 * 1000,
  });
}

/** Toggle a bookmark for a specific node */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => bookmarkService.toggleBookmark(nodeId),
    onSuccess: (data, nodeId) => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.check(nodeId) });
    },
  });
}

/** Check if a node is bookmarked */
export function useIsBookmarked(nodeId: string) {
  return useQuery({
    queryKey: bookmarkKeys.check(nodeId),
    queryFn: () => bookmarkService.isBookmarked(nodeId),
    enabled: !!nodeId,
    staleTime: 60 * 1000,
  });
}

// ── Favorite Hooks ──────────────────────────────────────────────

/** Get the current user's favorites */
export function useFavorites(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: favoriteKeys.list(params),
    queryFn: () => bookmarkService.listFavorites(params),
    staleTime: 60 * 1000,
  });
}

/** Add a node to favorites */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => bookmarkService.addFavorite(nodeId),
    onSuccess: (_, nodeId) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.check(nodeId) });
    },
  });
}

/** Remove a node from favorites */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => bookmarkService.removeFavorite(nodeId),
    onSuccess: (_, nodeId) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.check(nodeId) });
    },
  });
}

/** Check if a node is favorited */
export function useIsFavorited(nodeId: string) {
  return useQuery({
    queryKey: favoriteKeys.check(nodeId),
    queryFn: () => bookmarkService.isFavorited(nodeId),
    enabled: !!nodeId,
    staleTime: 60 * 1000,
  });
}
