/*
  CHAPTER: D1 — Complexity Core
    Big-O, Omega & Theta Notation (d1-01-asymptotic-notation)

  WHAT THIS DEMONSTRATES
    Plot several growth-rate functions (O(1), O(log n), O(n), O(n log n), O(n^2),
    O(2^n)) on one graph with adjustable n range, so students see how curves overtake
    each other.

  DESIGN DECISIONS
    - Used a log-scale y-axis toggle since O(2^n) dwarfs everything else on a linear
      scale almost immediately — without log scale, the "crossing" behavior of the
      slower-growing functions becomes invisible.
    - Each curve is individually toggleable so a student can isolate two functions at
      a time to see exactly where one overtakes another, rather than being stuck
      staring at 6 overlapping lines at once.
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

type CurveKey = 'const' | 'log' | 'linear' | 'nlogn' | 'quad' | 'exp';

const CURVES: Record<CurveKey, { label: string; color: string; fn: (n: number) => number }> = {
  const: { label: 'O(1)', color: '#8B7FD1', fn: () => 1 },
  log: { label: 'O(log n)', color: COLORS.teal, fn: (n) => Math.log2(Math.max(n, 1)) },
  linear: { label: 'O(n)', color: COLORS.amber, fn: (n) => n },
  nlogn: { label: 'O(n log n)', color: '#C97B2E', fn: (n) => n * Math.log2(Math.max(n, 1)) },
  quad: { label: 'O(n²)', color: COLORS.red, fn: (n) => n * n },
  exp: { label: 'O(2ⁿ)', color: '#8B2E3D', fn: (n) => Math.pow(2, n) },
};

export default function GrowthRateGrapher() {
  const [maxN, setMaxN] = useState(20);
  const [active, setActive] = useState<Record<CurveKey, boolean>>({
    const: true,
    log: true,
    linear: true,
    nlogn: true,
    quad: true,
    exp: true,
  });
  const [logScale, setLogScale] = useState(true);

  function toggle(key: CurveKey) {
    setActive((a) => ({ ...a, [key]: !a[key] }));
  }

  const W = 340,
    H = 260,
    pad = 36;
  const activeCurves = (Object.keys(CURVES) as CurveKey[]).filter((k) => active[k]);
  const maxY = Math.max(...activeCurves.map((k) => CURVES[k].fn(maxN)), 1);

  function scaleY(v: number): number {
    if (logScale) {
      const logV = Math.log10(Math.max(v, 0.1));
      const logMax = Math.log10(Math.max(maxY, 1));
      return H - pad - (logV / logMax) * (H - 2 * pad);
    }
    return H - pad - (v / maxY) * (H - 2 * pad);
  }
  function scaleX(n: number): number {
    return pad + (n / maxN) * (W - 2 * pad);
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
          Big-O, Omega &amp; Theta Notation
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How fast an algorithm's work grows as the input gets bigger — and why some growth rates
          dominate others.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            When we say an algorithm is "O(n²)," we're describing how its running time grows as the
            input size (n) grows — NOT the exact number of seconds it takes. <strong>Big-O</strong>{' '}
            describes an upper bound (how bad it can get), <strong>Omega</strong> describes a lower
            bound (how good it can get), and <strong>Theta</strong> means both bounds match — a
            tight, exact description of the growth rate. The real power of this notation is
            comparing algorithms: an O(n) algorithm will always eventually beat an O(n²) one as the
            input grows large enough, even if the O(n²) one looks faster on tiny inputs.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="n"
            def="The size of the input — like the number of items in a list being sorted or searched."
          />
          <KeyTerm
            term="Big-O, O(...)"
            def="An upper bound: the algorithm's work grows AT MOST this fast as n increases."
          />
          <KeyTerm
            term="Omega, Ω(...)"
            def="A lower bound: the algorithm's work grows AT LEAST this fast."
          />
          <KeyTerm
            term="Theta, Θ(...)"
            def="A tight bound: both the upper and lower bounds match — this IS the growth rate, not just a ceiling."
          />
          <KeyTerm
            term="Dominant term"
            def="The fastest-growing part of a formula — for large n, it's the only part that matters."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Drag the "input size" slider to change how large n gets on the graph.</Step>
            <Step>
              Click any curve's label below the graph to hide or show it — try isolating just two
              curves to see exactly where one overtakes another.
            </Step>
            <Step>
              Toggle "log scale" on and off to see why log scale is necessary once O(2ⁿ) is included
              — it grows too fast to see anything else otherwise.
            </Step>
          </ol>
        </Section>

        <Section title="Compare growth rates as n increases">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              style={{
                display: 'block',
                background: COLORS.panel,
                borderRadius: 6,
                marginBottom: 14,
              }}
            >
              <line
                x1={pad}
                y1={H - pad}
                x2={W - pad}
                y2={H - pad}
                stroke={COLORS.inkSoft}
                strokeWidth={1}
              />
              <line
                x1={pad}
                y1={pad}
                x2={pad}
                y2={H - pad}
                stroke={COLORS.inkSoft}
                strokeWidth={1}
              />
              <text
                x={W - pad}
                y={H - pad + 16}
                fontSize="9"
                fill={COLORS.inkSoft}
                textAnchor="end"
              >
                n = {maxN}
              </text>
              <text x={pad - 6} y={pad} fontSize="9" fill={COLORS.inkSoft} textAnchor="end">
                work
              </text>

              {activeCurves.map((key) => {
                const { fn, color } = CURVES[key];
                const pts: string[] = [];
                for (let n = 0; n <= maxN; n += Math.max(0.2, maxN / 100)) {
                  pts.push(`${scaleX(n)},${scaleY(fn(n))}`);
                }
                return (
                  <polyline
                    key={key}
                    points={pts.join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.2}
                  />
                );
              })}
            </svg>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {(Object.keys(CURVES) as CurveKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: `1.5px solid ${active[key] ? CURVES[key].color : COLORS.line}`,
                    background: active[key] ? `${CURVES[key].color}18` : '#fff',
                    fontSize: 12,
                    fontFamily: 'ui-monospace, monospace',
                    cursor: 'pointer',
                    color: COLORS.ink,
                    opacity: active[key] ? 1 : 0.5,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: CURVES[key].color,
                      display: 'inline-block',
                    }}
                  />
                  {CURVES[key].label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  Input size range: n up to {maxN}
                </label>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={maxN}
                  onChange={(e) => setMaxN(+e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <label
                style={{
                  fontSize: 12,
                  color: COLORS.inkSoft,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <input
                  type="checkbox"
                  checked={logScale}
                  onChange={(e) => setLogScale(e.target.checked)}
                />{' '}
                Log scale
              </label>
            </div>

            <Callout>
              <strong>Common mistake:</strong> comparing algorithms by which one "looks faster" on a
              small example. Big-O is specifically about what happens as n gets LARGE — an O(n²)
              algorithm can easily beat an O(n log n) one for tiny inputs, but it will always lose
              eventually.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
