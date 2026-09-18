/*
  CHAPTER: D6 — Sorting, Searching & Algorithm Design
    String Matching — Naive & KMP (d6-08-string-matching)

  WHAT THIS DEMONSTRATES
    Naive matching sliding one position at a time (O(nm)); KMP using a precomputed
    failure function to skip ahead, both on the same text/pattern for direct
    comparison.

  DESIGN DECISIONS
    - Both algorithms run side by side on the identical text/pattern pair with
      synchronized step controls, so the comparison of comparisons-made is a direct,
      countable number rather than an abstract claim.
    - The failure function table is shown explicitly (not just used internally),
      since understanding WHY KMP can skip ahead requires seeing that precomputed
      table, not just watching the pointer jump.
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

const TEXT = 'ABABABCABAB';
const PATTERN = 'ABABC';

function buildFailureFunction(pattern: string): number[] {
  const fail = new Array(pattern.length).fill(0);
  let len = 0,
    i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      fail[i] = len;
      i++;
    } else if (len > 0) {
      len = fail[len - 1];
    } else {
      fail[i] = 0;
      i++;
    }
  }
  return fail;
}
const FAILURE = buildFailureFunction(PATTERN);

interface MatchStep {
  textPos: number;
  patternPos: number;
  comparisons: number;
  matched: boolean;
  note: string;
}

function naiveTrace(text: string, pattern: string): MatchStep[] {
  const steps: MatchStep[] = [];
  let comparisons = 0;
  for (let i = 0; i <= text.length - pattern.length; i++) {
    let j = 0;
    while (j < pattern.length && text[i + j] === pattern[j]) {
      comparisons++;
      j++;
    }
    if (j < pattern.length) comparisons++;
    const matched = j === pattern.length;
    steps.push({
      textPos: i,
      patternPos: j,
      comparisons,
      matched,
      note: matched
        ? `Full match found at text position ${i}!`
        : `Mismatch after ${j} character(s) — slide pattern forward by just 1.`,
    });
  }
  return steps;
}

function kmpTrace(text: string, pattern: string, fail: number[]): MatchStep[] {
  const steps: MatchStep[] = [];
  let comparisons = 0;
  let i = 0,
    j = 0; // i = text pointer (never decreases), j = pattern pointer
  while (i < text.length) {
    if (text[i] === pattern[j]) {
      comparisons++;
      i++;
      j++;
      if (j === pattern.length) {
        steps.push({
          textPos: i - j,
          patternPos: j,
          comparisons,
          matched: true,
          note: `Full match found at text position ${i - j}!`,
        });
        break;
      }
    } else {
      comparisons++;
      if (j > 0) {
        const skip = fail[j - 1];
        steps.push({
          textPos: i - j,
          patternPos: j,
          comparisons,
          matched: false,
          note: `Mismatch after ${j} matched characters — instead of sliding by 1, use the failure function: skip ahead so only ${skip} characters need re-checking.`,
        });
        j = skip;
      } else {
        steps.push({
          textPos: i - j,
          patternPos: j,
          comparisons,
          matched: false,
          note: `Mismatch immediately — slide forward by 1 (nothing to reuse).`,
        });
        i++;
      }
    }
  }
  return steps;
}

const NAIVE_STEPS = naiveTrace(TEXT, PATTERN);
const KMP_STEPS = kmpTrace(TEXT, PATTERN, FAILURE);

function AlignmentRow({
  text,
  pattern,
  offset,
  matchLen,
  isMatch,
}: {
  text: string;
  pattern: string;
  offset: number;
  matchLen: number;
  isMatch: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {text.split('').map((c, i) => (
          <span key={i} style={{ width: 18, textAlign: 'center' }}>
            {c}
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`pad${i}`} style={{ width: 18 }} />
        ))}
        {pattern.split('').map((c, i) => (
          <span
            key={i}
            style={{
              width: 18,
              textAlign: 'center',
              background:
                i < matchLen
                  ? COLORS.tealSoft
                  : i === matchLen
                    ? isMatch
                      ? COLORS.tealSoft
                      : COLORS.redSoft
                    : 'transparent',
              color: COLORS.ink,
              borderRadius: 3,
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function KmpPatternMatchVisualizer() {
  const [naiveIdx, setNaiveIdx] = useState(0);
  const [kmpIdx, setKmpIdx] = useState(0);

  const naiveStep = NAIVE_STEPS[naiveIdx];
  const kmpStep = KMP_STEPS[kmpIdx];

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
          Sorting, Searching &amp; Algorithm Design · D6
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          String Matching: Naive vs. KMP
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Two ways to find a pattern inside a larger text — one simple and slow, one clever and
          fast.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            String matching means finding every place a short "pattern" appears inside a longer
            "text." The
            <strong> naive</strong> approach checks every possible starting position, one at a time,
            and if a mismatch happens, it just slides forward by exactly ONE character and starts
            over completely — this wastes a lot of already-known information. The{' '}
            <strong>KMP algorithm</strong> (Knuth-Morris-Pratt) precomputes a{' '}
            <strong>failure function</strong> that tells it, on a mismatch, exactly how far it can
            safely skip ahead — using the fact that part of the pattern already matched to avoid
            re-checking characters it already knows about.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm term="Text" def="The longer string being searched." />
          <KeyTerm term="Pattern" def="The shorter string being searched FOR." />
          <KeyTerm
            term="Failure function"
            def="A precomputed table for the pattern that says, after a mismatch at position i, how much of the pattern's own prefix can be reused."
          />
          <KeyTerm
            term="O(nm) vs O(n+m)"
            def="Naive matching can take time proportional to text length × pattern length in the worst case; KMP guarantees text length + pattern length, always."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Both boxes below search for the same pattern in the same text.</Step>
            <Step>
              Press "Step forward" in each box independently and compare how far each one has to
              slide after a mismatch.
            </Step>
            <Step>
              Check the failure function table to understand exactly what number KMP uses to decide
              its skip distance.
            </Step>
            <Step>
              Compare the final comparison counts — KMP should need noticeably fewer character
              comparisons overall.
            </Step>
          </ol>
        </Section>

        <Section title={`Naive matching: find "${PATTERN}" in "${TEXT}"`}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <AlignmentRow
              text={TEXT}
              pattern={PATTERN}
              offset={naiveStep.textPos}
              matchLen={naiveStep.patternPos}
              isMatch={naiveStep.matched}
            />
            <div
              style={{
                fontSize: 13,
                color: COLORS.ink,
                margin: '14px 0',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {naiveStep.note}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>
              Total comparisons so far: <strong>{naiveStep.comparisons}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setNaiveIdx((i) => Math.max(0, i - 1))} disabled={naiveIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setNaiveIdx((i) => Math.min(NAIVE_STEPS.length - 1, i + 1))}
                disabled={naiveIdx >= NAIVE_STEPS.length - 1 || naiveStep.matched}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setNaiveIdx(0)}>
                Reset
              </Btn>
            </div>
          </div>
        </Section>

        <Section title={`KMP: the failure function for "${PATTERN}"`}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {PATTERN.split('').map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 30,
                    textAlign: 'center',
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {FAILURE.map((f, i) => (
                <div
                  key={i}
                  style={{
                    width: 30,
                    textAlign: 'center',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 12,
                    color: COLORS.teal,
                    fontWeight: 700,
                    background: COLORS.tealSoft,
                    borderRadius: 4,
                    padding: '2px 0',
                  }}
                >
                  {f}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>
              Each number says: "if a mismatch happens right after matching up to here, this many
              characters at the start of the pattern are already known to match, so skip re-checking
              them."
            </p>
          </div>
        </Section>

        <Section title={`KMP matching: find "${PATTERN}" in "${TEXT}"`}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <AlignmentRow
              text={TEXT}
              pattern={PATTERN}
              offset={kmpStep.textPos}
              matchLen={kmpStep.patternPos}
              isMatch={kmpStep.matched}
            />
            <div
              style={{
                fontSize: 13,
                color: COLORS.ink,
                margin: '14px 0',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {kmpStep.note}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>
              Total comparisons so far: <strong>{kmpStep.comparisons}</strong> (vs{' '}
              {naiveStep.comparisons} for naive at this point)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setKmpIdx((i) => Math.max(0, i - 1))} disabled={kmpIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setKmpIdx((i) => Math.min(KMP_STEPS.length - 1, i + 1))}
                disabled={kmpIdx >= KMP_STEPS.length - 1 || kmpStep.matched}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setKmpIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> thinking KMP re-examines the text characters it skips
              past. It doesn't re-check the TEXT at all during a skip — it only avoids redundant
              PATTERN comparisons, since the text pointer never moves backward, only the pattern's
              matching position resets partway.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
