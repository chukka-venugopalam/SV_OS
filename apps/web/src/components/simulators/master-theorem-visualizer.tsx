/*
  CHAPTER: D1 — Complexity Core
    Master Theorem (d1-04-master-theorem)

  WHAT THIS DEMONSTRATES
    Enter a, b, f(n); tool computes n^(log_b a), compares against f(n), and shows
    which of the 3 cases applies with the resulting Theta bound.

  DESIGN DECISIONS
    - f(n) is chosen from a small preset menu (n^0, n^1, n^2, n log n) rather than
      free-text math input, since parsing arbitrary f(n) expressions reliably is out
      of scope and the presets cover all 3 Master Theorem cases cleanly, including
      the boundary (case 2) scenario.
    - This tool is intentionally distinct from the Recurrence Solver (which builds
      intuition via the recursion tree); this one is the direct "plug into the
      formula, get the case" companion tool, matching how the spec separates them.
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

type FShape = 'const' | 'linear' | 'nlogn' | 'quad';
const F_LABELS: Record<FShape, string> = {
  const: 'n⁰ (constant)',
  linear: 'n¹',
  nlogn: 'n log n',
  quad: 'n²',
};
const F_EXP: Record<FShape, number> = { const: 0, linear: 1, nlogn: 1, quad: 2 };
const F_HAS_LOG: Record<FShape, boolean> = {
  const: false,
  linear: false,
  nlogn: true,
  quad: false,
};

export default function MasterTheoremVisualizer() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(2);
  const [fShape, setFShape] = useState<FShape>('linear');
  const [step, setStep] = useState(0);

  const critical = Math.log(a) / Math.log(b);
  const fExp = F_EXP[fShape];
  const hasLog = F_HAS_LOG[fShape];

  let caseNum = 0;
  let theta = '';
  let explanation = '';

  if (fExp < critical - 0.001) {
    caseNum = 1;
    theta = `Θ(n^${critical.toFixed(2)})`;
    explanation = `f(n) = n^${fExp}${hasLog ? ' log n' : ''} grows SLOWER than n^log_${b}(${a}) = n^${critical.toFixed(2)}. The recursive splitting dominates — the answer is driven by how many subproblems pile up, not by the combine step.`;
  } else if (Math.abs(fExp - critical) < 0.001 && !hasLog) {
    caseNum = 2;
    theta = `Θ(n^${critical.toFixed(2)} log n)`;
    explanation = `f(n) = n^${fExp} grows at exactly the SAME rate as n^log_${b}(${a}) = n^${critical.toFixed(2)}. When they tie, every level of the recursion tree contributes equally, and there are log n levels — so we get an extra log n factor.`;
  } else if (Math.abs(fExp - critical) < 0.001 && hasLog) {
    caseNum = 2;
    theta = `Θ(n^${critical.toFixed(2)} log² n)`;
    explanation = `f(n) = n^${fExp} log n already has an extra log factor beyond the tie point n^log_${b}(${a}) = n^${critical.toFixed(2)} — this is a known extended case, adding one more log factor on top of the usual Case 2 result.`;
  } else {
    caseNum = 3;
    theta = `Θ(n^${fExp}${hasLog ? ' log n' : ''})`;
    explanation = `f(n) = n^${fExp}${hasLog ? ' log n' : ''} grows FASTER than n^log_${b}(${a}) = n^${critical.toFixed(2)}. The work done combining results at the top level dominates everything the recursion does underneath it.`;
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
          The Master Theorem
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A direct formula shortcut for solving T(n) = a·T(n/b) + f(n) without drawing a full
          recursion tree.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            The Master Theorem is a shortcut recipe for solving recurrences of the form T(n) =
            a·T(n/b) + f(n) without having to draw out a whole recursion tree every time. The trick
            is to compare f(n) — the "combine step" cost — against a special benchmark value, n
            raised to the power log base b of a. Whichever one grows faster "wins" and decides the
            overall answer. There are exactly three possible outcomes (cases), depending on whether
            f(n) grows slower than, equal to, or faster than that benchmark.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm term="a" def="How many subproblems the recursion splits into." />
          <KeyTerm term="b" def="How much smaller each subproblem is (divided by b)." />
          <KeyTerm
            term="f(n)"
            def="The extra work done outside the recursive calls, at each step (e.g. merging results)."
          />
          <KeyTerm
            term="Critical exponent"
            def="n raised to log base b of a — the benchmark growth rate f(n) gets compared against."
          />
          <KeyTerm
            term="Θ (Theta)"
            def="A tight bound — the exact growth rate, not just an upper or lower limit."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Set a and b to define the recursive part of T(n) = a·T(n/b) + f(n).</Step>
            <Step>Pick a shape for f(n) from the buttons below.</Step>
            <Step>
              Press "Step through" to see the comparison happen and land on the matching case.
            </Step>
            <Step>
              Try changing f(n) while keeping a and b fixed to see all three cases trigger with the
              same recursive structure.
            </Step>
          </ol>
        </Section>

        <Section title="Solve T(n) = a·T(n/b) + f(n)">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  a = {a}
                </label>
                <input
                  type="range"
                  min={1}
                  max={9}
                  value={a}
                  onChange={(e) => {
                    setA(+e.target.value);
                    setStep(0);
                  }}
                  style={{ width: 130 }}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  b = {b}
                </label>
                <input
                  type="range"
                  min={2}
                  max={5}
                  value={b}
                  onChange={(e) => {
                    setB(+e.target.value);
                    setStep(0);
                  }}
                  style={{ width: 130 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                f(n) =
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(F_LABELS) as FShape[]).map((k) => (
                  <Btn
                    key={k}
                    variant={fShape === k ? 'primary' : 'default'}
                    onClick={() => {
                      setFShape(k);
                      setStep(0);
                    }}
                  >
                    {F_LABELS[k]}
                  </Btn>
                ))}
              </div>
            </div>

            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, marginBottom: 16 }}>
              T(n) = {a}·T(n/{b}) + {F_LABELS[fShape]}
            </div>

            {step >= 1 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  lineHeight: 2,
                  marginBottom: 8,
                }}
              >
                <div>
                  Step 1 — compute the critical exponent: log_{b}({a}) = {critical.toFixed(3)}
                </div>
              </div>
            )}
            {step >= 2 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  lineHeight: 2,
                  marginBottom: 8,
                }}
              >
                <div>
                  Step 2 — compare: f(n) = n^{fExp}
                  {hasLog ? ' log n' : ''} vs benchmark n^{critical.toFixed(2)}
                </div>
              </div>
            )}
            {step >= 3 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 14,
                    fontSize: 12.5,
                    fontWeight: 700,
                    background: COLORS.tealSoft,
                    color: COLORS.teal,
                    marginBottom: 8,
                  }}
                >
                  Case {caseNum}
                </div>
                <div
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLORS.ink,
                    marginBottom: 6,
                  }}
                >
                  T(n) = {theta}
                </div>
                <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
                  {explanation}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={step >= 3}
              >
                Step through
              </Btn>
              <Btn variant="ghost" onClick={() => setStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> the Master Theorem does NOT apply to every recurrence
              — it only works for this exact a·T(n/b) + f(n) shape, with a ≥ 1 and b {'>'} 1.
              Recurrences like T(n) = T(n−1) + n (subtracting, not dividing) need a different
              technique entirely.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
