'use client';

import { CommandPalette as CommandPaletteUI } from '@sv-os/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from '@/hooks/use-debounce';
import { useSearchSuggestions, useTrendingSearches, useSearchHistory } from '@/hooks/use-search';
import { ROUTES } from '@/lib/constants';
import { useCommand } from '@/providers/command-provider';

const navigationCommands = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: '📊', href: ROUTES.DASHBOARD },
  { id: 'nav-explore', label: 'Browse Knowledge Explorer', icon: '🔍', href: ROUTES.EXPLORE },
  { id: 'nav-graph', label: 'Open Knowledge Graph', icon: '🕸️', href: ROUTES.GRAPH },
  { id: 'nav-careers', label: 'Explore Careers', icon: '💼', href: ROUTES.CAREERS },
  { id: 'nav-projects', label: 'Browse Projects', icon: '📁', href: ROUTES.PROJECTS },
  { id: 'nav-progress', label: 'View Progress', icon: '📈', href: ROUTES.PROGRESS },
  { id: 'nav-bookmarks', label: 'View Bookmarks', icon: '🔖', href: ROUTES.BOOKMARKS },
  { id: 'nav-settings', label: 'Open Settings', icon: '⚙️', href: ROUTES.SETTINGS },
];

export function CommandPaletteWrapper() {
  const router = useRouter();
  const { open, setOpen } = useCommand();
  const [query, setQuery] = useState('');

  const { data: suggestions } = useSearchSuggestions(query);
  const { data: trending } = useTrendingSearches();
  const { data: history } = useSearchHistory();

  const items = useMemo(() => {
    const result: Array<{
      id: string;
      label: string;
      description?: string;
      icon?: React.ReactNode;
      onSelect: () => void;
    }> = [];

    // Show suggestions when searching
    if (query.length >= 2 && suggestions) {
      for (const s of suggestions.slice(0, 5)) {
        result.push({
          id: `search-${s.text}`,
          label: s.text,
          description: `${s.type}`,
          onSelect: () => {
            router.push(`${ROUTES.EXPLORE}?search=${encodeURIComponent(s.text)}`);
          },
        });
      }
      if (result.length > 0) {
        result.push({
          id: 'search-all',
          label: `Search for "${query}"`,
          description: 'View all results',
          onSelect: () => {
            router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
          },
        });
      }
    }

    // Navigation commands (shown when not searching)
    if (query.length < 2) {
      for (const cmd of navigationCommands) {
        if (cmd.label.toLowerCase().includes(query.toLowerCase())) {
          result.push({
            id: cmd.id,
            label: cmd.label,
            icon: <span>{cmd.icon}</span>,
            onSelect: () => router.push(cmd.href),
          });
        }
      }

      // Recent pages from history
      if (history && history.length > 0) {
        for (const h of history.slice(0, 3)) {
          result.push({
            id: `history-${h.id}`,
            label: `Search: ${h.query}`,
            description: 'Recent search',
            onSelect: () => {
              router.push(`${ROUTES.EXPLORE}?search=${encodeURIComponent(h.query)}`);
            },
          });
        }
      }

      // Trending searches
      if (trending && trending.length > 0) {
        for (const t of trending.slice(0, 3)) {
          result.push({
            id: `trending-${t}`,
            label: t,
            description: 'Trending',
            onSelect: () => {
              router.push(`${ROUTES.EXPLORE}?search=${encodeURIComponent(t)}`);
            },
          });
        }
      }
    }

    return result;
  }, [query, suggestions, trending, history, router]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setOpen]);

  return (
    <CommandPaletteUI
      open={open}
      onClose={handleClose}
      items={items}
      placeholder="Search nodes, navigate, or type a command..."
    />
  );
}
