/**
 * Component: TransactionStateSim
 * Serves: act6-d4-ch01-transaction-states ("Transaction States")
 *
 * What it demonstrates:
 *   The transaction state diagram (Active → Partially Committed → Committed under
 *   normal operation), with a triggerable system crash that instead routes the
 *   transaction to Failed → Aborted from wherever it currently is — showing that a
 *   crash before the final commit step means the transaction never becomes durable,
 *   no matter how far along it was.
 *
 * Design decisions:
 *   - Modeled on the same "state diagram with a current-state highlight and
 *     labeled transition buttons" pattern used by this app's existing
 *     process-state-visualizer, per the build spec, but as its own standalone
 *     component — a transaction's states and triggers are database-specific
 *     concepts (Partially Committed, WAL-durability) distinct from an OS process's
 *     states, even though the visual shape rhymes.
 *   - "Trigger crash" is available from Active or Partially Committed specifically
 *     (not from Committed) to make the central point concrete: once a transaction is
 *     fully Committed it's durable and safe, but Partially Committed — having run all
 *     its operations but not yet made them permanent — is still vulnerable to a
 *     crash losing everything.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type TxState = 'active' | 'partially_committed' | 'committed' | 'failed' | 'aborted';

const STATE_INFO: Record<TxState, { label: string; pos: { x: number; y: number } }> = {
  active: { label: 'Active', pos: { x: 40, y: 90 } },
  partially_committed: { label: 'Partially Committed', pos: { x: 220, y: 40 } },
  committed: { label: 'Committed', pos: { x: 400, y: 40 } },
  failed: { label: 'Failed', pos: { x: 220, y: 150 } },
  aborted: { label: 'Aborted', pos: { x: 400, y: 150 } },
};

export default function TransactionStateSim() {
  const [state, setState] = useState<TxState>('active');
  const [log, setLog] = useState<string[]>(['Transaction started — state: Active']);

  const act = (next: TxState, note: string) => {
    setState(next);
    setLog((l) => [...l, note]);
  };

  const execute = () => act('active', 'Ran another operation — still Active.');
  const requestCommit = () =>
    act(
      'partially_committed',
      'All operations finished, commit requested — state: Partially Committed (not yet durable!)',
    );
  const finalize = () =>
    act('committed', 'Changes written durably to disk — state: Committed. Done.');
  const crash = () => {
    act('failed', `System crash while ${STATE_INFO[state].label} — state: Failed.`);
    setTimeout(
      () => act('aborted', 'Recovery rolls back any partial changes — state: Aborted.'),
      700,
    );
  };
  const reset = () => {
    setState('active');
    setLog(['Transaction started — state: Active']);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          Every database transaction moves through a small set of states. It starts{' '}
          <strong>Active</strong> while its operations run, becomes{' '}
          <strong>Partially Committed</strong> once all operations have finished but before the
          changes are made permanent, and finally <strong>Committed</strong> once they're safely
          written to durable storage. But if the system crashes at any point before that final
          write, the transaction instead goes <strong>Failed</strong>, then gets rolled back to{' '}
          <strong>Aborted</strong> — as if it never happened.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Partially Committed: </dt>
              <dd className="inline text-stone-600">
                every operation has run, but the results aren't durable yet — still vulnerable to a
                crash.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Committed: </dt>
              <dd className="inline text-stone-600">
                changes are permanently, durably saved — a crash after this point can't undo them.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Aborted: </dt>
              <dd className="inline text-stone-600">
                the transaction's effects have been rolled back entirely, as if it never ran.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming "Partially Committed" means partially saved — like some of the changes made it to
          disk and some didn't. It doesn't — it means all operations finished executing
          successfully, but nothing has been made durable yet. A crash in this state loses
          everything from the transaction, not just "the uncommitted part," because none of it was
          committed yet.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Run operation" a few times, then "Request commit" to move to Partially Committed.
          </li>
          <li>
            Click "Finalize commit" to complete it normally — or click "Trigger crash" at any
            earlier point instead.
          </li>
          <li>
            Watch a crash always route through Failed to Aborted, no matter how close to committing
            you were.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={execute}
          disabled={state !== 'active'}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Run operation
        </button>
        <button
          onClick={requestCommit}
          disabled={state !== 'active'}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Request commit
        </button>
        <button
          onClick={finalize}
          disabled={state !== 'partially_committed'}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Finalize commit
        </button>
        <button
          onClick={crash}
          disabled={state !== 'active' && state !== 'partially_committed'}
          className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Trigger crash
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {/* State diagram */}
      <svg viewBox="0 0 480 200" className="h-52 w-full">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#a8a29e" />
          </marker>
        </defs>
        <line
          x1={90}
          y1={90}
          x2={210}
          y2={55}
          stroke="#a8a29e"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
        <line
          x1={90}
          y1={100}
          x2={210}
          y2={140}
          stroke="#a8a29e"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
        <line
          x1={280}
          y1={40}
          x2={390}
          y2={40}
          stroke="#a8a29e"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
        <line
          x1={280}
          y1={150}
          x2={390}
          y2={150}
          stroke="#a8a29e"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
        <line
          x1={220}
          y1={70}
          x2={220}
          y2={125}
          stroke="#a8a29e"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
        {(Object.keys(STATE_INFO) as TxState[]).map((key) => {
          const info = STATE_INFO[key];
          const active = state === key;
          return (
            <g key={key} transform={`translate(${info.pos.x}, ${info.pos.y})`}>
              <rect
                width={110}
                height={36}
                rx={8}
                fill={active ? '#7c3aed' : '#f5f5f4'}
                stroke={active ? '#6d28d9' : '#d6d3d1'}
              />
              <text
                x={55}
                y={22}
                textAnchor="middle"
                fontSize="11"
                fill={active ? 'white' : '#57534e'}
                fontWeight={active ? 'bold' : 'normal'}
              >
                {info.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="max-h-32 space-y-1 overflow-y-auto text-sm text-stone-600">
        {log.map((l, i) => (
          <p key={i} className="font-mono text-xs">
            {l}
          </p>
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
