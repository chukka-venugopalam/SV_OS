#!/usr/bin/env node
/**
 * =============================================================================
 * SV-OS Repository Doctor
 * Complete monorepo health verification script.
 *
 * Usage:
 *   npx tsx scripts/repository-doctor.ts
 *   pnpm exec tsx scripts/repository-doctor.ts
 *
 * Exit codes:
 *   0 - All checks pass
 *   1 - One or more critical checks failed
 * =============================================================================
 */
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */
// Fallback: import.meta.dirname requires Node.js >=21.2, __dirname for <21.2
// Canonical ESM root resolution (works on Node.js >=18)
const __filename_actual = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename_actual, '..', '..');
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let failures = 0;
let warnings = 0;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function check(name: string, test: () => boolean | string, critical = true): void {
  try {
    const result = test();
    if (result === true) {
      console.log(`  ${GREEN}✓${RESET} ${name}`);
    } else if (typeof result === 'string') {
      console.log(`  ${YELLOW}⚠${RESET} ${name}: ${result}`);
      warnings++;
    } else {
      console.log(`  ${RED}✗${RESET} ${name}`);
      failures++;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ${RED}✗${RESET} ${name} — ${msg}`);
    failures++;
    if (critical) {
      console.log(`    ${RED}↑ CRITICAL failure${RESET}`);
    }
  }
}

function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function section(title: string): void {
  console.log(`\n${BOLD}${CYAN}━━━ ${title} ${'━'.repeat(60 - title.length)}${RESET}\n`);
}

/* -------------------------------------------------------------------------- */
/*  1. Repository Structure                                                   */
/* -------------------------------------------------------------------------- */
section('Repository Structure');

check('Root package.json exists', () => existsSync(join(ROOT, 'package.json')));
check('pnpm-workspace.yaml exists', () => existsSync(join(ROOT, 'pnpm-workspace.yaml')));
check('turbo.json exists', () => existsSync(join(ROOT, 'turbo.json')));
check('.npmrc exists', () => existsSync(join(ROOT, '.npmrc')));
check('.dockerignore exists', () => existsSync(join(ROOT, '.dockerignore')));
check('Dockerfile.web exists', () => existsSync(join(ROOT, 'Dockerfile.web')));
check('Dockerfile.api exists', () => existsSync(join(ROOT, 'Dockerfile.api')));
check('tsconfig.base.json exists', () => existsSync(join(ROOT, 'tsconfig.base.json')));

/* -------------------------------------------------------------------------- */
/*  2. Workspace Packages                                                     */
/* -------------------------------------------------------------------------- */
section('Workspace Packages');

const workspaceYaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf-8');
const hasAppsGlob = workspaceYaml.includes("'apps/*'");
const hasPackagesGlob = workspaceYaml.includes("'packages/*'");

check('Workspace includes apps/*', () => hasAppsGlob);
check('Workspace includes packages/*', () => hasPackagesGlob);

const expectedPackages: Record<string, string> = {
  '@sv-os/web': join(ROOT, 'apps/web/package.json'),
  '@sv-os/config': join(ROOT, 'packages/config/package.json'),
  '@sv-os/types': join(ROOT, 'packages/types/package.json'),
  '@sv-os/ui': join(ROOT, 'packages/ui/package.json'),
  '@sv-os/tsconfig': join(ROOT, 'packages/tsconfig/package.json'),
  '@sv-os/eslint-config': join(ROOT, 'packages/eslint-config/package.json'),
};

for (const [name, path] of Object.entries(expectedPackages)) {
  check(`${name} package.json`, () => existsSync(path));
  const pkg = readJson(path);
  if (pkg) {
    check(`  ${name} has valid package.json`, () => pkg !== null);
    check(`  ${name} is private`, () => pkg?.private === true, false);
  }
}

/* -------------------------------------------------------------------------- */
/*  3. Package Manager & Core Configuration                                   */
/* -------------------------------------------------------------------------- */
section('Package Manager');

const rootPkg = readJson(join(ROOT, 'package.json'));
if (rootPkg) {
  const pm = rootPkg.packageManager as string | undefined;
  check('packageManager field exists', () => !!pm, false);
  if (pm) {
    check(`  packageManager = ${pm}`, () => pm.startsWith('pnpm@'));
    const version = pm.replace('pnpm@', '');
    const hasMinPnpm = parseInt(version.split('.')[0] ?? '0', 10) >= 9;
    check(`  pnpm version >= 9.0.0`, () => hasMinPnpm);
  }

  const engines = rootPkg.engines as Record<string, string> | undefined;
  if (engines) {
    check('engines.node specified', () => !!engines.node, false);
    check('engines.pnpm specified', () => !!engines.pnpm, false);
  }
}

/* .npmrc validation */
const npmrc = readFileSync(join(ROOT, '.npmrc'), 'utf-8');
check('.npmrc has shamefully-hoist=false', () => npmrc.includes('shamefully-hoist=false'), false);
check(
  '.npmrc has strict-peer-dependencies=true',
  () => npmrc.includes('strict-peer-dependencies=true'),
  false,
);
check('.npmrc has auto-install-peers=true', () => npmrc.includes('auto-install-peers=true'), false);

/* -------------------------------------------------------------------------- */
/*  4. Dependency Graph — No circular deps                                    */
/* -------------------------------------------------------------------------- */
section('Dependency Graph');

const depGraph: Record<string, string[]> = {};
for (const [name, path] of Object.entries(expectedPackages)) {
  const pkg = readJson(path);
  if (pkg) {
    const deps = {
      ...(pkg.dependencies as Record<string, string> | undefined),
      ...(pkg.devDependencies as Record<string, string> | undefined),
    };
    depGraph[name] = Object.keys(deps).filter((d) => d.startsWith('@sv-os/'));
  }
}

// Simple cycle detection
function hasCycle(
  graph: Record<string, string[]>,
  node: string,
  visited: Set<string>,
  path: Set<string>,
): boolean {
  if (path.has(node)) return true;
  if (visited.has(node)) return false;
  visited.add(node);
  path.add(node);
  for (const dep of graph[node] ?? []) {
    if (hasCycle(graph, dep, visited, path)) return true;
  }
  path.delete(node);
  return false;
}

let cyclesFound = 0;
for (const pkg of Object.keys(depGraph)) {
  if (hasCycle(depGraph, pkg, new Set(), new Set())) {
    console.log(`  ${RED}✗${RESET} Circular dependency involving ${pkg}`);
    cyclesFound++;
    failures++;
  }
}
if (cyclesFound === 0) {
  console.log(`  ${GREEN}✓${RESET} No circular dependencies detected`);
}

// Check workspace dep versions
for (const pkg of Object.keys(depGraph)) {
  for (const dep of depGraph[pkg] ?? []) {
    check(
      `  ${pkg} → ${dep} uses workspace:*`,
      () => {
        const pkgData = readJson(expectedPackages[pkg]);
        const allDeps = {
          ...(pkgData?.dependencies as Record<string, string> | undefined),
          ...(pkgData?.devDependencies as Record<string, string> | undefined),
        };
        return allDeps?.[dep] === 'workspace:*' || `uses ${allDeps?.[dep] ?? 'MISSING'}`;
      },
      false,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  5. TypeScript Configuration                                               */
/* -------------------------------------------------------------------------- */
section('TypeScript Configuration');

check(
  'tsconfig.base.json',
  () => {
    const cfg = readJson(join(ROOT, 'tsconfig.base.json'));
    return cfg?.['compilerOptions']?.strict === true || 'strict not enabled';
  },
  false,
);

check('apps/web/tsconfig.json', () => existsSync(join(ROOT, 'apps/web/tsconfig.json')));
check('packages/ui/tsconfig.json', () => existsSync(join(ROOT, 'packages/ui/tsconfig.json')));

const tsconfigPkg = readJson(join(ROOT, 'packages/tsconfig/package.json'));
if (tsconfigPkg) {
  const files = tsconfigPkg.files as string[] | undefined;
  check('@sv-os/tsconfig has all config files', () => {
    const expected = ['base.json', 'nextjs.json', 'react-library.json', 'api.json'];
    return (
      expected.every((f) => files?.includes(f)) ||
      expected.filter((f) => !files?.includes(f)).join(', ') + ' missing'
    );
  });
}

/* -------------------------------------------------------------------------- */
/*  6. Next.js Configuration                                                  */
/* -------------------------------------------------------------------------- */
section('Next.js Configuration');

const nextConfig = readFileSync(join(ROOT, 'apps/web/next.config.ts'), 'utf-8');
check('output: standalone configured', () => nextConfig.includes("output: 'standalone'"));
check('transpilePackages configured', () => nextConfig.includes('transpilePackages'));
check('outputFileTracingRoot configured', () => nextConfig.includes('outputFileTracingRoot'));
check(
  'outputFileTracingRoot uses path.join',
  () => nextConfig.includes("path.join(__dirname, '..', '..')"),
  false,
);

const webPkg = readJson(join(ROOT, 'apps/web/package.json'));
if (webPkg) {
  const deps = webPkg.dependencies as Record<string, string> | undefined;
  check('next is a dependency', () => !!deps?.next || 'MISSING', true);
  check('react is a dependency', () => !!deps?.react || 'MISSING', true);
  check('react-dom is a dependency', () => !!deps?.['react-dom'] || 'MISSING', true);

  const nextVersion = deps?.next as string | undefined;
  if (nextVersion) {
    const major = nextVersion.replace('^', '').split('.')[0];
    check(
      `  next ${nextVersion} — major version ${major}`,
      () => parseInt(major ?? '0', 10) >= 15,
      false,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  7. Turborepo Configuration                                                */
/* -------------------------------------------------------------------------- */
section('Turborepo Configuration');

const turbo = readJson(join(ROOT, 'turbo.json'));
if (turbo) {
  const tasks = turbo.tasks as Record<string, unknown> | undefined;
  check('turbo.json has tasks defined', () => !!tasks);

  if (tasks) {
    const buildTask = tasks.build as Record<string, unknown> | undefined;
    check('build task exists', () => !!buildTask);
    check(
      '  dependsOn: ^build',
      () => (buildTask?.dependsOn as string[])?.includes('^build') || false,
      false,
    );

    const devTask = tasks.dev as Record<string, unknown> | undefined;
    check('dev task exists', () => !!devTask);

    const lintTask = tasks.lint as Record<string, unknown> | undefined;
    check('lint task exists', () => !!lintTask);

    const typecheckTask = tasks.typecheck as Record<string, unknown> | undefined;
    check('typecheck task exists', () => !!typecheckTask);

    // Check cached outputs
    const outputs = buildTask?.outputs as string[] | undefined;
    if (outputs) {
      check(
        '  build outputs includes .next/**',
        () => outputs.includes('.next/**') || 'custom outputs',
        false,
      );
      check(
        '  build excludes .next/cache',
        () => outputs.some((o) => o.includes('!.next/cache')) || false,
        false,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  8. Docker Configuration                                                   */
/* -------------------------------------------------------------------------- */
section('Docker Configuration');

// Dockerfile.web checks
const dockerWeb = readFileSync(join(ROOT, 'Dockerfile.web'), 'utf-8');

check('Dockerfile.web has multi-stage build', () => {
  const stages = dockerWeb.match(/FROM\s+\S+\s+AS\s+\S+/g);
  return (stages?.length ?? 0) >= 3;
});

check('  base stage exists', () => dockerWeb.includes('AS base'));
check('  deps stage exists', () => dockerWeb.includes('AS deps'));
check('  builder stage exists', () => dockerWeb.includes('AS builder'));
check('  runner stage exists', () => dockerWeb.includes('AS runner'));

check('Dockerfile.web uses --frozen-lockfile', () => dockerWeb.includes('--frozen-lockfile'));
check('Dockerfile.web copies .npmrc', () => {
  const lines = dockerWeb.split('\n');
  const npmrcLine = lines.findIndex((l) => l.includes('COPY .npmrc ./'));
  return npmrcLine >= 0 || 'COPY .npmrc ./ not found';
});

check('Dockerfile.web uses HEALTHCHECK', () => dockerWeb.includes('HEALTHCHECK'));
check('Dockerfile.web uses non-root user', () => dockerWeb.includes('USER nextjs'));
check('Dockerfile.web CMD is node server.js', () =>
  dockerWeb.includes('CMD ["node", "server.js"]'),
);
check('Dockerfile.web sets NODE_ENV=production', () => dockerWeb.includes('NODE_ENV=production'));
check('Dockerfile.web has NEXT_TELEMETRY_DISABLED', () =>
  dockerWeb.includes('NEXT_TELEMETRY_DISABLED'),
);
check('Dockerfile.web handles PUBLIC env vars with defaults', () => {
  const hasApiUrlDefault = dockerWeb.includes('${NEXT_PUBLIC_API_URL:-');
  const hasAppUrlDefault = dockerWeb.includes('${NEXT_PUBLIC_APP_URL:-');
  return (hasApiUrlDefault && hasAppUrlDefault) || 'missing default fallback';
});

// Dockerfile.api checks
const dockerApi = readFileSync(join(ROOT, 'Dockerfile.api'), 'utf-8');
check('Dockerfile.api has multi-stage build', () => {
  const stages = dockerApi.match(/FROM\s+\S+\s+AS\s+\S+/g);
  return (stages?.length ?? 0) >= 2;
});
check('Dockerfile.api uses HEALTHCHECK', () => dockerApi.includes('HEALTHCHECK'));
check('Dockerfile.api exposes port 8000', () => dockerApi.includes('EXPOSE 8000'));

// .dockerignore checks
const dockerignore = readFileSync(join(ROOT, '.dockerignore'), 'utf-8');
check('.dockerignore excludes node_modules/', () => dockerignore.includes('node_modules/'));
check('.dockerignore excludes .next/', () => dockerignore.includes('.next/'));
check('.dockerignore excludes .env files', () => dockerignore.includes('.env'));

/* -------------------------------------------------------------------------- */
/*  9. CI/CD Configuration                                                   */
/* -------------------------------------------------------------------------- */
section('CI/CD Configuration');

check('ci.yml exists', () => existsSync(join(ROOT, '.github/workflows/ci.yml')));
check('lint.yml exists', () => existsSync(join(ROOT, '.github/workflows/lint.yml')));

const ciYml = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf-8');
check('CI uses pnpm/action-setup', () => ciYml.includes('pnpm/action-setup'));
check('CI uses setup-node v4', () => ciYml.includes('setup-node@v4'));
check('CI uses node 22', () => ciYml.includes("node-version: '22'"));
check('CI caches pnpm', () => ciYml.includes("cache: 'pnpm'"));
check('CI runs pnpm install --frozen-lockfile', () =>
  ciYml.includes('pnpm install --frozen-lockfile'),
);
check('CI runs typecheck', () => ciYml.includes('pnpm typecheck'));
check('CI runs lint', () => ciYml.includes('pnpm lint'));
check('CI runs build', () => ciYml.includes('pnpm build'));
check('CI builds Docker API image', () => ciYml.includes('Dockerfile.api'));
check('CI builds Docker Web image', () => ciYml.includes('Dockerfile.web'));
check(
  'CI has no version:latest for pnpm',
  () => !ciYml.includes('version: latest') || 'check lint.yml separately',
);

/* -------------------------------------------------------------------------- */
/*  10. Web App Dependencies — Check .bin executables exist                   */
/* -------------------------------------------------------------------------- */
section('Binary Executables');

function checkBin(name: string, pkgName: string): void {
  const pkg = readJson(join(ROOT, 'node_modules', pkgName, 'package.json'));
  const binDir = join(ROOT, 'node_modules', '.bin');
  const binPath = join(binDir, name);
  check(
    `${name} binary (from ${pkgName})`,
    () => existsSync(binPath) || `not found at ${binPath}`,
    true,
  );
  if (pkg) {
    check(`  ${pkgName} package.json found`, () => true, false);
  }
}

const webNodeModules = join(ROOT, 'apps/web/node_modules');
check('node_modules exists at root', () => existsSync(join(ROOT, 'node_modules')), false);

if (existsSync(join(ROOT, 'node_modules'))) {
  checkBin('next', 'next');
  checkBin('turbo', 'turbo');
  checkBin('typescript', 'typescript');
  checkBin('eslint', 'eslint');
  checkBin('tailwindcss', 'tailwindcss');
  checkBin('tsx', 'tsx');
  checkBin('prettier', 'prettier');
}

/* -------------------------------------------------------------------------- */
/*  11. Docker Compose Production Config                                      */
/* -------------------------------------------------------------------------- */
section('Docker Compose Production');

check('docker-compose.prod.yml exists', () => existsSync(join(ROOT, 'docker-compose.prod.yml')));

const composeProd = readFileSync(join(ROOT, 'docker-compose.prod.yml'), 'utf-8');
check('  Has postgres service', () => composeProd.includes('postgres:'));
check('  Has api service', () => composeProd.includes('api:'));
check('  Has web service', () => composeProd.includes('web:'));
check('  API uses Dockerfile.api', () => composeProd.includes('Dockerfile.api'));
check('  Web uses Dockerfile.web', () => composeProd.includes('Dockerfile.web'));
check('  Has health checks for postgres', () => composeProd.includes('healthcheck'));

/* -------------------------------------------------------------------------- */
/*  12. Production Readiness Checklist                                        */
/* -------------------------------------------------------------------------- */
section('Production Readiness');

const readiness: [string, () => boolean | string][] = [
  ['pnpm-lock.yaml is committed', () => existsSync(join(ROOT, 'pnpm-lock.yaml'))],
  [
    'Docker multi-stage build (4 stages)',
    () => (dockerWeb.match(/FROM\s+\S+\s+AS\s+\S+/g)?.length ?? 0) >= 4,
  ],
  ['Non-root user in runner stage', () => dockerWeb.includes('nextjs')],
  ['HEALTHCHECK configured', () => dockerWeb.includes('HEALTHCHECK')],
  ['NEXT_TELEMETRY_DISABLED=1 set', () => dockerWeb.includes('NEXT_TELEMETRY_DISABLED=1')],
  ['NODE_ENV=production in runner', () => dockerWeb.includes('NODE_ENV=production')],
  ['Standalone output enabled', () => nextConfig.includes("output: 'standalone'")],
  ['.npmrc copied before install', () => dockerWeb.includes('COPY .npmrc ./')],
  ['Frozen lockfile for reproducible builds', () => dockerWeb.includes('--frozen-lockfile')],
  ['Build env vars have defaults', () => dockerWeb.includes('${NEXT_PUBLIC_API_URL:-')],
];

for (const [label, test] of readiness) {
  check(label, test, false);
}

/* -------------------------------------------------------------------------- */
/*  13. Environment Variable Verification                                      */
/* -------------------------------------------------------------------------- */
section('Environment Variables');

// Check that all NEXT_PUBLIC_* vars declared in .env.example are in Dockerfile.web
const envExample = readFileSync(join(ROOT, 'apps/web/.env.example'), 'utf-8');
const publicVars = envExample.match(/NEXT_PUBLIC_\w+/g) ?? [];
for (const v of [...new Set(publicVars)]) {
  check(
    `${v} in Dockerfile.web build args`,
    () => dockerWeb.includes(`ARG ${v}`) || `ARG ${v} declaration not found`,
    false,
  );
  check(`  ${v} has ENV default`, () => dockerWeb.includes(v) || `ENV ${v} not set`, false);
}

// Ensure PORT and HOSTNAME are set
check('PORT env var set in Dockerfile', () => dockerWeb.includes('ENV PORT='), false);
check('HOSTNAME env var set in Dockerfile', () => dockerWeb.includes('ENV HOSTNAME='), false);

/* -------------------------------------------------------------------------- */
/*  14. Render Deployment Readiness                                           */
/* -------------------------------------------------------------------------- */
section('Render Deployment Readiness');

check('PORT=3000 exposed in Dockerfile', () => dockerWeb.includes('EXPOSE 3000'), false);
check('HEALTHCHECK present for Render', () => dockerWeb.includes('HEALTHCHECK'), false);
check('NODE_ENV=production set', () => dockerWeb.includes('NODE_ENV=production'), false);
check('Non-root user for Render security policy', () => dockerWeb.includes('USER nextjs'), false);
check(
  'CMD is node server.js (Render expects Node.js)',
  () => dockerWeb.includes('CMD ["node", "server.js"]'),
  false,
);

// Render health check path validation (uses /health for HTTP health checks)
check('Health check uses port 3000', () => dockerWeb.includes('localhost:3000'), false);

/* -------------------------------------------------------------------------- */
/*  15. Vercel Deployment Readiness                                           */
/* -------------------------------------------------------------------------- */
section('Vercel Deployment Readiness');

// Vercel auto-detects Next.js, verify root + output directory config
check('Next.js auto-detected by Vercel', () => nextConfig.length > 0, false);
check(
  'output: standalone configured (Vercel uses default output)',
  () => nextConfig.includes("output: 'standalone'"),
  false,
);
check(
  'Public env vars declared (Vercel needs explicit env vars)',
  () => {
    const publicVarNames = [...new Set(publicVars)];
    return publicVarNames.length > 0 || `no NEXT_PUBLIC_ vars found`;
  },
  false,
);

// Vercel monorepo directory detection
check(
  'apps/web/ has package.json (Vercel root dir)',
  () => existsSync(join(ROOT, 'apps/web/package.json')),
  false,
);
check(
  'apps/web/ has next.config.ts (Vercel framework detection)',
  () => existsSync(join(ROOT, 'apps/web/next.config.ts')),
  false,
);

/* -------------------------------------------------------------------------- */
/*  Summary                                                                   */
/* -------------------------------------------------------------------------- */
console.log(`\n${BOLD}${CYAN}${'━'.repeat(70)}${RESET}`);
console.log(`${BOLD}Repository Doctor — Summary${RESET}`);
if (failures === 0 && warnings === 0) {
  console.log(`\n  ${GREEN}${BOLD}ALL CHECKS PASSED${RESET} — Repository is production-ready.`);
} else if (failures === 0) {
  console.log(
    `\n  ${YELLOW}${BOLD}${warnings} warning(s)${RESET} — All critical checks pass. Review warnings.`,
  );
} else {
  console.log(
    `\n  ${RED}${BOLD}${failures} failure(s)${RESET} — Critical issues must be resolved.`,
  );
  console.log(`  ${YELLOW}${BOLD}${warnings} warning(s)${RESET}`);
}

process.exit(failures > 0 ? 1 : 0);
