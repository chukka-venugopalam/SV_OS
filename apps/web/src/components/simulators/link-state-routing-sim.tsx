/**
 * Component: LinkStateRoutingSim
 * Serves: act5-d3-ch04-link-state-routing-ospf ("Link-State Routing — OSPF")
 *
 * What it demonstrates:
 *   Every router building a *complete* map of the network by flooding Link-State
 *   Advertisements (LSAs) to every other router, then running Dijkstra's algorithm
 *   locally on that full map to compute shortest paths — directly contrasted against
 *   distance vector routing's partial, neighbors-only knowledge on the identical
 *   A-B-C-D topology used by DistanceVectorRoutingVisualizer.
 *
 * Design decisions:
 *   - Reuses the exact same 4-router line topology (A-B-C-D, hop cost 1) as the
 *     distance-vector simulator so a student who has used both can directly compare
 *     "here's what each router knows" side by side rather than having to re-learn a
 *     new topology.
 *   - Flooding is animated as a literal wave (round 1: direct neighbors only; round 2:
 *     neighbors-of-neighbors; etc.) so "every router eventually has the whole map" is
 *     something the student watches happen, not something just stated.
 *   - Dijkstra's algorithm is shown as an explicit step trace (tentative distances,
 *     the node just finalized, and which edges got relaxed) rather than jumping
 *     straight to the final shortest-path tree, since the "pick the closest unvisited
 *     node, relax its neighbors, repeat" mechanism is the actual thing being taught.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const NODES = ['A', 'B', 'C', 'D'];
const EDGES: Record<string, Record<string, number>> = {
  A: { B: 1 },
  B: { A: 1, C: 1 },
  C: { B: 1, D: 1 },
  D: { C: 1 },
};

type Tab = 'flooding' | 'dijkstra';

// ---- Flooding: which nodes has each router "heard from" (via LSA) after k rounds ----
function knownAfterRounds(start: string, rounds: number): Set<string> {
  let frontier = new Set([start]);
  const known = new Set([start]);
  for (let r = 0; r < rounds; r++) {
    const next = new Set<string>();
    frontier.forEach((n) => {
      Object.keys(EDGES[n]).forEach((nb) => {
        if (!known.has(nb)) {
          next.add(nb);
          known.add(nb);
        }
      });
    });
    frontier = next;
    if (frontier.size === 0) break;
  }
  return known;
}

// ---- Dijkstra trace ----
interface DijkstraStep {
  finalized: string;
  dist: Record<string, number>;
  relaxedEdge?: [string, string];
}
function dijkstraTrace(source: string): DijkstraStep[] {
  const dist: Record<string, number> = {};
  NODES.forEach((n) => (dist[n] = n === source ? 0 : Infinity));
  const visited = new Set<string>();
  const steps: DijkstraStep[] = [];
  while (visited.size < NODES.length) {
    let u: string | null = null;
    let best = Infinity;
    NODES.forEach((n) => {
      if (!visited.has(n) && dist[n] < best) {
        best = dist[n];
        u = n;
      }
    });
    if (u === null) break;
    visited.add(u);
    steps.push({ finalized: u, dist: { ...dist } });
    Object.entries(EDGES[u]).forEach(([v, cost]) => {
      if (dist[u!] + cost < dist[v]) {
        dist[v] = dist[u!] + cost;
        steps.push({ finalized: u!, dist: { ...dist }, relaxedEdge: [u!, v] });
      }
    });
  }
  return steps;
}

export default function LinkStateRoutingSim() {
  const [tab, setTab] = useState<Tab>('flooding');
  const [source, setSource] = useState('A');

  // Flooding state
  const [floodRound, setFloodRound] = useState(0);
  const maxFloodRounds = NODES.length; // safely covers the whole graph
  const known = knownAfterRounds(source, floodRound);

  // Dijkstra state
  const steps = dijkstraTrace(source);
  const [stepIdx, setStepIdx] = useState(0);
  const current = steps[Math.min(stepIdx, steps.length - 1)];

  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    setFloodRound(0);
    setStepIdx(0);
    setRunning(false);
    clearTimer();
  }, [source, tab]);

  useEffect(() => {
    if (!running) return;
    const atEnd = tab === 'flooding' ? floodRound >= maxFloodRounds : stepIdx >= steps.length - 1;
    if (atEnd) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(() => {
      if (tab === 'flooding') setFloodRound((r) => r + 1);
      else setStepIdx((s) => s + 1);
    }, 700);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, floodRound, stepIdx, tab]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setTab('flooding')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'flooding' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          1. LSA flooding
        </button>
        <button
          onClick={() => setTab('dijkstra')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'dijkstra' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          2. Run Dijkstra's
        </button>
      </div>

      {tab === 'flooding' ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            <strong>Link-state routing</strong> (used by OSPF) takes a completely different approach
            from distance vector: instead of only trusting neighbor gossip, every router describes
            its own direct connections in a small message called an <strong>LSA</strong> (Link-State
            Advertisement), and floods that message to every other router in the network, hop by
            hop. After enough rounds, every single router ends up with a full map of the entire
            topology — not just its immediate neighborhood.
          </p>
          <div className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-medium text-stone-900">
                  LSA (Link-State Advertisement):{' '}
                </dt>
                <dd className="inline text-stone-600">
                  a small message a router sends describing exactly which links it has and their
                  cost.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Flooding: </dt>
                <dd className="inline text-stone-600">
                  forwarding a received LSA out to all your other neighbors too, so it eventually
                  reaches everyone.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Topology map: </dt>
                <dd className="inline text-stone-600">
                  a router's complete picture of every router and link in the network, built from
                  all the LSAs it's collected.
                </dd>
              </div>
            </dl>
          </div>
          <CommonMistake>
            assuming link-state routers exchange their entire routing table with each other, the way
            distance vector does. They don't — they only ever flood small LSAs describing their own
            direct links. The full map, and any shortest-path calculation, is assembled and computed
            independently by each router itself, using Dijkstra's algorithm on the map it built.
          </CommonMistake>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>Pick which router's point of view to watch (default: A).</li>
              <li>Click "Step" or "Run" to flood LSAs outward one hop per round.</li>
              <li>
                Watch which routers {source} has "heard from" light up until every router is known.
              </li>
              <li>
                Compare: in the distance-vector simulator, a router only ever knows direct neighbors
                — here it eventually knows everyone.
              </li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            Once a router has the full topology map, it needs to turn that map into actual shortest
            paths. <strong>Dijkstra's algorithm</strong> does this: starting from itself (distance
            0), it repeatedly picks the closest router it hasn't finalized yet, locks in that
            distance, and checks whether going through that router gives a shorter path to any of
            its neighbors (called <strong>relaxing</strong> an edge). It repeats until every router
            has a finalized shortest distance.
          </p>
          <div className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-medium text-stone-900">Tentative distance: </dt>
                <dd className="inline text-stone-600">
                  the current best-known (but not yet guaranteed final) distance to a node.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Finalized: </dt>
                <dd className="inline text-stone-600">
                  once a node's shortest distance is locked in, it will never change again.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Relaxing an edge: </dt>
                <dd className="inline text-stone-600">
                  checking whether reaching a node through the just-finalized node beats its current
                  tentative distance, and updating if so.
                </dd>
              </div>
            </dl>
          </div>
          <CommonMistake>
            thinking Dijkstra explores every possible path and compares them all at the end. It
            doesn't — it greedily finalizes the single closest unvisited node at each step and never
            revisits that decision, which is exactly why it only works correctly when all edge costs
            are non-negative.
          </CommonMistake>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>Pick the source router {source} is computing shortest paths from.</li>
              <li>
                Click "Step" to reveal one Dijkstra action at a time: a node finalized, or an edge
                relaxed.
              </li>
              <li>Watch the tentative-distance table update live as each step runs.</li>
            </ol>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600">Router's point of view:</span>
        {NODES.map((n) => (
          <button
            key={n}
            onClick={() => setSource(n)}
            className={`h-9 w-9 rounded-full border text-sm font-semibold ${source === n ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRunning(true)}
          disabled={tab === 'flooding' ? floodRound >= maxFloodRounds : stepIdx >= steps.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Run
        </button>
        <button
          onClick={() =>
            tab === 'flooding'
              ? setFloodRound((r) => Math.min(maxFloodRounds, r + 1))
              : setStepIdx((s) => Math.min(steps.length - 1, s + 1))
          }
          disabled={tab === 'flooding' ? floodRound >= maxFloodRounds : stepIdx >= steps.length - 1}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Step forward
        </button>
        <button
          onClick={() => {
            setFloodRound(0);
            setStepIdx(0);
            setRunning(false);
          }}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {/* Topology */}
      <div className="flex items-center justify-center gap-2 py-2">
        {NODES.map((n, i) => {
          const isKnownInFlood = tab === 'flooding' && known.has(n);
          const isFinalizedInDijkstra =
            tab === 'dijkstra' &&
            steps.slice(0, stepIdx + 1).some((s) => s.finalized === n && !s.relaxedEdge);
          return (
            <div key={n} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  n === source
                    ? 'border-violet-600 bg-violet-500 text-white'
                    : isKnownInFlood || isFinalizedInDijkstra
                      ? 'border-emerald-500 bg-emerald-400 text-white'
                      : 'border-stone-200 bg-stone-100 text-stone-400'
                }`}
              >
                {n}
              </div>
              {i < NODES.length - 1 && <div className="mx-1 h-0.5 w-12 bg-stone-300" />}
            </div>
          );
        })}
      </div>

      {tab === 'flooding' ? (
        <p className="text-center text-sm text-stone-600">
          Round {floodRound}: router {source} has heard from{' '}
          <span className="font-semibold">{[...known].sort().join(', ')}</span>
          {known.size === NODES.length && ' — full topology map complete.'}
        </p>
      ) : (
        <div className="space-y-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-stone-400">
                <th className="text-left font-normal">Node</th>
                {NODES.map((n) => (
                  <th key={n} className="text-left font-normal">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-2 text-stone-500">tentative dist.</td>
                {NODES.map((n) => (
                  <td
                    key={n}
                    className={`font-mono ${current.finalized === n ? 'font-semibold text-emerald-600' : ''}`}
                  >
                    {current.dist[n] === Infinity ? '∞' : current.dist[n]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-stone-600">
            {current.relaxedEdge
              ? `Relaxed edge ${current.relaxedEdge[0]}→${current.relaxedEdge[1]}: found a shorter path.`
              : `Finalized node ${current.finalized} — its shortest distance from ${source} is now locked in.`}
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
