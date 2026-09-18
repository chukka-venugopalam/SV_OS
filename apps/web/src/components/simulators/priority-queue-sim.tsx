/*
  CHAPTER: D2 — Linear Data Structures
    Deque & Priority Queue (d2-05-deque-priority-queue)

  WHAT THIS DEMONSTRATES
    Deque insertion/removal at both ends; priority queue backed by a heap, always
    exposing the min/max regardless of insertion order.

  DESIGN DECISIONS
    - Deque section uses simple add/remove-at-either-end buttons (four total) since
      that flexibility IS the entire concept — no need for anything fancier.
    - Priority queue is visualized as BOTH a binary heap tree AND the equivalent
      array layout side by side, since the array-to-tree index mapping is a common
      point of confusion that's much clearer seen simultaneously than described.
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

// ---- Min-heap helpers ----
function heapifyUp(heap: number[], i: number) {
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (heap[parent] > heap[i]) {
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    } else break;
  }
}
function heapifyDown(heap: number[], i: number) {
  const n = heap.length;
  while (true) {
    const left = 2 * i + 1,
      right = 2 * i + 2;
    let smallest = i;
    if (left < n && heap[left] < heap[smallest]) smallest = left;
    if (right < n && heap[right] < heap[smallest]) smallest = right;
    if (smallest !== i) {
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      i = smallest;
    } else break;
  }
}

function HeapTree({ heap }: { heap: number[] }) {
  const positions: { x: number; y: number }[] = [];
  const levelHeight = 55;
  for (let i = 0; i < heap.length; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const slotsInLevel = Math.pow(2, level);
    const x = 30 + (posInLevel + 0.5) * (300 / slotsInLevel);
    const y = 20 + level * levelHeight;
    positions.push({ x, y });
  }
  return (
    <svg
      viewBox="0 0 340 200"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {heap.map((_, i) => {
        const parent = Math.floor((i - 1) / 2);
        if (i === 0) return null;
        return (
          <line
            key={`l${i}`}
            x1={positions[parent].x}
            y1={positions[parent].y}
            x2={positions[i].x}
            y2={positions[i].y}
            stroke={COLORS.line}
            strokeWidth={1.5}
          />
        );
      })}
      {heap.map((v, i) => (
        <g key={i}>
          <circle
            cx={positions[i].x}
            cy={positions[i].y}
            r={16}
            fill={i === 0 ? COLORS.tealSoft : '#fff'}
            stroke={i === 0 ? COLORS.teal : COLORS.line}
            strokeWidth={i === 0 ? 2.5 : 1.5}
          />
          <text
            x={positions[i].x}
            y={positions[i].y + 4}
            fontSize="12"
            fontWeight={700}
            fill={COLORS.ink}
            textAnchor="middle"
          >
            {v}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function PriorityQueueSim() {
  const [deque, setDeque] = useState<number[]>([3, 7, 1]);
  const [dequeNext, setDequeNext] = useState(10);

  const [heap, setHeap] = useState<number[]>([2, 5, 4, 8, 9, 7]);
  const [heapValue, setHeapValue] = useState(1);
  const [lastAction, setLastAction] = useState('');

  function addFront() {
    setDeque((d) => [dequeNext, ...d]);
    setDequeNext((v) => v + 1);
  }
  function addRear() {
    setDeque((d) => [...d, dequeNext]);
    setDequeNext((v) => v + 1);
  }
  function removeFront() {
    setDeque((d) => d.slice(1));
  }
  function removeRear() {
    setDeque((d) => d.slice(0, -1));
  }

  function insertHeap() {
    const next = [...heap, heapValue];
    heapifyUp(next, next.length - 1);
    setHeap(next);
    setLastAction(
      `Inserted ${heapValue} at the end, then "bubbled up" while it was smaller than its parent.`,
    );
  }
  function extractMin() {
    if (heap.length === 0) return;
    const min = heap[0];
    const next = [...heap];
    const last = next.pop() as number;
    if (next.length > 0) {
      next[0] = last;
      heapifyDown(next, 0);
    }
    setHeap(next);
    setLastAction(
      `Removed the minimum (${min}). Moved the last element to the top, then "bubbled it down" to restore heap order.`,
    );
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
          Deque &amp; Priority Queue
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A queue that opens at both ends, and one that always hands you the most important item
          first.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A <strong>deque</strong> (pronounced "deck," short for double-ended queue) relaxes the
            normal queue rule — you can add or remove from EITHER end, front or rear, not just one.
            A<strong> priority queue</strong> is a completely different idea: instead of ordering by
            arrival time, it always hands you back the item with the smallest (or largest) priority
            value first, regardless of what order things were added in. Priority queues are usually
            built using a<strong> heap</strong> — a tree shape where every parent is smaller than
            its children (for a min-heap), which makes finding the minimum instant.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Deque"
            def="A queue that allows adding/removing from both the front AND the rear."
          />
          <KeyTerm
            term="Priority queue"
            def="A queue that always returns the highest-priority (e.g. smallest) item first, regardless of insertion order."
          />
          <KeyTerm
            term="Min-heap"
            def="A tree where every parent node is smaller than or equal to both its children — the smallest value is always at the root."
          />
          <KeyTerm
            term="Bubble up / down"
            def="The process of moving a newly inserted or moved element up or down the tree until heap order is restored."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Use the four deque buttons to add or remove items from either end.</Step>
            <Step>
              Scroll down and press "Insert" to add a number into the priority queue — watch it
              bubble up the tree.
            </Step>
            <Step>
              Press "Extract min" repeatedly and notice it always returns the smallest value
              currently in the structure, no matter what order things were inserted.
            </Step>
            <Step>
              Compare the tree view and the array view — they represent the exact same heap, just
              drawn two different ways.
            </Step>
          </ol>
        </Section>

        <Section title="Deque: add or remove from either end">
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
                gap: 6,
                marginBottom: 16,
                flexWrap: 'wrap',
                minHeight: 50,
                alignItems: 'center',
              }}
            >
              {deque.length === 0 && (
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontStyle: 'italic' }}>
                  (empty)
                </div>
              )}
              {deque.map((v, i) => (
                <div
                  key={i}
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
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn variant="primary" onClick={addFront}>
                Add to front
              </Btn>
              <Btn onClick={removeFront} disabled={deque.length === 0}>
                Remove from front
              </Btn>
              <Btn variant="primary" onClick={addRear}>
                Add to rear
              </Btn>
              <Btn onClick={removeRear} disabled={deque.length === 0}>
                Remove from rear
              </Btn>
            </div>
          </div>
        </Section>

        <Section title="Priority queue backed by a min-heap">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                Tree view (highlighted = current minimum)
              </div>
              <HeapTree heap={heap} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                Array view (same heap, stored flat — child of index i lives at 2i+1 and 2i+2)
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {heap.map((v, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 13,
                        fontWeight: 700,
                        background: i === 0 ? COLORS.tealSoft : COLORS.panel,
                        border: `1.5px solid ${i === 0 ? COLORS.teal : COLORS.line}`,
                      }}
                    >
                      {v}
                    </div>
                    <div style={{ fontSize: 8.5, color: COLORS.inkSoft }}>{i}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input
                type="number"
                value={heapValue}
                onChange={(e) => setHeapValue(+e.target.value)}
                style={{
                  width: 70,
                  padding: '6px 10px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                }}
              />
              <Btn variant="primary" onClick={insertHeap}>
                Insert
              </Btn>
              <Btn onClick={extractMin} disabled={heap.length === 0}>
                Extract min
              </Btn>
            </div>

            {lastAction && (
              <div
                style={{
                  fontSize: 12.5,
                  color: COLORS.inkSoft,
                  fontStyle: 'italic',
                  marginBottom: 8,
                }}
              >
                {lastAction}
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> assuming a heap is fully sorted. It's not! A min-heap
              only guarantees each parent is smaller than its OWN children — it says nothing about
              the relative order of elements in different branches. Only the very top (the root) is
              guaranteed to be the true minimum.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
