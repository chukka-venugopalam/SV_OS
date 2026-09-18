/*
  CHAPTER: D2 — Linear Data Structures
    Arrays (d2-01-arrays)

  WHAT THIS DEMONSTRATES
    Contiguous memory layout with computed addresses; insertion/deletion in the
    middle animated as an O(n) shift; dynamic resize triggering a copy.

  DESIGN DECISIONS
    - Addresses are shown as simple incrementing offsets (base + index*elementSize)
      rather than realistic hex memory addresses, since the POINT is showing the
      arithmetic relationship, not simulating a real memory map.
    - Insert/delete-in-middle uses an actual shift animation (elements visibly slide)
      rather than an instant jump, since the O(n) cost IS the shifting itself, and
      that has to be visible to land the point.
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

const BASE_ADDRESS = 1000;
const ELEMENT_SIZE = 4;

function Cell({
  value,
  address,
  highlight,
  ghost,
}: {
  value: number | null;
  address: number;
  highlight?: 'insert' | 'delete' | 'shift' | null;
  ghost?: boolean;
}) {
  const bg = ghost
    ? COLORS.panel
    : highlight === 'insert'
      ? COLORS.tealSoft
      : highlight === 'delete'
        ? COLORS.redSoft
        : highlight === 'shift'
          ? COLORS.amberSoft
          : '#fff';
  const border = ghost
    ? COLORS.line
    : highlight === 'insert'
      ? COLORS.teal
      : highlight === 'delete'
        ? COLORS.red
        : highlight === 'shift'
          ? COLORS.amber
          : COLORS.line;
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 15,
          fontWeight: 700,
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: 5,
          color: ghost ? COLORS.inkSoft : COLORS.ink,
          transition: 'all 0.3s ease',
        }}
      >
        {value !== null ? value : ''}
      </div>
      <div style={{ fontSize: 9, color: COLORS.inkSoft, marginTop: 3 }}>{address}</div>
    </div>
  );
}

export default function ArrayAddressVisualizer() {
  const [arr, setArr] = useState<number[]>([12, 45, 7, 23, 9]);
  const [capacity, setCapacity] = useState(5);
  const [opInProgress, setOpInProgress] = useState<null | {
    type: 'insert' | 'delete';
    index: number;
    stage: number;
  }>(null);
  const [insertValue, setInsertValue] = useState(99);
  const [insertIndex, setInsertIndex] = useState(2);
  const [deleteIndex, setDeleteIndex] = useState(2);
  const [showResize, setShowResize] = useState(false);

  function addressOf(index: number) {
    return BASE_ADDRESS + index * ELEMENT_SIZE;
  }

  function startInsert() {
    setOpInProgress({ type: 'insert', index: insertIndex, stage: 1 });
  }
  function startDelete() {
    setOpInProgress({ type: 'delete', index: deleteIndex, stage: 1 });
  }
  function advanceOp() {
    if (!opInProgress) return;
    if (opInProgress.type === 'insert') {
      if (opInProgress.stage < arr.length - opInProgress.index + 1) {
        setOpInProgress({ ...opInProgress, stage: opInProgress.stage + 1 });
      } else {
        const next = [...arr];
        if (arr.length >= capacity) {
          setShowResize(true);
          setCapacity((c) => c * 2);
        }
        next.splice(opInProgress.index, 0, insertValue);
        setArr(next);
        setOpInProgress(null);
      }
    } else {
      if (opInProgress.stage < arr.length - opInProgress.index) {
        setOpInProgress({ ...opInProgress, stage: opInProgress.stage + 1 });
      } else {
        const next = [...arr];
        next.splice(opInProgress.index, 1);
        setArr(next);
        setOpInProgress(null);
      }
    }
  }
  function resetOp() {
    setOpInProgress(null);
    setShowResize(false);
  }

  const shiftingIndices = new Set<number>();
  if (opInProgress) {
    const { type, index, stage } = opInProgress;
    if (type === 'insert') {
      for (let i = arr.length - 1; i >= index && i >= arr.length - stage + 1; i--)
        shiftingIndices.add(i);
    } else {
      for (let i = index; i < index + stage; i++) shiftingIndices.add(i);
    }
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
          Arrays &amp; Memory Addresses
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Why array access is instant, but inserting in the middle is expensive.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            An array stores its elements in one unbroken block of memory, back to back — this is
            called
            <strong> contiguous</strong> storage. Because every element takes up the same amount of
            space, the computer can calculate exactly where element #5 lives using simple arithmetic
            (base address + 5 × element size) — no searching needed, which is why array access is
            instant, O(1). But that same contiguous layout is a double-edged sword: inserting or
            deleting in the middle means every element after that point has to physically shift over
            to keep the array unbroken, which takes O(n) time.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Contiguous memory"
            def="Elements stored back-to-back in one unbroken block, with no gaps."
          />
          <KeyTerm
            term="Base address"
            def="The memory address where the array's very first element starts."
          />
          <KeyTerm
            term="Element size"
            def="How many bytes each element takes up — used to calculate any element's address."
          />
          <KeyTerm
            term="Shift"
            def="Moving elements over by one slot to open up or close a gap during insert/delete."
          />
          <KeyTerm
            term="Resize"
            def="Allocating a bigger block of memory and copying everything over, once the array runs out of room."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Look at the address shown under each cell — notice it's just base address + index ×
              element size.
            </Step>
            <Step>
              Set an insert value and position, then press "Start insert" and "Advance one shift"
              repeatedly to watch elements slide over one at a time.
            </Step>
            <Step>
              Try the same with delete — notice the shift happens in the opposite direction, closing
              the gap.
            </Step>
            <Step>
              Keep inserting past the array's capacity to trigger a resize, and watch every element
              get copied to a new block.
            </Step>
          </ol>
        </Section>

        <Section title="Contiguous storage and computed addresses">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 }}>
              Base address = {BASE_ADDRESS}, element size = {ELEMENT_SIZE} bytes. Capacity:{' '}
              {capacity} slots.
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: capacity }).map((_, i) => (
                <Cell
                  key={i}
                  value={i < arr.length ? arr[i] : null}
                  address={addressOf(i)}
                  ghost={i >= arr.length}
                  highlight={shiftingIndices.has(i) ? 'shift' : null}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12.5,
                color: COLORS.inkSoft,
                marginBottom: 16,
              }}
            >
              Address of index i = {BASE_ADDRESS} + i × {ELEMENT_SIZE}. E.g. index 3 →{' '}
              {BASE_ADDRESS} + 3×{ELEMENT_SIZE} = {addressOf(3)}.
            </div>

            {showResize && (
              <div
                style={{
                  background: COLORS.amberSoft,
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  marginBottom: 14,
                }}
              >
                Resize triggered! Capacity doubled to {capacity} — every existing element had to be
                copied into the new, bigger block.
              </div>
            )}

            <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Insert</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    value={insertValue}
                    onChange={(e) => setInsertValue(+e.target.value)}
                    style={{
                      width: 60,
                      padding: '5px 8px',
                      borderRadius: 5,
                      border: `1px solid ${COLORS.line}`,
                      fontSize: 12.5,
                    }}
                  />
                  <span style={{ fontSize: 12, color: COLORS.inkSoft }}>at index</span>
                  <input
                    type="number"
                    min={0}
                    max={arr.length}
                    value={insertIndex}
                    onChange={(e) =>
                      setInsertIndex(Math.max(0, Math.min(arr.length, +e.target.value)))
                    }
                    style={{
                      width: 50,
                      padding: '5px 8px',
                      borderRadius: 5,
                      border: `1px solid ${COLORS.line}`,
                      fontSize: 12.5,
                    }}
                  />
                  <Btn variant="primary" onClick={startInsert} disabled={!!opInProgress}>
                    Start insert
                  </Btn>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Delete</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: COLORS.inkSoft }}>index</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, arr.length - 1)}
                    value={deleteIndex}
                    onChange={(e) =>
                      setDeleteIndex(Math.max(0, Math.min(arr.length - 1, +e.target.value)))
                    }
                    style={{
                      width: 50,
                      padding: '5px 8px',
                      borderRadius: 5,
                      border: `1px solid ${COLORS.line}`,
                      fontSize: 12.5,
                    }}
                  />
                  <Btn
                    variant="primary"
                    onClick={startDelete}
                    disabled={!!opInProgress || arr.length === 0}
                  >
                    Start delete
                  </Btn>
                </div>
              </div>
            </div>

            {opInProgress && (
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 14,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {opInProgress.type === 'insert'
                  ? 'Shifting elements right to open a gap...'
                  : 'Shifting elements left to close the gap...'}{' '}
                (step {opInProgress.stage})
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="primary" onClick={advanceOp} disabled={!opInProgress}>
                Advance one shift
              </Btn>
              <Btn variant="ghost" onClick={resetOp}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> thinking insert/delete at the END of an array is also
              O(n). It's not — only inserting/deleting somewhere in the MIDDLE (or start) forces a
              shift. Adding to the end is O(1) as long as there's spare capacity.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
