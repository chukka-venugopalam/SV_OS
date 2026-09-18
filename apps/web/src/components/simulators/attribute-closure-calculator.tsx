/**
 * Component: AttributeClosureCalculator
 * Serves: act6-d3-ch01-functional-dependencies-closure ("Functional Dependencies & Closure")
 *
 * What it demonstrates:
 *   Computing the closure of a chosen starting attribute set by repeatedly applying
 *   functional dependencies (FDs) step by step, then determining whether that closure
 *   covers every attribute in the relation — which is the test for whether the
 *   starting set is a candidate key.
 *
 * Design decisions:
 *   - Uses one small, fixed relation R(A,B,C,D,E) with FDs A→B, A→C, C→D, D→E, chosen
 *     so different starting attribute sets produce genuinely different closures
 *     (some reach everything, some stall partway), rather than every choice trivially
 *     working.
 *   - The closure algorithm is shown one FD application at a time (not jumped to the
 *     final answer), since "repeatedly apply FDs until nothing new is added" is the
 *     actual mechanism being taught, not just the end result.
 *   - Explicitly distinguishes "closure = all attributes" (a superkey) from
 *     "candidate key" (a *minimal* superkey) in the explanation text, since
 *     conflating the two is the single most common error at this stage — the tool
 *     tells the student when their chosen set is a superkey but leaves the minimality
 *     check for them to reason about with a smaller starting set.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const ALL_ATTRS = ['A', 'B', 'C', 'D', 'E'];
const FDS: [string, string][] = [
  ['A', 'B'],
  ['A', 'C'],
  ['C', 'D'],
  ['D', 'E'],
];

interface Step {
  fd: [string, string];
  applied: boolean;
  closureAfter: Set<string>;
}

function computeClosureSteps(start: Set<string>): Step[] {
  const closure = new Set(start);
  const steps: Step[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [x, y] of FDS) {
      if (closure.has(x) && !closure.has(y)) {
        closure.add(y);
        steps.push({ fd: [x, y], applied: true, closureAfter: new Set(closure) });
        changed = true;
      }
    }
  }
  return steps;
}

export default function AttributeClosureCalculator() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['A']));
  const [revealedSteps, setRevealedSteps] = useState(0);

  const allSteps = computeClosureSteps(selected);
  const shownSteps = allSteps.slice(0, revealedSteps);
  const currentClosure =
    shownSteps.length > 0 ? shownSteps[shownSteps.length - 1].closureAfter : selected;

  const toggle = (attr: string) => {
    setRevealedSteps(0);
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(attr)) next.delete(attr);
      else next.add(attr);
      return next.size === 0 ? new Set([attr]) : next;
    });
  };

  const isSuperkey =
    allSteps.length > 0
      ? allSteps[allSteps.length - 1].closureAfter.size === ALL_ATTRS.length
      : currentClosure.size === ALL_ATTRS.length;
  const done = revealedSteps >= allSteps.length;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>functional dependency</strong> A → B means "knowing the value of A always tells
          you the value of B." The <strong>closure</strong> of a set of attributes is everything you
          can figure out by repeatedly chaining these dependencies, starting from that set. If a
          starting set's closure covers <em>every</em> attribute in the table, that set is a{' '}
          <strong>superkey</strong> — enough information to uniquely determine every other column.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Functional dependency (FD): </dt>
              <dd className="inline text-stone-600">
                a rule like A → B meaning A's value always determines B's value.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Closure: </dt>
              <dd className="inline text-stone-600">
                the full set of attributes you can derive by chaining FDs from a starting set, often
                written {'{X}'}⁺.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Superkey / candidate key: </dt>
              <dd className="inline text-stone-600">
                a superkey's closure covers every attribute; a candidate key is a superkey with no
                smaller subset that also works.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          treating "closure covers every attribute" and "candidate key" as the same thing. They're
          related but not identical — that condition only proves you have a <em>superkey</em>. A
          candidate key is a <em>minimal</em> superkey: try starting from just {'{A}'} vs.{' '}
          {'{A, B}'} here — both reach every attribute, but {'{A, B}'} is not minimal, since {'{A}'}{' '}
          alone was already enough.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>The relation is R(A,B,C,D,E) with FDs: A→B, A→C, C→D, D→E.</li>
          <li>Click attributes below to choose your starting set (try just "A" first).</li>
          <li>Click "Apply next FD" to grow the closure one dependency at a time.</li>
          <li>Once no more FDs apply, see whether the closure covers all 5 attributes.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600">Starting set:</span>
        {ALL_ATTRS.map((a) => (
          <button
            key={a}
            onClick={() => toggle(a)}
            className={`h-9 w-9 rounded-full border text-sm font-semibold ${selected.has(a) ? 'border-violet-600 bg-violet-500 text-white' : 'border-stone-300 text-stone-700'}`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
        <p className="mb-1 font-mono text-xs text-stone-500">FDs available:</p>
        <div className="flex flex-wrap gap-2">
          {FDS.map(([x, y], i) => {
            const usedInShown = shownSteps.some((s) => s.fd[0] === x && s.fd[1] === y);
            const nextToApply =
              revealedSteps < allSteps.length &&
              allSteps[revealedSteps].fd[0] === x &&
              allSteps[revealedSteps].fd[1] === y;
            return (
              <span
                key={i}
                className={`rounded border px-2 py-1 font-mono text-xs ${nextToApply ? 'border-amber-400 bg-amber-100' : usedInShown ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white text-stone-500'}`}
              >
                {x} → {y}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRevealedSteps((r) => Math.min(allSteps.length, r + 1))}
          disabled={revealedSteps >= allSteps.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Apply next FD
        </button>
        <button
          onClick={() => setRevealedSteps(0)}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Closure so far</p>
        <div className="flex gap-1">
          {ALL_ATTRS.map((a) => (
            <span
              key={a}
              className={`flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm ${currentClosure.has(a) ? 'border-emerald-400 bg-emerald-100 text-emerald-800' : 'border-stone-200 bg-stone-50 text-stone-300'}`}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {done && (
        <div
          className={`rounded-lg p-4 text-sm ${isSuperkey ? 'bg-emerald-50 text-emerald-900' : 'bg-stone-100 text-stone-700'}`}
        >
          <p className="font-semibold">
            Closure of {'{' + [...selected].join(', ') + '}'} ={' '}
            {'{' + [...currentClosure].join(', ') + '}'}.{' '}
            {isSuperkey
              ? "This covers every attribute — it's a superkey."
              : "This doesn't cover every attribute — not a superkey."}
          </p>
        </div>
      )}
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
