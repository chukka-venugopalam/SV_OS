/**
 * Component: CodegenLinkingSim
 * Serves: cd-code-generation-linking ("Code Generation & Linking")
 *
 * What it demonstrates:
 *   Codegen mode: IR mapped to target-machine assembly, with explicit register
 *   allocation decisions shown — including a register being reused once its
 *   previous value is no longer needed.
 *   Linking mode: two separately-compiled object files, one calling a function
 *   defined in the other, with the call instruction's placeholder address patched
 *   to the real one once linking resolves the external symbol.
 *
 * Design decisions:
 *   - Codegen uses an IR with exactly 3 temporaries but only 2 available registers,
 *     specifically so a real reuse decision has to happen (not just a 1-to-1
 *     mapping), and that reuse is explained by checking whether the temporary being
 *     replaced is still needed by any later instruction — a genuine (if simplified)
 *     liveness-driven allocation, not an arbitrary label swap.
 *   - Linking uses two named object files (main.o calling compute(), defined in
 *     lib.o) with an explicit "before" state showing the call instruction's target
 *     address as an unresolved placeholder, so "linking patches addresses" is a
 *     visible before/after diff rather than an abstract description.
 *   - Both modes are kept small enough (5-6 lines / 2 files) that every line's role
 *     is checkable by the student without needing to track a large program.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type Mode = 'codegen' | 'linking';

// ---------------- Codegen mode ----------------
interface IrOp {
  id: string;
  text: string;
  result?: string;
  operands: string[];
}
const IR: IrOp[] = [
  { id: 'i1', text: 't1 = a + b', result: 't1', operands: ['a', 'b'] },
  { id: 'i2', text: 't2 = t1 * c', result: 't2', operands: ['t1', 'c'] },
  { id: 'i3', text: 't3 = t2 - 1', result: 't3', operands: ['t2'] },
  { id: 'i4', text: 'return t3', operands: ['t3'] },
];
// With only 2 registers (R1, R2), t1's register can be reused for t3 once t1 is dead
// (t1 is last used producing t2 in i2, so by i3 its register is free).
const ASM_STEPS: { instr: string; note: string }[] = [
  { instr: 'LOAD R1, a', note: 'load a into R1' },
  { instr: 'LOAD R2, b', note: 'load b into R2' },
  { instr: 'ADD R1, R1, R2', note: 'R1 = a + b, i.e. t1 — R1 now holds t1' },
  { instr: 'LOAD R2, c', note: 'load c into R2 (R2 no longer needed for b)' },
  { instr: 'MUL R1, R1, R2', note: 'R1 = t1 * c, i.e. t2 — t1 is now dead, R1 reused for t2' },
  { instr: 'SUB R1, R1, #1', note: 'R1 = t2 - 1, i.e. t3 — R1 reused again, t2 now dead' },
  { instr: 'RETURN R1', note: "return t3's value, currently in R1" },
];

function CodegenPanel() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(ASM_STEPS.length, s + 1));
  const reset = () => setStep(0);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-700">
        <strong>Code generation</strong> maps IR onto real target-machine instructions and real,
        limited registers. With only 2 registers (R1, R2) available but 3 temporaries (t1, t2, t3)
        in the IR, the generator has to reuse a register once its old value is no longer needed — a
        simplified <strong>register allocation</strong> decision.
      </p>
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
          IR (3 temporaries, only 2 registers available)
        </p>
        <div className="space-y-0.5 font-mono text-sm">
          {IR.map((op) => (
            <p key={op.id} className="text-stone-700">
              {op.text}
            </p>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={next}
          disabled={step >= ASM_STEPS.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next instruction
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>
      <div className="space-y-1 font-mono text-sm">
        {ASM_STEPS.slice(0, step).map((s, i) => (
          <div key={i} className={i === step - 1 ? 'rounded bg-violet-50 px-1' : ''}>
            <span className="text-stone-900">{s.instr}</span>
            <span className="text-stone-400"> — {s.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Linking mode ----------------
function LinkingPanel() {
  const [linked, setLinked] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-700">
        Programs are usually compiled one file at a time into separate <strong>object files</strong>
        , each possibly referencing functions defined elsewhere.{' '}
        <span className="font-mono">main.o</span> below calls{' '}
        <span className="font-mono">compute()</span>, but doesn't know its real address — that
        symbol is <strong>unresolved</strong> until the <strong>linker</strong> combines both object
        files and patches the call instruction with the actual address where{' '}
        <span className="font-mono">compute</span> ended up.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setLinked((v) => !v)}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          {linked ? 'Unlink (show before)' : 'Run linker'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-md border border-stone-200">
          <div className="bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">main.o</div>
          <div className="space-y-0.5 p-3 font-mono text-sm">
            <p>0x00: LOAD R1, #10</p>
            <p>0x04: LOAD R2, #20</p>
            <p
              className={
                linked
                  ? 'rounded bg-emerald-50 px-1 text-emerald-800'
                  : 'rounded bg-amber-50 px-1 text-amber-800'
              }
            >
              0x08: CALL {linked ? '0x100' : 'compute (unresolved)'}
            </p>
            <p>0x0C: RETURN R1</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-stone-200">
          <div className="bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">lib.o</div>
          <div className="space-y-0.5 p-3 font-mono text-sm">
            <p className="text-stone-500">0x100: compute:</p>
            <p>0x100: ADD R1, R1, R2</p>
            <p>0x104: RETURN R1</p>
          </div>
        </div>
      </div>
      {linked && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            Linked — the linker found "compute" defined at 0x100 in lib.o and patched main.o's CALL
            instruction with that real address.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CodegenLinkingSim() {
  const [mode, setMode] = useState<Mode>('codegen');
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('codegen')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'codegen' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Code generation
        </button>
        <button
          onClick={() => setMode('linking')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'linking' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Linking
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          The last stages of building a program turn IR into real machine instructions, and then
          combine separately-compiled pieces into one runnable whole.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Register allocation: </dt>
              <dd className="inline text-stone-600">
                deciding which of a limited number of real registers holds which value, reusing
                registers once old values are no longer needed.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Object file: </dt>
              <dd className="inline text-stone-600">
                the compiled machine code for one source file, possibly with unresolved references
                to symbols defined elsewhere.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Linker: </dt>
              <dd className="inline text-stone-600">
                the tool that combines object files and patches every unresolved symbol reference
                with its real address.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming a separately-compiled function's address is somehow already known at compile
          time. It isn't — the compiler emits a placeholder and marks the symbol unresolved; only
          the linker, which sees every object file at once, knows where each symbol actually ends
          up.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        {mode === 'codegen' ? (
          <ol className="list-inside list-decimal space-y-0.5">
            <li>Click "Next instruction" to generate assembly for the IR, one line at a time.</li>
            <li>
              Watch R1 get reused for t2 and then t3, once each earlier value is no longer needed.
            </li>
          </ol>
        ) : (
          <ol className="list-inside list-decimal space-y-0.5">
            <li>Look at main.o's CALL instruction — its target is unresolved.</li>
            <li>Click "Run linker" to see it patched to compute's real address in lib.o.</li>
          </ol>
        )}
      </div>

      {mode === 'codegen' ? <CodegenPanel /> : <LinkingPanel />}
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
