/*
  CHAPTER: D5 — File Systems (Act 4: Operating Systems)
    Free Space Management (act4-d5-ch04-free-space-management)

  WHAT THIS DEMONSTRATES
    A bitmap of disk blocks (1=free) letting the student find a contiguous run at a
    glance; a free-list mode showing the same free blocks as a pointer chain
    instead, contrasting lookup speed.

  DESIGN DECISIONS
    - Both modes represent the EXACT SAME underlying free/used disk state, toggled
      via one shared source of truth, so the comparison is genuinely apples-to-apples
      rather than two separately-constructed examples that might not align.
    - "Find a contiguous run of 3 free blocks" is posed as an explicit timed task in
      both modes, since the actual payoff (bitmap: instant visual scan; free-list:
      must walk the chain) only lands when framed as a concrete task, not just shown passively.
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

// 1 = free, 0 = used. Contains one contiguous run of exactly 3 free blocks (positions 7,8,9).
const DISK_STATE = [0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0];
const TARGET_RUN_LENGTH = 3;

function findContiguousRun(state: number[], length: number): number {
  let count = 0;
  for (let i = 0; i < state.length; i++) {
    count = state[i] === 1 ? count + 1 : 0;
    if (count >= length) return i - length + 1;
  }
  return -1;
}

const RUN_START = findContiguousRun(DISK_STATE, TARGET_RUN_LENGTH);

function BitmapMode() {
  const [scanIdx, setScanIdx] = useState(-1);
  const [found, setFound] = useState(false);

  function scan() {
    if (scanIdx < DISK_STATE.length - 1) {
      setScanIdx((i) => i + 1);
      if (scanIdx + 1 === RUN_START + TARGET_RUN_LENGTH - 1) setFound(true);
    }
  }
  function reset() {
    setScanIdx(-1);
    setFound(false);
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Each bit represents one disk block: 1 means free, 0 means used. Task: find a run of{' '}
        {TARGET_RUN_LENGTH} consecutive free blocks.
      </p>
      <div style={{ display: 'flex', gap: 3, marginBottom: 14, flexWrap: 'wrap' }}>
        {DISK_STATE.map((bit, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 700,
              fontSize: 12,
              background:
                found && i >= RUN_START && i < RUN_START + TARGET_RUN_LENGTH
                  ? COLORS.tealSoft
                  : i <= scanIdx
                    ? COLORS.amberSoft
                    : COLORS.panel,
              border: `1.5px solid ${found && i >= RUN_START && i < RUN_START + TARGET_RUN_LENGTH ? COLORS.teal : i <= scanIdx ? COLORS.amber : COLORS.line}`,
            }}
          >
            {bit}
          </div>
        ))}
      </div>
      {found && (
        <div style={{ fontSize: 12.5, color: COLORS.teal, fontWeight: 600, marginBottom: 12 }}>
          Found it! Blocks {RUN_START}-{RUN_START + TARGET_RUN_LENGTH - 1} are all free — spotted in
          one visual scan of the bitmap.
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={scan} disabled={found}>
          Scan next bit
        </Btn>
        <Btn variant="ghost" onClick={reset}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

interface FreeNode {
  pos: number;
  next: number | null;
}
function buildFreeList(state: number[]): FreeNode[] {
  const freePositions = state.map((b, i) => (b === 1 ? i : -1)).filter((i) => i !== -1);
  return freePositions.map((pos, idx) => ({
    pos,
    next: idx + 1 < freePositions.length ? freePositions[idx + 1] : null,
  }));
}
const FREE_LIST = buildFreeList(DISK_STATE);

function FreeListMode() {
  const [chaseIdx, setChaseIdx] = useState(-1);
  const [foundStart, setFoundStart] = useState<number | null>(null);

  function chase() {
    if (chaseIdx + 1 >= FREE_LIST.length) return;
    const nextIdx = chaseIdx + 1;
    setChaseIdx(nextIdx);
    // check if this node and the next 2 in the LIST are physically contiguous
    if (nextIdx + TARGET_RUN_LENGTH - 1 < FREE_LIST.length) {
      const a = FREE_LIST[nextIdx].pos,
        b = FREE_LIST[nextIdx + 1].pos,
        c = FREE_LIST[nextIdx + 2].pos;
      if (b === a + 1 && c === a + 2) setFoundStart(a);
    }
  }
  function reset() {
    setChaseIdx(-1);
    setFoundStart(null);
  }

  const _visitedPositions = FREE_LIST.slice(0, chaseIdx + 1).map((n) => n.pos);

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        The exact same free blocks, represented instead as a linked chain — each free block points
        to the next free block, wherever it physically is.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {FREE_LIST.map((node, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 5,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                fontWeight: 700,
                background:
                  foundStart !== null &&
                  node.pos >= foundStart &&
                  node.pos < foundStart + TARGET_RUN_LENGTH
                    ? COLORS.tealSoft
                    : i <= chaseIdx
                      ? COLORS.amberSoft
                      : COLORS.panel,
                border: `1.5px solid ${foundStart !== null && node.pos >= foundStart && node.pos < foundStart + TARGET_RUN_LENGTH ? COLORS.teal : i <= chaseIdx ? COLORS.amber : COLORS.line}`,
              }}
            >
              block {node.pos}
            </div>
            {i < FREE_LIST.length - 1 && (
              <span style={{ color: COLORS.inkSoft, alignSelf: 'center' }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {foundStart !== null && (
        <div style={{ fontSize: 12.5, color: COLORS.teal, fontWeight: 600, marginBottom: 12 }}>
          Found it! Had to chase the chain and check each trio's physical positions — blocks{' '}
          {foundStart}-{foundStart + TARGET_RUN_LENGTH - 1} happen to be physically consecutive.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={chase} disabled={foundStart !== null}>
          Follow next pointer
        </Btn>
        <Btn variant="ghost" onClick={reset}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

export default function DiskBitmapVisualizer() {
  const [mode, setMode] = useState<'bitmap' | 'list'>('bitmap');

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
          File Systems · D5 (Act 4: OS)
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Free Space Management
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Two ways to track which disk blocks are free — with very different lookup speeds.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A file system needs to track which disk blocks are currently free, so it knows where new
            data can go. A <strong>bitmap</strong> uses one bit per block (1 = free, 0 = used) —
            scanning it lets you SEE patterns like "a run of 3 free blocks in a row" at a glance. A{' '}
            <strong>free list</strong> instead chains all the free blocks together like a linked
            list — simpler to update when a single block frees up, but finding a contiguous run
            means following the chain and checking each block's actual physical position, since the
            list order doesn't tell you anything about physical adjacency.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Bitmap"
            def="One bit per disk block, indicating free (1) or used (0) — lets patterns be spotted visually."
          />
          <KeyTerm
            term="Free list"
            def="Free blocks linked together in a chain, each pointing to the next free block."
          />
          <KeyTerm
            term="Contiguous run"
            def="Several free blocks that are physically next to each other on disk."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Both modes represent the SAME disk state — try finding a run of {TARGET_RUN_LENGTH}{' '}
              free blocks in a row in each.
            </Step>
            <Step>
              In bitmap mode, scan bit by bit and notice the pattern becomes visible as you go.
            </Step>
            <Step>
              In free-list mode, follow the chain and notice you have to check each block's actual
              POSITION, since chain order isn't physical order.
            </Step>
          </ol>
        </Section>

        <Section title="Find a contiguous run of free blocks">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Btn
                variant={mode === 'bitmap' ? 'primary' : 'default'}
                onClick={() => setMode('bitmap')}
              >
                Bitmap
              </Btn>
              <Btn
                variant={mode === 'list' ? 'primary' : 'default'}
                onClick={() => setMode('list')}
              >
                Free list
              </Btn>
            </div>
            {mode === 'bitmap' ? <BitmapMode /> : <FreeListMode />}

            <Callout>
              <strong>Common mistake:</strong> assuming a free list is always worse. It's actually
              cheaper to maintain when blocks are freed one at a time (just add to the chain) — the
              bitmap's advantage is specifically for finding contiguous runs quickly, not for every
              operation.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
