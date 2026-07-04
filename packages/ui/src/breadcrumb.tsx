import * as React from 'react';
import { cn } from './cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export function Breadcrumb({
  items,
  separator = '/',
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400', className)}
      {...props}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {index > 0 && (
              <span className="mx-1 text-neutral-300 dark:text-neutral-600" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  isLast && 'font-medium text-neutral-900 dark:text-neutral-100',
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
