/*
  CHAPTER: D0 — Engineering Mathematics
    Limits, Continuity & Differentiation (math-limits-continuity-differentiation), limits mode

  WHAT THIS DEMONSTRATES
    - A graph where the student drags x toward a and watches f(x) converge to L.
    - Toggling continuity conditions on/off to show a discontinuous function failing
      each one (function defined at a / limit exists / limit equals f(a)).
    - L'Hopital's rule applied step-by-step to a real 0/0 indeterminate case.

  DESIGN DECISIONS
    - Used one function with a removable-discontinuity toggle and a jump toggle so
      all three continuity conditions can be demonstrated from a single example.
    - L'Hopital section uses sin(x)/x (a genuinely famous 0/0 case) rather than an
      abstract f(x)/g(x) placeholder.
    - SVG graph, no charting library, so the approach-point animation is fully
      controllable frame by frame.
*/

import React, { useState, useRef } from 'react';

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

function rawF(
  x: number,
  definedAt2: boolean,
  valueAt2: number,
  jumpActive: boolean,
): number | null {
  if (Math.abs(x - 2) < 1e-9) return definedAt2 ? valueAt2 : null;
  if (jumpActive && x > 2) return x + 2 + 1.5;
  return x + 2;
}

function GraphSVG({
  definedAt2,
  valueAt2,
  jump,
  xApproach,
  showLimitLine,
}: {
  definedAt2: boolean;
  valueAt2: number;
  jump: boolean;
  xApproach: number;
  showLimitLine: boolean;
}) {
  const W = 320,
    H = 220,
    pad = 30;
  const xMin = -1,
    xMax = 5,
    yMin = 0,
    yMax = 9;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);

  const leftPts: [number, number][] = [];
  for (let x = xMin; x <= 2 - 0.02; x += 0.05)
    leftPts.push([x, rawF(x, definedAt2, valueAt2, jump) as number]);
  const rightPts: [number, number][] = [];
  for (let x = 2 + 0.02; x <= xMax; x += 0.05)
    rightPts.push([x, rawF(x, definedAt2, valueAt2, jump) as number]);
  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ');

  const limitValue = 4;
  const approachY = rawF(xApproach, definedAt2, valueAt2, jump && xApproach > 2) ?? valueAt2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', background: '#fff', borderRadius: 6 }}
    >
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={COLORS.line} strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke={COLORS.line} strokeWidth={1} />
      <text x={W - pad} y={H - pad + 14} fontSize="9" fill={COLORS.inkSoft} textAnchor="end">
        x
      </text>
      <text x={pad - 6} y={pad + 4} fontSize="9" fill={COLORS.inkSoft} textAnchor="end">
        f(x)
      </text>
      <line
        x1={sx(2)}
        y1={pad}
        x2={sx(2)}
        y2={H - pad}
        stroke={COLORS.line}
        strokeDasharray="3,3"
        strokeWidth={1}
      />
      <text x={sx(2)} y={H - pad + 14} fontSize="9" fill={COLORS.inkSoft} textAnchor="middle">
        a = 2
      </text>
      {showLimitLine && (
        <line
          x1={pad}
          y1={sy(limitValue)}
          x2={W - pad}
          y2={sy(limitValue)}
          stroke={COLORS.teal}
          strokeDasharray="3,3"
          strokeWidth={1}
          opacity={0.6}
        />
      )}
      <path d={toPath(leftPts)} stroke={COLORS.ink} strokeWidth={2} fill="none" />
      <path
        d={toPath(rightPts)}
        stroke={jump ? COLORS.red : COLORS.ink}
        strokeWidth={2}
        fill="none"
      />
      {!definedAt2 && (
        <circle cx={sx(2)} cy={sy(4)} r={4} fill="#fff" stroke={COLORS.ink} strokeWidth={2} />
      )}
      {definedAt2 && <circle cx={sx(2)} cy={sy(valueAt2)} r={4} fill={COLORS.ink} />}
      <circle
        cx={sx(xApproach)}
        cy={sy(approachY)}
        r={5}
        fill={COLORS.amber}
        stroke="#fff"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export default function LimitsVisualizer() {
  const [xApproach, setXApproach] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const [definedAt2, setDefinedAt2] = useState(true);
  const [valueAt2, setValueAt2] = useState(4);
  const [jump, setJump] = useState(false);
  const [showLimitLine, setShowLimitLine] = useState(false);
  const [hopStep, setHopStep] = useState(0);

  const limitFromLeft = 4;
  const limitFromRight = jump ? 5.5 : 4;
  const limitExists = limitFromLeft === limitFromRight;
  const fValue = definedAt2 ? valueAt2 : null;
  const isContinuous = definedAt2 && limitExists && fValue === limitFromLeft;

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const x = -1 + pct * 6;
    setXApproach(Math.round(Math.min(4.8, Math.max(-0.8, x)) * 20) / 20);
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
          Limits, Continuity &amp; L'Hopital's Rule
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          What a function does as you sneak up on a point — and when that story breaks down.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A <strong>limit</strong> asks: as x gets closer and closer to some point <em>a</em>,
            what value does f(x) get closer and closer to? This doesn't require f to actually be
            defined AT that point — just that it's heading somewhere as you approach. A function is{' '}
            <strong>continuous</strong> at a point only when three things line up: it's defined
            there, the limit exists there, and the limit actually equals the function's value there.
            When a limit produces the confusing form 0/0, <strong>L'Hopital's rule</strong> gives a
            shortcut: take the derivative of the top and bottom separately, then try the limit
            again.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Limit"
            def="The value f(x) approaches as x gets arbitrarily close to a — whether or not f(a) itself exists."
          />
          <KeyTerm
            term="Continuity"
            def="A function is continuous at a if it's defined there, has a limit there, AND the two match."
          />
          <KeyTerm
            term="Removable discontinuity"
            def="A single missing or misplaced point (a 'hole') — the limit exists, but f(a) doesn't match it."
          />
          <KeyTerm
            term="Jump discontinuity"
            def="The left-side and right-side limits approach two different values — no single limit exists."
          />
          <KeyTerm
            term="0/0 indeterminate form"
            def="A limit where both top and bottom go to zero — you can't just plug in the number, you need another method."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Click anywhere on the track below the graph to move the orange dot — that's x sneaking
              up on a = 2.
            </Step>
            <Step>
              Watch the f(x) reading update as the dot approaches, and turn on "show the limit line"
              to see where it's heading.
            </Step>
            <Step>
              Use the switches to break continuity in different ways, and see which condition fails.
            </Step>
            <Step>
              Scroll to the L'Hopital's rule box and press "Step forward" to solve a real 0/0 limit.
            </Step>
          </ol>
        </Section>

        <Section title="Watch x approach a = 2">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <GraphSVG
              definedAt2={definedAt2}
              valueAt2={valueAt2}
              jump={jump}
              xApproach={xApproach}
              showLimitLine={showLimitLine}
            />
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              style={{
                marginTop: 14,
                height: 24,
                background: COLORS.panel,
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: `${((xApproach + 1) / 6) * 100}%`,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: COLORS.amber,
                  transform: 'translateX(-50%)',
                  border: '2px solid #fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.15s ease',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10.5,
                color: COLORS.inkSoft,
                marginTop: 4,
              }}
            >
              <span>x = −1</span>
              <span>x = 2 (target)</span>
              <span>x = 5</span>
            </div>
            <div style={{ marginTop: 14, fontFamily: 'ui-monospace, monospace', fontSize: 13.5 }}>
              <div>
                x = {xApproach.toFixed(2)} → f(x) ={' '}
                {rawF(xApproach, definedAt2, valueAt2, jump && xApproach > 2)?.toFixed(2) ??
                  'undefined'}
              </div>
              <div style={{ color: Math.abs(xApproach - 2) < 0.15 ? COLORS.teal : COLORS.inkSoft }}>
                {Math.abs(xApproach - 2) < 0.15
                  ? 'Getting very close to the limit value.'
                  : 'Keep sliding closer to x = 2 to see it converge.'}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: COLORS.inkSoft }}>
                <input
                  type="checkbox"
                  checked={showLimitLine}
                  onChange={(e) => setShowLimitLine(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Show where the limit is heading
              </label>
            </div>
          </div>
        </Section>

        <Section title="Break continuity: toggle each condition">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={definedAt2}
                  onChange={(e) => setDefinedAt2(e.target.checked)}
                />
                Function is defined at a = 2{' '}
                {definedAt2 ? `(f(2) = ${valueAt2})` : '(hole — undefined)'}
              </label>
              {definedAt2 && (
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={0.5}
                  value={valueAt2}
                  onChange={(e) => setValueAt2(+e.target.value)}
                  style={{ width: 200, marginLeft: 26 }}
                />
              )}
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={jump} onChange={(e) => setJump(e.target.checked)} />
                Introduce a jump (left and right limits disagree)
              </label>
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.85 }}>
              <div>Left-hand limit as x→2⁻ = {limitFromLeft}</div>
              <div>Right-hand limit as x→2⁺ = {limitFromRight}</div>
              <div style={{ color: limitExists ? COLORS.teal : COLORS.red }}>
                Limit exists?{' '}
                {limitExists ? 'Yes — both sides agree' : 'No — left and right disagree'}
              </div>
              <div>f(2) = {fValue !== null ? fValue : 'undefined (hole)'}</div>
              <div
                style={{
                  fontWeight: 600,
                  color: isContinuous ? COLORS.teal : COLORS.red,
                  marginTop: 6,
                }}
              >
                Continuous at a = 2?{' '}
                {isContinuous
                  ? 'Yes — all three conditions hold'
                  : 'No — ' +
                    (!definedAt2
                      ? 'function is not defined there.'
                      : !limitExists
                        ? 'the limit does not exist.'
                        : 'the limit does not match f(2).')}
              </div>
            </div>
          </div>
        </Section>

        <Section title="L'Hopital's rule on a real 0/0 case">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 14px 0' }}>
              Find: lim(x→0) of sin(x) / x. Plugging in x = 0 directly gives 0/0 — indeterminate, so
              we can't stop there.
            </p>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, lineHeight: 2 }}>
              {hopStep >= 1 && (
                <div>
                  Step 1 — plug in x = 0: sin(0)/0 = 0/0. This is indeterminate, not an answer.
                </div>
              )}
              {hopStep >= 2 && (
                <div>
                  Step 2 — L'Hopital says: take the derivative of the top and the bottom separately.
                </div>
              )}
              {hopStep >= 3 && <div>Step 3 — d/dx[sin(x)] = cos(x), and d/dx[x] = 1.</div>}
              {hopStep >= 4 && <div>Step 4 — new limit: lim(x→0) cos(x) / 1.</div>}
              {hopStep >= 5 && (
                <div style={{ color: COLORS.teal, fontWeight: 600 }}>
                  Step 5 — plug in x = 0: cos(0)/1 = 1/1 = 1. Answer: the limit is 1.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn
                variant="primary"
                onClick={() => setHopStep((s) => Math.min(5, s + 1))}
                disabled={hopStep >= 5}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setHopStep(0)}>
                Reset
              </Btn>
            </div>
            <Callout>
              <strong>Common mistake:</strong> applying L'Hopital's rule to limits that AREN'T 0/0
              or ∞/∞. Always confirm you have an indeterminate form first — otherwise just plug the
              number in directly.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
