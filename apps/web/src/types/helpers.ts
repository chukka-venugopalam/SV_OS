/**
 * TypeScript utility type helpers — app-specific type helpers.
 *
 * These types extend the shared @sv-os/types package with app-level
 * utility types, React prop types, and domain-specific type helpers.
 */

import type { ReactNode } from 'react';

// ── Component Props ──────────────────────────────────────────────

/** Standard className prop */
export interface WithClassName {
  className?: string;
}

/** Standard children prop */
export interface WithChildren {
  children: ReactNode;
}

/** Combined className + children */
export interface WithChildrenAndClassName extends WithClassName, WithChildren {}

// ── Async / Data Status ──────────────────────────────────────────

/** Represents the loading state of any data fetching operation */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Generic async state container */
export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: Error | null;
}

// ── Data Wrappers ────────────────────────────────────────────────

/** Pattern for components that show data with loading/empty/error states */
export type DataWrapperProps<T> = {
  data: T | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
};

// ── UI State ──────────────────────────────────────────────────────

/** Generic dropdown/select option */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

/** Generic tab item */
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

// ── Pagination ────────────────────────────────────────────────────

/** Parameters sent with paginated API requests */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// ── Filter / Sort ─────────────────────────────────────────────────

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Generic sort config */
export interface SortConfig<T = string> {
  field: T;
  direction: SortDirection;
}

/** Generic filter config */
export interface FilterConfig<T = string> {
  field: T;
  value: string | number | boolean | string[] | null;
  operator?: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
}

// ── Deep Partial ──────────────────────────────────────────────────

/** Make all properties (including nested) optional */
export type DeepPartial<T> = T extends Record<string, unknown>
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** Make specific keys required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Make specific keys optional */
export type OptionalBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ── ValueOf ───────────────────────────────────────────────────────

/** Get the value type from an object type */
export type ValueOf<T> = T[keyof T];

/** Get the union of values from a const object */
export type ValueOfConst<T extends Record<string, string>> = T[keyof T];
