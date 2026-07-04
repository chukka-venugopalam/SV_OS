'use client';

import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { Button } from '@sv-os/ui';
import { ThemeSwitcher } from './theme-switcher';
import { useUIStore } from '@/stores/ui-store';

export function TopNav() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
