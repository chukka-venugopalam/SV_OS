import reactConfig from '@sv-os/eslint-config/react';

export default [
  ...reactConfig,
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
];
