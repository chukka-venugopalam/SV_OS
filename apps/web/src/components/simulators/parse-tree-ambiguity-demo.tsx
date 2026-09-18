/**
 * Component: ParseTreeAmbiguityDemo
 * Serves: act7-d3 "Parse Trees & Ambiguity" chapter
 *
 * What it demonstrates:
 *   An ambiguous grammar producing two genuinely different, both-valid parse trees
 *   for the exact same input string, shown side by side — motivating why ambiguity is
 *   a real practical problem for compilers, not just a theoretical curiosity.
 *
 * Design decisions:
 *   - Uses the classic ambiguous expression grammar E → E + E | E * E | id with the
 *     input "id + id * id", because both resulting trees are individually completely
 *     valid derivations under the same grammar, and their different shapes lead to
 *     genuinely different results if the id's were replaced with numbers (2+3*4 = 14
 *     vs. 20) — making the stakes of the ambiguity concrete rather than abstract.
 *   - Both trees are shown simultaneously, not toggled between, since the entire
 *     point is that they coexist for the same grammar and same string — flipping
 *     between them one at a time would undersell that both are simultaneously valid.
 *   - The practical fix (adding precedence/associativity rules, or restructuring the
 *     grammar to remove the ambiguity) is named explicitly in the Common Mistake
 *     callout, so the takeaway isn't just "ambiguity is bad" but "here's the direction
 *     a real fix takes."
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface TreeNode {
  label: string;
  children: TreeNode[];
}

// E -> E * E, left E -> E + E (id + id), right E -> id  => groups as (id+id)*id
const TREE_PLUS_FIRST: TreeNode = {
  label: 'E',
  children: [
    {
      label: 'E',
      children: [
        { label: 'E', children: [{ label: 'id', children: [] }] },
        { label: '+', children: [] },
        { label: 'E', children: [{ label: 'id', children: [] }] },
      ],
    },
    { label: '*', children: [] },
    { label: 'E', children: [{ label: 'id', children: [] }] },
  ],
};
// E -> E + E, right E -> E * E (id * id) => groups as id+(id*id)
const TREE_TIMES_FIRST: TreeNode = {
  label: 'E',
  children: [
    { label: 'E', children: [{ label: 'id', children: [] }] },
    { label: '+', children: [] },
    {
      label: 'E',
      children: [
        { label: 'E', children: [{ label: 'id', children: [] }] },
        { label: '*', children: [] },
        { label: 'E', children: [{ label: 'id', children: [] }] },
      ],
    },
  ],
};

function TreeView({ node }: { node: TreeNode }) {
  const isOp = node.label === '+' || node.label === '*';
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs ${isOp ? 'bg-amber-400 text-white' : node.label === 'id' ? 'bg-stone-200 text-stone-700' : 'bg-violet-500 text-white'}`}
      >
        {node.label}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-3 w-px bg-stone-300" />
          <div className="flex gap-2">
            {node.children.map((c, i) => (
              <TreeView key={i} node={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ParseTreeAmbiguityDemo() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A grammar is <strong>ambiguous</strong> if some string it generates has more than one
          valid parse tree. The grammar E → E + E | E * E | id is a classic example: for the input{' '}
          <span className="font-mono">id + id * id</span>, both trees below are completely valid
          derivations under this grammar — one groups the addition first, the other groups the
          multiplication first — and the grammar itself gives no way to say which one is "the real"
          structure.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Ambiguous grammar: </dt>
              <dd className="inline text-stone-600">
                a grammar where at least one string has more than one valid parse tree.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Precedence: </dt>
              <dd className="inline text-stone-600">
                a rule (like "* binds tighter than +") that a grammar can encode structurally to
                eliminate this kind of ambiguity.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          treating ambiguity as a purely academic concern. If id's here were actual numbers — say 2
          + 3 * 4 — the two trees shown below would compute genuinely different results: (2+3)*4 =
          20 versus 2+(3*4) = 14. A compiler using this grammar as written would have no principled
          way to pick which answer is correct — real compilers fix this by rewriting the grammar to
          bake in precedence and associativity rules, removing the ambiguity structurally rather
          than leaving it to chance.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Both trees below parse the exact same string: id + id * id.</li>
          <li>
            Compare their shapes — notice which operator ends up "on the outside" (applied last) in
            each.
          </li>
          <li>
            Imagine substituting real numbers for id and multiplying through — the two trees give
            different results.
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-center text-xs uppercase tracking-wide text-stone-400">
            Tree A — groups as (id + id) * id
          </p>
          <div className="flex justify-center overflow-x-auto py-2">
            <TreeView node={TREE_PLUS_FIRST} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-center text-xs uppercase tracking-wide text-stone-400">
            Tree B — groups as id + (id * id)
          </p>
          <div className="flex justify-center overflow-x-auto py-2">
            <TreeView node={TREE_TIMES_FIRST} />
          </div>
        </div>
      </div>
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
