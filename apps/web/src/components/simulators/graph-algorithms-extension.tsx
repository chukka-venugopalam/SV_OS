/*
  CHAPTER: Graph Algorithms — Topological Sort, Minimum Spanning Tree (Kruskal's &
  Prim's) (Act 3, Graph Algorithms)
  EXTENSION BUILD: per user's repo audit, the existing graph-traversal-visualizer
  component already correctly implements BFS and DFS. This file adds the remaining
  claimed modes (Topological Sort, MST via both Kruskal's and Prim's) as a
  standalone component, since this session has no repo access to open and literally
  extend the existing file in place. Built to match the established visual/interaction
  conventions used throughout this project — but "matches the existing file's internal
  code pattern" specifically could not be verified without reading that file.

  WHAT THIS DEMONSTRATES
    Topological Sort: a directed acyclic graph (course prerequisites) processed via
      Kahn's algorithm (repeatedly removing nodes with no remaining incoming edges),
      producing a valid ordering where every prerequisite comes before what depends
      on it — plus an explicit demonstration of what happens when a cycle exists
      (no valid topological order can exist).
    MST (Kruskal's & Prim's): the same weighted undirected graph solved by both
      classic MST algorithms side by side, showing Kruskal's edge-sorted-greedy
      approach (with cycle detection via union-find) against Prim's
      grow-from-a-starting-node approach, converging on the same total weight
      despite building the tree in a completely different order.

  DESIGN DECISIONS
    - Topological Sort includes an explicit "this graph has a cycle" scenario
      alongside the normal DAG case, since recognizing that a topological order
      CANNOT exist when a cycle is present is as important as computing a valid
      order when one does exist.
    - Ran BOTH Kruskal's and Prim's on the identical weighted graph, converging on
      the same total MST weight (verified programmatically, not merely claimed),
      since seeing two structurally different algorithms agree on the final answer
      is strong, concrete evidence that "any correct MST algorithm gives the same
      minimum total weight" is genuinely true, not just asserted.
*/

import React, { useState } from 'react';

const COLORS = {
  ink: '#1B2430',
  inkSoft: '#5B6472',
  parchment: '#FAF7F0',
  panel: '#F1ECE1',
  teal: '#2A9D8F',
  tealSoft: '#DCEEEC',
  amber: '#E9A23B',
  amberSoft: '#FBEBD2',
  red: '#D4634A',
  redSoft: '#F8E1DB',
  line: '#DDD5C3',
  purple: '#8B7FD1',
  purpleSoft: '#EDE6F5',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontFamily: 'ui-serif, Georgia, serif',
          fontSize: 15,
          fontWeight: 600,
          color: COLORS.ink,
          margin: '0 0 10px 0',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
function KeyTerm({ term, def }: { term: string; def: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13.5, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 600, color: COLORS.ink, minWidth: 150, flexShrink: 0 }}>
        {term}
      </span>
      <span style={{ color: COLORS.inkSoft }}>{def}</span>
    </div>
  );
}
function Step({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        marginBottom: 6,
        fontSize: 13.5,
        lineHeight: 1.55,
        color: COLORS.inkSoft,
        paddingLeft: 2,
      }}
    >
      {children}
    </li>
  );
}
function Btn({
  onClick,
  children,
  variant = 'default',
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  disabled?: boolean;
}) {
  const styles = {
    default: { background: '#fff', border: `1px solid ${COLORS.line}`, color: COLORS.ink },
    primary: { background: COLORS.teal, border: `1px solid ${COLORS.teal}`, color: '#fff' },
    ghost: { background: 'transparent', border: `1px solid transparent`, color: COLORS.inkSoft },
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: '6px 12px',
        borderRadius: 6,
        fontSize: 12.5,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: '8px 12px',
        background: COLORS.amberSoft,
        borderRadius: 6,
        fontSize: 12.5,
        color: COLORS.ink,
      }}
    >
      {children}
    </div>
  );
}

// ============================= TOPOLOGICAL SORT MODE =============================

const COURSE_NODES = [
  'Intro CS',
  'Data Structures',
  'Algorithms',
  'Calculus I',
  'Calculus II',
  'Discrete Math',
  'AI',
];
// edges: [from, to] meaning "from" is a prerequisite of "to"
const COURSE_EDGES: [string, string][] = [
  ['Intro CS', 'Data Structures'],
  ['Data Structures', 'Algorithms'],
  ['Discrete Math', 'Algorithms'],
  ['Calculus I', 'Calculus II'],
  ['Algorithms', 'AI'],
  ['Calculus II', 'AI'],
];
const CYCLE_EDGES: [string, string][] = [...COURSE_EDGES, ['AI', 'Intro CS']]; // introduces a cycle

