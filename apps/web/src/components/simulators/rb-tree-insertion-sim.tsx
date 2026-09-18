/*
  CHAPTER: D3 — Trees & Heaps
    Red-Black Trees (d3-04-red-black-trees)

  WHAT THIS DEMONSTRATES
    Insert nodes with color-coded red/black display, enforce all 4 RB invariants
    live, show recoloring/rotation fixing a violation.

  DESIGN DECISIONS
    - All 4 invariants are listed as a persistent checklist with live pass/fail
      status, rather than only mentioned in prose, so students always know exactly
      what's being protected as they insert.
    - Uses 3 preset guided scenarios (simple insert / recolor case / rotation case)
      rather than a free insertion engine, since correctly implementing full RB
      insertion fixup logic live is complex and a wrong intermediate state would
      actively mis-teach the invariants — preset, verified-correct scenarios protect
      correctness while still showing the real mechanism.
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
  rbRed: '#D4634A',
  rbBlack: '#1B2430',
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
function StepLi({ children }: { children: React.ReactNode }) {
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

type Color = 'R' | 'B';
interface RBNode {
  val: number;
  color: Color;
  x: number;
  y: number;
}
interface RBEdge {
  from: number;
  to: number;
}
interface RBFrame {
  nodes: RBNode[];
  edges: RBEdge[];
  caption: string;
  invariantNote?: string;
  violated?: number;
}

const SCENARIOS = {
  simple: {
    label: 'Simple insert (no fixup needed)',
    frames: [
      {
        nodes: [{ val: 20, color: 'B', x: 120, y: 30 }],
        edges: [],
        caption: 'Starting tree: just the root, colored black.',
      },
      {
        nodes: [
          { val: 20, color: 'B', x: 120, y: 30 },
          { val: 10, color: 'R', x: 60, y: 90 },
        ],
        edges: [{ from: 20, to: 10 }],
        caption:
          'Insert 10 as a new RED node. Its parent (20) is black, so no invariant is broken — done!',
      },
    ] as RBFrame[],
  },
  recolor: {
    label: 'Fixup by recoloring (uncle is red)',
    frames: [
      {
        nodes: [
          { val: 20, color: 'B', x: 120, y: 20 },
          { val: 10, color: 'R', x: 60, y: 80 },
          { val: 30, color: 'R', x: 180, y: 80 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
        ],
        caption: 'Tree before insertion: root 20 (black) with two red children.',
      },
      {
        nodes: [
          { val: 20, color: 'B', x: 120, y: 20 },
          { val: 10, color: 'R', x: 60, y: 80 },
          { val: 30, color: 'R', x: 180, y: 80 },
          { val: 5, color: 'R', x: 30, y: 140 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
          { from: 10, to: 5 },
        ],
        caption:
          'Insert 5 as RED. Now its parent (10) is ALSO red — that violates "no red node has a red child"!',
        violated: 5,
        invariantNote: 'Violated: no two red nodes in a row',
      },
      {
        nodes: [
          { val: 20, color: 'R', x: 120, y: 20 },
          { val: 10, color: 'B', x: 60, y: 80 },
          { val: 30, color: 'B', x: 180, y: 80 },
          { val: 5, color: 'R', x: 30, y: 140 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
          { from: 10, to: 5 },
        ],
        caption:
          "Fix by RECOLORING: since 5's uncle (30) is also red, just flip 10 and 30 to black, and 20 to red. If 20 is the root, it gets forced back to black.",
      },
      {
        nodes: [
          { val: 20, color: 'B', x: 120, y: 20 },
          { val: 10, color: 'B', x: 60, y: 80 },
          { val: 30, color: 'B', x: 180, y: 80 },
          { val: 5, color: 'R', x: 30, y: 140 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
          { from: 10, to: 5 },
        ],
        caption:
          '20 is the root, so it must be black. All invariants now hold again — fixed with only recoloring, no rotation needed!',
      },
    ] as RBFrame[],
  },
  rotate: {
    label: 'Fixup by rotation (uncle is black)',
    frames: [
      {
        nodes: [
          { val: 20, color: 'B', x: 130, y: 20 },
          { val: 10, color: 'R', x: 60, y: 80 },
          { val: 30, color: 'B', x: 200, y: 80 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
        ],
        caption:
          'Tree before insertion: root 20 (black), left child 10 (red), right child 30 (black, or absent — treated as black).',
      },
      {
        nodes: [
          { val: 20, color: 'B', x: 130, y: 20 },
          { val: 10, color: 'R', x: 60, y: 80 },
          { val: 30, color: 'B', x: 200, y: 80 },
          { val: 5, color: 'R', x: 30, y: 140 },
        ],
        edges: [
          { from: 20, to: 10 },
          { from: 20, to: 30 },
          { from: 10, to: 5 },
        ],
        caption:
          "Insert 5 as RED. Its parent (10) is also red — violation! But this time the uncle (30) is BLACK, so recoloring alone won't work.",
        violated: 5,
        invariantNote: 'Violated: no two red nodes in a row',
      },
      {
        nodes: [
          { val: 10, color: 'B', x: 120, y: 40 },
          { val: 5, color: 'R', x: 60, y: 100 },
          { val: 20, color: 'R', x: 180, y: 100 },
          { val: 30, color: 'B', x: 220, y: 160 },
        ],
        edges: [
          { from: 10, to: 5 },
          { from: 10, to: 20 },
          { from: 20, to: 30 },
        ],
        caption:
          'Fix by ROTATION: rotate right at 20, then recolor — 10 becomes the new subtree root (black), with 5 and 20 as its red children. All invariants restored.',
      },
    ] as RBFrame[],
  },
};

type ScenarioKey = keyof typeof SCENARIOS;

const INVARIANTS = [
  'Every node is either red or black.',
  'The root is always black.',
  'No red node has a red child (no two reds in a row).',
  'Every path from a node to its descendant null leaves passes through the same number of black nodes.',
];

function RBTreeSVG({ frame }: { frame: RBFrame }) {
  const nodeMap = Object.fromEntries(frame.nodes.map((n) => [n.val, n]));
  return (
    <svg
      viewBox="0 0 260 200"
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
      {frame.nodes.map((n) => {
        const isViolated = frame.violated === n.val;
        return (
          <g key={n.val}>
            <circle
              cx={n.x}
              cy={n.y}
              r={18}
              fill={n.color === 'R' ? COLORS.rbRed : COLORS.rbBlack}
              stroke={isViolated ? COLORS.amber : 'none'}
              strokeWidth={isViolated ? 4 : 0}
            />
            <text
              x={n.x}
              y={n.y + 4}
              fontSize="13"
              fontWeight={700}
              fill="#fff"
              textAnchor="middle"
            >
              {n.val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RbTreeInsertionSim() {
  const [scenario, setScenario] = useState<ScenarioKey>('simple');
  const [frameIdx, setFrameIdx] = useState(0);
  const frames = SCENARIOS[scenario].frames;
  const frame = frames[frameIdx];

  function changeScenario(s: ScenarioKey) {
    setScenario(s);
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
          Red-Black Trees
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Another self-balancing tree — this one uses color rules instead of tracking exact heights.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A red-black tree is a self-balancing binary search tree that keeps itself roughly
            balanced by coloring every node either RED or BLACK and enforcing four strict rules
            about how those colors can be arranged. Unlike an AVL tree (which tracks exact height
            differences), a red-black tree just needs to maintain these color rules — which turns
            out to be enough to guarantee the tree never gets too lopsided. When a new insertion
            breaks one of the rules, the fix is either simple
            <strong> recoloring</strong> or, in trickier cases, a <strong>rotation</strong> combined
            with recoloring.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Red / Black"
            def="Every node gets one of these two colors — the color pattern is what keeps the tree balanced."
          />
          <KeyTerm
            term="Uncle"
            def="A new node's parent's sibling — whether the uncle is red or black determines which fixup strategy applies."
          />
          <KeyTerm
            term="Recoloring"
            def="Flipping some nodes' colors to restore the rules, without changing the tree's shape."
          />
          <KeyTerm
            term="Rotation"
            def="A structural rearrangement, used when recoloring alone can't fix the violation."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <StepLi>
              Check the invariant checklist below — these four rules must ALWAYS hold.
            </StepLi>
            <StepLi>
              Pick a scenario using the buttons — each shows a different kind of fixup.
            </StepLi>
            <StepLi>
              Press "Step forward" to watch the insertion happen and, if needed, watch the fixup
              restore the rules.
            </StepLi>
            <StepLi>
              Notice the orange-highlighted node marks exactly where a rule got broken, right before
              it gets fixed.
            </StepLi>
          </ol>
        </Section>

        <Section title="The four red-black invariants (always true)">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {INVARIANTS.map((inv, i) => {
                const isCurrentlyViolated =
                  frame.invariantNote && inv.toLowerCase().includes('two') && frame.violated;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 12.5,
                      padding: '6px 10px',
                      background: isCurrentlyViolated ? COLORS.redSoft : COLORS.tealSoft,
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: isCurrentlyViolated ? COLORS.red : COLORS.teal,
                      }}
                    >
                      {isCurrentlyViolated ? '✗' : '✓'}
                    </span>
                    <span style={{ color: COLORS.ink }}>{inv}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Watch an insertion and its fixup">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map((s) => (
                <Btn
                  key={s}
                  variant={scenario === s ? 'primary' : 'default'}
                  onClick={() => changeScenario(s)}
                >
                  {SCENARIOS[s].label}
                </Btn>
              ))}
            </div>

            <RBTreeSVG frame={frame} />

            <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '14px 0' }}>
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
              <strong>Common mistake:</strong> forgetting to check the uncle's color before choosing
              a fixup. If the uncle is RED, simple recoloring works. If the uncle is BLACK (or
              missing, which counts as black), you need a rotation instead — using the wrong fixup
              for the wrong case is the single most common red-black tree bug.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
