'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useCallback } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const setDark = useCallback(() => setTheme('dark'), [setTheme]);
  const setLight = useCallback(() => setTheme('light'), [setTheme]);

  return {
    theme,
    resolvedTheme,
    systemTheme,
    isDark,
    toggleTheme,
    setDark,
    setLight,
    setTheme,
  };
}