function kahnsTopoSort(
  nodes: string[],
  edges: [string, string][],
): { order: string[]; hasCycle: boolean; steps: { removed: string; newlyAvailable: string[] }[] } {
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => {
    inDegree[n] = 0;
  });
  edges.forEach(([, to]) => {
    inDegree[to]++;
  });

  const queue: string[] = nodes.filter((n) => inDegree[n] === 0);
  const order: string[] = [];
  const steps: { removed: string; newlyAvailable: string[] }[] = [];
  const inDegreeCopy = { ...inDegree };

  while (queue.length > 0) {
    const node = queue.shift() as string;
    order.push(node);
    const newlyAvailable: string[] = [];
    edges.forEach(([from, to]) => {
      if (from === node) {
        inDegreeCopy[to]--;
        if (inDegreeCopy[to] === 0) {
          queue.push(to);
          newlyAvailable.push(to);
        }
      }
    });
    steps.push({ removed: node, newlyAvailable });
  }

  return { order, hasCycle: order.length !== nodes.length, steps };
}

export function TopoSortMode() {
  const [useCycle, setUseCycle] = useState(false);
  const edges = useCycle ? CYCLE_EDGES : COURSE_EDGES;
  const result = kahnsTopoSort(COURSE_NODES, edges);
  const [stepIdx, setStepIdx] = useState(0);

  function toggle(v: boolean) {
    setUseCycle(v);
    setStepIdx(0);
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        A course prerequisite graph: an arrow from A to B means "A must be completed before B." A
        topological sort produces a valid ORDER to take all these courses in, respecting every
        prerequisite.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Btn variant={!useCycle ? 'primary' : 'default'} onClick={() => toggle(false)}>
          Normal (no cycle)
        </Btn>
        <Btn variant={useCycle ? 'primary' : 'default'} onClick={() => toggle(true)}>
          With a cycle added
        </Btn>
      </div>

      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 }}>
        Prerequisites: {edges.map(([a, b]) => `${a}→${b}`).join(', ')}
      </div>

      {!result.hasCycle && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {result.order.map((course, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  fontWeight: 700,
                  background: i <= stepIdx ? COLORS.tealSoft : COLORS.panel,
                  border: `1.5px solid ${i <= stepIdx ? COLORS.teal : COLORS.line}`,
                  opacity: i <= stepIdx ? 1 : 0.4,
                }}
              >
                {i + 1}. {course}
              </div>
            ))}
          </div>
          {stepIdx < result.steps.length && (
            <div
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, marginBottom: 14 }}
            >
              Remove "{result.steps[stepIdx].removed}" (no remaining prerequisites blocking it).
              {result.steps[stepIdx].newlyAvailable.length > 0
                ? ` This unlocks: ${result.steps[stepIdx].newlyAvailable.join(', ')}.`
                : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn
              variant="primary"
              onClick={() => setStepIdx((i) => Math.min(result.steps.length, i + 1))}
              disabled={stepIdx >= result.steps.length}
            >
              Step forward
            </Btn>
            <Btn variant="ghost" onClick={() => setStepIdx(0)}>
              Reset
            </Btn>
          </div>
        </>
      )}

      {result.hasCycle && (
        <div
          style={{
            background: COLORS.redSoft,
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 13,
            color: COLORS.red,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          No valid topological order exists! This graph has a cycle (AI requires Algorithms, which
          eventually requires AI again) — there's no course you could possibly take FIRST, since
          everything has an unmet prerequisite somewhere in the loop.
        </div>
      )}

      <Callout>
        <strong>Common mistake:</strong> assuming a topological sort is unique. It usually isn't —
        whenever multiple nodes have zero remaining incoming edges at the same time, they could be
        processed in ANY order relative to each other, producing a different but equally valid
        overall sequence.
      </Callout>
    </div>
  );
}

// ============================= MST MODE =============================

interface Edge {
  a: string;
  b: string;
  weight: number;
}
const MST_NODES = ['A', 'B', 'C', 'D', 'E'];
const MST_EDGES: Edge[] = [
  { a: 'A', b: 'B', weight: 4 },
  { a: 'A', b: 'C', weight: 2 },
  { a: 'B', b: 'C', weight: 1 },
  { a: 'B', b: 'D', weight: 5 },
  { a: 'C', b: 'D', weight: 8 },
  { a: 'C', b: 'E', weight: 10 },
  { a: 'D', b: 'E', weight: 2 },
  { a: 'B', b: 'E', weight: 6 },
];

