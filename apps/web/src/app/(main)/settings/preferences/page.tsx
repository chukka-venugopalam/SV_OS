'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, cn } from '@sv-os/ui';
import { ArrowLeft, Palette, Sun, Moon, Type, Eye, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Shell } from '@/components/shared/shell';
import { useSyncPreferences, useUpdatePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/providers/toast-provider';
import { useUIStore } from '@/stores/ui-store';

export default function PreferencesSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize, reducedMotion, setReducedMotion } = useUIStore();
  const updatePrefs = useUpdatePreferences();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Sync preferences from backend on mount
  useSyncPreferences();

  const themeOptions = [
    { value: 'dark' as const, label: 'Dark', icon: <Moon className="h-5 w-5" /> },
    { value: 'light' as const, label: 'Light', icon: <Sun className="h-5 w-5" /> },
  ];

  const fontSizeOptions = [
    { value: 'sm' as const, label: 'Small', preview: 'text-sm' },
    { value: 'md' as const, label: 'Medium', preview: 'text-base' },
    { value: 'lg' as const, label: 'Large', preview: 'text-lg' },
  ];

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePrefs.mutateAsync({
        font_size: fontSize,
        reduced_motion: reducedMotion,
        theme: theme as 'light' | 'dark' | undefined,
      });
      addToast('Preferences saved', 'success');
    } catch {
      addToast('Failed to save preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Shell maxWidth="2xl">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Preferences</h1>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleSavePreferences}
          disabled={isSaving || updatePrefs.isPending}
        >
          {isSaving || updatePrefs.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving || updatePrefs.isPending ? 'Saving...' : 'Save all'}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="text-primary-500 h-4 w-4" />
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all',
                    theme === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
                  )}
                >
                  {option.icon}
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Font Size */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Type className="text-info-500 h-4 w-4" />
              Font Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={cn(
                    'flex-1 rounded-lg border-2 p-4 text-center transition-all',
                    fontSize === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
                  )}
                >
                  <p className={cn('font-medium', option.preview)}>Aa</p>
                  <p className="mt-1 text-xs text-neutral-500">{option.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reduced Motion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="text-warning-500 h-4 w-4" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Reduced motion
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Minimize animations and transitions
                </p>
              </div>
              <button
                role="switch"
                aria-checked={reducedMotion}
                onClick={() => setReducedMotion(!reducedMotion)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  reducedMotion ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    reducedMotion ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </label>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
