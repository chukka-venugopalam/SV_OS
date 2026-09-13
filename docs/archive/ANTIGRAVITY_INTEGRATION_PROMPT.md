> **SUPERSEDED** — integration task completed September 2026. Archived for historical reference only.

# SV-OS — Antigravity Integration Prompt

Paste this as the first message in Antigravity. This zip is a **drop-in replacement**
for the root of the existing SV-OS repo — it was produced by extending the current
codebase in place (same file structure, same conventions), not a rewrite. Your job is
to integrate it: install, build, type-check, run it against the live Supabase project,
fix anything that doesn't compile, and verify the fixes actually work end to end.

**Explicitly out of scope — do not touch:** the Simulators feature (`/simulators` page,
`apps/api/app/api/v1/endpoints/simulators.py`, `components/simulators/*`) and anything
under AI (`ai-chat`, `services/ai/*.py`, `hooks/use-ai*`, recommendation/semantic-search
services). Leave these exactly as they are, including their known bugs — they're being
handled in a separate session.

## Golden rules carried over from the whole project (non-negotiable)

- **Verify against the live DB, not this document's numbers.** Re-run the checks below
  yourself before trusting them — the DB may have changed since this was written.
- **Extend/update, never hard-delete** DB rows. `is_deleted`/`is_published` exist for a
  reason.
- Supabase project ID: `ricdottheyzsvnnhojuh` (region ap-south-1). Use the Supabase MCP
  connector / `execute_sql` for all DB checks.

## What this zip already contains (done, needs verification not re-doing)

### DB changes (already executed and verified against live Supabase this session)

- 207 previously-hidden `verified`-quality nodes were published
- 13 thin/stub nodes that were live were unpublished (checked: no `worked_example`, no
  `sources`, 49-194 char descriptions — confirmed genuinely stub-quality, not a mistake)
- Current live state (verify this first): 292 published / 78 unpublished-stub / 1 draft
  = 371 live nodes, 52 distinct districts across acts 1-8

### Backend (`apps/api`)

- `models/knowledge_node.py`: added missing `content_status` ORM column mapping (DB had
  this column; the ORM never mapped it — the API was faking it from a metadata JSON key
  with a bogus `'published'` default)
- `api/v1/endpoints/nodes.py`: `_node_to_dict()` now serializes `act`/`district`/`tier`/
  `chapter_number`/real `content_status`, and lifts `worked_example`/`sources`/
  `simulators`/`common_mistakes`/etc. out of the metadata blob as top-level fields.
  Added `act`/`district`/`tier` query params to `GET /nodes`. Added two new endpoints:
  `GET /nodes/curriculum-path?tier=gate_core` (full ordered sequence, act→district→
  chapter_number) and `GET /nodes/districts?act=<n>` (distinct districts with counts).
  Both registered _before_ `/{slug}` in the router — verify FastAPI didn't reorder them
  if you add anything else here, or `/{slug}` will shadow them.
- `services/knowledge_node.py` + `repositories/knowledge_node.py`: filters and the two
  new query methods (`find_curriculum_path`, `list_districts`) wired through.
- **Found but only partially fixed — a real architecture problem**: there are **14
  separate, duplicated `_node_to_dict()` functions** scattered across the backend
  (`grep -rln "^def _node_to_dict" apps/api/app` to see them all). Each one independently
  decides which node fields to expose, so a fix to one (like the one above) doesn't
  propagate to the others. This session fixed three of them — `services/graph/
traversal.py`, `api/v1/endpoints/careers.py`, `api/v1/endpoints/projects.py` — to
  include `act`/`district`/`tier`/`chapter_number` consistently, because those three
  directly back pages in scope (Graph, Careers, Projects). **Left untouched** (not in
  scope, or AI-related): `services/progress_intelligence.py`, `services/
recommendation_engine.py`, `services/learning_path_generator.py`, `engines/
graph_engine.py`, `api/v1/endpoints/search.py`, `api/v1/endpoints/recommendations.py`,
  `api/v1/endpoints/graph.py`, and all four under `services/ai/*.py`. Recommend a
  follow-up task: consolidate all 14 into one shared serializer function. Don't do this
  silently — it touches a lot of surface area, confirm scope with the user first.

### Frontend (`apps/web`)

- **`page_size` → `per_page` fixed everywhere** (was a systemic bug: every backend
  endpoint reads `per_page`, the entire frontend sent `page_size`, so custom page sizes
  silently never worked, anywhere, on any list, ever). Root cause was `types/helpers.ts`
  `PaginationParams`; fixed there and propagated to ~19 call sites. Verify with
  `grep -rn "page_size" apps/web/src` — should return nothing.
