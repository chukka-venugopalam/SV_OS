/*
  CHAPTER: D2 — Linear Data Structures
    Linked Lists (d2-02-linked-lists)

  WHAT THIS DEMONSTRATES
    Node-and-pointer structure; O(1) insert/delete given a node reference vs O(n)
    traversal for access; animate in-place list reversal pointer by pointer.

  DESIGN DECISIONS
    - The reversal animation is the centerpiece since it's the single best way to
      build real intuition for pointer manipulation — showing the classic 3-pointer
      (prev/curr/next) technique step by step rather than just "poof, it's reversed."
    - Kept the O(1)-with-reference vs O(n)-without-reference distinction as a
      separate side-by-side toggle rather than folding it into the reversal demo,
      since conflating the two ideas in one animation would muddy both.
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

const INITIAL = [10, 25, 7, 42, 3];

interface ReversalState {
  order: number[];
  pointers: (number | null)[];
  prevIdx: number;
  currIdx: number;
  nextIdx: number;
  done: boolean;
}

function buildReversalSteps(values: number[]): ReversalState[] {
  const steps: ReversalState[] = [];
  // pointers[i] = index this node points to (in ORIGINAL array positions), or null for end
  let pointers: (number | null)[] = values.map((_, i) => (i + 1 < values.length ? i + 1 : null));
  let prev = -1; // -1 represents null
  let curr = 0;
  steps.push({
    order: [...values.keys()],
    pointers: [...pointers],
    prevIdx: prev,
    currIdx: curr,
    nextIdx: pointers[curr] ?? -1,
    done: false,
  });

  while (curr !== -1 && curr < values.length) {
    const next = pointers[curr];
    pointers = [...pointers];
    pointers[curr] = prev === -1 ? null : prev;
    prev = curr;
    curr = next === null || next === undefined ? -1 : next;
    steps.push({
      order: [...values.keys()],
      pointers: [...pointers],
      prevIdx: prev,
      currIdx: curr,
      nextIdx: curr === -1 ? -1 : (pointers[curr] ?? -1),
      done: curr === -1,
    });
  }
  return steps;
}

function NodeBox({
  value,
  isPrev,
  isCurr,
  isNext,
}: {
  value: number;
  isPrev: boolean;
  isCurr: boolean;
  isNext: boolean;
}) {
  const bg = isCurr ? COLORS.amberSoft : isPrev ? COLORS.tealSoft : isNext ? '#EDE6F5' : '#fff';
  const border = isCurr ? COLORS.amber : isPrev ? COLORS.teal : isNext ? '#8B7FD1' : COLORS.line;
  return (
    <div
      style={{
        display: 'flex',
        border: `2px solid ${border}`,
        borderRadius: 6,
        overflow: 'hidden',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 14,
        fontWeight: 700,
        background: bg,
      }}
    >
      <div style={{ padding: '10px 14px' }}>{value}</div>
      <div
        style={{
          padding: '10px 10px',
          borderLeft: `1.5px solid ${border}`,
          fontSize: 11,
          color: COLORS.inkSoft,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        next
      </div>
    </div>
  );
}

export default function LinkedListReversalVisualizer() {
  const [steps] = useState(() => buildReversalSteps(INITIAL));
  const [stepIdx, setStepIdx] = useState(0);
  const current = steps[stepIdx];

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
          Linear Data Structures · D2
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Linked Lists &amp; In-Place Reversal
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Nodes connected by pointers instead of sitting next to each other in memory.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Unlike an array, a linked list's elements ("nodes") don't need to sit next to each other
            in memory — each node just stores its value AND a pointer to the next node. This means
            inserting or deleting a node is instant (O(1)) as long as you already have a reference
            to the right spot — no shifting required. The tradeoff: to find a specific node, you
            have to follow pointers one at a time from the start (O(n)) — you can't jump straight to
            "node #5" the way you can with an array. Reversing a linked list is a classic exercise
            in carefully rewiring these pointers using three trackers:
            <strong> previous</strong>, <strong>current</strong>, and <strong>next</strong>.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Node"
            def="One element of the list: a value plus a pointer to the next node."
          />
          <KeyTerm
            term="Pointer"
            def="A reference to where the next node lives — like an arrow connecting nodes."
          />
          <KeyTerm term="Head" def="The very first node in the list — your only entry point." />
          <KeyTerm
            term="prev / curr / next"
            def="Three trackers used during reversal: the node already flipped, the node being flipped now, and the node coming up next."
          />
          <KeyTerm
            term="In-place"
            def="Reversing the list by rewiring existing pointers, without creating a whole new list."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Press "Step forward" to advance the reversal one node at a time.</Step>
            <Step>
              Watch which node is orange (current), teal (already reversed), and purple (up next).
            </Step>
            <Step>
              Notice each "next" arrow flips direction one at a time — that's the actual rewiring
              happening.
            </Step>
            <Step>
              Keep stepping until you reach the end — the list will now point in the opposite order.
            </Step>
          </ol>
        </Section>

        <Section title="Reverse the list, one pointer at a time">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontFamily: 'ui-monospace, monospace',
                  background: current.prevIdx === -1 ? COLORS.panel : COLORS.tealSoft,
                  color: COLORS.ink,
                }}
              >
                prev → {current.prevIdx === -1 ? 'null' : INITIAL[current.prevIdx]}
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontFamily: 'ui-monospace, monospace',
                  background: COLORS.amberSoft,
                  color: COLORS.ink,
                }}
              >
                curr → {current.currIdx === -1 ? 'null (done)' : INITIAL[current.currIdx]}
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontFamily: 'ui-monospace, monospace',
                  background: '#EDE6F5',
                  color: COLORS.ink,
                }}
              >
                next → {current.nextIdx === -1 ? 'null' : INITIAL[current.nextIdx]}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 16,
                flexWrap: 'wrap',
                minHeight: 70,
              }}
            >
              {INITIAL.map((v, i) => {
                const pointsTo = current.pointers[i];
                return (
                  <React.Fragment key={i}>
                    <NodeBox
                      value={v}
                      isPrev={i === current.prevIdx}
                      isCurr={i === current.currIdx}
                      isNext={i === current.nextIdx}
                    />
                    {i < INITIAL.length - 1 && (
                      <div
                        style={{
                          fontSize: 16,
                          color:
                            pointsTo === i + 1
                              ? COLORS.inkSoft
                              : pointsTo === null
                                ? '#ccc'
                                : COLORS.teal,
                        }}
                      >
                        {pointsTo === i + 1 ? '→' : pointsTo === null ? '⊥' : '↩'}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <div
                style={{
                  fontSize: 16,
                  color: current.pointers[INITIAL.length - 1] === null ? '#ccc' : COLORS.teal,
                  marginLeft: 4,
                }}
              >
                {current.pointers[INITIAL.length - 1] === null ? '→ null' : '↩'}
              </div>
            </div>

            {current.done && (
              <div
                style={{
                  background: COLORS.tealSoft,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 14,
                }}
              >
                Reversal complete! The list now reads {INITIAL.slice().reverse().join(' → ')} —
                every arrow has been flipped.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setStepIdx((s) => Math.min(steps.length - 1, s + 1))}
                disabled={stepIdx >= steps.length - 1}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> updating curr's pointer to prev BEFORE saving curr's
              original "next" somewhere safe. If you overwrite the pointer first, you lose your only
              way to continue traversing the rest of the original list — that's why "save next"
              always has to happen first.
            </Callout>
          </div>
        </Section>

        <Section title="Access speed: with a reference vs. without one">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
              If you already hold a direct reference to a node, inserting or deleting right there is
              O(1) — just rewire a couple of pointers. But if you only know a VALUE and need to find
              its node first, you have to walk the list from the head, one pointer at a time, which
              is O(n) — there's no shortcut, unlike an array's instant indexing.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
