/**
 * Function utility functions — debounce, throttle, memoize, etc.
 */

/** Create a debounced function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/** Create a throttled function */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limitMs: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/** Create a memoized function with a single argument */
export function memoize<TArg, TResult>(
  fn: (arg: TArg) => TResult,
): (arg: TArg) => TResult {
  const cache = new Map<TArg, TResult>();
  return (arg: TArg) => {
    if (cache.has(arg)) {
      return cache.get(arg) as TResult;
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/** Create a function that only executes once */
export function once<T extends (...args: unknown[]) => unknown>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T> | undefined;
  return (...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = fn(...args) as ReturnType<T>;
    }
    return result;
  };
}

/** No operation function */
export function noop(): void {
  // Intentionally empty
}
