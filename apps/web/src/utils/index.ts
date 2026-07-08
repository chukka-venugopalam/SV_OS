/**
 * Utils — pure utility functions organized by domain.
 *
 * These are non-React utilities that can be used anywhere.
 * They have no side effects, no React dependencies, and are fully tree-shakeable.
 *
 * Structure:
 *   string.ts   — String manipulation (capitalize, truncate, slugify)
 *   number.ts   — Number formatting, clamping, range mapping
 *   object.ts   — Object manipulation (pick, omit, deep merge)
 *   array.ts    — Array operations (group, chunk, sort, unique)
 *   function.ts — Function utilities (debounce, throttle, memoize)
 */

export {
  capitalize,
  slugToTitle,
  truncate,
  pluralize,
  toKebabCase,
  toSnakeCase,
  toCamelCase,
  isBlank,
  randomString,
} from './string';

export {
  formatNumber,
  formatPercent,
  formatCurrency,
  clamp,
  mapRange,
  roundTo,
  isBetween,
  randomInt,
  formatFileSize,
} from './number';

export {
  isNullish,
  isEmptyObject,
  omit,
  pick,
  deepMerge,
  clone,
  get,
} from './object';

export {
  groupBy,
  chunk,
  uniqueBy,
  sortBy,
  toggleItem,
  moveItem,
  arraysEqual,
  intersection,
  difference,
} from './array';

export {
  debounce,
  throttle,
  memoize,
  once,
  noop,
} from './function';
