import * as React from 'react';
import { cn } from './cn';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function Table({ className, wrapperClassName, ...props }: TableProps) {
  return (
    <div className={cn('w-full overflow-auto', wrapperClassName)}>
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'border-b border-neutral-200 bg-neutral-50/50 dark:border-neutral-700 dark:bg-neutral-900/50',
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        'divide-y divide-neutral-200 dark:divide-neutral-700',
        className,
      )}
      {...props}
    />
  );
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        'border-t border-neutral-200 bg-neutral-50 font-medium dark:border-neutral-700 dark:bg-neutral-900',
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-neutral-50/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-900/50 dark:data-[state=selected]:bg-neutral-800',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400',
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * When true, renders a leading slot for row actions (checkboxes, drag handles, etc.)
   */
  isAction?: boolean;
}

export function TableCell({ className, isAction, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'p-4 align-middle',
        isAction && 'w-12',
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn(
        'mt-4 text-sm text-neutral-500 dark:text-neutral-400',
        className,
      )}
      {...props}
    />
  );
}
