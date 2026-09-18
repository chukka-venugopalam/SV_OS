/**
 * Component: DistanceVectorRoutingVisualizer
 * Serves: act5-d3-ch03-distance-vector-routing-rip ("Distance Vector Routing — RIP")
 *
 * What it demonstrates:
 *   A small network where each router only knows its direct neighbors' distance
 *   tables (not the whole topology). Distance vectors propagate hop by hop, round by
 *   round, until every router's table stops changing (convergence). Then a link
 *   failure is introduced and, without any fix applied, the routers' distance
 *   estimates creep upward round after round instead of correcting immediately — the
 *   classic RIP "count-to-infinity" problem.
 *
 * Design decisions:
 *   - Fixed 4-router line topology (A-B-C-D, all hop-count 1 per link) rather than a
 *     denser graph, so every one of a router's rows fits on screen and a beginner can
 *     hand-verify each Bellman-Ford update ("min over neighbors' advertised distance
 *     + 1") without a calculator.
 *   - Deliberately runs the failure scenario with count-to-infinity left
 *     un-mitigated (no split horizon) because that failure mode IS the "must
 *     demonstrate" — a version that silently fixes itself would hide the very problem
 *     this chapter is about. RIP's real protocol caps this at metric 16 ("infinity"),
 *     called out explicitly rather than letting the number climb forever.
 *   - Same topology is reused by the Link-State (OSPF) simulator so the two
 *     algorithms' behavior can be directly compared by a student working through both.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const NODES = ['A', 'B', 'C', 'D'];
type Edges = Record<string, Record<string, number>>;
const BASE_EDGES: Edges = {
  A: { B: 1 },
  B: { A: 1, C: 1 },
  C: { B: 1, D: 1 },
  D: { C: 1 },
};
const INF = 16; // RIP's real "infinity" cap

type Table = Record<string, Record<string, number>>; // table[node][dest] = distance

function initialTables(edges: Edges): Table {
  const t: Table = {};
  NODES.forEach((n) => {
    t[n] = {};
    NODES.forEach((d) => {
      t[n][d] = n === d ? 0 : (edges[n][d] ?? Infinity);
    });
  });
  return t;
}

/** One synchronous round: every node fully recomputes each distance purely from what
 *  its neighbors advertised last round (no fallback to its own previous belief) —
 *  this is what makes count-to-infinity actually show up after a failure, instead of
 *  a stale distance just sitting frozen forever. */
function stepRound(edges: Edges, prev: Table): Table {
  const next: Table = {};
  NODES.forEach((n) => {
    next[n] = {};
    NODES.forEach((dest) => {
      if (dest === n) {
        next[n][dest] = 0;
        return;
      }
      let best = Infinity;
      Object.entries(edges[n]).forEach(([neighbor, cost]) => {
        const viaNeighbor = prev[neighbor][dest] + cost;
        if (viaNeighbor < best) best = viaNeighbor;
      });
      next[n][dest] = Math.min(best, INF);
    });
  });
  return next;
}

function tablesEqual(a: Table, b: Table): boolean {
  return NODES.every((n) => NODES.every((d) => a[n][d] === b[n][d]));
}

