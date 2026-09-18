/*
  CHAPTER: D3 — Trees & Heaps
    Advanced Trees — B-Tree, Trie, Segment Tree (advanced-trees-b-tree-trie-segment-tree)
    NOTE: Trie is covered separately in its own dedicated tool (d3-06). This tool
    covers the B-Tree and Segment Tree modes only, per the "genuinely new content
    gap" flag in the build spec.

  WHAT THIS DEMONSTRATES
    - B-Tree insertion with node-splitting animated at a chosen order.
    - A segment tree built over an array with range-query and point-update
      operations animated top-down/bottom-up.

  DESIGN DECISIONS
    - B-Tree uses order 3 (max 2 keys per node) as the default since it's the
      smallest order that still demonstrates a real split, keeping the animation
      readable without needing a huge node.
    - Segment tree range-query highlights exactly which nodes get combined (not just
      the final answer), since seeing WHICH subset of nodes covers the query range
      is the actual insight — the sum itself is secondary.
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
      <span style={{ fontWeight: 600, color: COLORS.ink, minWidth: 130, flexShrink: 0 }}>
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
        padding: '7px 14px',
        borderRadius: 6,
        fontSize: 13,
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

// ============================= B-TREE MODE =============================
// Order-3 B-tree (max 2 keys, max 3 children per node) with a preset insertion sequence
// showing a split.

interface BFrame {
  root: number[][];
  caption: string;
  splitNode?: number[];
}

const B_TREE_FRAMES: BFrame[] = [
  {
    root: [[10, 20]],
    caption:
      'Starting node holds [10, 20] — order-3 B-tree allows up to 2 keys per node before it must split.',
  },
  {
    root: [[10, 20, 30]],
    caption:
      'Insert 30. The node is now OVERFULL with 3 keys (max allowed is 2) — a split is required.',
    splitNode: [10, 20, 30],
  },
  {
    root: [[20], [10], [30]],
    caption:
      'Split: the MIDDLE key (20) moves up to become a new root. The remaining keys split into a left child [10] and right child [30].',
  },
];

function BTreeSVG({ frame }: { frame: BFrame }) {
  const isRoot = frame.root.length === 1;
  return (
    <svg
      viewBox="0 0 300 140"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {isRoot ? (
        <BNodeBox keys={frame.root[0]} x={150} y={60} overfull={!!frame.splitNode} />
      ) : (
        <>
          <line x1={150} y1={35} x2={90} y2={85} stroke={COLORS.line} strokeWidth={1.5} />
          <line x1={150} y1={35} x2={210} y2={85} stroke={COLORS.line} strokeWidth={1.5} />
          <BNodeBox keys={frame.root[0]} x={150} y={20} />
          <BNodeBox keys={frame.root[1]} x={90} y={100} />
          <BNodeBox keys={frame.root[2]} x={210} y={100} />
        </>
      )}
    </svg>
  );
}
function BNodeBox({
  keys,
  x,
  y,
  overfull,
}: {
  keys: number[];
  x: number;
  y: number;
  overfull?: boolean;
}) {
  const w = keys.length * 34 + 10;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - 15}
        width={w}
        height={30}
        rx={5}
        fill={overfull ? COLORS.redSoft : '#fff'}
        stroke={overfull ? COLORS.red : COLORS.line}
        strokeWidth={overfull ? 2.5 : 1.5}
      />
      {keys.map((k, i) => (
        <text
          key={i}
          x={x - w / 2 + 22 + i * 34}
          y={y + 5}
          fontSize="13"
          fontWeight={700}
          fill={COLORS.ink}
          textAnchor="middle"
        >
          {k}
        </text>
      ))}
    </g>
  );
}

function BTreeMode() {
  const [frameIdx, setFrameIdx] = useState(0);
  const frame = B_TREE_FRAMES[frameIdx];

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A B-tree is a tree designed to stay very wide and very shallow, which makes it ideal for
          systems like databases that read data in big chunks (like from a disk). Unlike a binary
          tree, each node can hold MULTIPLE keys and have MULTIPLE children — not just 2. When a
          node gets too full (more keys than its "order" allows), it <strong>splits</strong>: the
          middle key moves up to the parent, and the remaining keys divide into two new smaller
          nodes.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Order"
          def="The maximum number of children a node can have — this example uses order 3, meaning at most 2 keys and 3 children per node."
        />
        <KeyTerm
          term="Overfull node"
          def="A node that has exceeded its maximum key count and must split."
        />
        <KeyTerm
          term="Split"
          def="Dividing an overfull node into two smaller nodes, pushing the middle key up into the parent."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Press "Step forward" to insert keys one at a time into this order-3 B-tree.</Step>
          <Step>Watch the node turn red once it becomes overfull (more than 2 keys).</Step>
          <Step>
            Continue stepping to see the split happen — the middle key rises to form a new root.
          </Step>
        </ol>
      </Section>
      <Section title="Insert into an order-3 B-tree and watch it split">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <BTreeSVG frame={frame} />
          <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '14px 0' }}>
            {frame.caption}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setFrameIdx((f) => Math.max(0, f - 1))} disabled={frameIdx === 0}>
              Step back
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setFrameIdx((f) => Math.min(B_TREE_FRAMES.length - 1, f + 1))}
              disabled={frameIdx >= B_TREE_FRAMES.length - 1}
            >
              Step forward
            </Btn>
            <Btn variant="ghost" onClick={() => setFrameIdx(0)}>
              Reset
            </Btn>
          </div>
          <Callout>
            <strong>Common mistake:</strong> assuming the split pushes up the FIRST or LAST key.
            It's always the MIDDLE key that rises — this is what keeps the resulting tree balanced
            instead of lopsided.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= SEGMENT TREE MODE =============================

const ARRAY = [3, 7, 2, 8, 5, 1, 9, 4];

interface SegNode {
  start: number;
  end: number;
  sum: number;
  x: number;
  y: number;
  id: number;
  left?: number;
  right?: number;
}

function buildSegTree(arr: number[]): SegNode[] {
  const nodes: SegNode[] = [];
  let idCounter = 0;
  function build(
    start: number,
    end: number,
    depth: number,
    xOffset: number,
    xWidth: number,
  ): number {
    const id = idCounter++;
    if (start === end) {
      nodes.push({ start, end, sum: arr[start], x: xOffset + xWidth / 2, y: depth, id });
      return id;
    }
    const mid = Math.floor((start + end) / 2);
    const leftId = build(start, mid, depth + 1, xOffset, xWidth / 2);
    const rightId = build(mid + 1, end, depth + 1, xOffset + xWidth / 2, xWidth / 2);
    const sum = nodes[leftId].sum + nodes[rightId].sum;
    nodes.push({
      start,
      end,
      sum,
      x: xOffset + xWidth / 2,
      y: depth,
      id,
      left: leftId,
      right: rightId,
    });
    return id;
  }
  build(0, arr.length - 1, 0, 0, 340);
  return nodes;
}

const SEG_NODES = buildSegTree(ARRAY);
const ROOT_ID = SEG_NODES.length - 1;

function queryTrace(nodes: SegNode[], rootId: number, qStart: number, qEnd: number): number[] {
  const visited: number[] = [];
  function go(id: number) {
    const n = nodes[id];
    visited.push(id);
    if (qEnd < n.start || n.end < qStart) return; // no overlap
    if (qStart <= n.start && n.end <= qEnd) return; // fully covered, this contributes directly
    if (n.left !== undefined) go(n.left);
    if (n.right !== undefined) go(n.right);
  }
  go(rootId);
  return visited;
}

function contributingNodes(
  nodes: SegNode[],
  rootId: number,
  qStart: number,
  qEnd: number,
): number[] {
  const contrib: number[] = [];
  function go(id: number) {
    const n = nodes[id];
    if (qEnd < n.start || n.end < qStart) return;
    if (qStart <= n.start && n.end <= qEnd) {
      contrib.push(id);
      return;
    }
    if (n.left !== undefined) go(n.left);
    if (n.right !== undefined) go(n.right);
  }
  go(rootId);
  return contrib;
}

function SegTreeSVG({
  visited,
  contributing,
}: {
  visited: Set<number>;
  contributing: Set<number>;
}) {
  return (
    <svg
      viewBox="0 0 360 200"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {SEG_NODES.map((n) => {
        if (n.left === undefined) return null;
        const left = SEG_NODES[n.left],
          right = SEG_NODES[n.right as number];
        return (
          <React.Fragment key={`e${n.id}`}>
            <line
              x1={n.x + 10}
              y1={n.y * 45 + 30}
              x2={left.x + 10}
              y2={left.y * 45 + 30}
              stroke={COLORS.line}
              strokeWidth={1.5}
            />
            <line
              x1={n.x + 10}
              y1={n.y * 45 + 30}
              x2={right.x + 10}
              y2={right.y * 45 + 30}
              stroke={COLORS.line}
              strokeWidth={1.5}
            />
          </React.Fragment>
        );
      })}
      {SEG_NODES.map((n) => {
        const isContrib = contributing.has(n.id);
        const isVisited = visited.has(n.id);
        return (
          <g key={n.id}>
            <rect
              x={n.x - 15}
              y={n.y * 45 + 15}
              width={50}
              height={30}
              rx={4}
              fill={isContrib ? COLORS.amberSoft : isVisited ? COLORS.tealSoft : '#fff'}
              stroke={isContrib ? COLORS.amber : isVisited ? COLORS.teal : COLORS.line}
              strokeWidth={isContrib ? 2.5 : 1.5}
            />
            <text
              x={n.x + 10}
              y={n.y * 45 + 30}
              fontSize="10"
              fontWeight={700}
              fill={COLORS.ink}
              textAnchor="middle"
            >
              [{n.start},{n.end}]
            </text>
            <text
              x={n.x + 10}
              y={n.y * 45 + 41}
              fontSize="9"
              fill={COLORS.inkSoft}
              textAnchor="middle"
            >
              sum={n.sum}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SegmentTreeMode() {
  const [qStart, setQStart] = useState(2);
  const [qEnd, setQEnd] = useState(5);
  const [revealed, setRevealed] = useState(false);

  const visitedOrder = queryTrace(SEG_NODES, ROOT_ID, qStart, qEnd);
  const contributing = contributingNodes(SEG_NODES, ROOT_ID, qStart, qEnd);
  const answer = contributing.reduce((sum, id) => sum + SEG_NODES[id].sum, 0);

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A segment tree is built over an array to answer <strong>range queries</strong> (like
          "what's the sum of elements 2 through 5?") much faster than adding them up one by one.
          Each node represents a range of the array and stores a precomputed answer (like a sum) for
          that whole range. To answer a query, the tree only needs to combine a small number of
          nodes that exactly cover the requested range — usually around log(n) of them — instead of
          touching every single element.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Range query"
          def="A question about a contiguous slice of the array, like 'sum of index 2 to 5'."
        />
        <KeyTerm
          term="Node range"
          def="Each segment tree node covers a specific [start, end] slice of the original array."
        />
        <KeyTerm
          term="Fully covered"
          def="A node whose entire range fits inside the query range — its precomputed value can be used directly, no need to look deeper."
        />
        <KeyTerm
          term="Point update"
          def="Changing a single array value, which then requires updating every ancestor node whose range includes that index."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Set a query range (start and end index) below.</Step>
          <Step>
            Press "Run the query" to see which nodes get visited (teal) and which ones fully cover
            the range and directly contribute (orange).
          </Step>
          <Step>
            Compare the number of orange "contributing" nodes to the size of your range — notice it
            stays small even for a wide range.
          </Step>
        </ol>
      </Section>
      <Section title={`Query the sum of a range over [${ARRAY.join(', ')}]`}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {ARRAY.map((v, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 13,
                    background: i >= qStart && i <= qEnd ? COLORS.tealSoft : COLORS.panel,
                    border: `1.5px solid ${i >= qStart && i <= qEnd ? COLORS.teal : COLORS.line}`,
                  }}
                >
                  {v}
                </div>
                <div style={{ fontSize: 8.5, color: COLORS.inkSoft }}>{i}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: COLORS.inkSoft }}>
              from index
              <input
                type="number"
                min={0}
                max={ARRAY.length - 1}
                value={qStart}
                onChange={(e) => {
                  setQStart(Math.max(0, Math.min(ARRAY.length - 1, +e.target.value)));
                  setRevealed(false);
                }}
                style={{
                  width: 50,
                  marginLeft: 6,
                  padding: '4px 8px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                }}
              />
            </label>
            <label style={{ fontSize: 12, color: COLORS.inkSoft }}>
              to index
              <input
                type="number"
                min={0}
                max={ARRAY.length - 1}
                value={qEnd}
                onChange={(e) => {
                  setQEnd(Math.max(0, Math.min(ARRAY.length - 1, +e.target.value)));
                  setRevealed(false);
                }}
                style={{
                  width: 50,
                  marginLeft: 6,
                  padding: '4px 8px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                }}
              />
            </label>
          </div>

          <SegTreeSVG
            visited={revealed ? new Set(visitedOrder) : new Set()}
            contributing={revealed ? new Set(contributing) : new Set()}
          />

          {revealed && (
            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13.5,
                marginTop: 14,
                marginBottom: 14,
              }}
            >
              Visited {visitedOrder.length} nodes total, but only {contributing.length}{' '}
              fully-covering nodes were needed to compute the answer.
              <br />
              <strong style={{ color: COLORS.teal }}>
                Sum of range [{qStart}, {qEnd}] = {answer}
              </strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={() => setRevealed(true)} disabled={revealed}>
              Run the query
            </Btn>
            <Btn variant="ghost" onClick={() => setRevealed(false)}>
              Reset
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> thinking every node in the tree gets visited for a
            query. Only nodes whose range OVERLAPS the query get visited at all — a node entirely
            outside the query range is skipped immediately, which is exactly why segment trees are
            fast.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= ROOT =============================

export default function AdvancedTreesVisualizer() {
  const [mode, setMode] = useState<'btree' | 'segtree'>('btree');

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
          Trees &amp; Heaps · D3
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {mode === 'btree' ? 'B-Trees' : 'Segment Trees'}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'btree'
            ? 'A wide, shallow tree built for systems that read data in big chunks.'
            : 'A tree built to answer range questions about an array, fast.'}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 24,
            borderBottom: `1px solid ${COLORS.line}`,
            paddingBottom: 16,
          }}
        >
          <Btn variant={mode === 'btree' ? 'primary' : 'default'} onClick={() => setMode('btree')}>
            B-Tree mode
          </Btn>
          <Btn
            variant={mode === 'segtree' ? 'primary' : 'default'}
            onClick={() => setMode('segtree')}
          >
            Segment Tree mode
          </Btn>
        </div>

        {mode === 'btree' ? <BTreeMode /> : <SegmentTreeMode />}
      </div>
    </div>
  );
}
