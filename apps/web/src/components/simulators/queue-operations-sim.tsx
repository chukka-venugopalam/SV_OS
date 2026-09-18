/*
  CHAPTER: D2 — Linear Data Structures
    Queues (d2-04-queues)

  WHAT THIS DEMONSTRATES
    enqueue/dequeue as FIFO; both a linked-list-backed and circular-buffer-backed
    implementation shown achieving O(1).

  DESIGN DECISIONS
    - Two side-by-side implementations (linked-list-backed vs circular-buffer-backed)
      running the SAME sequence of operations simultaneously, so the student can see
      both achieve O(1) enqueue/dequeue despite looking structurally very different.
    - Circular buffer explicitly visualizes the front/rear indices wrapping around
      the fixed-size array, since that wraparound IS the "circular" part and is easy
      to miss if only shown as a plain list.
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

const CAPACITY = 6;

export default function QueueOperationsSim() {
  const [linkedQueue, setLinkedQueue] = useState<number[]>([4, 8, 15]);
  const [buffer, setBuffer] = useState<(number | null)[]>([4, 8, 15, null, null, null]);
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(3); // index just past the last item
  const [nextValue, setNextValue] = useState(16);

  const bufferCount = linkedQueue.length; // keep both representations in sync by count

  function enqueue() {
    if (bufferCount >= CAPACITY) return;
    setLinkedQueue((q) => [...q, nextValue]);
    setBuffer((b) => {
      const next = [...b];
      next[rear] = nextValue;
      return next;
    });
    setRear((r) => (r + 1) % CAPACITY);
    setNextValue((v) => v + 1);
  }

  function dequeue() {
    if (linkedQueue.length === 0) return;
    setLinkedQueue((q) => q.slice(1));
    setBuffer((b) => {
      const next = [...b];
      next[front] = null;
      return next;
    });
    setFront((f) => (f + 1) % CAPACITY);
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
          Queues: Two Ways to Build FIFO
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          First in, first out — and two very different implementations that both achieve it in O(1).
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A queue is like a line at a checkout counter: whoever arrives FIRST gets served first.
            This is called <strong>FIFO</strong> (first in, first out) — the opposite ordering rule
            from a stack. You add new items at the <strong>rear</strong> (enqueue) and remove items
            from the <strong>front</strong>
            (dequeue). There are two common ways to build one: backing it with a linked list (grow
            and shrink freely, one node at a time) or backing it with a fixed-size{' '}
            <strong>circular buffer</strong> (a regular array where the front and rear indices wrap
            back around to the start once they hit the end). Both achieve O(1) enqueue and dequeue —
            they just get there differently.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="FIFO"
            def="First In, First Out — the item that's been waiting longest is always the next one removed."
          />
          <KeyTerm term="Enqueue" def="Add a new item to the rear (back) of the queue." />
          <KeyTerm term="Dequeue" def="Remove and return the item at the front of the queue." />
          <KeyTerm
            term="Circular buffer"
            def="A fixed-size array where the front/rear positions wrap back to index 0 once they reach the end, reusing freed-up slots."
          />
          <KeyTerm
            term="Front / rear pointers"
            def="Indices tracking where the next dequeue will come from, and where the next enqueue will go."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Press "Enqueue" repeatedly to add items — watch both representations update together.
            </Step>
            <Step>
              Press "Dequeue" to remove from the front — notice the linked list shrinks, while the
              buffer just marks a slot empty.
            </Step>
            <Step>
              Keep enqueuing and dequeuing until the circular buffer's rear pointer wraps back
              around to index 0 — that's the "circular" part in action.
            </Step>
          </ol>
        </Section>

        <Section title="Linked-list-backed queue">
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
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                flexWrap: 'wrap',
                minHeight: 50,
              }}
            >
              {linkedQueue.length === 0 && (
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontStyle: 'italic' }}>
                  (empty queue)
                </div>
              )}
              {linkedQueue.map((v, i) => (
                <React.Fragment key={i}>
                  <div
                    style={{
                      padding: '8px 14px',
                      borderRadius: 5,
                      background: COLORS.tealSoft,
                      border: `1.5px solid ${COLORS.teal}`,
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {v}
                  </div>
                  {i < linkedQueue.length - 1 && <span style={{ color: COLORS.inkSoft }}>→</span>}
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: COLORS.inkSoft }}>
              <span>front (dequeue here) ↑ leftmost</span>
              <span>rear (enqueue here) ↑ rightmost</span>
            </div>
          </div>
        </Section>

        <Section title="Circular-buffer-backed queue (fixed size 6)">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {buffer.map((v, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 5,
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      background: v !== null ? COLORS.tealSoft : COLORS.panel,
                      border: `1.5px solid ${v !== null ? COLORS.teal : COLORS.line}`,
                    }}
                  >
                    {v !== null ? v : ''}
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.inkSoft, marginTop: 3 }}>{i}</div>
                  {i === front && (
                    <div style={{ fontSize: 9, color: COLORS.amber, fontWeight: 700 }}>front</div>
                  )}
                  {i === rear && (
                    <div style={{ fontSize: 9, color: COLORS.red, fontWeight: 700 }}>rear</div>
                  )}
                </div>
              ))}
            </div>
            <p
              style={{ fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '10px 0 0' }}
            >
              When "rear" reaches index 5 and a new item is enqueued, it wraps back to index 0 — as
              long as that slot has already been freed by an earlier dequeue. That wraparound is
              what makes it "circular."
            </p>
          </div>
        </Section>

        <Section title="Try it: enqueue and dequeue">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn variant="primary" onClick={enqueue} disabled={bufferCount >= CAPACITY}>
                Enqueue {nextValue}
              </Btn>
              <Btn onClick={dequeue} disabled={linkedQueue.length === 0}>
                Dequeue
              </Btn>
            </div>
            {bufferCount >= CAPACITY && (
              <div style={{ fontSize: 12.5, color: COLORS.red }}>
                Buffer full (capacity {CAPACITY}) — dequeue something first.
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> thinking a circular buffer needs to physically shift
              elements when it wraps around. It doesn't — it just reuses the SAME fixed slots by
              moving the front/rear index pointers, which is exactly why it stays O(1) instead of
              needing an O(n) shift like an array might.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
