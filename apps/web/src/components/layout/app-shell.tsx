'use client';

import { type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import { Footer } from './footer';
import { CommandPaletteWrapper } from './command-palette';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/cn';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[60px]',
        )}
      >
        <TopNav />
        <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
      <CommandPaletteWrapper />
    </div>
  );
}
