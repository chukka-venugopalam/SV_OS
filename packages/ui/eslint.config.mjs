import baseConfig from '@sv-os/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
