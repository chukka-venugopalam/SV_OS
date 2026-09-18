/*
  CHAPTER: D0 — Engineering Mathematics
    Matrices & Determinants (math-matrices-determinants-rank)

  WHAT THIS DEMONSTRATES
    - Row-reduce an editable matrix step by step to echelon form, showing rank.
    - Compute det(A) and flag invertibility live.
    - Solve Ax = b and show the three outcome cases (unique / infinite / none) as
      rank comparisons change.

  DESIGN DECISIONS
    - Fixed at 3x3 (plus a b column for the Ax=b section) — big enough to show real
      row reduction, small enough to stay readable and hand-editable on a page.
    - Row operations are logged in plain language ("R2 = R2 - 2*R1") alongside the
      matrix state at each step, so the student sees cause and effect together.
    - The three Ax=b outcome cases are demonstrated by three PRESET example systems
      rather than trying to derive an arbitrary one live, since "does this have a
      unique solution" needs a curated example to reliably land the point.
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

type Mat = number[][];

function cloneMat(m: Mat): Mat {
  return m.map((r) => [...r]);
}

function fmt(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

// Compute a full row-reduction trace with plain-language op descriptions.
function computeTrace(input: Mat) {
  const steps: { matrix: Mat; desc: string }[] = [
    { matrix: cloneMat(input), desc: 'Starting matrix.' },
  ];
  const m = cloneMat(input);
  const rows = m.length,
    cols = m[0].length;
  let lead = 0;
  for (let r = 0; r < rows && lead < cols; r++) {
    let i = r;
    while (Math.abs(m[i][lead]) < 1e-9) {
      i++;
      if (i === rows) {
        i = r;
        lead++;
        if (lead === cols) break;
      }
    }
    if (lead === cols) break;
    if (i !== r) {
      [m[i], m[r]] = [m[r], m[i]];
      steps.push({
        matrix: cloneMat(m),
        desc: `Swap R${r + 1} and R${i + 1} to get a non-zero pivot.`,
      });
    }
    const pivot = m[r][lead];
    if (Math.abs(pivot - 1) > 1e-9 && Math.abs(pivot) > 1e-9) {
      m[r] = m[r].map((v) => v / pivot);
      steps.push({
        matrix: cloneMat(m),
        desc: `R${r + 1} = R${r + 1} ÷ ${fmt(pivot)}, so the pivot becomes 1.`,
      });
    }
    for (let i2 = 0; i2 < rows; i2++) {
      if (i2 !== r) {
        const factor = m[i2][lead];
        if (Math.abs(factor) > 1e-9) {
          m[i2] = m[i2].map((v, c) => v - factor * m[r][c]);
          steps.push({
            matrix: cloneMat(m),
            desc: `R${i2 + 1} = R${i2 + 1} − (${fmt(factor)})·R${r + 1}, to zero out that column.`,
          });
        }
      }
    }
    lead++;
  }
  return steps;
}

function rankOf(m: Mat): number {
  const trace = computeTrace(m);
  const final = trace[trace.length - 1].matrix;
  return final.filter((row) => row.some((v) => Math.abs(v) > 1e-9)).length;
}

function det3(m: Mat): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

function MatrixGrid({ m, highlightRows = [] as number[] }: { m: Mat; highlightRows?: number[] }) {
  return (
    <div
      style={{
        display: 'inline-block',
        border: `2px solid ${COLORS.ink}`,
        borderRadius: 4,
        padding: '10px 14px',
      }}
    >
      {m.map((row, r) => (
        <div
          key={r}
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: r < m.length - 1 ? 6 : 0,
            background: highlightRows.includes(r) ? COLORS.amberSoft : 'transparent',
          }}
        >
          {row.map((v, c) => (
            <span
              key={c}
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                width: 42,
                textAlign: 'right',
                color: COLORS.ink,
              }}
            >
              {fmt(v)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

const DEFAULT_MATRIX: Mat = [
  [2, 1, -1],
  [4, -6, 0],
  [-2, 7, 2],
];

export default function GaussianEliminationVisualizer() {
  const [matrix, setMatrix] = useState<Mat>(DEFAULT_MATRIX.map((r) => [...r]));
  const [trace, setTrace] = useState(computeTrace(DEFAULT_MATRIX));
  const [stepIdx, setStepIdx] = useState(0);

  const [ab, setAb] = useState<'unique' | 'infinite' | 'none'>('unique');

  function updateCell(r: number, c: number, val: string) {
    const num = parseFloat(val);
    const next = cloneMat(matrix);
    next[r][c] = isNaN(num) ? 0 : num;
    setMatrix(next);
    setTrace(computeTrace(next));
    setStepIdx(0);
  }

  const rank = rankOf(matrix);
  const determinant = det3(matrix);
  const invertible = Math.abs(determinant) > 1e-9;

  const abSystems: Record<string, { A: Mat; b: number[]; label: string; explanation: string }> = {
    unique: {
      A: [
        [1, 1],
        [2, -1],
      ],
      b: [4, 2],
      label: 'x + y = 4,  2x − y = 2',
      explanation: 'Rank of A = 2 = number of unknowns → exactly one solution.',
    },
    infinite: {
      A: [
        [1, 2],
        [2, 4],
      ],
      b: [3, 6],
      label: 'x + 2y = 3,  2x + 4y = 6',
      explanation:
        'The second equation is just 2× the first — same line, so every point on it works. Rank of A = 1 < number of unknowns → infinitely many solutions.',
    },
    none: {
      A: [
        [1, 2],
        [2, 4],
      ],
      b: [3, 7],
      label: 'x + 2y = 3,  2x + 4y = 7',
      explanation:
        'The left sides are proportional but the right sides are not — two parallel lines that never meet. Rank of A (1) < rank of the augmented matrix (2) → no solution.',
    },
  };

  const current = abSystems[ab];

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
          Matrices, Determinants &amp; Rank
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Row-reducing a matrix by hand, and what the result tells you about a system of equations.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A matrix is just a grid of numbers, often used to represent a system of linear
            equations.
            <strong> Row reduction</strong> (also called Gaussian elimination) is a mechanical
            recipe for simplifying that grid — using three allowed moves (swap two rows, scale a
            row, or subtract a multiple of one row from another) — until it's as simple as possible.
            The number of non-zero rows left over is the matrix's <strong>rank</strong>, and it
            tells you how many truly independent pieces of information the system actually contains.
            The <strong>determinant</strong> is a single number computed from a square matrix that
            tells you whether the matrix can be "undone" (inverted) at all.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Row operation"
            def="One of three legal moves on a matrix: swap two rows, scale a row by a non-zero number, or add/subtract a multiple of one row to another."
          />
          <KeyTerm
            term="Echelon form"
            def="A simplified matrix shape where each row's first non-zero number sits further right than the row above it."
          />
          <KeyTerm
            term="Rank"
            def="The number of non-zero rows remaining after row reduction — how many independent equations you actually have."
          />
          <KeyTerm
            term="Determinant"
            def="A single number computed from a square matrix; if it's zero, the matrix has no inverse and the system may not have a unique solution."
          />
          <KeyTerm
            term="Invertible"
            def="A matrix that CAN be undone by another matrix — true exactly when its determinant is non-zero."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Edit any number in the matrix below — the rank and determinant recalculate instantly.
            </Step>
            <Step>
              Press "Step forward" to watch the row reduction happen one operation at a time, in
              plain English.
            </Step>
            <Step>Check the determinant readout to see whether the matrix is invertible.</Step>
            <Step>
              Scroll down and switch between the three Ax = b examples to see unique / infinite / no
              solution in action.
            </Step>
          </ol>
        </Section>

        <Section title="Row-reduce this matrix (click a number to edit it)">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              {matrix.map((row, r) => (
                <div key={r} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  {row.map((v, c) => (
                    <input
                      key={c}
                      type="number"
                      value={v}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      style={{
                        width: 56,
                        padding: '6px 8px',
                        borderRadius: 5,
                        border: `1px solid ${COLORS.line}`,
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 13.5,
                        textAlign: 'center',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 13.5 }}>
              <div>
                <strong>Rank:</strong> {rank}
              </div>
              <div>
                <strong>Determinant:</strong> {fmt(determinant)}
              </div>
              <div style={{ color: invertible ? COLORS.teal : COLORS.red, fontWeight: 600 }}>
                {invertible ? 'Invertible' : 'Not invertible'}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <MatrixGrid m={trace[stepIdx].matrix} />
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 14, minHeight: 18 }}>
              Step {stepIdx + 1} of {trace.length}: {trace[stepIdx].desc}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setStepIdx((s) => Math.min(trace.length - 1, s + 1))}
                disabled={stepIdx >= trace.length - 1}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(trace.length - 1)}>
                Skip to end
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> students think rank always equals the number of rows.
              A row that becomes all zeros during reduction does NOT count toward the rank — it
              means that equation carried no new information.
            </Callout>
          </div>
        </Section>

        <Section title="Solving Ax = b: three outcomes are possible">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 14px 0' }}>
              Every system of linear equations lands in exactly one of three buckets. Switch between
              them below.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Btn
                variant={ab === 'unique' ? 'primary' : 'default'}
                onClick={() => setAb('unique')}
              >
                Unique solution
              </Btn>
              <Btn
                variant={ab === 'infinite' ? 'primary' : 'default'}
                onClick={() => setAb('infinite')}
              >
                Infinite solutions
              </Btn>
              <Btn variant={ab === 'none' ? 'primary' : 'default'} onClick={() => setAb('none')}>
                No solution
              </Btn>
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, marginBottom: 10 }}>
              {current.label}
            </div>
            <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, margin: 0 }}>
              {current.explanation}
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
