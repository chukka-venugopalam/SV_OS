/**
 * Component: GrammarNormalFormConverter
 * Serves: act7-d3 "CNF & GNF" chapter
 *
 * What it demonstrates:
 *   Converting an arbitrary CFG into Chomsky Normal Form (CNF) through the standard
 *   sequence of elimination steps — removing null (epsilon) productions, removing
 *   unit productions, then restructuring any remaining long/mixed productions into
 *   CNF's required shape (every production is either one terminal, or exactly two
 *   nonterminals) — revealed one transformation at a time, plus a short explanation
 *   of how GNF differs.
 *
 * Design decisions:
 *   - Uses one small worked grammar chosen to need all three elimination steps (it
 *     has a nullable production, a unit production, and a too-long production), so
 *     the full pipeline is demonstrated on a single running example instead of three
 *     disconnected mini-examples.
 *   - Each step shows the grammar immediately before and after, with the specific
 *     rule that triggered the change called out by name, rather than jumping straight
 *     from the original grammar to the final CNF form.
 *   - GNF (Greibach Normal Form) is covered as a shorter comparison note rather than
 *     a full second worked conversion, since GNF's defining shape (every production
 *     starts with exactly one terminal followed by zero or more nonterminals) is a
 *     small variation on the same idea CNF already taught in depth here — a second
 *     full multi-step conversion would repeat the same skill, not add a new one.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface StageDef {
  title: string;
  grammar: string[];
  explanation: string;
}

const STAGES: StageDef[] = [
  {
    title: 'Starting grammar',
    grammar: ['S → A | aSb', 'A → B', 'B → b | ε'],
    explanation:
      "This grammar has a null production (B → ε), a unit production (A → B), and needs restructuring before it's in CNF.",
  },
  {
    title: 'Step 1 — Eliminate null (ε) productions',
    grammar: ['S → A | aSb | ab', 'A → B | ε', 'B → b'],
    explanation:
      "B → ε is removed. Everywhere B appeared on a right-hand side, add a version of that production with B left out: since S → aSb had no B, it's unaffected, but wherever B fed into a production, we account for the case where it contributed nothing. A → B becomes A → B | ε here since B could vanish — this cascades until no more ε-productions remain (except possibly S → ε for the empty string itself, not needed here).",
  },
  {
    title: 'Step 2 — Eliminate unit productions',
    grammar: ['S → aSb | ab', 'A → b', 'B → b'],
    explanation:
      "A → B is a unit production (one nonterminal going directly to another). It's removed by replacing it with copies of whatever B itself produces — B → b — so A → b directly. Also A → ε is dropped once we ensure S no longer needs to reference A → ε indirectly, folding that case into S's own alternatives (ab, above).",
  },
  {
    title: 'Step 3 — Convert to strict CNF shape',
    grammar: ['S → AS1 | ab', 'AS1 → a S1b', 'S1b → S B_b', 'B_b → b'],
    explanation:
      "CNF requires every production to be exactly one terminal, or exactly two nonterminals — nothing longer, and no mixing terminals with nonterminals. S → aSb is too long and mixes a terminal with nonterminals, so it's broken into a chain of new helper nonterminals, each holding just one terminal or one pairing, until every production fits the required shape.",
  },
];

export default function GrammarNormalFormConverter() {
  const [stageIdx, setStageIdx] = useState(0);
  const next = () => setStageIdx((s) => Math.min(STAGES.length - 1, s + 1));
  const reset = () => setStageIdx(0);
  const [showGnf, setShowGnf] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          Some algorithms (like CYK parsing) require a grammar to be in a very specific shape called{' '}
          <strong>Chomsky Normal Form (CNF)</strong>: every production is either exactly one
          terminal symbol, or exactly two nonterminal symbols — nothing longer, nothing mixed. Any
          context-free grammar can be mechanically converted into an equivalent CNF grammar (one
          that generates the exact same language) through a fixed sequence of elimination steps.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Null (ε) production: </dt>
              <dd className="inline text-stone-600">
                a rule where a nonterminal can produce nothing at all.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Unit production: </dt>
              <dd className="inline text-stone-600">
                a rule where one nonterminal produces exactly one other nonterminal and nothing
                else.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">CNF: </dt>
              <dd className="inline text-stone-600">
                a normal form requiring every production to be one terminal, or exactly two
                nonterminals.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          doing the CNF conversion steps in a different order and expecting the same result along
          the way. The order matters: eliminate null productions first, then unit productions, then
          restructure long productions — doing them out of order (e.g. restructuring before removing
          unit productions) can leave leftover unit or null productions that the later steps don't
          expect to see.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Next step" to walk through eliminating null productions, then unit productions,
            then restructuring into strict CNF shape.
          </li>
          <li>
            Compare the grammar at each stage — notice each step only fixes one specific kind of
            problem.
          </li>
          <li>
            Click "Compare to GNF" at the end for a short note on how Greibach Normal Form differs.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={stageIdx >= STAGES.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next step
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        {stageIdx === STAGES.length - 1 && (
          <button
            onClick={() => setShowGnf((v) => !v)}
            className="rounded-md bg-violet-100 px-4 py-2 text-sm font-medium text-violet-800"
          >
            {showGnf ? 'Hide' : 'Compare to'} GNF
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-stone-200">
        <div className="bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
          {STAGES[stageIdx].title}
        </div>
        <div className="space-y-1 p-4 font-mono text-sm">
          {STAGES[stageIdx].grammar.map((g, i) => (
            <p key={i}>{g}</p>
          ))}
        </div>
      </div>
      <p className="text-sm text-stone-600">{STAGES[stageIdx].explanation}</p>

      {showGnf && stageIdx === STAGES.length - 1 && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <p className="mb-1 font-semibold">CNF vs. GNF</p>
          <p>
            <strong>Greibach Normal Form (GNF)</strong> requires every production to start with
            exactly one terminal, optionally followed by any number of nonterminals — e.g.{' '}
            <span className="font-mono">A → a B C</span>. Where CNF's productions are always length
            1 or 2, GNF's shape is defined by <em>where the terminal sits</em> (always first) rather
            than by length. Any CNF grammar can be further converted into GNF; the resulting grammar
            is useful because every derivation step consumes exactly one input symbol, which
            top-down parsers rely on.
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
