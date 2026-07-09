'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { useUIStore } from '@/stores/ui-store';

interface CommandContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

export function useCommand() {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }
  return context;
}

interface CommandProviderProps {
  children: ReactNode;
}

export function CommandProvider({ children }: CommandProviderProps) {
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  // Cmd+K / Ctrl+K to open command palette
  useKeyboardShortcut({
    key: 'k',
    modifiers: ['meta'],
    handler: () => toggleCommandPalette(),
  });

  useKeyboardShortcut({
    key: 'k',
    modifiers: ['ctrl'],
    handler: () => toggleCommandPalette(),
  });

  const value = useMemo(
    () => ({
      open: commandPaletteOpen,
      setOpen: setCommandPaletteOpen,
      toggle: toggleCommandPalette,
    }),
    [commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette],
  );

  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}
