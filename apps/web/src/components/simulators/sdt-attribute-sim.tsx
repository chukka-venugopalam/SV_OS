/**
 * Component: SdtAttributeSim
 * Serves: act7-d5 "Syntax-Directed Translation" chapter
 *
 * What it demonstrates:
 *   Synthesized mode: semantic attributes (computed numeric values) flowing UP a
 *   parse tree as each production's semantic rule fires, bottom-up, until the root
 *   holds the final computed value.
 *   Inherited mode: a semantic attribute (a declared type) flowing DOWN a parse
 *   tree from a parent to its children, so each leaf can use information only
 *   available from above it.
 *
 * Design decisions:
 *   - Synthesized mode computes an actual arithmetic result (2 + 3 * 4 = 14) via
 *     real per-node evaluation rules, not a hardcoded final number, so every
 *     intermediate .val shown is a genuine computation, traceable node by node.
 *   - Inherited mode uses the standard "int x, y, z" declaration-list example
 *     specifically because it's the textbook case where synthesized attributes alone
 *     can't work — no child node in "x, y, z" has any local information about the
 *     type "int" without it being passed down from the D → T L production above it.
 *   - Both modes reveal the SAME kind of thing (an attribute appearing at a tree
 *     node) but attributes appear in opposite tree-traversal order between the two
 *     modes (leaves-up vs. root-down), which is the entire conceptual difference
 *     being taught — the reveal order itself carries the lesson.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type Mode = 'synthesized' | 'inherited';

// ---------------- Synthesized: E -> E + T | T; T -> T * F | F; F -> num ----------------
interface SynNode {
  id: string;
  label: string;
  val?: number;
  children: SynNode[];
}
// Tree for "2 + 3 * 4"
const SYN_TREE: SynNode = {
  id: 'E',
  label: 'E',
  children: [
    { id: 'F1', label: 'F(2)', val: 2, children: [] },
    { id: 'plus', label: '+', children: [] },
    {
      id: 'T',
      label: 'T',
      children: [
        { id: 'F2', label: 'F(3)', val: 3, children: [] },
        { id: 'times', label: '*', children: [] },
        { id: 'F3', label: 'F(4)', val: 4, children: [] },
      ],
    },
  ],
};
// Evaluation order (bottom-up): compute T.val from F2*F3, then E.val from F1 + T.val
const SYN_STEPS: {
  nodeId: string;
  rule: string;
  compute: (vals: Record<string, number>) => number;
}[] = [
  { nodeId: 'F1', rule: 'F → 2 { F.val = 2 }', compute: () => 2 },
  { nodeId: 'F2', rule: 'F → 3 { F.val = 3 }', compute: () => 3 },
  { nodeId: 'F3', rule: 'F → 4 { F.val = 4 }', compute: () => 4 },
  { nodeId: 'T', rule: 'T → F * F { T.val = F2.val * F3.val }', compute: (v) => v.F2 * v.F3 },
  { nodeId: 'E', rule: 'E → F + T { E.val = F1.val + T.val }', compute: (v) => v.F1 + v.T },
];

function SynTreeView({ node, vals }: { node: SynNode; vals: Record<string, number> }) {
  const v = vals[node.id];
  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-md border px-2 py-1 text-center font-mono text-xs ${v !== undefined ? 'border-emerald-400 bg-emerald-100 text-emerald-800' : 'border-stone-300 bg-white text-stone-700'}`}
      >
        <div>{node.label}</div>
        {v !== undefined && <div className="font-semibold">.val = {v}</div>}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-3 w-px bg-stone-300" />
          <div className="flex gap-3">
            {node.children.map((c) => (
              <SynTreeView key={c.id} node={c} vals={vals} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SynthesizedPanel() {
  const [step, setStep] = useState(0);
  const vals: Record<string, number> = {};
  for (let i = 0; i < step; i++) {
    const s = SYN_STEPS[i];
    vals[s.nodeId] = s.compute(vals);
  }
  const next = () => setStep((s) => Math.min(SYN_STEPS.length, s + 1));
  const reset = () => setStep(0);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-700">
        <strong>Synthesized attributes</strong> are computed from a node's <em>children</em> and
        flow <strong>upward</strong>. Here, each F leaf gets its value directly from a number token,
        then T and E compute their own .val from their children's already-known .val — bottom-up,
        until the root holds the final answer.
      </p>
      <div className="flex gap-2">
        <button
          onClick={next}
          disabled={step >= SYN_STEPS.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Apply next rule
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>
      {step > 0 && <p className="font-mono text-xs text-stone-500">{SYN_STEPS[step - 1].rule}</p>}
      <div className="flex justify-center overflow-x-auto py-2">
        <SynTreeView node={SYN_TREE} vals={vals} />
      </div>
      {step >= SYN_STEPS.length && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            E.val = {vals.E} — the final synthesized result for "2 + 3 * 4", computed bottom-up.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------- Inherited: D -> T L ; L -> L1 , id | id ----------------
interface InhNode {
  id: string;
  label: string;
  type?: string;
  children: InhNode[];
}
const INH_TREE_3: InhNode = {
  id: 'D',
  label: 'D',
  children: [
    { id: 'T', label: 'T(int)', children: [] },
    {
      id: 'L1',
      label: 'L',
      children: [
        {
          id: 'L2',
          label: 'L',
          children: [
            { id: 'L3', label: 'L', children: [{ id: 'id_x', label: 'id(x)', children: [] }] },
            { id: 'comma1', label: ',', children: [] },
            { id: 'id_y', label: 'id(y)', children: [] },
          ],
        },
        { id: 'comma2', label: ',', children: [] },
        { id: 'id_z', label: 'id(z)', children: [] },
      ],
    },
  ],
};
// Propagation order top-down: D passes type to T (read) then to L1; L1 passes down to L2 and stamps id_z; L2 passes down to L3 and stamps id_y; L3 stamps id_x.
const INH_STEPS: { nodeId: string; rule: string }[] = [
  { nodeId: 'D', rule: 'D → T L { L.in = T.type }' },
  { nodeId: 'L1', rule: 'L.in inherited from D = int' },
  { nodeId: 'id_z', rule: 'L → L1, id { addType(id.entry, L.in) } — z gets type int' },
  { nodeId: 'L2', rule: 'L1 → L2, id { L2.in = L1.in = int }' },
  { nodeId: 'id_y', rule: 'addType(id.entry, L2.in) — y gets type int' },
  { nodeId: 'L3', rule: 'L2 → L3, id { L3.in = L2.in = int }' },
  { nodeId: 'id_x', rule: 'addType(id.entry, L3.in) — x gets type int' },
];

function InhTreeView({ node, typed }: { node: InhNode; typed: Set<string> }) {
  const marked = typed.has(node.id);
  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-md border px-2 py-1 text-center font-mono text-xs ${marked ? 'border-sky-400 bg-sky-100 text-sky-800' : 'border-stone-300 bg-white text-stone-700'}`}
      >
        <div>{node.label}</div>
        {marked && node.id !== 'D' && node.id !== 'T' && (
          <div className="font-semibold">.in = int</div>
        )}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-3 w-px bg-stone-300" />
          <div className="flex gap-3">
            {node.children.map((c) => (
              <InhTreeView key={c.id} node={c} typed={typed} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InheritedPanel() {
  const [step, setStep] = useState(0);
  const typed = new Set(INH_STEPS.slice(0, step).map((s) => s.nodeId));
  const next = () => setStep((s) => Math.min(INH_STEPS.length, s + 1));
  const reset = () => setStep(0);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-700">
        <strong>Inherited attributes</strong> flow <strong>downward</strong>, from a parent (or
        sibling) to a node, carrying information that node couldn't know on its own. For "int x, y,
        z", none of the individual id nodes has any idea the declared type is "int" — that fact only
        exists at D, and has to be threaded down through each L before it reaches the id leaves.
      </p>
      <div className="flex gap-2">
        <button
          onClick={next}
          disabled={step >= INH_STEPS.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Apply next rule
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>
      {step > 0 && <p className="font-mono text-xs text-stone-500">{INH_STEPS[step - 1].rule}</p>}
      <div className="flex justify-center overflow-x-auto py-2">
        <InhTreeView node={INH_TREE_3} typed={typed} />
      </div>
      {step >= INH_STEPS.length && (
        <div className="rounded-lg bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-semibold">
            All three identifiers (x, y, z) received type "int" — passed down from D, not computed
            locally by any of them.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SdtAttributeSim() {
  const [mode, setMode] = useState<Mode>('synthesized');
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('synthesized')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'synthesized' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Synthesized attributes
        </button>
        <button
          onClick={() => setMode('inherited')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'inherited' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Inherited attributes
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>Syntax-directed translation</strong> attaches semantic rules to a grammar's
          productions, so that as a parse tree is built, each node also computes extra information
          called <strong>attributes</strong>. Attributes come in two flavors, based on which
          direction they flow through the tree.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Synthesized attribute: </dt>
              <dd className="inline text-stone-600">
                computed from a node's children, flowing upward toward the root.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Inherited attribute: </dt>
              <dd className="inline text-stone-600">
                passed down from a parent (or sibling) to a node, flowing downward from the root.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming every attribute in a syntax-directed grammar has to be one type or the other
          exclusively. Real compilers routinely mix both in the same tree — types flow down
          (inherited) while computed expression values flow up (synthesized) — the two mechanisms
          work together, not as alternatives to choose once for an entire grammar.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            In Synthesized mode, click through the rules and watch values compute bottom-up to a
            final result.
          </li>
          <li>
            In Inherited mode, click through and watch the type "int" get pushed down from the root
            to each identifier.
          </li>
        </ol>
      </div>

      {mode === 'synthesized' ? <SynthesizedPanel /> : <InheritedPanel />}
    </div>
  );
}

function CommonMistake({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p>
        <span className="font-semibold">Common mistake: </span>
        {children}
      </p>
    </div>
  );
}
