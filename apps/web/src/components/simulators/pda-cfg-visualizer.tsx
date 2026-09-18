/**
 * Component: PdaCfgVisualizer
 * Serves: act7-d3-ch01 ("Context-Free Grammars") — CFG mode
 *         act7-d3-ch05 ("Pushdown Automata") — PDA mode
 *
 * What it demonstrates:
 *   CFG mode: deriving a string from a context-free grammar step by step (leftmost
 *   derivation), building the parse tree as each production is applied.
 *   PDA mode: a pushdown automaton processing that same kind of string while
 *   animating its stack (push/pop) alongside the input tape, showing how having a
 *   stack lets it recognize a language a plain DFA cannot.
 *
 * Design decisions:
 *   - Both modes use the same example language, aⁿbⁿ (equal numbers of a's then b's)
 *     via grammar S → aSb | ε, specifically because it's the smallest standard
 *     example of a language that's context-free but NOT regular — so the PDA mode's
 *     "why does this need a stack, a DFA really can't do this" point has real force,
 *     not just an assertion.
 *   - CFG mode builds the parse tree incrementally alongside the derivation string,
 *     rather than only showing the final tree, so the connection between "apply this
 *     production" and "this branch appears in the tree" is direct and immediate.
 *   - PDA mode explicitly ties each tape symbol to a stack action (push on 'a', pop on
 *     'b') and rejects if the stack isn't empty exactly when the tape ends, since
 *     "accept condition = empty stack at end of input" is easy to gloss over.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const TARGET = 'aabb'; // n = 2

// ---------------- CFG mode ----------------
type CfgStep = { rule: string; result: string };
const CFG_STEPS: CfgStep[] = [
  { rule: 'S → aSb', result: 'aSb' },
  { rule: 'S → aSb', result: 'aaSbb' },
  { rule: 'S → ε', result: 'aabb' },
];

interface TreeNode {
  label: string;
  children: TreeNode[];
}
// Precomputed final parse tree for S -> a S b -> a (a S b) b -> a (a (ε) b) b
const FINAL_TREE: TreeNode = {
  label: 'S',
  children: [
    { label: 'a', children: [] },
    {
      label: 'S',
      children: [
        { label: 'a', children: [] },
        { label: 'S', children: [{ label: 'ε', children: [] }] },
        { label: 'b', children: [] },
      ],
    },
    { label: 'b', children: [] },
  ],
};
// Partial trees for earlier steps, so the tree visibly grows with each production
const TREE_AT_STEP: TreeNode[] = [
  {
    label: 'S',
    children: [
      { label: 'a', children: [] },
      { label: 'S', children: [] },
      { label: 'b', children: [] },
    ],
  },
  {
    label: 'S',
    children: [
      { label: 'a', children: [] },
      {
        label: 'S',
        children: [
          { label: 'a', children: [] },
          { label: 'S', children: [] },
          { label: 'b', children: [] },
        ],
      },
      { label: 'b', children: [] },
    ],
  },
  FINAL_TREE,
];

function TreeView({ node }: { node: TreeNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 font-mono text-xs text-white">
        {node.label}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-3 w-px bg-stone-300" />
          <div className="flex gap-3">
            {node.children.map((c, i) => (
              <TreeView key={i} node={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CfgMode() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(CFG_STEPS.length, s + 1));
  const reset = () => setStep(0);
  const current = step === 0 ? 'S' : CFG_STEPS[step - 1].result;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>context-free grammar (CFG)</strong> is a set of rewriting rules, called{' '}
          <strong>productions</strong>, that generate strings in a language. Starting from a{' '}
          <strong>start symbol</strong>, you repeatedly replace a symbol using a production until
          only terminal symbols (actual characters) are left. This grammar — S → aSb | ε — generates
          exactly the strings with equal numbers of a's followed by equal numbers of b's: ε, ab,
          aabb, aaabbb, and so on.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Production: </dt>
              <dd className="inline text-stone-600">
                a rewrite rule, e.g. S → aSb, meaning "S can become a, then S, then b."
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Derivation: </dt>
              <dd className="inline text-stone-600">
                a sequence of production applications turning the start symbol into a target string.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Parse tree: </dt>
              <dd className="inline text-stone-600">
                a tree showing which productions were applied and where, with the target string
                readable left-to-right along its leaves.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming a CFG like this could just as easily be written as a DFA. It can't — recognizing
          aⁿbⁿ requires remembering exactly how many a's were seen, and a DFA only has a fixed,
          finite number of states, not a counter that can grow without bound. This is exactly the
          kind of language a stack (as in the PDA mode) can handle but a DFA cannot.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Apply next production" to derive the target string "{TARGET}" from S, one step at
            a time.
          </li>
          <li>Watch the parse tree grow a new branch with each production applied.</li>
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          onClick={next}
          disabled={step >= CFG_STEPS.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Apply next production
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div className="font-mono text-sm">
        Current string: <span className="font-semibold">{current}</span>
        {step > 0 && <span className="text-stone-400"> (via {CFG_STEPS[step - 1].rule})</span>}
      </div>

      {step > 0 && (
        <div className="overflow-x-auto py-2">
          <TreeView node={TREE_AT_STEP[step - 1]} />
        </div>
      )}
    </div>
  );
}

// ---------------- PDA mode ----------------
function PdaMode() {
  const [pos, setPos] = useState(0);
  const [stack, setStack] = useState<string[]>([]);
  const [rejected, setRejected] = useState(false);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = () => {
    if (pos >= TARGET.length) return;
    const symbol = TARGET[pos];
    if (symbol === 'a') {
      setStack((s) => [...s, 'A']);
    } else {
      if (stack.length === 0) {
        setRejected(true);
        setRunning(false);
        return;
      }
      setStack((s) => s.slice(0, -1));
    }
    setPos((p) => p + 1);
  };

  useEffect(() => {
    if (!running) return;
    if (pos >= TARGET.length || rejected) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(step, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pos, rejected]);

  const reset = () => {
    setPos(0);
    setStack([]);
    setRejected(false);
    setRunning(false);
  };

  const finished = pos >= TARGET.length;
  const accepted = finished && stack.length === 0 && !rejected;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>pushdown automaton (PDA)</strong> is like a DFA with one crucial extra tool: a{' '}
          <strong>stack</strong>. As it reads the input tape left to right, it can push symbols onto
          the stack or pop them off, and its next move can depend on what's currently on top. For
          the language aⁿbⁿ, the PDA below pushes a marker for every 'a' it reads, then pops one for
          every 'b' — it <strong>accepts</strong> only if the stack is completely empty exactly when
          the input ends, meaning the a's and b's balanced out exactly.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Stack: </dt>
              <dd className="inline text-stone-600">
                a last-in-first-out memory the automaton can push to or pop from as it reads input.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Accept condition: </dt>
              <dd className="inline text-stone-600">
                here, the input is accepted only if the stack is empty exactly when the tape is
                fully read.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          thinking the stack just needs to end up empty at some point — it specifically has to be
          empty exactly when the input ends, not before. Popping too early (a 'b' with nothing on
          the stack) means reject immediately, since that would mean more b's than a's seen so far.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click "Run" or "Step" to read the tape "{TARGET}" left to right.</li>
          <li>Watch the stack grow with each 'a' and shrink with each 'b'.</li>
          <li>See it accept once the tape is fully read and the stack is empty.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRunning(true)}
          disabled={finished || rejected}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Run
        </button>
        <button
          onClick={step}
          disabled={finished || rejected}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Step
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Input tape</p>
        <div className="flex gap-1">
          {TARGET.split('').map((c, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded border font-mono text-sm ${i < pos ? 'border-stone-300 bg-stone-100 text-stone-400' : i === pos ? 'border-violet-600 bg-violet-500 text-white' : 'border-stone-300 bg-white'}`}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
          Stack (top on the left)
        </p>
        <div className="flex gap-1">
          {stack.length === 0 && <span className="text-xs italic text-stone-400">empty</span>}
          {[...stack].reverse().map((s, i) => (
            <span
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded border border-amber-300 bg-amber-100 font-mono text-sm text-amber-800"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {finished && (
        <div
          className={`rounded-lg p-4 text-sm ${accepted ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
        >
          <p className="font-semibold">
            {accepted ? 'ACCEPTED — stack empty exactly when input ended.' : 'REJECTED.'}
          </p>
        </div>
      )}
      {rejected && !finished && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">REJECTED — tried to pop from an empty stack.</p>
        </div>
      )}
    </div>
  );
}

export default function PdaCfgVisualizer() {
  const [mode, setMode] = useState<'cfg' | 'pda'>('cfg');
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('cfg')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'cfg' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          CFG: derivation & parse tree
        </button>
        <button
          onClick={() => setMode('pda')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'pda' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          PDA: stack-based recognition
        </button>
      </div>
      {mode === 'cfg' ? <CfgMode /> : <PdaMode />}
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
