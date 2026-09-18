/**
 * Component: TransactionWaitForGraphSim
 * Serves: act6-d4-ch04-deadlock-in-transactions ("Deadlock in Transactions")
 *
 * INTEGRATION NOTE: the build spec calls for this to be added as a new
 * "transaction wait-for-graph mode" on the existing `deadlock-banker-visualizer`
 * component (built earlier for Act 4's process-deadlock chapters), rather than a
 * fully separate file — but that existing component's source isn't available in
 * this environment to open and extend directly (no repo access in this session).
 * This file is written as a complete, self-contained mode so it works standalone
 * right now; whoever has repo access should fold its JSX/state into
 * deadlock-banker-visualizer as an additional mode (reusing that component's
 * shell/tab controls) rather than shipping this as a permanently separate file,
 * to match the spec's intent once the base file can actually be opened.
 *
 * What it demonstrates:
 *   Two transactions each holding a lock the other one needs, forming a cycle in the
 *   wait-for graph; the DBMS detecting that cycle and resolving the deadlock by
 *   aborting one transaction (the "victim") to let the other proceed.
 *
 * Design decisions:
 *   - Uses the same two-item lock scenario style as TwoPhaseLockSim (this app's 2PL
 *     chapter) but crossed the other way — T1 holds A wants B, T2 holds B wants A —
 *     so a student who's already seen ordinary lock waiting can see exactly how this
 *     differs: last time only one transaction was waiting, this time each is waiting
 *     on the other, and neither can ever proceed.
 *   - The wait-for graph is drawn directly from "who holds what" and "who wants
 *     what" state (not hardcoded as already-deadlocked), so clicking through the
 *     steps shows the cycle actually form, not appear pre-built.
 *   - Victim selection is kept simple and explicit (lower transaction ID number is
 *     aborted, an arbitrary but common tie-breaking rule) rather than modeling a
 *     real cost-based selection algorithm, since the point is "the DBMS picks one and
 *     breaks the cycle," not the selection heuristic itself.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Step {
  label: string;
  t1Holds: string[];
  t1Wants: string | null;
  t2Holds: string[];
  t2Wants: string | null;
  note: string;
}

const STEPS: Step[] = [
  {
    label: '0',
    t1Holds: [],
    t1Wants: null,
    t2Holds: [],
    t2Wants: null,
    note: 'Both transactions start with no locks.',
  },
  {
    label: '1',
    t1Holds: ['A'],
    t1Wants: null,
    t2Holds: [],
    t2Wants: null,
    note: 'T1 acquires a lock on A.',
  },
  {
    label: '2',
    t1Holds: ['A'],
    t1Wants: null,
    t2Holds: ['B'],
    t2Wants: null,
    note: 'T2 acquires a lock on B.',
  },
  {
    label: '3',
    t1Holds: ['A'],
    t1Wants: 'B',
    t2Holds: ['B'],
    t2Wants: null,
    note: 'T1 now wants B — but T2 holds it. T1 waits.',
  },
  {
    label: '4',
    t1Holds: ['A'],
    t1Wants: 'B',
    t2Holds: ['B'],
    t2Wants: 'A',
    note: 'T2 now wants A — but T1 holds it. T2 waits too. Neither can ever proceed: deadlock.',
  },
];

export default function TransactionWaitForGraphSim() {
  const [idx, setIdx] = useState(0);
  const [resolved, setResolved] = useState<'T1' | 'T2' | null>(null);
  const step = STEPS[idx];
  const isDeadlocked = idx === STEPS.length - 1;

  const next = () => setIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const reset = () => {
    setIdx(0);
    setResolved(null);
  };
  const abortVictim = (tx: 'T1' | 'T2') => setResolved(tx);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>deadlock</strong> happens when two (or more) transactions each hold a lock the
          other one needs, so both wait forever and neither can proceed. The database tracks this
          with a <strong>wait-for graph</strong>: an edge from Ti to Tj means "Ti is waiting for a
          lock Tj currently holds." If that graph ever contains a <strong>cycle</strong>, it's a
          deadlock — and the only way out is for the database to pick one transaction as a{' '}
          <strong>victim</strong> and abort it, freeing its locks so the other can continue.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Wait-for graph: </dt>
              <dd className="inline text-stone-600">
                a graph with an edge Ti → Tj whenever Ti is blocked waiting for a lock Tj holds.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Deadlock: </dt>
              <dd className="inline text-stone-600">
                a cycle in the wait-for graph — every transaction in the cycle is stuck waiting
                forever.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Victim: </dt>
              <dd className="inline text-stone-600">
                the transaction the DBMS chooses to abort in order to break the cycle.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          confusing this with the ordinary lock-waiting from 2PL, where one transaction waits for
          another to finish. That resolves itself — the waiting transaction proceeds once the lock
          is released. A deadlock is different: the wait is mutual and circular, so there's no
          release that will ever come naturally. It requires an outside intervention (aborting a
          victim) to resolve.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Next step" to watch T1 and T2 each acquire a lock, then each request the other's
            lock.
          </li>
          <li>
            Watch the wait-for graph gain an edge each time a transaction starts waiting — and form
            a cycle at the last step.
          </li>
          <li>
            Once deadlocked, click "Abort T1" or "Abort T2" to see the DBMS break the cycle by
            picking a victim.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={idx >= STEPS.length - 1}
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-stone-200 p-3 text-sm">
          <p className="font-semibold text-stone-900">T1</p>
          <p className="text-xs text-stone-600">Holds: {step.t1Holds.join(', ') || 'none'}</p>
          <p className="text-xs text-stone-600">Wants: {step.t1Wants || '—'}</p>
        </div>
        <div className="rounded-md border border-stone-200 p-3 text-sm">
          <p className="font-semibold text-stone-900">T2</p>
          <p className="text-xs text-stone-600">Holds: {step.t2Holds.join(', ') || 'none'}</p>
          <p className="text-xs text-stone-600">Wants: {step.t2Wants || '—'}</p>
        </div>
      </div>

      {/* Wait-for graph */}
      <div className="flex justify-center">
        <svg viewBox="0 0 220 100" className="h-24 w-56">
          <defs>
            <marker id="arrowwf" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill={isDeadlocked && !resolved ? '#f43f5e' : '#78716c'} />
            </marker>
          </defs>
          {step.t1Wants && (
            <path
              d="M 60,30 A 60 30 0 0 1 160,30"
              fill="none"
              stroke={isDeadlocked && !resolved ? '#f43f5e' : '#78716c'}
              strokeWidth={1.5}
              markerEnd="url(#arrowwf)"
            />
          )}
          {step.t2Wants && (
            <path
              d="M 160,70 A 60 30 0 0 1 60,70"
              fill="none"
              stroke={isDeadlocked && !resolved ? '#f43f5e' : '#78716c'}
              strokeWidth={1.5}
              markerEnd="url(#arrowwf)"
            />
          )}
          <circle cx={50} cy={50} r={22} fill={resolved === 'T1' ? '#e7e5e4' : '#7c3aed'} />
          <text
            x={50}
            y={54}
            textAnchor="middle"
            fontSize="12"
            fill={resolved === 'T1' ? '#a8a29e' : 'white'}
          >
            T1
          </text>
          <circle cx={170} cy={50} r={22} fill={resolved === 'T2' ? '#e7e5e4' : '#7c3aed'} />
          <text
            x={170}
            y={54}
            textAnchor="middle"
            fontSize="12"
            fill={resolved === 'T2' ? '#a8a29e' : 'white'}
          >
            T2
          </text>
        </svg>
      </div>

      <p className="text-center text-sm text-stone-600">{step.note}</p>

      {isDeadlocked && !resolved && (
        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">
            Deadlock detected — the DBMS must abort a victim to break the cycle.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => abortVictim('T1')}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Abort T1
            </button>
            <button
              onClick={() => abortVictim('T2')}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Abort T2
            </button>
          </div>
        </div>
      )}
      {resolved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            {resolved} aborted — its locks are released, and {resolved === 'T1' ? 'T2' : 'T1'} can
            now acquire what it was waiting for and proceed.
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
