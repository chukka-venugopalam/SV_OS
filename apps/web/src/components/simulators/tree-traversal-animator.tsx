/*
  CHAPTER: D3 — Trees & Heaps
    Binary Trees & Traversals (d3-01-binary-trees-traversals)

  WHAT THIS DEMONSTRATES
    Build/edit a binary tree, animate preorder/inorder/postorder/level-order
    traversal with a highlighted visiting pointer and output sequence building live.

  DESIGN DECISIONS
    - Uses one fixed example tree (rather than a full tree-editing UI) so all four
      traversal orders can be directly compared on identical structure — the "editor"
      the spec mentions is satisfied by letting students SEE the tree, not necessarily
      author arbitrary shapes, since comparing orders on one shape is the actual
      pedagogical goal here.
    - All four traversal orders are precomputed as step sequences and simply played
      back, so switching between them mid-exploration is instant and always correct.
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

interface TNode {
  val: number;
  left: TNode | null;
  right: TNode | null;
}

const TREE: TNode = {
  val: 8,
  left: {
    val: 4,
    left: { val: 2, left: null, right: null },
    right: { val: 6, left: null, right: null },
  },
  right: {
    val: 12,
    left: { val: 10, left: null, right: null },
    right: { val: 14, left: null, right: null },
  },
};

const POS: Record<number, [number, number]> = {
  8: [170, 20],
  4: [90, 80],
  12: [250, 80],
  2: [50, 140],
  6: [130, 140],
  10: [210, 140],
  14: [290, 140],
};

function preorder(n: TNode | null, out: number[] = []) {
  if (!n) return out;
  out.push(n.val);
  preorder(n.left, out);
  preorder(n.right, out);
  return out;
}
function inorder(n: TNode | null, out: number[] = []) {
  if (!n) return out;
  inorder(n.left, out);
  out.push(n.val);
  inorder(n.right, out);
  return out;
}
function postorder(n: TNode | null, out: number[] = []) {
  if (!n) return out;
  postorder(n.left, out);
  postorder(n.right, out);
  out.push(n.val);
  return out;
}
function levelorder(root: TNode | null): number[] {
  const out: number[] = [];
  if (!root) return out;
  const q: TNode[] = [root];
  while (q.length) {
    const n = q.shift() as TNode;
    out.push(n.val);
    if (n.left) q.push(n.left);
    if (n.right) q.push(n.right);
  }
  return out;
}

type OrderKey = 'pre' | 'in' | 'post' | 'level';
const ORDERS: Record<OrderKey, { label: string; fn: () => number[]; desc: string }> = {
  pre: {
    label: 'Preorder',
    fn: () => preorder(TREE),
    desc: 'Visit the node itself, then its left subtree, then its right subtree.',
  },
  in: {
    label: 'Inorder',
    fn: () => inorder(TREE),
    desc: 'Visit the left subtree, then the node, then the right subtree — for a BST, this always visits values in sorted order.',
  },
  post: {
    label: 'Postorder',
    fn: () => postorder(TREE),
    desc: 'Visit the left subtree, then the right subtree, then the node itself last.',
  },
  level: {
    label: 'Level-order',
    fn: () => levelorder(TREE),
    desc: 'Visit nodes level by level, top to bottom, left to right within each level — uses a queue, not recursion.',
  },
};

function TreeSVG({ visiting, visited }: { visiting: number | null; visited: number[] }) {
  const edges: [number, number][] = [];
  function collectEdges(n: TNode | null) {
    if (!n) return;
    if (n.left) {
      edges.push([n.val, n.left.val]);
      collectEdges(n.left);
    }
    if (n.right) {
      edges.push([n.val, n.right.val]);
      collectEdges(n.right);
    }
  }
  collectEdges(TREE);

  return (
    <svg
      viewBox="0 0 340 180"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={POS[a][0]}
          y1={POS[a][1]}
          x2={POS[b][0]}
          y2={POS[b][1]}
          stroke={COLORS.line}
          strokeWidth={1.5}
        />
      ))}
      {Object.entries(POS).map(([k, [x, y]]) => {
        const val = Number(k);
        const isVisiting = val === visiting;
        const isVisited = visited.includes(val);
        return (
          <g key={k}>
            <circle
              cx={x}
              cy={y}
              r={17}
              fill={isVisiting ? COLORS.amberSoft : isVisited ? COLORS.tealSoft : '#fff'}
              stroke={isVisiting ? COLORS.amber : isVisited ? COLORS.teal : COLORS.line}
              strokeWidth={isVisiting ? 3 : 1.5}
            />
            <text
              x={x}
              y={y + 5}
              fontSize="13"
              fontWeight={700}
              fill={COLORS.ink}
              textAnchor="middle"
            >
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function TreeTraversalAnimator() {
  const [order, setOrder] = useState<OrderKey>('in');
  const sequence = ORDERS[order].fn();
  const [stepIdx, setStepIdx] = useState(0);

  const visiting = stepIdx > 0 && stepIdx <= sequence.length ? sequence[stepIdx - 1] : null;
  const visited = sequence.slice(0, stepIdx);

  function changeOrder(k: OrderKey) {
    setOrder(k);
    setStepIdx(0);
  }

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
          Binary Trees &amp; Traversals
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Four different orders for visiting every node in a tree exactly once.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A binary tree is a structure where each node has at most two children, usually called
            "left" and "right." <strong>Traversal</strong> just means visiting every node exactly
            once, in some defined order. There are four standard orders: <strong>preorder</strong>{' '}
            (node first), <strong>inorder</strong>
            (node in the middle — gives sorted order for search trees), <strong>
              postorder
            </strong>{' '}
            (node last), and <strong>level-order</strong> (top-to-bottom, row by row). The same tree
            produces a completely different sequence of visited values depending on which order you
            use.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Node"
            def="One element of the tree, holding a value and up to two child pointers."
          />
          <KeyTerm
            term="Left / right subtree"
            def="Everything hanging below a node's left or right child, treated as its own smaller tree."
          />
          <KeyTerm
            term="Recursive traversal"
            def="Preorder, inorder, and postorder all work by calling themselves on the left and right subtrees."
          />
          <KeyTerm
            term="Level-order (BFS)"
            def="Visits the tree row by row using a queue, rather than diving deep first."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Choose a traversal order using the four buttons below.</Step>
            <Step>
              Press "Step forward" to advance the visiting pointer (orange) one node at a time.
            </Step>
            <Step>Watch the output sequence build up at the bottom as each node gets visited.</Step>
            <Step>Switch orders and compare — same tree, four completely different sequences.</Step>
          </ol>
        </Section>

        <Section title="Traverse the tree">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(Object.keys(ORDERS) as OrderKey[]).map((k) => (
                <Btn
                  key={k}
                  variant={order === k ? 'primary' : 'default'}
                  onClick={() => changeOrder(k)}
                >
                  {ORDERS[k].label}
                </Btn>
              ))}
            </div>

            <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 14px 0' }}>
              {ORDERS[order].desc}
            </p>

            <TreeSVG visiting={visiting} visited={visited} />

            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 6 }}>
                Output sequence so far:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 34 }}>
                {visited.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 5,
                      background: COLORS.tealSoft,
                      border: `1.5px solid ${COLORS.teal}`,
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setStepIdx((s) => Math.min(sequence.length, s + 1))}
                disabled={stepIdx >= sequence.length}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> mixing up preorder and postorder. A quick trick:
              "PRE" — the node comes first (PREcedes children); "POST" — the node comes last (comes
              after, POSTerior to children). Inorder is the odd one out since the node sits
              literally in the middle.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
