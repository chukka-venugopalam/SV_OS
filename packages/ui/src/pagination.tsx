import * as React from 'react';
import { cn } from './cn';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Whether to show first/last page buttons */
  showFirstLast?: boolean;
  /** Maximum number of page buttons to show (excluding first/last/ellipsis) */
  maxVisible?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
  className,
}: PaginationProps) {
  // Don't render if there's only one page
  if (totalPages <= 1) return null;

  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  // Calculate visible page range
  const pageNumbers = React.useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 1);

      if (end === totalPages - 1) {
        start = Math.max(2, end - maxVisible + 1);
      }

      if (start > 2) pages.push('ellipsis');

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push('ellipsis');

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisible]);

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {showFirstLast && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onPageChange(1)}
          disabled={!canGoBack}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="xs"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoBack}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-7 w-7 items-center justify-center text-xs text-neutral-400 dark:text-neutral-500"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'ghost'}
            size="xs"
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className="min-w-[28px]"
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="xs"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoForward}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoForward}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
