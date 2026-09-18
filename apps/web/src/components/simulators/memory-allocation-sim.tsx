/*
  CHAPTER: D3 — Memory Management (Act 4: Operating Systems)
    Contiguous Allocation & Fragmentation (act4-d3-ch01-contiguous-allocation-fragmentation)

  WHAT THIS DEMONSTRATES
    Fixed partitioning showing internal fragmentation as wasted space inside a
    partition; dynamic partitioning showing external fragmentation as scattered
    unusable free blocks over repeated alloc/free cycles.

  DESIGN DECISIONS
    - Two clearly separate modes (fixed vs dynamic partitioning) since internal and
      external fragmentation are genuinely different phenomena with different root
      causes — conflating them would blur exactly what's being wasted and why.
    - Dynamic mode uses a scripted sequence of alloc/free operations (not free-form)
      specifically chosen to reliably produce visible external fragmentation, since
      random operations might not reliably demonstrate the point within a few steps.
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

// ============================= FIXED PARTITIONING (internal fragmentation) =============================

const FIXED_PARTITION_SIZE = 100;
const FIXED_REQUESTS = [60, 90, 35, 100];

function FixedMode() {
  const [idx, setIdx] = useState(0);
  const placed = FIXED_REQUESTS.slice(0, idx);

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Memory is divided into fixed-size partitions of {FIXED_PARTITION_SIZE}KB each. A process
        gets placed into ONE partition, no matter how much of it the process actually uses.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {placed.map((size, i) => {
          const wasted = FIXED_PARTITION_SIZE - size;
          return (
            <div key={i} style={{ width: 90 }}>
              <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginBottom: 4 }}>
                Partition {i + 1}
              </div>
              <div
                style={{
                  height: 100,
                  border: `1.5px solid ${COLORS.line}`,
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: `${size}%`,
                    background: COLORS.tealSoft,
                    borderTop: `1px solid ${COLORS.teal}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {size}KB used
                </div>
                {wasted > 0 && (
                  <div
                    style={{
                      height: `${wasted}%`,
                      background: COLORS.redSoft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: COLORS.red,
                      fontWeight: 700,
                    }}
                  >
                    {wasted}KB wasted
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {idx > 0 && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginBottom: 14 }}>
          Process needing {placed[placed.length - 1]}KB placed into a {FIXED_PARTITION_SIZE}KB
          partition
          {placed[placed.length - 1] < FIXED_PARTITION_SIZE &&
            ` — wastes ${FIXED_PARTITION_SIZE - placed[placed.length - 1]}KB of INTERNAL fragmentation (space inside the partition that no other process can use).`}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn
          variant="primary"
          onClick={() => setIdx((i) => Math.min(FIXED_REQUESTS.length, i + 1))}
          disabled={idx >= FIXED_REQUESTS.length}
        >
          Place next process ({idx < FIXED_REQUESTS.length ? FIXED_REQUESTS[idx] + 'KB' : 'done'})
        </Btn>
        <Btn variant="ghost" onClick={() => setIdx(0)}>
          Reset
        </Btn>
      </div>

      <Callout>
        <strong>Internal fragmentation:</strong> wasted space INSIDE an allocated partition — it
        belongs to a process but that process isn't using all of it, and no OTHER process can use it
        either.
      </Callout>
    </div>
  );
}

// ============================= DYNAMIC PARTITIONING (external fragmentation) =============================

interface Block {
  start: number;
  size: number;
  used: boolean;
  label?: string;
}
const TOTAL_MEM = 300;

type Op = { type: 'alloc'; label: string; size: number } | { type: 'free'; label: string };

const DYNAMIC_OPS: Op[] = [
  { type: 'alloc', label: 'A', size: 80 },
  { type: 'alloc', label: 'B', size: 60 },
  { type: 'alloc', label: 'C', size: 100 },
  { type: 'free', label: 'B' },
  { type: 'alloc', label: 'D', size: 50 },
  { type: 'free', label: 'A' },
];

function applyOps(ops: Op[], count: number): Block[] {
  let blocks: Block[] = [{ start: 0, size: TOTAL_MEM, used: false }];
  for (let i = 0; i < count; i++) {
    const op = ops[i];
    if (op.type === 'alloc') {
      const idx = blocks.findIndex((b) => !b.used && b.size >= op.size);
      if (idx === -1) continue;
      const b = blocks[idx];
      const newBlocks = [...blocks];
      newBlocks.splice(idx, 1, { start: b.start, size: op.size, used: true, label: op.label });
      if (b.size > op.size)
        newBlocks.splice(idx + 1, 0, {
          start: b.start + op.size,
          size: b.size - op.size,
          used: false,
        });
      blocks = newBlocks;
    } else {
      blocks = blocks.map((b) =>
        b.used && b.label === op.label ? { start: b.start, size: b.size, used: false } : b,
      );
    }
  }
  return blocks;
}

function DynamicMode() {
  const [opIdx, setOpIdx] = useState(0);
  const blocks = applyOps(DYNAMIC_OPS, opIdx);
  const freeBlocks = blocks.filter((b) => !b.used);
  const largestFree = Math.max(...freeBlocks.map((b) => b.size), 0);
  const totalFree = freeBlocks.reduce((s, b) => s + b.size, 0);

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Memory is allocated in exactly the size each process needs — no waste inside a partition.
        But as processes come and go, the FREED gaps end up scattered in small, disconnected pieces.
      </p>

      <div
        style={{
          display: 'flex',
          height: 60,
          borderRadius: 6,
          overflow: 'hidden',
          border: `1.5px solid ${COLORS.line}`,
          marginBottom: 12,
        }}
      >
        {blocks.map((b, i) => (
          <div
            key={i}
            style={{
              width: `${(b.size / TOTAL_MEM) * 100}%`,
              background: b.used ? COLORS.tealSoft : COLORS.panel,
              borderRight: i < blocks.length - 1 ? `1px solid ${COLORS.line}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            {b.used ? b.label : `${b.size}KB free`}
          </div>
        ))}
      </div>

      {opIdx > 0 && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginBottom: 14 }}>
          {(() => {
            const lastOp = DYNAMIC_OPS[opIdx - 1];
            return lastOp.type === 'alloc'
              ? `Allocated process ${lastOp.label} (${lastOp.size}KB)`
              : `Freed process ${lastOp.label}`;
          })()}
        </div>
      )}

      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>
        Total free memory: {totalFree}KB, spread across {freeBlocks.length} block(s). Largest single
        free block: {largestFree}KB.
        {freeBlocks.length > 1 && totalFree > largestFree && (
          <div style={{ color: COLORS.red, marginTop: 4, fontWeight: 600 }}>
            A process needing more than {largestFree}KB would FAIL to allocate, even though{' '}
            {totalFree}KB total is free — that's external fragmentation.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn
          variant="primary"
          onClick={() => setOpIdx((i) => Math.min(DYNAMIC_OPS.length, i + 1))}
          disabled={opIdx >= DYNAMIC_OPS.length}
        >
          Next operation{' '}
          {opIdx < DYNAMIC_OPS.length
            ? `(${DYNAMIC_OPS[opIdx].type} ${DYNAMIC_OPS[opIdx].label})`
            : ''}
        </Btn>
        <Btn variant="ghost" onClick={() => setOpIdx(0)}>
          Reset
        </Btn>
      </div>

      <Callout>
        <strong>External fragmentation:</strong> enough total free memory exists, but it's scattered
        into pieces too small individually to satisfy a new request — the waste is BETWEEN
        allocations, not inside them.
      </Callout>
    </div>
  );
}

export default function MemoryAllocationSim() {
  const [mode, setMode] = useState<'fixed' | 'dynamic'>('fixed');

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
          Memory Management · D3 (Act 4: OS)
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Memory Allocation &amp; Fragmentation
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Two ways memory gets wasted — inside a partition, or scattered between them.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            When the OS hands out memory to processes, some of that memory inevitably gets wasted —
            but the WAY it gets wasted depends on the allocation strategy. With{' '}
            <strong>fixed partitioning</strong>, memory is pre-divided into equal-sized chunks, and
            a process that doesn't need the whole chunk wastes the leftover space inside its own
            partition — <strong>internal fragmentation</strong>. With
            <strong> dynamic partitioning</strong>, each process gets exactly the size it asks for,
            but as processes are freed and re-allocated over time, the freed gaps become scattered
            small leftover pieces — <strong>external fragmentation</strong>.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Fixed partitioning"
            def="Memory pre-divided into equal-sized fixed chunks, one process per chunk."
          />
          <KeyTerm
            term="Dynamic partitioning"
            def="Memory allocated in exactly the size requested, with no pre-set chunk boundaries."
          />
          <KeyTerm
            term="Internal fragmentation"
            def="Wasted space INSIDE an allocated block — belongs to a process but goes unused."
          />
          <KeyTerm
            term="External fragmentation"
            def="Wasted space BETWEEN allocated blocks — free memory exists but is too scattered to be useful."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Switch between "fixed" and "dynamic" partitioning modes using the tabs below.
            </Step>
            <Step>
              In fixed mode, place processes one at a time and watch the wasted space inside each
              partition.
            </Step>
            <Step>
              In dynamic mode, step through a sequence of allocations and frees, and watch free
              space fragment into scattered pieces.
            </Step>
            <Step>
              Compare: fixed mode wastes space immediately and predictably; dynamic mode wastes
              space gradually and unpredictably.
            </Step>
          </ol>
        </Section>

        <Section title="Watch fragmentation happen">
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
                variant={mode === 'fixed' ? 'primary' : 'default'}
                onClick={() => setMode('fixed')}
              >
                Fixed partitioning
              </Btn>
              <Btn
                variant={mode === 'dynamic' ? 'primary' : 'default'}
                onClick={() => setMode('dynamic')}
              >
                Dynamic partitioning
              </Btn>
            </div>
            {mode === 'fixed' ? <FixedMode /> : <DynamicMode />}
          </div>
        </Section>
      </div>
    </div>
  );
}
