/*
  CHAPTER: D0 — Engineering Mathematics
    Sets, Relations & Functions (math-sets-relations-functions)

  WHAT THIS DEMONSTRATES
    - A digraph of a relation the student edits.
    - Live reflexive/symmetric/transitive checks with pass/fail indicators.
    - Toggle to equivalence-relation mode showing the resulting partition into
      equivalence classes.

  DESIGN DECISIONS
    - Fixed a small 4-element set {A, B, C, D} arranged as a square so edges stay
      readable; the student edits the relation by clicking pairs of elements to
      toggle an arrow, not by typing set notation (much lower-friction on mobile/beginners).
    - Equivalence-class partition is computed live and only made available once all
      three properties pass, since an equivalence relation is defined as exactly
      that combination.
*/

import React, { useState, useMemo } from 'react';

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

const ELEMENTS = ['A', 'B', 'C', 'D'];
type Edge = [string, string]; // ordered pair (x,y) meaning "x relates to y"

const PRESET_EQUIVALENCE: Edge[] = [
  ['A', 'A'],
  ['B', 'B'],
  ['C', 'C'],
  ['D', 'D'],
  ['A', 'B'],
  ['B', 'A'],
  ['C', 'D'],
  ['D', 'C'],
];

function edgeKey(e: Edge) {
  return `${e[0]}->${e[1]}`;
}

function checkReflexive(edges: Set<string>): { pass: boolean; missing: string[] } {
  const missing = ELEMENTS.filter((x) => !edges.has(`${x}->${x}`));
  return { pass: missing.length === 0, missing };
}
function checkSymmetric(edges: Set<string>): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  edges.forEach((key) => {
    const [x, y] = key.split('->');
    if (x !== y && !edges.has(`${y}->${x}`))
      violations.push(`${x}→${y} exists but ${y}→${x} doesn't`);
  });
  return { pass: violations.length === 0, violations };
}
function checkTransitive(edges: Set<string>): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const x of ELEMENTS) {
    for (const y of ELEMENTS) {
      if (!edges.has(`${x}->${y}`)) continue;
      for (const z of ELEMENTS) {
        if (edges.has(`${y}->${z}`) && !edges.has(`${x}->${z}`)) {
          violations.push(`${x}→${y} and ${y}→${z} exist but ${x}→${z} doesn't`);
        }
      }
    }
  }
  return { pass: violations.length === 0, violations };
}

function computePartition(edges: Set<string>): string[][] {
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const el of ELEMENTS) {
    if (seen.has(el)) continue;
    const group = ELEMENTS.filter((other) => edges.has(`${el}->${other}`));
    group.forEach((g) => seen.add(g));
    groups.push(group);
  }
  return groups;
}

const NODE_POS: Record<string, [number, number]> = {
  A: [60, 40],
  B: [240, 40],
  C: [240, 200],
  D: [60, 200],
};

