/**
 * Component: CompilerPipelineVisualizer
 * Serves: act7-d5 "Compiler Phases Overview" chapter
 *
 * What it demonstrates:
 *   One piece of source code, "x = a + b * 2;", flowing through every compiler phase
 *   in a single animated pipeline — lexer, parser, semantic analysis, IR generation,
 *   optimization, and code generation — with the actual intermediate representation
 *   shown at each stage transition, so the student sees the same program getting
 *   progressively transformed rather than six disconnected examples.
 *
 * Design decisions:
 *   - Deliberately reuses the exact representations this app's other compiler
 *     simulators use for each individual phase (tokens, a parse tree, three-address
 *     code, assembly) so a student who's already used those tools recognizes the
 *     shapes here, and this component reads as "here's how they all chain together"
 *     rather than introducing yet another notation.
 *   - Each phase's output is shown feeding directly into the next phase's input
 *     (visually connected, not just adjacent), since the core idea of a pipeline is
 *     that each stage only depends on the previous stage's output, not on the
 *     original source text.
 *   - The optimization stage intentionally shows "no change" for this particular
 *     example (there's no constant or dead code to remove here) rather than
 *     manufacturing a fake win, since the honest lesson is that optimization is a
 *     pass that CAN change the IR, not one that always does.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const SOURCE = 'x = a + b * 2;';

const PHASES = [
  {
    name: 'Lexer',
    output: 'id(x)  =  id(a)  +  id(b)  *  num(2)  ;',
    note: 'Splits the raw characters into a stream of tokens — the smallest meaningful units.',
  },
  {
    name: 'Parser',
    output: 'Assign(x, Add(id(a), Mul(id(b), num(2))))',
    note: 'Groups tokens into a parse tree, encoding structure — here, that * binds tighter than +.',
  },
  {
    name: 'Semantic analysis',
    output: 'Symbol table: x:int, a:int, b:int — types checked, no errors.',
    note: "Checks the tree makes sense: every variable declared, every operation's types compatible.",
  },
  {
    name: 'IR generation',
    output: 't1 = b * 2\nt2 = a + t1\nx = t2',
    note: 'Lowers the tree into simple three-address code, one operation per instruction.',
  },
  {
    name: 'Optimization',
    output: 't1 = b * 2\nt2 = a + t1\nx = t2   (unchanged — nothing to fold or eliminate here)',
    note: 'Applies IR-level improvements where they apply. This particular program has no constant expressions or dead code, so nothing changes this time.',
  },
  {
    name: 'Code generation',
    output: 'LOAD R1, b\nMUL R1, R1, #2\nLOAD R2, a\nADD R1, R2, R1\nSTORE x, R1',
    note: 'Maps the (optimized) IR onto real target-machine instructions and registers.',
  },
];

export default function CompilerPipelineVisualizer() {
  const [phaseIdx, setPhaseIdx] = useState(-1); // -1 = only source shown
  const next = () => setPhaseIdx((p) => Math.min(PHASES.length - 1, p + 1));
  const reset = () => setPhaseIdx(-1);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A compiler isn't one big step — it's a <strong>pipeline</strong> of distinct phases, each
          taking the previous phase's output as its input and producing a new representation of the
          same program. This simulator follows one line of source code,{' '}
          <span className="font-mono">{SOURCE}</span>, all the way through every phase, so you can
          see the program's representation change shape at each stage.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Pipeline: </dt>
              <dd className="inline text-stone-600">
                a sequence of phases, each transforming the program into a new representation for
                the next phase.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Front end / back end: </dt>
              <dd className="inline text-stone-600">
                lexing through IR generation is typically called the front end (language-specific);
                optimization and code generation are the back end (target-specific).
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming every phase has to run to completion for the whole program before the next phase
          starts, or that the phases always run in one strict pass with no phase ever revisited.
          Real compilers often interleave phases for efficiency, and may run some passes (like
          optimization) multiple times — the six phases here describe distinct <em>kinds</em> of
          work, not necessarily six hard sequential passes in every real implementation.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click "Next phase" to advance the source through each stage of the pipeline.</li>
          <li>
            Notice each phase's output becomes the next phase's input — nothing skips back to the
            original text.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={phaseIdx >= PHASES.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next phase
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {/* Phase progress strip */}
      <div className="flex flex-wrap gap-1">
        {PHASES.map((p, i) => (
          <span
            key={p.name}
            className={`rounded px-2 py-1 text-xs font-medium ${i <= phaseIdx ? 'bg-violet-500 text-white' : 'bg-stone-100 text-stone-400'}`}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-md border border-stone-200">
          <div className="bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">Source</div>
          <pre className="p-3 font-mono text-sm">{SOURCE}</pre>
        </div>
        {PHASES.slice(0, phaseIdx + 1).map((p, i) => (
          <div key={p.name}>
            <div className="flex justify-center text-stone-300">↓</div>
            <div
              className={`overflow-hidden rounded-md border ${i === phaseIdx ? 'border-violet-400' : 'border-stone-200'}`}
            >
              <div
                className={`px-3 py-1.5 text-xs font-semibold ${i === phaseIdx ? 'bg-violet-500 text-white' : 'bg-stone-900 text-white'}`}
              >
                {p.name}
              </div>
              <pre className="whitespace-pre-wrap p-3 font-mono text-sm">{p.output}</pre>
              <p className="px-3 pb-3 text-xs text-stone-500">{p.note}</p>
            </div>
          </div>
        ))}
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