class UnionFind {
  parent: Record<string, string> = {};
  constructor(nodes: string[]) {
    nodes.forEach((n) => {
      this.parent[n] = n;
    });
  }
  find(x: string): string {
    return this.parent[x] === x ? x : (this.parent[x] = this.find(this.parent[x]));
  }
  union(x: string, y: string): boolean {
    const rx = this.find(x),
      ry = this.find(y);
    if (rx === ry) return false;
    this.parent[rx] = ry;
    return true;
  }
}

function kruskalMST(
  nodes: string[],
  edges: Edge[],
): { steps: { edge: Edge; accepted: boolean }[]; mstEdges: Edge[]; totalWeight: number } {
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(nodes);
  const steps: { edge: Edge; accepted: boolean }[] = [];
  const mstEdges: Edge[] = [];
  for (const e of sorted) {
    const accepted = uf.union(e.a, e.b);
    steps.push({ edge: e, accepted });
    if (accepted) mstEdges.push(e);
  }
  return { steps, mstEdges, totalWeight: mstEdges.reduce((s, e) => s + e.weight, 0) };
}

function primMST(
  nodes: string[],
  edges: Edge[],
  start: string,
): { steps: { edge: Edge; newNode: string }[]; mstEdges: Edge[]; totalWeight: number } {
  const visited = new Set([start]);
  const mstEdges: Edge[] = [];
  const steps: { edge: Edge; newNode: string }[] = [];
  while (visited.size < nodes.length) {
    let best: Edge | null = null;
    for (const e of edges) {
      const aIn = visited.has(e.a),
        bIn = visited.has(e.b);
      if (aIn !== bIn) {
        if (!best || e.weight < best.weight) best = e;
      }
    }
    if (!best) break; // disconnected graph guard
    const newNode = visited.has(best.a) ? best.b : best.a;
    visited.add(newNode);
    mstEdges.push(best);
    steps.push({ edge: best, newNode });
  }
  return { steps, mstEdges, totalWeight: mstEdges.reduce((s, e) => s + e.weight, 0) };
}

export function MstMode() {
  const [algo, setAlgo] = useState<'kruskal' | 'prim'>('kruskal');
  const kruskal = kruskalMST(MST_NODES, MST_EDGES);
  const prim = primMST(MST_NODES, MST_EDGES, 'A');
  const [stepIdx, setStepIdx] = useState(0);

  function change(a: 'kruskal' | 'prim') {
    setAlgo(a);
    setStepIdx(0);
  }

  const current = algo === 'kruskal' ? kruskal : prim;
  const acceptedEdgesSoFar =
    algo === 'kruskal'
      ? kruskal.steps
          .slice(0, stepIdx)
          .filter((s) => s.accepted)
          .map((s) => s.edge)
      : prim.steps.slice(0, stepIdx).map((s) => s.edge);

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Find the Minimum Spanning Tree — the cheapest possible set of edges that connects every
        node, with no cycles. Two classic algorithms solve this completely differently but always
        reach the same total weight.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Btn variant={algo === 'kruskal' ? 'primary' : 'default'} onClick={() => change('kruskal')}>
          Kruskal's (sort all edges)
        </Btn>
        <Btn variant={algo === 'prim' ? 'primary' : 'default'} onClick={() => change('prim')}>
          Prim's (grow from a node)
        </Btn>
      </div>

      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 }}>
        Edges: {MST_EDGES.map((e) => `${e.a}-${e.b}(${e.weight})`).join(', ')}
      </div>

      {algo === 'kruskal' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>
            Kruskal's checks edges in order of weight, smallest first, accepting any that DON'T form
            a cycle:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {kruskal.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  background:
                    i >= stepIdx ? 'transparent' : s.accepted ? COLORS.tealSoft : COLORS.redSoft,
                  opacity: i < stepIdx ? 1 : 0.35,
                }}
              >
                {s.edge.a}-{s.edge.b} (weight {s.edge.weight}):{' '}
                {i < stepIdx
                  ? s.accepted
                    ? 'ACCEPTED — connects two separate groups'
                    : 'REJECTED — would form a cycle'
                  : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {algo === 'prim' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>
            Prim's starts at node A and always adds the cheapest edge connecting the growing tree to
            a NEW node:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {prim.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  background: i < stepIdx ? COLORS.tealSoft : 'transparent',
                  opacity: i < stepIdx ? 1 : 0.35,
                }}
              >
                {i < stepIdx
                  ? `Add edge ${s.edge.a}-${s.edge.b} (weight ${s.edge.weight}) — brings in node ${s.newNode}.`
                  : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Btn
          variant="primary"
          onClick={() => setStepIdx((i) => Math.min(current.steps.length, i + 1))}
          disabled={stepIdx >= current.steps.length}
        >
          Step forward
        </Btn>
        <Btn variant="ghost" onClick={() => setStepIdx(0)}>
          Reset
        </Btn>
      </div>

      {stepIdx >= current.steps.length && (
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.teal,
            marginBottom: 8,
          }}
        >
          MST edges: {acceptedEdgesSoFar.map((e) => `${e.a}-${e.b}`).join(', ')} — total weight:{' '}
          {current.totalWeight}
        </div>
      )}
      {stepIdx >= current.steps.length && kruskal.totalWeight === prim.totalWeight && (
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
          Both algorithms reach total weight {kruskal.totalWeight} — different edge order, same
          minimum cost.
        </div>
      )}

      <Callout>
        <strong>Common mistake:</strong> in Kruskal's, thinking any edge between two nodes NOT
        already directly connected is safe to accept. What actually matters is whether the two nodes
        are already connected through ANY path in the growing forest (even indirectly) — accepting
        an edge between two nodes already in the same connected group would create a cycle, which is
        exactly what union-find detects.
      </Callout>
    </div>
  );
}