function DigraphSVG({
  edges,
  onToggle,
}: {
  edges: Set<string>;
  onToggle: (a: string, b: string) => void;
}) {
  const W = 300,
    H = 240;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', background: '#fff', borderRadius: 6 }}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={COLORS.teal} />
        </marker>
      </defs>
      {/* edges */}
      {ELEMENTS.map((x) =>
        ELEMENTS.map((y) => {
          if (x === y) return null;
          if (!edges.has(`${x}->${y}`)) return null;
          const [x1, y1] = NODE_POS[x];
          const [x2, y2] = NODE_POS[y];
          const dx = x2 - x1,
            dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const shrink = 22;
          const ex = x1 + (dx / len) * (len - shrink);
          const ey = y1 + (dy / len) * (len - shrink);
          const sx = x1 + (dx / len) * shrink;
          const sy = y1 + (dy / len) * shrink;
          // offset curve slightly if reverse edge also exists, so both are visible
          const reverseExists = edges.has(`${y}->${x}`);
          const midX = (sx + ex) / 2 + (reverseExists ? (dy / len) * 10 : 0);
          const midY = (sy + ey) / 2 + (reverseExists ? -(dx / len) * 10 : 0);
          return (
            <path
              key={`${x}${y}`}
              d={`M ${sx} ${sy} Q ${midX} ${midY} ${ex} ${ey}`}
              stroke={COLORS.teal}
              strokeWidth={1.8}
              fill="none"
              markerEnd="url(#arrow)"
              opacity={0.85}
            />
          );
        }),
      )}
      {/* self-loops */}
      {ELEMENTS.map((x) => {
        if (!edges.has(`${x}->${x}`)) return null;
        const [cx, cy] = NODE_POS[x];
        return (
          <circle
            key={`loop${x}`}
            cx={cx}
            cy={cy - 26}
            r={12}
            stroke={COLORS.amber}
            strokeWidth={1.8}
            fill="none"
          />
        );
      })}
      {/* nodes */}
      {ELEMENTS.map((el) => {
        const [cx, cy] = NODE_POS[el];
        return (
          <g key={el} onClick={() => onToggle(el, el)} style={{ cursor: 'pointer' }}>
            <circle
              cx={cx}
              cy={cy}
              r={16}
              fill={COLORS.panel}
              stroke={COLORS.ink}
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={cy + 5}
              fontSize="13"
              fontWeight={600}
              fill={COLORS.ink}
              textAnchor="middle"
            >
              {el}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RelationPropertiesVisualizer() {
  const [edges, setEdges] = useState<Set<string>>(
    new Set(['A->A', 'A->B', 'B->A', 'B->B', 'C->C', 'D->D']),
  );
  const [_mode, setMode] = useState<'explore' | 'equivalence'>('explore');
  const [pairA, setPairA] = useState('A');
  const [pairB, setPairB] = useState('B');

  function toggleEdge(a: string, b: string) {
    const key = `${a}->${b}`;
    const next = new Set(edges);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setEdges(next);
  }

  function loadEquivalencePreset() {
    setEdges(new Set(PRESET_EQUIVALENCE.map(edgeKey)));
    setMode('equivalence');
  }

  const reflexive = useMemo(() => checkReflexive(edges), [edges]);
  const symmetric = useMemo(() => checkSymmetric(edges), [edges]);
  const transitive = useMemo(() => checkTransitive(edges), [edges]);
  const isEquivalence = reflexive.pass && symmetric.pass && transitive.pass;
  const partition = useMemo(
    () => (isEquivalence ? computePartition(edges) : []),
    [edges, isEquivalence],
  );

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
          Engineering Mathematics · D0
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Sets, Relations &amp; Functions
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Build your own relation and watch it get checked against the rules that define an
          equivalence relation.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A <strong>relation</strong> on a set is just a collection of connections between
            elements — think of it as a list of arrows saying "this thing relates to that thing."
            Three properties come up constantly: whether every element relates to itself (
            <strong>reflexive</strong>), whether every arrow has a matching arrow going the other
            way (<strong>symmetric</strong>), and whether chains of arrows always have a shortcut
            arrow (<strong>transitive</strong>). When all three hold at once, the relation is called
            an
            <strong> equivalence relation</strong>, and it neatly splits the whole set into
            non-overlapping groups called equivalence classes — like sorting people into groups by
            birth month.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Relation"
            def="A set of ordered pairs (x, y) meaning 'x relates to y' — drawn here as an arrow from x to y."
          />
          <KeyTerm
            term="Reflexive"
            def="Every element relates to itself: there's a self-loop on every node."
          />
          <KeyTerm
            term="Symmetric"
            def="If x relates to y, then y also relates to x — every arrow has a matching arrow back."
          />
          <KeyTerm
            term="Transitive"
            def="If x relates to y, and y relates to z, then x must also relate to z directly."
          />
          <KeyTerm
            term="Equivalence class"
            def="A group of elements that all relate to each other under an equivalence relation."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Click a node to toggle its self-loop (reflexive arrow).</Step>
            <Step>
              Use the two dropdowns below the graph and press "Toggle arrow" to add or remove a
              connection between two different elements.
            </Step>
            <Step>Watch the three pass/fail checks update live as you edit the relation.</Step>
            <Step>
              Once all three pass, scroll down to see the equivalence classes appear — or press
              "Load an equivalence relation" to see a working example immediately.
            </Step>
          </ol>
        </Section>

        <Section title="Build a relation on {A, B, C, D}">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <DigraphSVG edges={edges} onToggle={toggleEdge} />

            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                marginTop: 16,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <select
                value={pairA}
                onChange={(e) => setPairA(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                  fontSize: 13,
                }}
              >
                {ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 13, color: COLORS.inkSoft }}>relates to</span>
              <select
                value={pairB}
                onChange={(e) => setPairB(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                  fontSize: 13,
                }}
              >
                {ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
              <Btn variant="primary" onClick={() => toggleEdge(pairA, pairB)}>
                Toggle arrow
              </Btn>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <CheckRow
                label="Reflexive"
                pass={reflexive.pass}
                detail={
                  reflexive.pass
                    ? 'Every element loops to itself.'
                    : `Missing self-loop on: ${reflexive.missing.join(', ')}`
                }
              />
              <CheckRow
                label="Symmetric"
                pass={symmetric.pass}
                detail={
                  symmetric.pass
                    ? 'Every arrow has a matching arrow back.'
                    : symmetric.violations[0]
                }
              />
              <CheckRow
                label="Transitive"
                pass={transitive.pass}
                detail={transitive.pass ? 'No missing shortcut arrows.' : transitive.violations[0]}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" onClick={loadEquivalencePreset}>
                Load an equivalence relation example
              </Btn>
              <Btn variant="ghost" onClick={() => setEdges(new Set())}>
                Clear all
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> students check reflexive/symmetric/transitive as one
              combined vibe check. Check them one at a time — a relation can pass two and fail the
              third, and it only counts as an equivalence relation if ALL three pass.
            </Callout>
          </div>
        </Section>

        {isEquivalence && (
          <Section title="Equivalence classes (this relation splits the set into groups)">
            <div
              style={{
                background: '#fff',
                border: `1px solid ${COLORS.line}`,
                borderRadius: 8,
                padding: 20,
              }}
            >
              <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 14px 0' }}>
                Since all three properties passed, this relation is an equivalence relation — it
                partitions {'{A, B, C, D}'} into these non-overlapping groups:
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {partition.map((group, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 16px',
                      background: COLORS.tealSoft,
                      border: `1px solid ${COLORS.teal}`,
                      borderRadius: 8,
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 14,
                    }}
                  >
                    {'{' + group.join(', ') + '}'}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function CheckRow({ label, pass, detail }: { label: string; pass: boolean; detail?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 13,
        padding: '6px 10px',
        background: pass ? COLORS.tealSoft : COLORS.redSoft,
        borderRadius: 6,
      }}
    >
      <span style={{ fontWeight: 700, color: pass ? COLORS.teal : COLORS.red, minWidth: 16 }}>
        {pass ? '✓' : '✗'}
      </span>
      <div>
        <span style={{ fontWeight: 600, color: COLORS.ink }}>{label}</span>
        <span style={{ color: COLORS.inkSoft }}>{detail ? ` — ${detail}` : ''}</span>
      </div>
    </div>
  );
}