export default function DistanceVectorRoutingVisualizer() {
  const [failed, setFailed] = useState(false);
  const _edges: Edges = failed
    ? { A: { B: 1 }, B: { A: 1 }, C: { D: 1 }, D: { C: 1 } } // B-C link cut
    : BASE_EDGES;

  const [history, setHistory] = useState<Table[]>([initialTables(BASE_EDGES)]);
  const [round, setRound] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const runMoreRounds = (fromEdges: Edges, base: Table[], maxRounds: number) => {
    const h = [...base];
    for (let i = 0; i < maxRounds; i++) {
      const nextT = stepRound(fromEdges, h[h.length - 1]);
      h.push(nextT);
      if (tablesEqual(nextT, h[h.length - 2])) break;
    }
    return h;
  };

  const reset = () => {
    clearTimer();
    setRunning(false);
    setFailed(false);
    setHistory([initialTables(BASE_EDGES)]);
    setRound(0);
  };

  const breakLink = () => {
    clearTimer();
    setRunning(false);
    setFailed(true);
    const failedEdges: Edges = { A: { B: 1 }, B: { A: 1 }, C: { D: 1 }, D: { C: 1 } };
    const converged = history[history.length - 1];
    setHistory(runMoreRounds(failedEdges, [converged], 20));
    setRound(0);
  };

  const stepOnce = () => setRound((r) => Math.min(history.length - 1, r + 1));

  useEffect(() => {
    if (!running) return;
    if (round >= history.length - 1) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, 700);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, round, history.length]);

  // build converged (pre-failure) history on first mount effect
  useEffect(() => {
    setHistory(runMoreRounds(BASE_EDGES, [initialTables(BASE_EDGES)], 8));
  }, []);

  const table = history[Math.min(round, history.length - 1)];
  const converged = !failed && round > 0 && tablesEqual(table, history[round - 1] ?? table);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>Distance vector routing</strong> (used by the RIP protocol) is a routing strategy
          where each router only knows two things: which routers it's directly connected to, and,
          from gossip, how far
          <em> those neighbors</em> think they are from everywhere else. Every round, each router
          asks "for each destination, is going through one of my neighbors shorter than what I
          currently believe?" and updates if so. Do this repeatedly and, on a stable network,
          everyone's table eventually stops changing — a state called <strong>convergence</strong>.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Distance vector: </dt>
              <dd className="inline text-stone-600">
                a router's own list of "my current best-known distance to every destination."
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Convergence: </dt>
              <dd className="inline text-stone-600">
                the point where no router's table changes anymore after a round.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Count-to-infinity: </dt>
              <dd className="inline text-stone-600">
                a failure mode where, after a link breaks, routers keep believing a now-broken path
                still exists via each other, so their distance estimate creeps up by 1 each round
                instead of correcting immediately.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming that once a network has converged, a link failure is detected and fixed quickly.
          With plain distance vector routing, a router that loses a path doesn't know its neighbor's
          advertised route was
          <em> through the broken link</em> — it can end up trusting a stale route back through that
          very neighbor, and the "distance" number just keeps climbing by 1 each round
          (count-to-infinity) until it hits RIP's cap of {INF} ("infinity"), rather than being
          corrected instantly.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            The network is a line: A—B—C—D. Click "Step" or "Run" to watch each router's table
            update round by round until it converges.
          </li>
          <li>Once converged, click "Break the B–C link" to simulate a failed connection.</li>
          <li>
            Keep stepping forward and watch A and B's distance to D climb round by round instead of
            jumping straight to "unreachable."
          </li>
          <li>Click "Reset" to restore the network and start over.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRunning(true)}
          disabled={round >= history.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Run
        </button>
        <button
          onClick={stepOnce}
          disabled={round >= history.length - 1}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Step forward
        </button>
        <button
          onClick={breakLink}
          disabled={failed || !converged}
          className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Break the B–C link
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span className="ml-2 text-sm text-stone-500">
          Round {round} {converged && !failed && '— converged'}{' '}
          {failed && "— link down, watch D's column"}
        </span>
      </div>

      {/* Topology */}
      <div className="flex items-center justify-center gap-2 py-2">
        {NODES.map((n, i) => (
          <div key={n} className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
              {n}
            </div>
            {i < NODES.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-12 ${failed && n === 'B' && NODES[i + 1] === 'C' ? 'h-0 border-t-2 border-dashed border-rose-500 bg-rose-400' : 'bg-stone-300'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {NODES.map((n) => (
          <div key={n} className="rounded-md border border-stone-200 p-2">
            <p className="mb-1 text-xs font-semibold text-stone-700">Router {n}'s table</p>
            <table className="w-full text-xs">
              <tbody>
                {NODES.filter((d) => d !== n).map((d) => {
                  const dist = table[n][d];
                  const prevDist = history[Math.max(0, round - 1)]?.[n]?.[d];
                  const changed = prevDist !== undefined && prevDist !== dist;
                  return (
                    <tr key={d} className={changed ? 'bg-amber-50' : ''}>
                      <td className="py-0.5 pr-2 text-stone-500">to {d}</td>
                      <td
                        className={`py-0.5 font-mono font-semibold ${dist >= INF ? 'text-rose-600' : 'text-stone-900'}`}
                      >
                        {dist >= INF ? '∞' : dist}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
