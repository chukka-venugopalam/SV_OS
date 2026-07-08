/**
 * Array utility functions.
 */

/** Group an array of objects by a key */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      (acc[key] ??= []).push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/** Split an array into chunks of a specified size */
export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/** Get the unique elements of an array */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Sort an array of objects by a key */
export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => string | number,
  order: 'asc' | 'desc' = 'asc',
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/** Toggle an item in an array (add if not present, remove if present) */
export function toggleItem<T>(array: T[], item: T): T[] {
  return array.includes(item)
    ? array.filter((i) => i !== item)
    : [...array, item];
}

/** Move an element in an array from one index to another */
export function moveItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [moved] = result.splice(fromIndex, 1);
  if (moved !== undefined) {
    result.splice(toIndex, 0, moved);
  }
  return result;
}

/** Check if two arrays have the same elements (order-independent) */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item) => b.includes(item));
}

/** Find the intersection of two arrays */
export function intersection<T>(a: T[], b: T[]): T[] {
  return a.filter((item) => b.includes(item));
}

/** Find the difference between two arrays (elements in a but not in b) */
export function difference<T>(a: T[], b: T[]): T[] {
  return a.filter((item) => !b.includes(item));
}
