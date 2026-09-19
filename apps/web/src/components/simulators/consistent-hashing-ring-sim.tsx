/**
 * Component: ConsistentHashingRingSim
 * Serves: act6-d6-ch01-document-keyvalue-column-stores ("Consistent Hashing")
 *
 * What it demonstrates:
 *   Nodes and keys placed on a hash ring, with each key owned by the next node
 *   clockwise from it. Adding or removing a node only moves the keys in the one arc
 *   segment next to it — contrasted directly against naive mod-N hashing, where
 *   changing the node count reshuffles nearly every key's assignment.
 *
 * Design decisions:
 *   - Both the ring and the mod-N comparison operate on the *same* fixed set of 12
 *     keys and the *same* hash values for them, so the "how many keys moved" counts
 *     are a fair, directly comparable apples-to-apples measurement, not two
 *     independently-tuned examples.
 *   - Node/key positions come from a simple, deterministic string hash (not random
 *     per render), so the ring layout is stable and reproducible for a class demo —
 *     re-running it always shows the same arcs and the same moved keys.
 *   - "Keys moved" is computed by actually comparing before/after assignments for
 *     every key under both schemes, not asserted — the contrast numbers in the UI are
 *     real counts, not scripted claims.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

const RING_SIZE = 360;

function hashToRing(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % RING_SIZE;
}

const KEYS = [
  'user:42',
  'user:17',
  'session:a1',
  'order:901',
  'order:902',
  'cart:5',
  'user:3',
  'order:903',
  'session:b2',
  'cart:9',
  'user:88',
  'order:904',
];
const BASE_NODES = ['NodeA', 'NodeB', 'NodeC'];
const EXTRA_NODE = 'NodeD';
// Node ring positions are assigned explicitly (rather than hashed from short, similar
// names like "NodeA"/"NodeB"/"NodeC"/"NodeD") because this simple teaching hash
// clusters near-identical short strings close together on the ring — explicit,
// well-spread placement keeps the demo's arcs meaningful instead of degenerate.
const NODE_POS: Record<string, number> = { NodeA: 100, NodeB: 220, NodeC: 340, NodeD: 280 };

function assignRing(nodes: string[], keys: string[]): Record<string, string> {
  const nodePositions = nodes.map((n) => ({ n, pos: NODE_POS[n] })).sort((a, b) => a.pos - b.pos);
  const assignment: Record<string, string> = {};
  keys.forEach((k) => {
    const pos = hashToRing(k);
    const owner = nodePositions.find((np) => np.pos >= pos) ?? nodePositions[0]; // wrap around
    assignment[k] = owner.n;
  });
  return assignment;
}

function assignModN(nodeCount: number, keys: string[]): Record<string, number> {
  const assignment: Record<string, number> = {};
  keys.forEach((k) => {
    assignment[k] = hashToRing(k) % nodeCount;
  });
  return assignment;
}

const NODE_COLOR: Record<string, string> = {
  NodeA: '#7c3aed',
  NodeB: '#0ea5e9',
  NodeC: '#f59e0b',
  NodeD: '#10b981',
};

export default function ConsistentHashingRingSim() {
  const [nodeAdded, setNodeAdded] = useState(false);

  const nodesBefore = BASE_NODES;
  const nodesAfter = useMemo(
    () => (nodeAdded ? [...BASE_NODES, EXTRA_NODE] : BASE_NODES),
    [nodeAdded],
  );

  const assignBefore = useMemo(() => assignRing(nodesBefore, KEYS), [nodesBefore]);
  const assignAfter = useMemo(() => assignRing(nodesAfter, KEYS), [nodesAfter]);
  const ringMoved = KEYS.filter((k) => assignBefore[k] !== assignAfter[k]);

  const modBefore = useMemo(() => assignModN(nodesBefore.length, KEYS), [nodesBefore.length]);
  const modAfter = useMemo(() => assignModN(nodesAfter.length, KEYS), [nodesAfter]);
  const modMoved = KEYS.filter((k) => modBefore[k] !== modAfter[k]);

  const positions = (nodes: string[]) => nodes.map((n) => ({ n, pos: NODE_POS[n] }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          When a distributed system spreads keys across several storage nodes, the naive approach —
          hash the key, take it <span className="font-mono">mod N</span> (the number of nodes) — has
          a serious problem: add or remove one node and N changes, which changes nearly every key's
          assignment at once. <strong>Consistent hashing</strong> fixes this by placing both nodes
          and keys on a circular <strong>ring</strong> of hash values; each key belongs to whichever
          node is next going clockwise. Add a node, and it only takes over the keys in the one arc
          segment right before it — everyone else's assignment stays exactly the same.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Hash ring: </dt>
              <dd className="inline text-stone-600">
                a circular range of hash values that both nodes and keys get placed on.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Next node clockwise: </dt>
              <dd className="inline text-stone-600">
                the rule for ownership — a key belongs to the first node found going clockwise from
                its position.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Mod-N hashing: </dt>
              <dd className="inline text-stone-600">
                the naive alternative — key's hash mod the current node count — which reshuffles
                almost everything whenever N changes.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming consistent hashing means "almost no keys ever move." Some keys always have to
          move when the node count changes — that's unavoidable, since the new node has to own
          something. The point isn't zero movement, it's that only the keys in{' '}
          <em>one arc segment</em> move, instead of nearly the entire keyspace like mod-N hashing.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>The ring below starts with 3 nodes and 12 keys already assigned.</li>
          <li>Click "Add NodeD" to add a 4th node to the ring — watch which keys actually move.</li>
          <li>Compare against the mod-N panel below, computed on the exact same 12 keys.</li>
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setNodeAdded((v) => !v)}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          {nodeAdded ? 'Remove NodeD' : 'Add NodeD'}
        </button>
      </div>

      {/* Ring visualization */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 300" className="h-72 w-72">
          <circle cx={150} cy={150} r={110} fill="none" stroke="#e7e5e4" strokeWidth={2} />
          {positions(nodesAfter).map(({ n, pos }) => {
            const rad = (pos / RING_SIZE) * 2 * Math.PI - Math.PI / 2;
            const x = 150 + 110 * Math.cos(rad);
            const y = 150 + 110 * Math.sin(rad);
            return (
              <g key={n}>
                <circle cx={x} cy={y} r={9} fill={NODE_COLOR[n]} stroke="white" strokeWidth={2} />
                <text
                  x={x + (x > 150 ? 12 : -12)}
                  y={y}
                  fontSize="10"
                  textAnchor={x > 150 ? 'start' : 'end'}
                  fill="#44403c"
                >
                  {n}
                </text>
              </g>
            );
          })}
          {KEYS.map((k) => {
            const pos = hashToRing(k);
            const rad = (pos / RING_SIZE) * 2 * Math.PI - Math.PI / 2;
            const x = 150 + 80 * Math.cos(rad);
            const y = 150 + 80 * Math.sin(rad);
            const owner = assignAfter[k];
            const moved = ringMoved.includes(k);
            return (
              <circle
                key={k}
                cx={x}
                cy={y}
                r={moved ? 5 : 3.5}
                fill={NODE_COLOR[owner]}
                opacity={moved ? 1 : 0.5}
                stroke={moved ? '#1c1917' : 'none'}
                strokeWidth={moved ? 1 : 0}
              />
            );
          })}
        </svg>
      </div>

      <div className="rounded-md border border-stone-200 p-4 text-sm">
        <p className="mb-1 font-semibold text-stone-900">Consistent hashing result</p>
        <p className="text-stone-700">
          <span className="font-mono font-semibold">{ringMoved.length}</span> of {KEYS.length} keys
          moved{nodeAdded ? ' when NodeD was added' : ''}: {ringMoved.join(', ') || 'none'}
        </p>
      </div>

      <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm">
        <p className="mb-1 font-semibold text-rose-900">
          Naive mod-N hashing, same keys and same node-count change
        </p>
        <p className="text-rose-800">
          <span className="font-mono font-semibold">{modMoved.length}</span> of {KEYS.length} keys
          moved (hash mod {nodesBefore.length} → hash mod {nodesAfter.length}):{' '}
          {modMoved.join(', ') || 'none'}
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
