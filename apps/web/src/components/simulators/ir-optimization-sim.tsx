/**
 * Component: IrOptimizationSim
 * Serves: cd-intermediate-code-generation-optimization
 *         ("Intermediate Code Generation & Optimization")
 *
 * What it demonstrates:
 *   Source code lowered to three-address code (a simple IR), then two local
 *   optimizations — constant folding and dead-code elimination — applied live, with
 *   the before/after IR shown side by side so the exact lines that changed or
 *   disappeared are visible.
 *
 * Design decisions:
 *   - The source program is deliberately built with one foldable constant expression
 *     (2 + 3) and one genuinely dead variable (c, computed but never used) so both
 *     named optimizations have a real, distinct target to act on, rather than one
 *     optimization needing to be inferred from a contrived example.
 *   - Constant folding and dead-code elimination are applied as two separate,
 *     independently-toggleable passes rather than one combined "optimize" button, so
 *     the student can see what each pass alone changes before seeing them combined.
 *   - Dead-code elimination is computed from actual liveness (does any later
 *     instruction or the final output use this value?) rather than a hardcoded "line
 *     3 is dead" flag, so the logic would correctly identify a different dead line if
 *     the source were edited.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface IrLine {
  id: string;
  text: string;
  defines?: string;
  uses: string[];
  foldableTo?: string; // if constant folding applies, the replacement text
}

const SOURCE = `a = 2 + 3;
b = a * 10;
c = 99;
print(b);`;

const IR_ORIGINAL: IrLine[] = [
  { id: 'l1', text: 't1 = 2 + 3', defines: 't1', uses: [], foldableTo: 't1 = 5' },
  { id: 'l2', text: 'a = t1', defines: 'a', uses: ['t1'] },
  { id: 'l3', text: 't2 = a * 10', defines: 't2', uses: ['a'] },
  { id: 'l4', text: 'b = t2', defines: 'b', uses: ['t2'] },
  { id: 'l5', text: 'c = 99', defines: 'c', uses: [] },
  { id: 'l6', text: 'print(b)', uses: ['b'] },
];

function computeLiveIds(lines: IrLine[]): Set<string> {
  // A definition is live if the variable it defines is used by some later line
  // (or is used at all, transitively, ending in print). Simple backward liveness pass.
  const live = new Set<string>();
  const usedVars = new Set<string>();
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    const isLive = !l.defines || usedVars.has(l.defines) || l.text.startsWith('print');
    if (isLive) {
      live.add(l.id);
      l.uses.forEach((u) => usedVars.add(u));
    }
  }
  return live;
}

export default function IrOptimizationSim() {
  const [foldingOn, setFoldingOn] = useState(false);
  const [dceOn, setDceOn] = useState(false);

  const folded: IrLine[] = IR_ORIGINAL.map((l) =>
    foldingOn && l.foldableTo ? { ...l, text: l.foldableTo, foldableTo: undefined } : l,
  );
  const liveIds = dceOn ? computeLiveIds(folded) : new Set(folded.map((l) => l.id));
  const finalLines = folded.filter((l) => liveIds.has(l.id));
  const removedLines = folded.filter((l) => !liveIds.has(l.id));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          Before generating real machine code, a compiler usually lowers the program into a simple{' '}
          <strong>intermediate representation (IR)</strong> — here,{' '}
          <strong>three-address code</strong>, where every instruction does at most one operation.
          This IR is a great place to apply <strong>optimizations</strong> that don't depend on the
          target machine: <strong>constant folding</strong> computes constant expressions once, at
          compile time, instead of at runtime, and <strong>dead-code elimination</strong> removes
          instructions whose results are never actually used.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Three-address code: </dt>
              <dd className="inline text-stone-600">
                an IR where each instruction has at most one operator and a small, fixed number of
                operands.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Constant folding: </dt>
              <dd className="inline text-stone-600">
                computing an expression made entirely of constants at compile time instead of
                generating code to compute it at runtime.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Dead code: </dt>
              <dd className="inline text-stone-600">
                an instruction whose result is never used by anything later in the program.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming dead-code elimination just looks for "unused variable names" as declared. It
          actually traces whether a computed <em>value</em> ever reaches something observable (a
          later use, or output) — variable "c" below is assigned but that value never flows anywhere
          else, which is what makes it dead, not simply that "c" looks unused by eye.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Toggle "Constant folding" — watch t1 = 2 + 3 become t1 = 5.</li>
          <li>
            Toggle "Dead-code elimination" — watch the c = 99 line disappear, since c is never used
            again.
          </li>
          <li>Compare the original IR against the optimized version side by side.</li>
        </ol>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Source</p>
        <pre className="whitespace-pre-wrap rounded-md bg-stone-50 p-3 font-mono text-sm">
          {SOURCE}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFoldingOn((v) => !v)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${foldingOn ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
        >
          Constant folding: {foldingOn ? 'on' : 'off'}
        </button>
        <button
          onClick={() => setDceOn((v) => !v)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${dceOn ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
        >
          Dead-code elimination: {dceOn ? 'on' : 'off'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Original IR</p>
          <div className="space-y-0.5 font-mono text-sm">
            {IR_ORIGINAL.map((l) => (
              <p key={l.id} className="text-stone-700">
                {l.text}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Optimized IR</p>
          <div className="space-y-0.5 font-mono text-sm">
            {finalLines.map((l) => {
              const original = IR_ORIGINAL.find((o) => o.id === l.id)!;
              const changed = original.text !== l.text;
              return (
                <p
                  key={l.id}
                  className={changed ? 'rounded bg-amber-50 px-1 text-amber-800' : 'text-stone-700'}
                >
                  {l.text}
                </p>
              );
            })}
            {removedLines.map((l) => (
              <p key={l.id} className="text-stone-300 line-through">
                {l.text}
              </p>
            ))}
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
