'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { cn } from '@/lib/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = memo(function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
              {crumb.href && i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
});
