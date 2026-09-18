/*
  CHAPTER: D1 — Complexity Core
    Recurrence Relations (d1-03-recurrence-relations)

  WHAT THIS DEMONSTRATES
    Enter a recurrence like T(n)=2T(n/2)+O(n), animate the recursion tree expanding
    level by level, sum work per level to reach the closed form.

  DESIGN DECISIONS
    - Fixed to the classic T(n) = a*T(n/b) + n^d shape (covers merge sort, binary
      search, etc.) rather than a free-form recurrence parser, since that shape is
      what virtually every GATE-level recurrence problem actually uses, and it lets
      the tree-level accounting stay exact and explorable.
    - Tree is rendered level by level (not all subtrees drawn individually beyond a
      cap) to stay readable — beyond depth 4 we summarize remaining levels in text
      rather than drawing hundreds of tiny boxes.
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

export default function RecurrenceSolver() {
  const [a, setA] = useState(2); // number of subproblems
  const [b, setB] = useState(2); // factor problem size is divided by
  const [d, setD] = useState(1); // exponent of n in the non-recursive work: n^d
  const [n0, setN0] = useState(16); // starting problem size, should be a power of b ideally
  const [levelsShown, setLevelsShown] = useState(0);

  const maxLevels = Math.floor(Math.log(n0) / Math.log(b)) + 1;
  const displayLevels = Math.min(levelsShown, Math.min(maxLevels, 5));

  function levelWork(level: number): {
    subproblems: number;
    sizePerSubproblem: number;
    workPerSubproblem: number;
    totalWork: number;
  } {
    const subproblems = Math.pow(a, level);
    const sizePerSubproblem = n0 / Math.pow(b, level);
    const workPerSubproblem = Math.pow(sizePerSubproblem, d);
    return {
      subproblems,
      sizePerSubproblem,
      workPerSubproblem,
      totalWork: subproblems * workPerSubproblem,
    };
  }

  // Master theorem classification for the closed-form summary
  const critical = Math.log(a) / Math.log(b); // log_b(a)
  let caseLabel = '';
  if (d > critical) caseLabel = `Case 3: n^${d} dominates → Θ(n^${d})`;
  else if (Math.abs(d - critical) < 0.001) caseLabel = `Case 2: equal → Θ(n^${d} log n)`;
  else caseLabel = `Case 1: recursive work dominates → Θ(n^${critical.toFixed(2)})`;

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
          Complexity Core · D1
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Recurrence Relations
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Turning a recursive algorithm's self-description into a growth-rate formula.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Many algorithms (like merge sort) work by breaking a problem into smaller copies of
            itself. A<strong> recurrence relation</strong> describes exactly how: T(n) = a·T(n/b) +
            n^d means "solve a copies of a problem that's 1/b the size, then do n^d extra work to
            combine the results." To find the overall Big-O, we can draw this as a{' '}
            <strong>recursion tree</strong> — each level shows how much total work happens at that
            depth — and add up the work across every level.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm term="a (branching factor)" def="How many subproblems each level splits into." />
          <KeyTerm
            term="b (size divisor)"
            def="How much smaller each subproblem is compared to its parent (divided by b)."
          />
          <KeyTerm
            term="n^d (combine cost)"
            def="The extra work done at each call to combine/process results, ignoring the recursive calls themselves."
          />
          <KeyTerm
            term="Recursion tree"
            def="A diagram where each node is one recursive call, and children represent the subproblems it spawns."
          />
          <KeyTerm
            term="Level"
            def="One 'row' of the recursion tree — all calls at the same depth from the top."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Set a, b, and d to define your recurrence T(n) = a·T(n/b) + n^d.</Step>
            <Step>
              Press "Expand next level" repeatedly to grow the recursion tree and see the
              work-per-level table fill in.
            </Step>
            <Step>
              Watch whether the per-level work is growing, shrinking, or staying the same as you go
              deeper — that pattern tells you which term dominates.
            </Step>
            <Step>
              Read the closed-form summary at the bottom once you've expanded a few levels.
            </Step>
          </ol>
        </Section>

        <Section title="Build your recurrence: T(n) = a·T(n/b) + n^d">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <NumberField
                label="a (subproblems)"
                value={a}
                onChange={(v) => {
                  setA(v);
                  setLevelsShown(0);
                }}
                min={1}
                max={8}
              />
              <NumberField
                label="b (size divisor)"
                value={b}
                onChange={(v) => {
                  setB(v);
                  setLevelsShown(0);
                }}
                min={2}
                max={4}
              />
              <NumberField
                label="d (combine cost exponent)"
                value={d}
                onChange={(v) => {
                  setD(v);
                  setLevelsShown(0);
                }}
                min={0}
                max={3}
              />
              <NumberField
                label="starting n"
                value={n0}
                onChange={(v) => {
                  setN0(v);
                  setLevelsShown(0);
                }}
                min={4}
                max={64}
                step={4}
              />
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                marginBottom: 16,
                color: COLORS.ink,
              }}
            >
              T(n) = {a}·T(n/{b}) + n^{d}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {Array.from({ length: displayLevels }).map((_, level) => {
                const { subproblems, sizePerSubproblem, workPerSubproblem, totalWork } =
                  levelWork(level);
                return (
                  <div
                    key={level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: level % 2 === 0 ? COLORS.panel : '#fff',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontFamily: 'ui-monospace, monospace',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 700, minWidth: 60 }}>Level {level}</span>
                    <span>
                      {subproblems} subproblem{subproblems !== 1 ? 's' : ''}
                    </span>
                    <span>× size {sizePerSubproblem.toFixed(1)}</span>
                    <span>× cost {workPerSubproblem.toFixed(1)}</span>
                    <span style={{ color: COLORS.teal, fontWeight: 700 }}>
                      = {totalWork.toFixed(1)} total work
                    </span>
                  </div>
                );
              })}
            </div>

            {displayLevels >= Math.min(maxLevels, 5) && maxLevels > 5 && (
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>
                (Tree continues for {maxLevels - 5} more levels — pattern continues the same way
                down to the base case.)
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn
                variant="primary"
                onClick={() => setLevelsShown((l) => Math.min(Math.min(maxLevels, 5), l + 1))}
                disabled={displayLevels >= Math.min(maxLevels, 5)}
              >
                Expand next level
              </Btn>
              <Btn variant="ghost" onClick={() => setLevelsShown(0)}>
                Reset
              </Btn>
            </div>

            {displayLevels >= 2 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  lineHeight: 1.8,
                  marginBottom: 8,
                }}
              >
                <div>
                  Critical exponent log_{b}({a}) = {critical.toFixed(2)}, compare against d = {d}.
                </div>
                <div style={{ color: COLORS.teal, fontWeight: 600 }}>{caseLabel}</div>
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> assuming the top level always dominates. Look at
              whether the per-level work is growing or shrinking as you expand — if it's GROWING
              with depth, the bottom (many tiny subproblems) dominates instead of the top.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <label style={{ fontSize: 11.5, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}>
        {label}: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: 130 }}
      />
    </div>
  );
}
