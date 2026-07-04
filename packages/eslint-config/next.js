/**
 * Next.js ESLint Configuration
 * @type {import('eslint').Linter.Config[]}
 */
import baseConfig from './base.js';

const nextConfig = [
  ...baseConfig,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'error',
    },
  },
];

export default nextConfig;