- `packages/types/src/graph.ts` (`KnowledgeNode`) and `packages/types/src/project.ts`
  (`Project`): both had drifted from the real API response shape independent of this
  session's other work (`icon_name` vs real `icon`, `metadata` vs real `extra_metadata`,
  `estimated_time: string` vs real `estimated_hours: number`). Fixed both, verified
  against the actual `_node_to_dict`/`_project_to_dict` output, not guessed.
- **Explorer** (`/explore`): added Tier filter, Act filter (static 1-8, these are fixed
  by design), and a live **District filter** populated from the new `/nodes/districts`
  endpoint, scoped to the selected act. This was the main "districts/acts/nodes should
  be full and aligned" gap — previously there was no district-level filtering at all
  despite 52 real districts existing.
- **Node detail page** (`/explore/[slug]`): added the missing `worked_example` section
  (shape verified against real content source: `SVOS content/73_nodes/*.jsonl` →
  `{setup, steps[], result}` — not guessed). Fixed a bug where "cross-domain connections"
  cards read `node.metadata`, a field the API never returns — they had never rendered,
  ever; now read the real top-level field.
- **Guided Path** (`/learning-path`): fully rewritten. Was a hardcoded static array
  (`gate-path-nodes.ts`, since deleted) where 59/72 slugs (82%) pointed at soft-deleted
  nodes. Now queries `/nodes/curriculum-path?tier=gate_core` live.
- **Graph page** (`/graph`): fixed a local, file-scoped `GraphNode` TypeScript interface
  that was _written_ with a shape that never matched the API (`metadata: {
estimated_minutes }` — that key never existed in the response). The node detail panel's
  duration badge had never rendered. Now uses real top-level `estimated_minutes`/`act`/
  `district` fields and shows them.
- **Careers**: added real per-career icons (12 stable slugs, hardcoded map — safe, these
  slugs aren't churning like node slugs are). Fixed a **hardcoded 40% progress bar** with
  no backing data. Found the roadmap feature depends on `career_requirements`, a table
  that's **completely empty** (verified) — a second, parallel, unpopulated mechanism
  alongside `learning_goal_nodes`/`learning_goals` (the one this project's other
  handoff describes as intended for future per-career curriculum). Fixed the TS type
  for that endpoint (it didn't match the real response shape either), and the UI now
  shows an honest "not built yet, here's the GATE-core path instead" message rather than
  silently failing. Fixed a "View Learning Path" button that pointed at `?career=slug`,
  a query param the Explorer never supported. Fixed a mislabeled "Compare Careers"
  button that was just a back-link.
- **Projects**: confirmed the 8 demo HTML files are correctly deployed in `public/
projects-demo/` and DB `demo_url` paths match (this was flagged "not yet deployed" in
  an older handoff — it's actually done). Fixed `estimated_time` (string, never existed)
  → `estimated_hours` (number, real field) on both list and detail pages — that Clock
  badge had never rendered either.

### Known open items — need your input or a decision, not guessed

1. **Simulators** — explicitly out of scope for you, per above. A separate hardcoded
   31-slug registry exists on both frontend and backend; 27/31 point at soft-deleted
   nodes, 1 doesn't exist, 3 work. Left untouched.
2. **The 14-duplicate-serializer problem** above — flagged, partially addressed, needs
   a scoped decision on full consolidation.
3. **`career_requirements` vs `learning_goal_nodes`** — two empty tables for the same
   concept (career curriculum sequencing). Recommend picking one (likely
   `learning_goal_nodes`, since that's what a prior session in this project deliberately
   built) and deprecating the other. Don't decide this unilaterally — ask the user.
4. No real TypeScript compile has been run against any of this (sandbox had no
   `node_modules`, no network to the private registry/tooling). Treat everything above
   as **VERIFY, not DONE**, until a real build passes.

## Your task, in order

1. `pnpm install` (or whatever this repo's package manager is — check for a lockfile)
   at the root, then `pnpm --filter web type-check` (or equivalent) and `pnpm --filter
api` — whatever the real build/lint commands are, check `package.json` scripts —
   and fix any compile errors that come up. Given the scale of the type-drift fixes in
   this changeset, expect a handful of small knock-on errors in files that weren't
   touched but reference these types — fix them minimally, don't rewrite unrelated code.
2. Run the backend locally against the live Supabase project (`ricdottheyzsvnnhojuh`)
   and smoke-test: `GET /nodes`, `GET /nodes/curriculum-path`, `GET /nodes/districts`,
   `GET /careers/{slug}/roadmap`, `GET /projects/{slug}`, `GET /graph/subgraph`.
3. Run the frontend and click through: Explorer (try the new District filter), a node
   detail page with a `worked_example` (spot-check one Act 8 node), Guided Path, Graph
   page (select a node, check the badges), a Careers detail page, a Projects detail page
   with a live demo link.
4. Re-verify the DB numbers in this document against live Supabase before reporting
   anything back to the user — don't trust this document's counts.
5. Report back: what compiled cleanly, what needed fixing, and confirm the open items
   above with the user before acting on them.
