/*
  CHAPTER: D3 — Trees & Heaps
    AVL Trees & Rotations (d3-03-avl-trees-rotations)
    NOTE: spec says to verify bst-avl-visualizer (already built) covers this before
    building separately — user has opted to build this now and will dedupe/merge
    against the existing component themselves. This file is self-contained and can
    be discarded or merged as needed.

  WHAT THIS DEMONSTRATES
    Insert nodes causing imbalance, show balance factor per node, animate all 4
    rotation cases (LL/RR/LR/RL) restoring balance.

  DESIGN DECISIONS
    - Rather than a free insertion UI (which risks landing on a rotation case that's
      hard to narrate generically), used 4 PRESET scenarios, one per rotation case,
      each starting pre-imbalanced with one extra insert that triggers the specific
      rotation — so every case gets a clean, correct, individually-narrated animation.
    - Balance factor is displayed on every node at every step, since watching it
      cross the threshold IS what makes "why did this rotate" visible.
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

interface Node {
  val: number;
  x: number;
  y: number;
  bf: number;
}
interface Edge {
  from: number;
  to: number;
}
interface TreeFrame {
  nodes: Node[];
  edges: Edge[];
  caption: string;
}

const CASES = {
  LL: {
    label: 'Left-Left (LL)',
    rotationName: 'Single right rotation',
    frames: [
      {
        nodes: [
          { val: 30, x: 170, y: 20, bf: 2 },
          { val: 20, x: 100, y: 80, bf: 1 },
          { val: 10, x: 40, y: 140, bf: 0 },
        ],
        edges: [
          { from: 30, to: 20 },
          { from: 20, to: 10 },
        ],
        caption:
          "Inserting 10 made node 30 unbalanced (balance factor +2) — the extra height is on the LEFT child's LEFT side.",
      },
      {
        nodes: [
          { val: 20, x: 120, y: 40, bf: 0 },
          { val: 10, x: 60, y: 100, bf: 0 },
          { val: 30, x: 180, y: 100, bf: 0 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
        ],
        caption:
          'Single right rotation: 20 becomes the new root, 30 drops down to become its right child. Balanced!',
      },
    ] as TreeFrame[],
  },
  RR: {
    label: 'Right-Right (RR)',
    rotationName: 'Single left rotation',
    frames: [
      {
        nodes: [
          { val: 10, x: 60, y: 20, bf: -2 },
          { val: 20, x: 130, y: 80, bf: -1 },
          { val: 30, x: 190, y: 140, bf: 0 },
        ],
        edges: [
          { from: 10, to: 20 },
          { from: 20, to: 30 },
        ],
        caption:
          "Inserting 30 made node 10 unbalanced (balance factor -2) — the extra height is on the RIGHT child's RIGHT side.",
      },
      {
        nodes: [
          { val: 20, x: 120, y: 40, bf: 0 },
          { val: 10, x: 60, y: 100, bf: 0 },
          { val: 30, x: 180, y: 100, bf: 0 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
        ],
        caption:
          'Single left rotation: 20 becomes the new root, 10 drops down to become its left child. Balanced!',
      },
    ] as TreeFrame[],
  },
  LR: {
    label: 'Left-Right (LR)',
    rotationName: 'Double rotation (left, then right)',
    frames: [
      {
        nodes: [
          { val: 30, x: 170, y: 20, bf: 2 },
          { val: 10, x: 90, y: 80, bf: -1 },
          { val: 20, x: 150, y: 140, bf: 0 },
        ],
        edges: [
          { from: 30, to: 10 },
          { from: 10, to: 20 },
        ],
        caption:
          "Inserting 20 made node 30 unbalanced — but the extra height zigzags: LEFT child, then that child's RIGHT side. Needs a double rotation.",
      },
      {
        nodes: [
          { val: 30, x: 170, y: 20, bf: 2 },
          { val: 20, x: 90, y: 80, bf: 1 },
          { val: 10, x: 40, y: 140, bf: 0 },
        ],
        edges: [
          { from: 30, to: 20 },
          { from: 20, to: 10 },
        ],
        caption:
          "First, rotate LEFT at node 10's subtree: 20 moves up to become 10's parent. Now it looks like a plain LL case.",
      },
      {
        nodes: [
          { val: 20, x: 120, y: 40, bf: 0 },
          { val: 10, x: 60, y: 100, bf: 0 },
          { val: 30, x: 180, y: 100, bf: 0 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
        ],
        caption:
          'Then rotate RIGHT at the root, same as the LL fix: 20 becomes the new root. Balanced!',
      },
    ] as TreeFrame[],
  },
  RL: {
    label: 'Right-Left (RL)',
    rotationName: 'Double rotation (right, then left)',
    frames: [
      {
        nodes: [
          { val: 10, x: 60, y: 20, bf: -2 },
          { val: 30, x: 140, y: 80, bf: 1 },
          { val: 20, x: 90, y: 140, bf: 0 },
        ],
        edges: [
          { from: 10, to: 30 },
          { from: 30, to: 20 },
        ],
        caption:
          "Inserting 20 made node 10 unbalanced — the extra height zigzags: RIGHT child, then that child's LEFT side. Needs a double rotation.",
      },
      {
        nodes: [
          { val: 10, x: 60, y: 20, bf: -2 },
          { val: 20, x: 140, y: 80, bf: -1 },
          { val: 30, x: 190, y: 140, bf: 0 },
        ],
        edges: [
          { from: 10, to: 20 },
          { from: 20, to: 30 },
        ],
        caption:
          "First, rotate RIGHT at node 30's subtree: 20 moves up to become 30's parent. Now it looks like a plain RR case.",
      },
      {
        nodes: [
          { val: 20, x: 120, y: 40, bf: 0 },
          { val: 10, x: 60, y: 100, bf: 0 },
          { val: 30, x: 180, y: 100, bf: 0 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
        ],
        caption:
          'Then rotate LEFT at the root, same as the RR fix: 20 becomes the new root. Balanced!',
      },
    ] as TreeFrame[],
  },
};

type CaseKey = keyof typeof CASES;

function BalanceBadge({ bf }: { bf: number }) {
  const bad = Math.abs(bf) >= 2;
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: '1px 4px',
        borderRadius: 3,
        background: bad ? COLORS.redSoft : COLORS.tealSoft,
        color: bad ? COLORS.red : COLORS.teal,
      }}
    >
      {bf > 0 ? `+${bf}` : bf}
    </span>
  );
}

function TreeFrameSVG({ frame }: { frame: TreeFrame }) {
  const nodeMap = Object.fromEntries(frame.nodes.map((n) => [n.val, n]));
  return (
    <svg
      viewBox="0 0 230 180"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {frame.edges.map((e, i) => {
        const a = nodeMap[e.from],
          b = nodeMap[e.to];
        if (!a || !b) return null;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={COLORS.line}
            strokeWidth={1.5}
          />
        );
      })}
      {frame.nodes.map((n) => (
        <g key={n.val}>
          <circle
            cx={n.x}
            cy={n.y}
            r={18}
            fill={Math.abs(n.bf) >= 2 ? COLORS.redSoft : '#fff'}
            stroke={Math.abs(n.bf) >= 2 ? COLORS.red : COLORS.line}
            strokeWidth={Math.abs(n.bf) >= 2 ? 2.5 : 1.5}
          />
          <text
            x={n.x}
            y={n.y + 4}
            fontSize="13"
            fontWeight={700}
            fill={COLORS.ink}
            textAnchor="middle"
          >
            {n.val}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AvlRotationVisualizer() {
  const [activeCase, setActiveCase] = useState<CaseKey>('LL');
  const [frameIdx, setFrameIdx] = useState(0);
  const frames = CASES[activeCase].frames;
  const frame = frames[frameIdx];

  function changeCase(c: CaseKey) {
    setActiveCase(c);
    setFrameIdx(0);
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
          AVL Trees &amp; Rotations
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How a self-balancing tree fixes itself the instant it becomes lopsided.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A regular binary search tree can become badly lopsided depending on insertion order,
            which hurts performance. An <strong>AVL tree</strong> fixes this automatically: after
            every insertion, it checks each node's <strong>balance factor</strong> (the height of
            its left subtree minus its right subtree). If that number ever reaches +2 or -2, the
            tree is too lopsided, and a<strong> rotation</strong> — a local rearrangement of a few
            nodes — restores balance. There are 4 possible imbalance shapes, each fixed by a
            different rotation pattern.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Balance factor"
            def="Left subtree height minus right subtree height. Must stay between -1 and +1 for a valid AVL tree."
          />
          <KeyTerm
            term="Rotation"
            def="A local rearrangement of 2-3 nodes that changes the tree's shape without breaking its sorted (BST) property."
          />
          <KeyTerm
            term="LL / RR case"
            def="A 'straight-line' imbalance (left-left or right-right) — fixed with a SINGLE rotation."
          />
          <KeyTerm
            term="LR / RL case"
            def="A 'zigzag' imbalance (left-right or right-left) — needs a DOUBLE rotation (two single rotations back to back)."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Pick one of the four imbalance cases using the buttons below.</Step>
            <Step>
              Notice the red-highlighted node — that's the one whose balance factor has gone out of
              range.
            </Step>
            <Step>Press "Step forward" to watch the rotation(s) play out and restore balance.</Step>
            <Step>
              Compare LL/RR (single rotation) against LR/RL (double rotation, one extra step) side
              by side.
            </Step>
          </ol>
        </Section>

        <Section title="Four imbalance cases, four fixes">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(Object.keys(CASES) as CaseKey[]).map((c) => (
                <Btn
                  key={c}
                  variant={activeCase === c ? 'primary' : 'default'}
                  onClick={() => changeCase(c)}
                >
                  {CASES[c].label}
                </Btn>
              ))}
            </div>

            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>
              Fix: <strong>{CASES[activeCase].rotationName}</strong>
            </div>

            <TreeFrameSVG frame={frame} />

            <div
              style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 10, flexWrap: 'wrap' }}
            >
              {frame.nodes.map((n) => (
                <div
                  key={n.val}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  node {n.val}: <BalanceBadge bf={n.bf} />
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '10px 0 14px' }}>
              {frame.caption}
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setFrameIdx((f) => Math.max(0, f - 1))} disabled={frameIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setFrameIdx((f) => Math.min(frames.length - 1, f + 1))}
                disabled={frameIdx >= frames.length - 1}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setFrameIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> trying to fix an LR or RL case with just ONE
              rotation. A zigzag shape needs two rotations — attempting a single rotation on a
              zigzag actually leaves the tree still unbalanced, just in a different way.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
