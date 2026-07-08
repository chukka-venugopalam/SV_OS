/**
 * Object utility functions.
 */

/** Check if a value is null or undefined */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Check if an object is empty (has no own enumerable properties) */
export function isEmptyObject(value: Record<string, unknown>): boolean {
  return Object.keys(value).length === 0;
}

/** Omit specified keys from an object (type-safe) */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/** Pick specified keys from an object (type-safe) */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/** Deep merge two objects */
export function deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  target: T,
  source: U,
): T & U {
  const output = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source) as Array<keyof U>) {
    const value = source[key];
    if (isNonNullObject(value) && isNonNullObject(output[key as string])) {
      output[key as string] = deepMerge(
        output[key as string] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      output[key as string] = value;
    }
  }
  return output as T & U;
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Create a shallow clone of an object */
export function clone<T extends Record<string, unknown>>(obj: T): T {
  return { ...obj } as T;
}

/** Get a value from an object using a dot-notation path */
export function get<T>(obj: Record<string, unknown>, path: string, fallback?: T): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return fallback;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return (current as T) ?? fallback;
}
