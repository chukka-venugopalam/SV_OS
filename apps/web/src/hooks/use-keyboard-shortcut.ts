'use client';

import * as React from 'react';

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

interface Shortcut {
  key: string;
  modifiers?: Modifier[];
  handler: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

function matchesModifiers(event: KeyboardEvent, modifiers?: Modifier[]): boolean {
  if (!modifiers || modifiers.length === 0) return true;

  return modifiers.every((mod) => {
    switch (mod) {
      case 'ctrl':
        return event.ctrlKey;
      case 'meta':
        return event.metaKey;
      case 'shift':
        return event.shiftKey;
      case 'alt':
        return event.altKey;
      default:
        return false;
    }
  });
}

export function useKeyboardShortcut(shortcuts: Shortcut | Shortcut[]): void {
  const shortcutsArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts];

  React.useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsArray) {
        if (shortcut.enabled === false) continue;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          matchesModifiers(event, shortcut.modifiers)
        ) {
          event.preventDefault();
          shortcut.handler(event);
          return;
        }
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [shortcutsArray]);
}
