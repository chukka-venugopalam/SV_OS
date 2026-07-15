import baseConfig from './packages/eslint-config/base.js';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.venv/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      'apps/api/**',
    ],
  },
  ...baseConfig,
  // Handle root-level CommonJS config files (e.g. commitlint.config.js)
  {
    files: ['commitlint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'no-console': 'off',
      'no-unused-expressions': 'off',
      'no-undef': 'off',
    },
  },
];
