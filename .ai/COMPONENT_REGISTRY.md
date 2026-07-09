# Component Registry

## UI Components (packages/ui) — 25 total

### Base Primitives

| Component | File                                | Status |
| --------- | ----------------------------------- | ------ |
| cn()      | packages/ui/src/cn.ts               | ✅     |
| Button    | packages/ui/src/button.tsx          | ✅     |
| Label     | packages/ui/src/label.tsx           | ✅     |
| Badge     | packages/ui/src/badge.tsx           | ✅     |
| Separator | packages/ui/src/separator.tsx       | ✅     |
| Spinner   | packages/ui/src/loading-spinner.tsx | ✅     |
| Skeleton  | packages/ui/src/skeleton.tsx        | ✅     |

### Data Display

| Component  | File                            | Status |
| ---------- | ------------------------------- | ------ |
| Card       | packages/ui/src/card.tsx        | ✅     |
| Avatar     | packages/ui/src/avatar.tsx      | ✅     |
| Progress   | packages/ui/src/progress.tsx    | ✅     |
| ScrollArea | packages/ui/src/scroll-area.tsx | ✅     |

### Form Controls

| Component | File                         | Status |
| --------- | ---------------------------- | ------ |
| Input     | packages/ui/src/input.tsx    | ✅     |
| Textarea  | packages/ui/src/textarea.tsx | ✅     |

### Feedback

| Component        | File                                      | Status |
| ---------------- | ----------------------------------------- | ------ |
| Alert            | packages/ui/src/alert.tsx                 | ✅     |
| EmptyState       | packages/ui/src/empty-state.tsx           | ✅     |
| ErrorState       | packages/ui/src/error-state.tsx           | ✅     |
| LoadingState     | packages/ui/src/loading-state.tsx         | ✅     |
| Toast (Provider) | apps/web/src/providers/toast-provider.tsx | ✅     |

### Navigation

| Component  | File                           | Status |
| ---------- | ------------------------------ | ------ |
| Breadcrumb | packages/ui/src/breadcrumb.tsx | ✅     |
| Tabs       | packages/ui/src/tabs.tsx       | ✅     |
| Accordion  | packages/ui/src/accordion.tsx  | ✅     |

### Overlay

| Component      | File                                | Status |
| -------------- | ----------------------------------- | ------ |
| Dialog         | packages/ui/src/dialog.tsx          | ✅     |
| DropdownMenu   | packages/ui/src/dropdown-menu.tsx   | ✅     |
| Popover        | packages/ui/src/popover.tsx         | ✅     |
| Tooltip        | packages/ui/src/tooltip.tsx         | ✅     |
| HoverCard      | packages/ui/src/hover-card.tsx      | ✅     |
| ContextMenu    | packages/ui/src/context-menu.tsx    | ✅     |
| CommandPalette | packages/ui/src/command-palette.tsx | ✅     |

## Layout Components (apps/web) — 6 total

| Component     | File                                              | Status |
| ------------- | ------------------------------------------------- | ------ |
| AppShell      | apps/web/src/components/layout/app-shell.tsx      | ✅     |
| Sidebar       | apps/web/src/components/layout/sidebar.tsx        | ✅     |
| TopNav        | apps/web/src/components/layout/top-nav.tsx        | ✅     |
| Footer        | apps/web/src/components/layout/footer.tsx         | ✅     |
| ThemeSwitcher | apps/web/src/components/layout/theme-switcher.tsx | ✅     |
| SearchBar     | apps/web/src/components/layout/search-bar.tsx     | ✅     |

## Providers (apps/web) — 6 total

| Component          | File                                            | Status |
| ------------------ | ----------------------------------------------- | ------ |
| ThemeProvider      | apps/web/src/providers/theme-provider.tsx       | ✅     |
| ReactQueryProvider | apps/web/src/providers/react-query-provider.tsx | ✅     |
| ToastProvider      | apps/web/src/providers/toast-provider.tsx       | ✅     |
| ModalProvider      | apps/web/src/providers/modal-provider.tsx       | ✅     |
| CommandProvider    | apps/web/src/providers/command-provider.tsx     | ✅     |
| GraphProvider      | apps/web/src/providers/graph-provider.tsx       | ✅     |

## Hooks (apps/web) — 7 total

| Hook                | File                                        | Status |
| ------------------- | ------------------------------------------- | ------ |
| useTheme            | apps/web/src/hooks/use-theme.ts             | ✅     |
| useMediaQuery       | apps/web/src/hooks/use-media-query.ts       | ✅     |
| useLocalStorage     | apps/web/src/hooks/use-local-storage.ts     | ✅     |
| useDebounce         | apps/web/src/hooks/use-debounce.ts          | ✅     |
| useMounted          | apps/web/src/hooks/use-mounted.ts           | ✅     |
| useKeyboardShortcut | apps/web/src/hooks/use-keyboard-shortcut.ts | ✅     |
| useWindowSize       | apps/web/src/hooks/use-window-size.ts       | ✅     |

## Graph Infrastructure (apps/web) — 4 files

| File                                           | Status |
| ---------------------------------------------- | ------ |
| apps/web/src/components/graph/flow-config.ts   | ✅     |
| apps/web/src/components/graph/flow-helpers.ts  | ✅     |
| apps/web/src/components/graph/flow-registry.ts | ✅     |

## App Router Pages — 6 files

| Page                | File                                       | Status |
| ------------------- | ------------------------------------------ | ------ |
| Home                | apps/web/src/app/page.tsx                  | ✅     |
| Error               | apps/web/src/app/error.tsx                 | ✅     |
| Loading             | apps/web/src/app/loading.tsx               | ✅     |
| Not Found           | apps/web/src/app/not-found.tsx             | ✅     |
| Dashboard (minimal) | apps/web/src/app/(main)/dashboard/page.tsx | ✅     |
| Login (placeholder) | apps/web/src/app/(auth)/login/page.tsx     | ✅     |

**Total: 25 UI components + 6 layout + 6 providers + 7 hooks + 6 pages = 50 total**
