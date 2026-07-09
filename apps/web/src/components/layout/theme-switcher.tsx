'use client';

import { Button } from '@sv-os/ui';
import { Sun, Moon } from 'lucide-react';

import { useMounted } from '@/hooks/use-mounted';
import { useTheme } from '@/hooks/use-theme';

export function ThemeSwitcher() {
  const { isDark, toggleTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <div className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
