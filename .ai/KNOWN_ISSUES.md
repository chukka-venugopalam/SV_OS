# Known Issues

| ID     | Issue                                                      | Category       | Status     | Notes                                             |
| ------ | ---------------------------------------------------------- | -------------- | ---------- | ------------------------------------------------- |
| KI-001 | No code has been generated yet                             | Development    | Open       | Phase 1 was architecture-only                     |
| KI-002 | Recursive CTEs need depth limits to prevent infinite loops | Database       | Resolved   | Depth limits of 10 configured in schema           |
| KI-003 | No caching implementation yet                              | Performance    | Open       | Cache strategy designed but not implemented       |
| KI-004 | No rate limiting implementation                            | Security       | Open       | Rate limits designed but not implemented          |
| KI-005 | No test coverage                                           | Testing        | Open       | Phase 2.1 added Python health tests (3 passing)   |
| KI-006 | No mobile-specific optimizations                           | Accessibility  | Deferred   | Responsive design planned                         |
| KI-007 | Dark mode is default — light mode may need refinement      | UI             | Deferred   | Light mode support will be refined                |
| KI-008 | Tailwind v4: config file is stub (tooling only)            | Configuration  | Resolved   | Documented in tailwind.config.ts                  |
| KI-009 | pnpm approve-builds may fail on Windows PATH               | Dev Experience | Workaround | Approve manually per package                      |
| KI-010 | Husky requires `git init` before hooks work                | Dev Experience | Open       | Run `git init` before `pnpm install`              |
| KI-011 | No shadcn/ui components generated yet                      | UI             | Open       | components.json ready, components pending Phase 6 |
