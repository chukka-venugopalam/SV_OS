# Decision Log

Records of features changed from their original design.

| ID     | Original Plan         | New Plan                                         | Reason                                                                  | Date       | Status      |
| ------ | --------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- | ---------- | ----------- |
| DL-001 | pnpm approve-builds   | Approve builds per package via config            | `pnpm approve-builds --global` fails on Windows PATH                    | 2026-06-29 | Resolved    |
| DL-002 | Tailwind v3 JS config | Tailwind v4 CSS-first config + stub JS file      | v4 is faster, modern, CSS-native                                        | 2026-06-29 | Implemented |
| DL-003 | Poetry/uv for Python  | pip + setuptools with explicit package discovery | uv/Poetry not available; pip works with proper config                   | 2026-06-29 | Implemented |
| DL-004 | docker/ directory     | Dockerfiles at root level                        | Single `docker/` dir for configs, Dockerfiles at root for build context | 2026-06-29 | Implemented |
