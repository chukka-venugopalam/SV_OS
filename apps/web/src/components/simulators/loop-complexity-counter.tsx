/*
  CHAPTER: D1 — Complexity Core
    Analyzing Loop Complexity (d1-02-loop-complexity)

  WHAT THIS DEMONSTRATES
    Student edits pseudocode with single/nested/halving loops, tool counts actual
    operations for a given n and derives the matching Big-O.

  DESIGN DECISIONS
    - Rather than a free-text pseudocode editor (hard to parse reliably and risky for
      beginners to get "wrong" syntax), used a preset menu of 4 canonical loop shapes
      (single, nested, nested-triangular, halving) — each with an n slider — since the
      "Must demonstrate" goal is counting operations and deriving Big-O, not general
      code parsing.
    - Operation counting is done by literally executing an instrumented version of
      each loop shape and counting iterations live, so the count is always accurate,
      never a hardcoded formula that could drift from the visual.
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

type LoopShape = 'single' | 'nested' | 'triangular' | 'halving';

const LOOP_CODE: Record<LoopShape, string> = {
  single: `for i = 0 to n-1:\n    print(i)   // 1 operation per pass`,
  nested: `for i = 0 to n-1:\n    for j = 0 to n-1:\n        print(i, j)   // 1 operation per pass`,
  triangular: `for i = 0 to n-1:\n    for j = i to n-1:\n        print(i, j)   // inner loop shrinks each time`,
  halving: `i = n\nwhile i > 1:\n    print(i)\n    i = i / 2   // i shrinks by half each pass`,
};

function countOps(shape: LoopShape, n: number): number {
  let ops = 0;
  if (shape === 'single') {
    for (let i = 0; i < n; i++) ops++;
  } else if (shape === 'nested') {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) ops++;
  } else if (shape === 'triangular') {
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) ops++;
  } else if (shape === 'halving') {
    let i = n;
    while (i > 1) {
      ops++;
      i = Math.floor(i / 2);
    }
  }
  return ops;
}

const BIG_O: Record<LoopShape, string> = {
  single: 'O(n)',
  nested: 'O(n²)',
  triangular: 'O(n²)',
  halving: 'O(log n)',
};
const EXPLANATION: Record<LoopShape, string> = {
  single:
    'One loop runs n times, doing one operation each pass — total work scales directly with n.',
  nested:
    'The outer loop runs n times, and for EACH of those, the inner loop also runs n times — n × n = n² total operations.',
  triangular:
    "The inner loop shrinks each time (starts later), but the total still adds up to roughly n²/2 — and constants don't matter in Big-O, so this is still O(n²).",
  halving:
    'Each pass cuts the remaining work in half, so the number of passes needed is log₂(n) — MUCH slower-growing than a plain loop.',
};

export default function LoopComplexityCounter() {
  const [shape, setShape] = useState<LoopShape>('single');
  const [n, setN] = useState(6);
  const [revealed, setRevealed] = useState(false);

  const ops = countOps(shape, n);

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
          Analyzing Loop Complexity
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Counting exactly how many operations different loop shapes actually perform.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            The shape of a loop tells you a lot about its Big-O complexity. A single loop that runs
            n times does roughly n operations. But loops INSIDE other loops multiply their work
            together — a loop inside a loop, each running n times, does n × n = n² operations. And a
            loop that shrinks its problem size each pass (like cutting it in half) needs
            surprisingly FEW passes. This tool lets you pick a loop shape, change n, and watch the
            actual operation count add up — so the Big-O formula isn't just something you memorize,
            it's something you can literally count.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Operation count"
            def="How many times the innermost line of code actually executes — the real, countable amount of work."
          />
          <KeyTerm
            term="Nested loop"
            def="A loop written inside another loop — its total work multiplies with the outer loop's iterations."
          />
          <KeyTerm
            term="Triangular loop"
            def="A nested loop where the inner loop's range depends on the outer loop's current position, so it shrinks each pass."
          />
          <KeyTerm
            term="Halving loop"
            def="A loop where the problem size is divided (usually by 2) each pass, rather than reduced by a fixed amount."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Pick a loop shape from the four buttons below.</Step>
            <Step>
              Drag the n slider to change the input size and watch the operation count update live.
            </Step>
            <Step>
              Press "Reveal the Big-O" to see the matching complexity class and why it fits.
            </Step>
            <Step>
              Switch between shapes at the same n to compare how differently the operation counts
              scale.
            </Step>
          </ol>
        </Section>

        <Section title="Pick a loop shape and count its operations">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Btn
                variant={shape === 'single' ? 'primary' : 'default'}
                onClick={() => {
                  setShape('single');
                  setRevealed(false);
                }}
              >
                Single loop
              </Btn>
              <Btn
                variant={shape === 'nested' ? 'primary' : 'default'}
                onClick={() => {
                  setShape('nested');
                  setRevealed(false);
                }}
              >
                Nested loop
              </Btn>
              <Btn
                variant={shape === 'triangular' ? 'primary' : 'default'}
                onClick={() => {
                  setShape('triangular');
                  setRevealed(false);
                }}
              >
                Triangular nested loop
              </Btn>
              <Btn
                variant={shape === 'halving' ? 'primary' : 'default'}
                onClick={() => {
                  setShape('halving');
                  setRevealed(false);
                }}
              >
                Halving loop
              </Btn>
            </div>

            <pre
              style={{
                background: COLORS.panel,
                padding: '12px 16px',
                borderRadius: 6,
                fontSize: 12.5,
                fontFamily: 'ui-monospace, monospace',
                lineHeight: 1.6,
                marginBottom: 16,
                overflowX: 'auto',
              }}
            >
              {LOOP_CODE[shape]}
            </pre>

            <label
              style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
            >
              Input size n = {n}
            </label>
            <input
              type="range"
              min={2}
              max={16}
              value={n}
              onChange={(e) => {
                setN(+e.target.value);
              }}
              style={{ width: 240, marginBottom: 16 }}
            />

            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, marginBottom: 14 }}>
              Actual operation count for n = {n}:{' '}
              <strong style={{ color: COLORS.teal }}>{ops}</strong>
            </div>

            {revealed && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  lineHeight: 1.8,
                  marginBottom: 14,
                }}
              >
                <div>
                  Big-O: <strong style={{ color: COLORS.teal }}>{BIG_O[shape]}</strong>
                </div>
                <div
                  style={{
                    color: COLORS.inkSoft,
                    fontFamily: 'system-ui, sans-serif',
                    marginTop: 4,
                  }}
                >
                  {EXPLANATION[shape]}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="primary" onClick={() => setRevealed(true)} disabled={revealed}>
                Reveal the Big-O
              </Btn>
              <Btn variant="ghost" onClick={() => setRevealed(false)}>
                Hide
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> assuming the triangular loop is O(n) because "the
              inner loop doesn't always run n times." It still adds up to about n²/2 total
              operations — and Big-O ignores constant factors like that ÷2, so it's still classified
              as O(n²), same as a full nested loop.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
