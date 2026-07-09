// NOTE: This project uses Tailwind CSS v4 — all design tokens and theme configuration
// are defined in `globals.css` via the `@theme` directive.
//
// This file is a stub retained for:
//   1. shadcn/ui's components.json reference
//   2. Prettier's tailwindcss-plugin config resolution
//   3. IDE intellisense compatibility
//
// Tailwind v4 ignores this file at runtime. The actual theme lives in globals.css.

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
