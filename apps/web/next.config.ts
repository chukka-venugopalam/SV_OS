import path from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@sv-os/ui', '@sv-os/types', '@sv-os/config'],
  // Set tracing root to the monorepo root so standalone output preserves
  // project-relative paths for static assets and public files.
  // __dirname = apps/web, ../.. = monorepo root
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
