'use client';

import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { Button } from '@sv-os/ui';
import { ThemeSwitcher } from './theme-switcher';
import { useUIStore } from '@/stores/ui-store';
import { useCommand } from '@/providers/command-provider';

export function TopNav() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { setOpen } = useCommand();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-950/80">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Brand (mobile) */}
      <Link
        href="/"
        className="text-sm font-semibold text-neutral-900 lg:hidden dark:text-neutral-100"
      >
        SV-OS
      </Link>

      {/* Search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex flex-1 max-w-md items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500 dark:hover:border-neutral-600"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span>Search anything...</span>
        <kbd className="ml-auto rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-500">
          Ctrl+K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="sm:hidden"
          aria-label="Open command palette"
        >
          <Search className="h-5 w-5" />
        </Button>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
