/**
 * Component: Ll1ParserSim
 * Serves: cd-ll1-parsing ("LL(1) Parsing")
 *
 * What it demonstrates:
 *   The FIRST/FOLLOW sets and resulting parsing table for a small unambiguous
 *   expression grammar, then a full top-down predictive parse of "id + id * id"
 *   traced with an explicit parse stack, driven by the same table.
 *
 * Design decisions:
 *   - Grammar (E → T E'; E' → + T E' | ε; T → F T'; T' → * F T' | ε; F → ( E ) | id)
 *     is the standard textbook example specifically because it's already free of
 *     left recursion and left factoring issues — i.e. it's LL(1)-ready as written —
 *     so the chapter can focus on FIRST/FOLLOW/table/trace without also having to
 *     teach grammar transformation first.
 *   - The predictive-parsing engine is a real generic implementation (table-driven
 *     stack simulation), not a scripted trace, so the displayed stack/input/action at
 *     every step is an actual computation result — independently verified against a
 *     hand-worked trace before shipping.
 *   - FIRST/FOLLOW sets and the parsing table are shown as static reference panels
 *     (computing them live via a general algorithm is a separate, heavier skill from
 *     using them to parse) so the student can check each step of the trace against
 *     the table directly, which is the actual point of this chapter.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const EPS = 'ε';
type Prod = string[];
const TABLE: Record<string, Record<string, Prod>> = {
  E: { '(': ['T', "E'"], id: ['T', "E'"] },
  "E'": { '+': ['+', 'T', "E'"], ')': [EPS], $: [EPS] },
  T: { '(': ['F', "T'"], id: ['F', "T'"] },
  "T'": { '*': ['*', 'F', "T'"], '+': [EPS], ')': [EPS], $: [EPS] },
  F: { '(': ['(', 'E', ')'], id: ['id'] },
};
const NONTERMS = new Set(['E', "E'", 'T', "T'", 'F']);
const TERMS = ['(', ')', '+', '*', 'id', '$'];

const FIRST: Record<string, string[]> = {
  E: ['(', 'id'],
  "E'": ['+', EPS],
  T: ['(', 'id'],
  "T'": ['*', EPS],
  F: ['(', 'id'],
};
const FOLLOW: Record<string, string[]> = {
  E: ['$', ')'],
  "E'": ['$', ')'],
  T: ['+', '$', ')'],
  "T'": ['+', '$', ')'],
  F: ['*', '+', '$', ')'],
};

interface TraceStep {
  stack: string[];
  lookahead: string;
  action: string;
}

function runParse(tokens: string[]): TraceStep[] {
  const input = [...tokens, '$'];
  let ip = 0;
  const stack: string[] = ['$', 'E'];
  const trace: TraceStep[] = [];
  let guard = 0;
  while (stack.length && guard++ < 100) {
    const top = stack[stack.length - 1];
    const a = input[ip];
    if (top === '$' && a === '$') {
      trace.push({ stack: [...stack], lookahead: a, action: 'ACCEPT' });
      break;
    }
    if (!NONTERMS.has(top)) {
      if (top === a) {
        trace.push({ stack: [...stack], lookahead: a, action: `match "${top}"` });
        stack.pop();
        ip++;
      } else {
        trace.push({ stack: [...stack], lookahead: a, action: 'ERROR: mismatch' });
        break;
      }
    } else {
      const prod = TABLE[top]?.[a];
      if (!prod) {
        trace.push({ stack: [...stack], lookahead: a, action: 'ERROR: no table entry' });
        break;
      }
      trace.push({ stack: [...stack], lookahead: a, action: `${top} → ${prod.join(' ')}` });
      stack.pop();
      if (!(prod.length === 1 && prod[0] === EPS)) {
        for (let i = prod.length - 1; i >= 0; i--) stack.push(prod[i]);
      }
    }
  }
  return trace;
}

const INPUT_TOKENS = ['id', '+', 'id', '*', 'id'];
const TRACE = runParse(INPUT_TOKENS);

export default function Ll1ParserSim() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(TRACE.length - 1, s + 1));
  const reset = () => setStep(0);
  const current = TRACE[step];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          An <strong>LL(1) parser</strong> parses top-down, deciding which production to apply by
          looking at just <strong>one lookahead token</strong>. To build one, you first compute each
          nonterminal's <strong>FIRST</strong> set (which terminals can start something it derives)
          and <strong>FOLLOW</strong> set (which terminals can come right after it), then combine
          those into a <strong>parsing table</strong>: for each (nonterminal, lookahead) pair,
          exactly one production to apply. Parsing then becomes mechanical: keep a stack, and at
          each step, either match a terminal against the input or expand a nonterminal using the
          table.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">FIRST(X): </dt>
              <dd className="inline text-stone-600">
                the set of terminals that can appear first in something X derives.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">FOLLOW(X): </dt>
              <dd className="inline text-stone-600">
                the set of terminals that can legally appear immediately after X in some derivation.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Parse stack: </dt>
              <dd className="inline text-stone-600">
                tracks what's left to match; the parser looks at its top symbol and the current
                input token to decide the next move.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          forgetting that a nonterminal's ε-production is only used for a lookahead token in its{' '}
          <strong>FOLLOW</strong> set, not its own FIRST set. E' → ε doesn't fire because "ε is in
          FIRST(E')" — it fires because the current lookahead is something that's allowed to follow
          E', like "$" or ")".
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Grammar: E → T E' | E' → +T E' | ε | T → F T' | T' → *F T' | ε | F → (E) | id.</li>
          <li>
            Check FIRST/FOLLOW and the parsing table below, then click "Step" to trace parsing "id +
            id * id".
          </li>
          <li>
            At each step, compare the stack's top symbol and the current lookahead against the
            table.
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-stone-200 p-3">
          <p className="mb-1 font-semibold text-stone-900">FIRST / FOLLOW</p>
          <table className="w-full font-mono">
            <thead>
              <tr className="text-stone-400">
                <th className="text-left">NT</th>
                <th className="text-left">FIRST</th>
                <th className="text-left">FOLLOW</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(FIRST).map((nt) => (
                <tr key={nt}>
                  <td>{nt}</td>
                  <td>{FIRST[nt].join(',')}</td>
                  <td>{FOLLOW[nt].join(',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto rounded-md border border-stone-200 p-3">
          <p className="mb-1 font-semibold text-stone-900">Parsing table</p>
          <table className="font-mono">
            <thead>
              <tr className="text-stone-400">
                <th className="pr-2 text-left">NT</th>
                {TERMS.map((t) => (
                  <th key={t} className="pr-2 text-left">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(TABLE).map((nt) => (
                <tr key={nt}>
                  <td className="pr-2">{nt}</td>
                  {TERMS.map((t) => (
                    <td key={t} className="pr-2">
                      {TABLE[nt][t]?.join(' ') ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={step >= TRACE.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Step
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span className="text-sm text-stone-500">Input: {INPUT_TOKENS.join(' ')} $</span>
      </div>

      <div className="space-y-1 rounded-md border border-stone-200 p-4">
        <p className="text-xs uppercase tracking-wide text-stone-400">
          Stack (top on the right) &amp; lookahead
        </p>
        <p className="font-mono text-sm">
          {current.stack.join(' ')}{' '}
          <span className="font-semibold text-violet-600">| {current.lookahead}</span>
        </p>
        <p
          className={`mt-1 text-sm font-medium ${current.action === 'ACCEPT' ? 'text-emerald-600' : current.action.startsWith('ERROR') ? 'text-rose-600' : 'text-stone-700'}`}
        >
          {current.action}
        </p>
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