// ============================= ROOT =============================

export default function GraphAlgorithmsExtension() {
  const [mode, setMode] = useState<'topo' | 'mst'>('topo');

  return (
    <div
      style={{
        background: COLORS.parchment,
        minHeight: '100%',
        padding: '28px 24px 40px',
        fontFamily: 'system-ui, sans-serif',
        color: COLORS.ink,
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 6, fontSize: 11.5, color: COLORS.inkSoft }}>
          Graph Algorithms · Act 3
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {mode === 'topo' ? 'Topological Sort' : 'Minimum Spanning Tree'}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'topo'
            ? 'Finding a valid order to process nodes that respects every dependency.'
            : 'Connecting every node as cheaply as possible, with no wasted cycles.'}
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            {mode === 'topo'
              ? 'A topological sort takes a directed graph representing dependencies (like course prerequisites, or build steps) and produces a linear ordering where every dependency comes before whatever relies on it. This only works on a DAG (Directed Acyclic Graph) — a graph with no cycles — since a cycle would mean two things each require each other first, which has no valid starting point.'
              : "A Minimum Spanning Tree connects every node in a weighted graph using the smallest possible total edge weight, while forming a tree (no cycles, and every node reachable). Two classic algorithms solve this: Kruskal's considers all edges globally, sorted cheapest-first; Prim's grows a single tree outward from one starting node, always adding the cheapest available connection to something new."}
          </p>
        </Section>

        <Section title="Key terms">
          {mode === 'topo' ? (
            <>
              <KeyTerm
                term="DAG"
                def="Directed Acyclic Graph — a directed graph with no cycles, the only kind that can be topologically sorted."
              />
              <KeyTerm
                term="In-degree"
                def="How many incoming edges (unmet dependencies) a node currently has."
              />
              <KeyTerm
                term="Kahn's algorithm"
                def="Repeatedly remove any node with zero remaining in-degree, which is exactly the topological-sort technique used here."
              />
            </>
          ) : (
            <>
              <KeyTerm
                term="Spanning tree"
                def="A subset of edges that connects every node with no cycles."
              />
              <KeyTerm
                term="Union-Find"
                def="A data structure Kruskal's uses to quickly check whether two nodes are already connected, to avoid creating a cycle."
              />
              <KeyTerm
                term="Cut property"
                def="The reason both algorithms work: the cheapest edge crossing any split of the nodes into two groups is always safe to include in some MST."
              />
            </>
          )}
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {mode === 'topo' ? (
              <>
                <Step>
                  Step through the normal course graph to see a valid processing order emerge.
                </Step>
                <Step>
                  Switch to the "with a cycle" version and see why no valid order can exist.
                </Step>
              </>
            ) : (
              <>
                <Step>
                  Step through Kruskal's algorithm and watch which edges get accepted or rejected.
                </Step>
                <Step>
                  Switch to Prim's and watch the tree grow outward from a single starting node
                  instead.
                </Step>
                <Step>
                  Compare the final total weight — both algorithms should agree, despite building
                  the tree completely differently.
                </Step>
              </>
            )}
          </ol>
        </Section>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <Btn variant={mode === 'topo' ? 'primary' : 'default'} onClick={() => setMode('topo')}>
            Topological Sort
          </Btn>
          <Btn variant={mode === 'mst' ? 'primary' : 'default'} onClick={() => setMode('mst')}>
            Minimum Spanning Tree
          </Btn>
        </div>

        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          {mode === 'topo' ? <TopoSortMode /> : <MstMode />}
        </div>
      </div>
    </div>
  );
}
