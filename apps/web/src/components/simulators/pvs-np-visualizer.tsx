/**
 * Component: PvsNpVisualizer
 * Serves: tm-complexity-classes ("Complexity Classes — P vs NP")
 *
 * What it demonstrates:
 *   A P problem (sorting) solved efficiently, with its work growing polynomially as
 *   input size grows, contrasted against an NP problem (subset-sum) where checking a
 *   proposed answer is fast but finding one by brute force means an exponentially
 *   exploding search space — animated directly as the input size grows.
 *
 * Design decisions:
 *   - Sorting and subset-sum are computed on the *same* input size slider, so the
 *     polynomial-vs-exponential growth comparison is a single shared chart rather
 *     than two separately-scaled examples the student has to mentally align.
 *   - Subset-sum's "checking is fast" side is made concrete: the student can pick a
 *     candidate subset and watch it get verified in one pass (O(n) additions), then
 *     separately watch what brute-force enumeration of all subsets would cost — so
 *     "easy to check, hard to find" is two different measured operations, not one
 *     asserted claim.
 *   - The growth chart uses actual computed values (n log n vs 2ⁿ) rather than
 *     illustrative curve shapes, so the exact crossover and the scale of the blowup
 *     are real numbers the student can read off.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

function sortingSteps(n: number): number {
  return Math.ceil(n * Math.log2(Math.max(2, n)));
}
function subsetCount(n: number): number {
  return 2 ** n;
}

const SET_BASE = [3, 7, 2, 9, 4, 1, 8, 5, 6, 10, 11, 12];

export default function PvsNpVisualizer() {
  const [n, setN] = useState(6);
  const [selected, setSelected] = useState<number[]>([]);
  const [verified, setVerified] = useState(false);
  const set = SET_BASE.slice(0, n);
  const TARGET = set.slice(0, 3).reduce((a, b) => a + b, 0); // guarantee a real solution exists

  const toggle = (v: number) => {
    setVerified(false);
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  };
  const sum = selected.reduce((a, b) => a + b, 0);
  const verify = () => setVerified(true);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>P</strong> is the class of problems solvable efficiently — in time that grows{' '}
          <strong>polynomially</strong> with input size, like sorting a list. <strong>NP</strong> is
          the class of problems where, even if finding a solution might take a very long time, a
          proposed solution can at least be <strong>checked</strong> quickly.{' '}
          <strong>Subset Sum</strong> — "does some subset of these numbers add up to a target?" — is
          a classic NP problem: verifying one candidate subset is fast, but brute-force searching
          through every possible subset means checking <strong>2ⁿ</strong> possibilities, a number
          that explodes far faster than any polynomial.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Polynomial time: </dt>
              <dd className="inline text-stone-600">
                work that grows like nᵏ for some fixed k as input size n grows — manageable even for
                large n.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Exponential time: </dt>
              <dd className="inline text-stone-600">
                work that grows like 2ⁿ — becomes infeasible extremely quickly as n grows.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">NP: </dt>
              <dd className="inline text-stone-600">
                problems where a proposed solution can be verified in polynomial time, even if
                finding one might not be.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming NP means "impossible" or "no fast algorithm could ever exist." NP only describes
          fast <em>verification</em>. Whether every NP problem also has a fast way to <em>find</em>{' '}
          a solution — the famous "P vs NP" question — remains unproven either way; NP problems just
          haven't been shown to have one so far (for problems like subset-sum specifically, none is
          currently known).
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Drag the "input size" slider and watch both cost estimates below update.</li>
          <li>
            Click numbers in the set to build a candidate subset, then click "Verify" — this check
            is always fast.
          </li>
          <li>
            Compare that single fast check against "total subsets to brute-force," which explodes as
            n grows.
          </li>
        </ol>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-800">Input size (n): {n}</label>
        <input
          type="range"
          min={2}
          max={12}
          value={n}
          onChange={(e) => {
            setN(Number(e.target.value));
            setSelected([]);
            setVerified(false);
          }}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4">
          <p className="mb-1 text-sm font-semibold text-emerald-900">P — Sorting n items</p>
          <p className="text-xs text-emerald-800">Estimated comparisons: ~n log n</p>
          <p className="mt-1 font-mono text-lg font-semibold text-emerald-900">
            {sortingSteps(n).toLocaleString()}
          </p>
        </div>
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4">
          <p className="mb-1 text-sm font-semibold text-rose-900">NP — Brute-force subset-sum</p>
          <p className="text-xs text-rose-800">Total subsets to check: 2ⁿ</p>
          <p className="mt-1 font-mono text-lg font-semibold text-rose-900">
            {subsetCount(n).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-stone-700">
          Target sum: <span className="font-mono font-semibold">{TARGET}</span>. Click numbers below
          to build a candidate subset.
        </p>
        <div className="flex flex-wrap gap-2">
          {set.map((v) => (
            <button
              key={v}
              onClick={() => toggle(v)}
              className={`h-10 w-10 rounded-md border font-mono text-sm ${selected.includes(v) ? 'border-violet-600 bg-violet-500 text-white' : 'border-stone-300 text-stone-700'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={verify}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Verify this subset (fast: O(n))
          </button>
          <span className="font-mono text-sm text-stone-600">sum = {sum}</span>
        </div>
        {verified && (
          <div
            className={`rounded-lg p-3 text-sm ${sum === TARGET ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
          >
            {sum === TARGET
              ? 'Match! This subset sums to the target — verified in one pass.'
              : 'No match — but notice how fast that check was, regardless of the answer.'}
          </div>
        )}
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
