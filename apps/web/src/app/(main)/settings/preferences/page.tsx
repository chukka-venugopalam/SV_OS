'use client';

import Link from 'next/link';
import { ArrowLeft, Palette, Sun, Moon, Monitor, Type, Eye } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useUIStore } from '@/stores/ui-store';
import { Shell } from '@/components/shared/shell';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Badge,
  cn,
} from '@sv-os/ui';

export default function PreferencesSettingsPage() {
  const { theme, setTheme, isDark } = useTheme();
  const { fontSize, setFontSize, reducedMotion, setReducedMotion } = useUIStore();

  const themeOptions = [
    { value: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
    { value: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
  ] as const;

  const fontSizeOptions = [
    { value: 'sm' as const, label: 'Small', preview: 'text-sm' },
    { value: 'md' as const, label: 'Medium', preview: 'text-base' },
    { value: 'lg' as const, label: 'Large', preview: 'text-lg' },
  ];

  return (
    <Shell maxWidth="2xl">
      <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-50">Preferences</h1>

      <div className="space-y-4">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4 text-primary-500" />
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
              <Type className="h-4 w-4 text-info-500" />
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
              <Eye className="h-4 w-4 text-warning-500" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Reduced motion</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Minimize animations and transitions</p>
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
                <span className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  reducedMotion ? 'translate-x-6' : 'translate-x-1',
                )} />
              </button>
            </label>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
