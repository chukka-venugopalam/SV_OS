/*
  CHAPTER: D0 — Engineering Mathematics
    Optimization — Maxima, Minima & Critical Points (math-optimization-maxima-minima)

  WHAT THIS DEMONSTRATES
    - Plot f(x), let the student find f'(x)=0 points.
    - Apply the second-derivative test live (color-code max/min/inconclusive).
    - Solve one applied optimization problem end-to-end (maximize fenced area).

  DESIGN DECISIONS
    - Used f(x) = x^3 - 3x (has one clean local max and one clean local min) so both
      colors of the second-derivative test appear in a single, simple function rather
      than needing multiple examples.
    - The applied problem (maximize rectangular area with fixed fencing) is solved
      with a live-draggable rectangle tied to the same math, so the abstract
      derivative work and the "real" problem visibly use the same method.
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

// f(x) = x^3 - 3x. f'(x) = 3x^2 - 3 = 0 at x = -1, 1. f''(x) = 6x.
// f''(-1) = -6 < 0 -> local max at x=-1. f''(1) = 6 > 0 -> local min at x=1.
function f(x: number) {
  return x ** 3 - 3 * x;
}
function _fPrime(x: number) {
  return 3 * x ** 2 - 3;
}
function _fDoublePrime(x: number) {
  return 6 * x;
}

function FunctionGraph({
  highlightPoints,
}: {
  highlightPoints: { x: number; kind: 'max' | 'min' | 'none' }[];
}) {
  const W = 320,
    H = 220,
    pad = 30;
  const xMin = -2.5,
    xMax = 2.5,
    yMin = -4,
    yMax = 4;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);

  const pts: [number, number][] = [];
  for (let x = xMin; x <= xMax; x += 0.05) pts.push([x, f(x)]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', background: '#fff', borderRadius: 6 }}
    >
      <line x1={pad} y1={sy(0)} x2={W - pad} y2={sy(0)} stroke={COLORS.line} strokeWidth={1} />
      <line x1={sx(0)} y1={pad} x2={sx(0)} y2={H - pad} stroke={COLORS.line} strokeWidth={1} />
      <text x={W - pad} y={sy(0) + 14} fontSize="9" fill={COLORS.inkSoft} textAnchor="end">
        x
      </text>
      <path d={path} stroke={COLORS.ink} strokeWidth={2} fill="none" />
      {highlightPoints.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x)}
          cy={sy(f(p.x))}
          r={6}
          fill={p.kind === 'max' ? COLORS.red : p.kind === 'min' ? COLORS.teal : COLORS.amber}
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

export default function CriticalPointVisualizer() {
  const [foundStep, setFoundStep] = useState(0); // 0: nothing, 1: derivative shown, 2: critical points found, 3: second-deriv test applied
  const [fenceLength, _setFenceLength] = useState(40);
  const [width, setWidth] = useState(10);
  const [showOptimalStep, setShowOptimalStep] = useState(0);

  const height = (fenceLength - 2 * width) / 2;
  const area = width * height;
  const optimalWidth = fenceLength / 4;
  const optimalHeight = (fenceLength - 2 * optimalWidth) / 2;
  const optimalArea = optimalWidth * optimalHeight;

  const points: { x: number; kind: 'max' | 'min' | 'none' }[] =
    foundStep >= 3
      ? [
          { x: -1, kind: 'max' },
          { x: 1, kind: 'min' },
        ]
      : foundStep >= 2
        ? [
            { x: -1, kind: 'none' },
            { x: 1, kind: 'none' },
          ]
        : [];

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
          Maxima, Minima &amp; Critical Points
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Finding the highest and lowest points of a curve — and using it to solve a real problem.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A <strong>critical point</strong> is a spot on a curve where the slope is exactly zero —
            the curve is momentarily flat, neither rising nor falling. These are the only places a
            local peak (maximum) or valley (minimum) can occur. Finding them is a two-step process:
            first solve f'(x) = 0 to find the candidate x-values, then use the{' '}
            <strong>second-derivative test</strong> to figure out whether each one is a peak, a
            valley, or neither. This exact technique is what lets you solve real "what's the best
            possible size/amount/shape" problems.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Derivative, f'(x)"
            def="The slope of the curve at each point x — how steeply it's rising or falling there."
          />
          <KeyTerm
            term="Critical point"
            def="A point where f'(x) = 0 — the curve is momentarily flat."
          />
          <KeyTerm
            term="Second derivative, f''(x)"
            def="The slope of the slope — tells you whether the curve is bending upward (like a cup) or downward (like a frown)."
          />
          <KeyTerm
            term="Second-derivative test"
            def="At a critical point: if f''(x) is negative, it's a local max; if positive, a local min; if zero, the test can't tell (inconclusive)."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Look at the curve f(x) = x³ − 3x below, then press "Find f'(x) = 0" to reveal where
              the slope is zero.
            </Step>
            <Step>
              Press "Apply the second-derivative test" to see each point classified as a max or min,
              color-coded.
            </Step>
            <Step>
              Scroll down to the fencing problem and drag the slider to try different rectangle
              shapes.
            </Step>
            <Step>
              Press "Reveal the optimal width" to see the calculus answer match your best guess.
            </Step>
          </ol>
        </Section>

        <Section title="Find and classify the critical points of f(x) = x³ − 3x">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <FunctionGraph highlightPoints={points} />

            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13.5,
                lineHeight: 2,
                marginTop: 14,
              }}
            >
              {foundStep >= 1 && <div>Step 1 — take the derivative: f'(x) = 3x² − 3.</div>}
              {foundStep >= 2 && (
                <div>Step 2 — solve f'(x) = 0: 3x² − 3 = 0 → x² = 1 → x = −1 or x = 1.</div>
              )}
              {foundStep >= 3 && (
                <>
                  <div>Step 3 — take the second derivative: f''(x) = 6x.</div>
                  <div style={{ color: COLORS.red }}>
                    f''(−1) = −6, which is negative → local MAX at x = −1 (f(−1) = {fmt2(f(-1))}).
                  </div>
                  <div style={{ color: COLORS.teal }}>
                    f''(1) = 6, which is positive → local MIN at x = 1 (f(1) = {fmt2(f(1))}).
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn
                variant="primary"
                onClick={() => setFoundStep((s) => Math.min(3, s + 1))}
                disabled={foundStep >= 3}
              >
                {foundStep === 0
                  ? "Find f'(x) = 0"
                  : foundStep === 2
                    ? 'Apply the second-derivative test'
                    : 'Step forward'}
              </Btn>
              <Btn variant="ghost" onClick={() => setFoundStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> assuming every critical point is automatically a max
              or min. If f''(x) = 0 at that point, the test is inconclusive — the point could be
              neither (like an inflection point).
            </Callout>
          </div>
        </Section>

        <Section title="Applied problem: fence the largest rectangular yard">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 14px 0' }}>
              You have {fenceLength} meters of fencing and want to enclose the largest possible
              rectangular area against a wall (so only 3 sides need fencing: two widths and one
              length). Drag the slider to try different widths and watch the area change.
            </p>

            <svg
              viewBox="0 0 300 160"
              width="100%"
              style={{
                display: 'block',
                background: COLORS.panel,
                borderRadius: 6,
                marginBottom: 14,
              }}
            >
              <rect x={20} y={20} width={260} height={8} fill={COLORS.inkSoft} />
              <rect
                x={150 - (width / (fenceLength / 2)) * 100}
                y={40}
                width={(width / (fenceLength / 2)) * 200}
                height={Math.max(4, (height / (fenceLength / 4)) * 90)}
                fill={COLORS.tealSoft}
                stroke={COLORS.teal}
                strokeWidth={2}
              />
              <text x={150} y={155} fontSize="10" fill={COLORS.inkSoft} textAnchor="middle">
                width = {width}m, height = {height > 0 ? height.toFixed(1) : 0}m
              </text>
            </svg>

            <label
              style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
            >
              Width: {width}m
            </label>
            <input
              type="range"
              min={1}
              max={fenceLength / 2 - 1}
              value={width}
              onChange={(e) => setWidth(+e.target.value)}
              style={{ width: 240, marginBottom: 14 }}
            />

            <div
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, marginBottom: 14 }}
            >
              Area = width × height = {width} × {height.toFixed(1)} ={' '}
              <strong>{area > 0 ? area.toFixed(1) : 0} m²</strong>
            </div>

            {showOptimalStep >= 1 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  lineHeight: 2,
                  marginBottom: 14,
                }}
              >
                <div>
                  Set up: 2w + l = {fenceLength}, so l = {fenceLength} − 2w. Area A(w) = w × l = w(
                  {fenceLength} − 2w).
                </div>
                <div>
                  A(w) = {fenceLength}w − 2w². Take the derivative: A'(w) = {fenceLength} − 4w.
                </div>
                <div>
                  Solve A'(w) = 0: {fenceLength} − 4w = 0 → w = {optimalWidth.toFixed(1)}.
                </div>
                <div style={{ color: COLORS.teal, fontWeight: 600 }}>
                  Optimal width = {optimalWidth.toFixed(1)}m, height = {optimalHeight.toFixed(1)}m,
                  max area = {optimalArea.toFixed(1)} m².
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setShowOptimalStep(1)}
                disabled={showOptimalStep >= 1}
              >
                Reveal the optimal width
              </Btn>
              <Btn variant="ghost" onClick={() => setShowOptimalStep(0)}>
                Hide
              </Btn>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function fmt2(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}
