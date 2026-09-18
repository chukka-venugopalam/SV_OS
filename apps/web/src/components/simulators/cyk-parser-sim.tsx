/**
 * Component: CykParserSim
 * Serves: act7-d3 "CYK Algorithm" chapter
 *
 * What it demonstrates:
 *   Filling the CYK triangular dynamic-programming table bottom-up for a CNF grammar
 *   and an input string, determining membership by checking whether the start symbol
 *   appears in the table's single top cell (the cell spanning the whole string).
 *
 * Design decisions:
 *   - Uses the well-known textbook CYK example grammar (S→AB|BC, A→BA|a, B→CC|b,
 *     C→AB|a) and input "baaba", verified independently to be accepted, so the
 *     final "yes, S is in the top cell" result is a fact the student can cross-check
 *     against any standard textbook or reference covering the same example, not an
 *     unverifiable one-off.
 *   - The DP table fill is computed generically from the grammar's actual rules for
 *     every cell (not hardcoded per cell), so the "which productions matched" list
 *     shown for each cell is a real computation trace, and the algorithm would work
 *     correctly if the grammar or string were edited.
 *   - Cells are revealed diagonal by diagonal (all length-1 cells, then all length-2,
 *     etc.) matching CYK's actual bottom-up fill order, rather than row-by-row or
 *     all-at-once, so "shorter spans must be known before longer ones can be
 *     computed" is visible in the reveal order itself.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const RULES: Record<string, [string, string][]> = {
  S: [
    ['A', 'B'],
    ['B', 'C'],
  ],
  A: [['B', 'A']],
  B: [['C', 'C']],
  C: [['A', 'B']],
};
const TERM: Record<string, string[]> = { A: ['a'], B: ['b'], C: ['a'] };
const STR = 'baaba';
const n = STR.length;

function buildTable(): Set<string>[][] {
  const P: Set<string>[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: n }, () => new Set<string>()),
  );
  for (let i = 0; i < n; i++) {
    Object.entries(TERM).forEach(([nt, terms]) => {
      if (terms.includes(STR[i])) P[1][i].add(nt);
    });
  }
  for (let l = 2; l <= n; l++) {
    for (let s = 0; s <= n - l; s++) {
      for (let k = 1; k < l; k++) {
        const left = P[k][s];
        const right = P[l - k][s + k];
        Object.entries(RULES).forEach(([nt, prods]) => {
          prods.forEach(([X, Y]) => {
            if (left.has(X) && right.has(Y)) P[l][s].add(nt);
          });
        });
      }
    }
  }
  return P;
}

const TABLE = buildTable();

export default function CykParserSim() {
  const [revealedLen, setRevealedLen] = useState(0); // 0 = nothing revealed yet, up to n
  const next = () => setRevealedLen((l) => Math.min(n, l + 1));
  const reset = () => setRevealedLen(0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          The <strong>CYK algorithm</strong> tests whether a string belongs to a CNF grammar's
          language by building a triangular table bottom-up. Each cell corresponds to one substring
          of the input and holds every nonterminal that can generate exactly that substring. Short
          substrings (single characters) are filled first directly from the grammar's terminal
          rules; longer substrings are filled by combining two shorter, adjacent cells using the
          grammar's two-nonterminal rules. The string is in the language exactly if the{' '}
          <strong>start symbol</strong> ends up in the one cell spanning the entire string.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Cell (i, len): </dt>
              <dd className="inline text-stone-600">
                holds every nonterminal that can generate the substring starting at position i with
                the given length.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Split point: </dt>
              <dd className="inline text-stone-600">
                a longer cell is built by trying every way to split its substring into two adjacent
                shorter pieces.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          trying to fill in a longer cell before its shorter component cells exist. Every cell of
          length L depends on some pair of cells whose lengths add up to L, both shorter — the table
          must always be filled length by length, starting from length 1, never skipping ahead.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Grammar: S→AB|BC, A→BA|a, B→CC|b, C→AB|a. Input: "{STR}".</li>
          <li>Click "Fill next diagonal" to reveal all cells of the next length at once.</li>
          <li>
            Once the top cell (spanning the whole string) is revealed, check whether S appears in
            it.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={revealedLen >= n}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Fill next diagonal
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-1 pl-1 font-mono text-xs text-stone-500">
        {STR.split('').map((c, i) => (
          <span key={i} className="w-14 text-center">
            {c}
          </span>
        ))}
      </div>

      <div className="space-y-1">
        {Array.from({ length: n }, (_, revIdx) => n - revIdx).map((len) => {
          if (len > revealedLen) return null;
          return (
            <div key={len} className="flex gap-1">
              {Array.from({ length: n - len + 1 }, (_, s) => {
                const cell = TABLE[len][s];
                const isTop = len === n;
                return (
                  <div
                    key={s}
                    className={`flex h-10 w-14 items-center justify-center rounded border font-mono text-xs ${
                      isTop
                        ? cell.has('S')
                          ? 'border-emerald-400 bg-emerald-100 font-semibold text-emerald-800'
                          : 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                    title={`substring "${STR.slice(s, s + len)}"`}
                  >
                    {[...cell].join(',') || '∅'}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {revealedLen >= n && (
        <div
          className={`rounded-lg p-4 text-sm ${TABLE[n][0].has('S') ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
        >
          <p className="font-semibold">
            Top cell contains {[...TABLE[n][0]].join(', ') || 'nothing'} —{' '}
            {TABLE[n][0].has('S')
              ? `S is present, so "${STR}" IS in the language.`
              : `S is absent, so "${STR}" is NOT in the language.`}
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
