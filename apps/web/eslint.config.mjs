import baseConfig from '@sv-os/eslint-config/base';
import reactConfig from '@sv-os/eslint-config/react';

export default [
  ...baseConfig,
  ...reactConfig,
  {
    ignores: ['.next/**', 'out/**'],
  },
];
