/**
 * React Query hooks for search functionality.
 *
 * Provides hooks for full-text search, autocomplete suggestions,
 * search history, and trending searches.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { searchService } from '@/services/search';

// ── Query Key Factory ─────────────────────────────────────────────

export const searchKeys = {
  all: ['search'] as const,
  results: (params: Record<string, unknown>) => [...searchKeys.all, 'results', params] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
  history: () => [...searchKeys.all, 'history'] as const,
  trending: () => [...searchKeys.all, 'trending'] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Full-text search across knowledge nodes */
export function useSearch(params: {
  q: string;
  node_type?: string;
  difficulty?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: () => searchService.search(params),
    enabled: params.q.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get search suggestions for autocomplete */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: () => searchService.getSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

/** Get the current user's search history */
export function useSearchHistory() {
  return useQuery({
    queryKey: searchKeys.history(),
    queryFn: searchService.getHistory,
    staleTime: 60 * 1000,
  });
}

/** Clear search history */
export function useClearSearchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchService.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() });
    },
  });
}

/** Get trending searches */
export function useTrendingSearches() {
  return useQuery({
    queryKey: searchKeys.trending(),
    queryFn: searchService.getTrending,
    staleTime: 30 * 60 * 1000,
  });
}
