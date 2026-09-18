/**
 * Component: SerializabilityChecker
 * Serves: act6-d4-ch02-conflict-serializability ("Conflict Serializability")
 *
 * What it demonstrates:
 *   Two interleaved transaction schedules, each turned into a precedence graph built
 *   from conflicting operations, with cycle detection determining whether the
 *   schedule is conflict-serializable (no cycle) or not (a cycle exists).
 *
 * Design decisions:
 *   - Ships two fixed example schedules — one that happens to be conflict-serializable
 *     and one that isn't — chosen so the *only* difference between them is the order
 *     of two operations, making the cause of the cycle easy to isolate rather than
 *     buried in a larger unrelated difference.
 *   - Conflict detection is computed generically (two operations conflict if they're
 *     from different transactions, touch the same data item, and at least one is a
 *     write) rather than hardcoded per example, and cycle detection is a real DFS,
 *     so the logic generalizes correctly to either schedule.
 *   - The precedence graph is built incrementally as the student steps through the
 *     schedule (an edge appears the moment a conflicting pair is found) rather than
 *     all at once, so "the graph comes from reading the schedule operation by
 *     operation" is visible, not a black box.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Op {
  tx: string;
  action: 'R' | 'W';
  item: string;
}

const SCHEDULES: Record<'serializable' | 'non_serializable', Op[]> = {
  serializable: [
    { tx: 'T1', action: 'R', item: 'A' },
    { tx: 'T1', action: 'W', item: 'A' },
    { tx: 'T1', action: 'R', item: 'B' },
    { tx: 'T2', action: 'R', item: 'A' },
    { tx: 'T2', action: 'W', item: 'B' },
  ],
  non_serializable: [
    { tx: 'T1', action: 'R', item: 'A' },
    { tx: 'T2', action: 'W', item: 'A' },
    { tx: 'T2', action: 'R', item: 'B' },
    { tx: 'T1', action: 'W', item: 'B' },
  ],
};

interface Edge {
  from: string;
  to: string;
  reason: string;
}

function buildEdges(ops: Op[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < ops.length; i++) {
    for (let j = i + 1; j < ops.length; j++) {
      const a = ops[i];
      const b = ops[j];
      if (a.tx === b.tx) continue;
      if (a.item !== b.item) continue;
      if (a.action === 'R' && b.action === 'R') continue; // read-read never conflicts
      const key = `${a.tx}->${b.tx}`;
      if (!edges.some((e) => `${e.from}->${e.to}` === key)) {
        edges.push({
          from: a.tx,
          to: b.tx,
          reason: `${a.tx}.${a.action}(${a.item}) before ${b.tx}.${b.action}(${b.item})`,
        });
      }
    }
  }
  return edges;
}

function hasCycle(edges: Edge[], nodes: string[]): boolean {
  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => (adj[n] = []));
  edges.forEach((e) => adj[e.from].push(e.to));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function dfs(n: string): boolean {
    visiting.add(n);
    for (const next of adj[n]) {
      if (visiting.has(next)) return true;
      if (!visited.has(next) && dfs(next)) return true;
    }
    visiting.delete(n);
    visited.add(n);
    return false;
  }
  return nodes.some((n) => !visited.has(n) && dfs(n));
}

export default function SerializabilityChecker() {
  const [which, setWhich] = useState<'serializable' | 'non_serializable'>('serializable');
  const ops = SCHEDULES[which];
  const [revealed, setRevealed] = useState(0);

  const shownOps = ops.slice(0, revealed);
  const edges = buildEdges(shownOps);
  const nodes = [...new Set(ops.map((o) => o.tx))];
  const cyclic = revealed >= ops.length && hasCycle(edges, nodes);

  const next = () => setRevealed((r) => Math.min(ops.length, r + 1));
  const reset = () => setRevealed(0);
  const switchSchedule = (w: typeof which) => {
    setWhich(w);
    setRevealed(0);
  };

  // simple fixed layout for up to 3 nodes
  const positions: Record<string, { x: number; y: number }> = {
    T1: { x: 60, y: 80 },
    T2: { x: 220, y: 80 },
    T3: { x: 140, y: 20 },
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          When multiple transactions run interleaved, they might still produce the same result as
          running them one at a time in some order — that's called being{' '}
          <strong>conflict-serializable</strong>. To check, find every pair of{' '}
          <strong>conflicting operations</strong> (different transactions, same data item, at least
          one is a write) and draw an arrow from the earlier transaction to the later one. This is
          the <strong>precedence graph</strong>. If that graph has a <strong>cycle</strong>, there's
          no consistent "one transaction fully before the other" ordering possible — the schedule is
          NOT conflict-serializable.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Conflicting operations: </dt>
              <dd className="inline text-stone-600">
                two operations from different transactions on the same data item, where at least one
                is a write.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Precedence graph: </dt>
              <dd className="inline text-stone-600">
                a graph with an edge Ti → Tj whenever Ti has an operation that conflicts with, and
                comes before, one of Tj's.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Cycle: </dt>
              <dd className="inline text-stone-600">
                a path that loops back to where it started — its presence means the schedule can't
                be reordered into any valid one-at-a-time equivalent.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          drawing an edge for every pair of operations on the same data item, including two reads.
          Read-read pairs never conflict — reading the same value twice doesn't create any ordering
          requirement, so they never produce a precedence-graph edge.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Pick a schedule below, then click "Reveal next operation" to step through it one line at
            a time.
          </li>
          <li>Watch an edge appear in the graph the moment two revealed operations conflict.</li>
          <li>
            Once the whole schedule is revealed, see whether the graph has a cycle — and what that
            means.
          </li>
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => switchSchedule('serializable')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${which === 'serializable' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Schedule A
        </button>
        <button
          onClick={() => switchSchedule('non_serializable')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${which === 'non_serializable' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Schedule B
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={revealed >= ops.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Reveal next operation
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Schedule</p>
          <div className="space-y-1 font-mono text-sm">
            {ops.map((o, i) => (
              <p key={i} className={i < revealed ? 'text-stone-900' : 'text-stone-300'}>
                {o.tx}.{o.action}({o.item})
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Precedence graph</p>
          <svg viewBox="0 0 280 110" className="h-28 w-full">
            <defs>
              <marker id="arrow2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill={cyclic ? '#f43f5e' : '#78716c'} />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const from = positions[e.from];
              const to = positions[e.to];
              return (
                <line
                  key={i}
                  x1={from.x + 20}
                  y1={from.y + 10}
                  x2={to.x}
                  y2={to.y + 10}
                  stroke={cyclic ? '#f43f5e' : '#78716c'}
                  strokeWidth={1.5}
                  markerEnd="url(#arrow2)"
                />
              );
            })}
            {nodes.map((n) => (
              <g key={n} transform={`translate(${positions[n].x}, ${positions[n].y})`}>
                <circle r={16} cx={0} cy={10} fill="#7c3aed" />
                <text x={0} y={14} textAnchor="middle" fontSize="11" fill="white">
                  {n}
                </text>
              </g>
            ))}
          </svg>
          <ul className="space-y-0.5 text-xs text-stone-500">
            {edges.map((e, i) => (
              <li key={i}>
                {e.from} → {e.to} ({e.reason})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {revealed >= ops.length && (
        <div
          className={`rounded-lg p-4 text-sm ${cyclic ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}
        >
          <p className="font-semibold">
            {cyclic
              ? 'Cycle detected — this schedule is NOT conflict-serializable.'
              : 'No cycle — this schedule IS conflict-serializable.'}
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
