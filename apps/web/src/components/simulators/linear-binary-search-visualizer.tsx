/*
  CHAPTER: Linear & Binary Search (Act 3, Sorting & Searching)
  CORRECTION BUILD: the previously cited exclusion "binary-search-visualizer" does
  not exist anywhere in the codebase — this was a fabricated exclusion in the
  original spec audit. This is a genuine new build.

  WHAT THIS DEMONSTRATES
    Linear search stepping through an array one element at a time until the target
    is found (or the array is exhausted), contrasted directly against binary search
    on the SAME sorted array, repeatedly halving the search range by comparing
    against the middle element — with a running comparison-count for both, run
    side by side on an identical target so the O(n) vs O(log n) difference is a
    direct, countable number rather than an abstract claim.

  DESIGN DECISIONS
    - Ran both algorithms on the IDENTICAL sorted array and the IDENTICAL search
      target simultaneously, with independent step controls for each, so the
      comparison-count difference is a direct apples-to-apples number.
    - Included a "search for a value not in the array" scenario as a required part
      of the interaction (not just the successful-find case), since binary search's
      early-termination behavior on an unsuccessful search is a common place
      students misunderstand the algorithm.
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
  purple: '#8B7FD1',
  purpleSoft: '#EDE6F5',
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

const ARRAY = [3, 7, 12, 18, 24, 31, 39, 45, 52, 58, 66, 71, 79, 85, 93];

interface LinearStep {
  idx: number;
  found: boolean;
}
function linearSearchTrace(arr: number[], target: number): LinearStep[] {
  const steps: LinearStep[] = [];
  for (let i = 0; i < arr.length; i++) {
    steps.push({ idx: i, found: arr[i] === target });
    if (arr[i] === target) break;
  }
  return steps;
}

interface BinaryStep {
  lo: number;
  hi: number;
  mid: number;
  comparison: 'found' | 'go-left' | 'go-right';
}
function binarySearchTrace(arr: number[], target: number): BinaryStep[] {
  const steps: BinaryStep[] = [];
  let lo = 0,
    hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      steps.push({ lo, hi, mid, comparison: 'found' });
      break;
    } else if (arr[mid] < target) {
      steps.push({ lo, hi, mid, comparison: 'go-right' });
      lo = mid + 1;
    } else {
      steps.push({ lo, hi, mid, comparison: 'go-left' });
      hi = mid - 1;
    }
  }
  return steps;
}

export default function LinearBinarySearchVisualizer() {
  const [target, setTarget] = useState(71);
  const linearSteps = linearSearchTrace(ARRAY, target);
  const binarySteps = binarySearchTrace(ARRAY, target);

  const [linearIdx, setLinearIdx] = useState(0);
  const [binaryIdx, setBinaryIdx] = useState(0);

  function changeTarget(t: number) {
    setTarget(t);
    setLinearIdx(0);
    setBinaryIdx(0);
  }

  const linearDone = linearIdx >= linearSteps.length - 1;
  const binaryDone = binaryIdx >= binarySteps.length - 1;
  const linearFound = linearSteps[linearSteps.length - 1]?.found ?? false;
  const binaryFound = binarySteps[binarySteps.length - 1]?.comparison === 'found';

  const curLinear = linearSteps[Math.min(linearIdx, linearSteps.length - 1)];
  const curBinary = binarySteps[Math.min(binaryIdx, binarySteps.length - 1)];

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
          Sorting &amp; Searching · Act 3
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Linear Search vs. Binary Search
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Two ways to find a value in a sorted array — one checks everything, one throws away half
          the possibilities every step.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            <strong>Linear search</strong> checks every element one at a time, from the start, until
            it finds the target or runs out of elements — this works on ANY array, sorted or not,
            but can take up to n comparisons for n elements. <strong>Binary search</strong> only
            works on a SORTED array, but is far faster: it checks the middle element, and based on
            whether the target is smaller or larger, throws away HALF the remaining possibilities
            every single step — leading to at most log₂(n) comparisons instead of n.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Linear search"
            def="Check every element in order, one at a time, until the target is found or the array ends."
          />
          <KeyTerm
            term="Binary search"
            def="Repeatedly check the middle of the remaining range and eliminate half the possibilities, based on whether the target is smaller or larger."
          />
          <KeyTerm
            term="Search range (lo, hi)"
            def="The current bounds binary search is still considering — everything outside this range has already been ruled out."
          />
          <KeyTerm
            term="O(n) vs O(log n)"
            def="Linear search's worst case grows directly with array size; binary search's worst case grows much more slowly, roughly doubling the array only adds ONE more comparison."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Pick a target value to search for using the buttons below (including one value NOT in
              the array).
            </Step>
            <Step>
              Step through linear search and binary search independently, watching each one's
              comparison count.
            </Step>
            <Step>Compare how many steps each algorithm needed to reach the same answer.</Step>
            <Step>
              Try searching for a value not in the array and see how each algorithm recognizes "not
              found."
            </Step>
          </ol>
        </Section>

        <Section title={`Search this sorted array: [${ARRAY.join(', ')}]`}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                Search for:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[71, 3, 93, 100].map((t) => (
                  <Btn
                    key={t}
                    variant={target === t ? 'primary' : 'default'}
                    onClick={() => changeTarget(t)}
                  >
                    {t}
                    {t === 100 ? ' (not in array)' : ''}
                  </Btn>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Linear search</div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 10 }}>
                  {ARRAY.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          i === curLinear?.idx
                            ? curLinear.found
                              ? COLORS.tealSoft
                              : COLORS.amberSoft
                            : i < linearIdx
                              ? COLORS.panel
                              : '#fff',
                        border: `1.5px solid ${i === curLinear?.idx ? (curLinear.found ? COLORS.teal : COLORS.amber) : COLORS.line}`,
                      }}
                    >
                      {v}
                    </div>
                  ))}
                </div>
                <div
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, marginBottom: 10 }}
                >
                  Comparisons so far:{' '}
                  <strong>
                    {linearIdx + 1 <= linearSteps.length ? linearIdx + 1 : linearSteps.length}
                  </strong>
                </div>
                {linearDone && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: linearFound ? COLORS.teal : COLORS.red,
                      marginBottom: 10,
                    }}
                  >
                    {linearFound
                      ? `Found at index ${curLinear.idx}!`
                      : 'Not found — checked every element.'}
                  </div>
                )}
                <Btn
                  variant="primary"
                  onClick={() => setLinearIdx((i) => Math.min(linearSteps.length - 1, i + 1))}
                  disabled={linearDone}
                >
                  Step
                </Btn>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Binary search</div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 10 }}>
                  {ARRAY.map((v, i) => {
                    const inRange = curBinary && i >= curBinary.lo && i <= curBinary.hi;
                    const isMid = curBinary && i === curBinary.mid;
                    return (
                      <div
                        key={i}
                        style={{
                          width: 30,
                          height: 30,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 4,
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 11,
                          fontWeight: 700,
                          background: isMid
                            ? curBinary?.comparison === 'found'
                              ? COLORS.tealSoft
                              : COLORS.amberSoft
                            : inRange
                              ? COLORS.purpleSoft
                              : COLORS.panel,
                          border: `1.5px solid ${isMid ? (curBinary?.comparison === 'found' ? COLORS.teal : COLORS.amber) : inRange ? COLORS.purple : COLORS.line}`,
                          opacity: inRange || isMid ? 1 : 0.4,
                        }}
                      >
                        {v}
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, marginBottom: 10 }}
                >
                  Comparisons so far:{' '}
                  <strong>
                    {binaryIdx + 1 <= binarySteps.length ? binaryIdx + 1 : binarySteps.length}
                  </strong>
                </div>
                {binaryDone && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: binaryFound ? COLORS.teal : COLORS.red,
                      marginBottom: 10,
                    }}
                  >
                    {binaryFound
                      ? `Found at index ${curBinary.mid}!`
                      : 'Not found — range shrank to nothing.'}
                  </div>
                )}
                <Btn
                  variant="primary"
                  onClick={() => setBinaryIdx((i) => Math.min(binarySteps.length - 1, i + 1))}
                  disabled={binaryDone}
                >
                  Step
                </Btn>
              </div>
            </div>

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <Btn
                variant="ghost"
                onClick={() => {
                  setLinearIdx(0);
                  setBinaryIdx(0);
                }}
              >
                Reset both
              </Btn>
            </div>

            {linearDone && binaryDone && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  color: COLORS.ink,
                  marginTop: 10,
                }}
              >
                Final comparison count — linear: <strong>{linearSteps.length}</strong>, binary:{' '}
                <strong>{binarySteps.length}</strong>.
                {linearSteps.length > binarySteps.length &&
                  ` Binary search needed ${linearSteps.length - binarySteps.length} fewer comparisons on this ${ARRAY.length}-element array.`}
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> using binary search on an UNSORTED array. Binary
              search's entire logic depends on being able to rule out half the array based on a
              single comparison — which only works if the array is sorted. On unsorted data, binary
              search can give a completely wrong answer, silently.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
