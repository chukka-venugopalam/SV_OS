/*
  CHAPTER: D5 — File Systems (Act 4: Operating Systems)
    File Allocation (act4-d5-ch02-file-allocation)

  WHAT THIS DEMONSTRATES
    Contiguous, linked, and indexed allocation shown side by side for the same file,
    with contiguous showing fast sequential read but fragmentation, linked showing
    slow random access via pointer-chasing, and indexed showing direct block lookup
    via an index block.

  DESIGN DECISIONS
    - All three methods are shown allocating the SAME example file (5 blocks) onto
      the SAME 12-block disk simultaneously, side by side, so the space/access
      tradeoffs are a direct visual comparison rather than three separate isolated
      demos the student has to mentally reconcile.
    - "Access block 3 of the file" is run as an explicit timed operation on all three
      layouts at once, since the SPEED difference (instant vs pointer-chase vs
      index-lookup) is the actual payoff and needs to be felt, not just described.
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

const DISK_SIZE = 12;
const _FILE_BLOCKS = 5; // "myfile.txt" needs 5 blocks

// Contiguous: blocks 2-6 (with pre-existing fragmentation elsewhere)
const CONTIGUOUS_LAYOUT = [
  null,
  'other',
  'F0',
  'F1',
  'F2',
  'F3',
  'F4',
  null,
  'other',
  null,
  null,
  'other',
];
// Linked: file blocks scattered, each pointing to the next
interface LinkedBlock {
  data: string;
  next: number | null;
}
const LINKED_BLOCKS: Record<number, LinkedBlock> = {
  1: { data: 'F0', next: 5 },
  5: { data: 'F1', next: 8 },
  8: { data: 'F2', next: 3 },
  3: { data: 'F3', next: 10 },
  10: { data: 'F4', next: null },
};
const LINKED_START = 1;
// Indexed: an index block at position 0 lists all 5 data block locations directly
const INDEX_BLOCK_POS = 0;
const INDEXED_DATA_BLOCKS = [4, 7, 2, 9, 11]; // where F0..F4 actually live

function DiskGrid({
  occupied,
  highlight,
}: {
  occupied: Record<number, string>;
  highlight: Set<number>;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
      {Array.from({ length: DISK_SIZE }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 32,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'ui-monospace, monospace',
            background: highlight.has(i)
              ? COLORS.amberSoft
              : occupied[i]
                ? COLORS.tealSoft
                : COLORS.panel,
            border: `1.5px solid ${highlight.has(i) ? COLORS.amber : occupied[i] ? COLORS.teal : COLORS.line}`,
            color: COLORS.ink,
          }}
        >
          {occupied[i] || i}
        </div>
      ))}
    </div>
  );
}

function ContiguousMode() {
  const [target, _setTarget] = useState(3); // access F3
  const [accessed, setAccessed] = useState(false);
  const occupied: Record<number, string> = {};
  CONTIGUOUS_LAYOUT.forEach((v, i) => {
    if (v) occupied[i] = v;
  });
  const targetBlockPos = CONTIGUOUS_LAYOUT.indexOf(`F${target}`);

  return (
    <div>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 12px' }}>
        File blocks stored back-to-back in one run.
      </p>
      <DiskGrid occupied={occupied} highlight={accessed ? new Set([targetBlockPos]) : new Set()} />
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace' }}>
        Access block F{target}:{' '}
        {accessed
          ? `direct jump to position ${targetBlockPos} = base + ${target}. INSTANT.`
          : 'not yet accessed'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn variant="primary" onClick={() => setAccessed(true)}>
          Access F{target} directly
        </Btn>
        <Btn variant="ghost" onClick={() => setAccessed(false)}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

function LinkedMode() {
  const [chaseIdx, setChaseIdx] = useState(0);
  const chain: number[] = [];
  let cur: number | null = LINKED_START;
  while (cur !== null) {
    chain.push(cur);
    cur = LINKED_BLOCKS[cur].next;
  }

  const occupied: Record<number, string> = {};
  chain.forEach((pos) => {
    occupied[pos] = LINKED_BLOCKS[pos].data;
  });

  const visited = new Set(chain.slice(0, chaseIdx + 1));

  return (
    <div>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 12px' }}>
        File blocks scattered anywhere, each storing a pointer to the next.
      </p>
      <DiskGrid occupied={occupied} highlight={visited} />
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace' }}>
        {chaseIdx === 0
          ? 'To reach block F3, must start at F0 and follow pointers one at a time.'
          : `Hop ${chaseIdx}: followed pointer to position ${chain[chaseIdx]} (${LINKED_BLOCKS[chain[chaseIdx]].data}). ${chaseIdx < 3 ? 'Not there yet — keep following.' : 'Reached F3 after chasing pointers through every earlier block!'}`}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn
          variant="primary"
          onClick={() => setChaseIdx((i) => Math.min(3, i + 1))}
          disabled={chaseIdx >= 3}
        >
          Follow next pointer
        </Btn>
        <Btn variant="ghost" onClick={() => setChaseIdx(0)}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

function IndexedMode() {
  const [accessed, setAccessed] = useState(false);
  const [target] = useState(3);
  const occupied: Record<number, string> = { [INDEX_BLOCK_POS]: 'IDX' };
  INDEXED_DATA_BLOCKS.forEach((pos, i) => {
    occupied[pos] = `F${i}`;
  });

  return (
    <div>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 12px' }}>
        One index block lists exactly where every data block lives.
      </p>
      <DiskGrid
        occupied={occupied}
        highlight={accessed ? new Set([INDEX_BLOCK_POS, INDEXED_DATA_BLOCKS[target]]) : new Set()}
      />
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace' }}>
        Access F{target}:{' '}
        {accessed
          ? `1) read index block, 2) look up entry ${target} → position ${INDEXED_DATA_BLOCKS[target]}, 3) jump directly there. Two lookups, but no chasing.`
          : 'not yet accessed'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn variant="primary" onClick={() => setAccessed(true)}>
          Access F{target} via index
        </Btn>
        <Btn variant="ghost" onClick={() => setAccessed(false)}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

export default function FileAllocationSim() {
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
          File Allocation Methods
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Three different ways to lay a file's data blocks out on disk — each with a different
          access-speed tradeoff.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A file is really just a collection of data blocks somewhere on disk — but HOW those
            blocks are organized and found again varies. <strong>Contiguous allocation</strong>{' '}
            stores all of a file's blocks back-to-back, so any block's location can be computed
            instantly, but it can suffer external fragmentation. <strong>Linked allocation</strong>{' '}
            scatters blocks anywhere, with each block storing a pointer to the next — flexible, but
            reaching block #4 means following 4 pointers one at a time.
            <strong> Indexed allocation</strong> keeps one separate index block listing every data
            block's location directly, giving direct access without needing contiguous storage.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Contiguous allocation"
            def="A file's blocks stored in one unbroken run of consecutive disk positions."
          />
          <KeyTerm
            term="Linked allocation"
            def="A file's blocks scattered anywhere, connected by pointers, like a linked list."
          />
          <KeyTerm
            term="Indexed allocation"
            def="A separate block that lists the exact location of every one of a file's data blocks."
          />
          <KeyTerm
            term="Random access"
            def="Jumping directly to a specific block in the middle of a file, without reading everything before it."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Each box below lays out the SAME 5-block file using a different method.</Step>
            <Step>
              Try accessing block F3 (the 4th block) in each — notice how differently each method
              gets there.
            </Step>
            <Step>
              Compare: contiguous jumps instantly, linked must chase pointers one at a time, indexed
              does one lookup then jumps.
            </Step>
          </ol>
        </Section>

        <Section title="Contiguous allocation">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <ContiguousMode />
          </div>
        </Section>

        <Section title="Linked allocation">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <LinkedMode />
          </div>
        </Section>

        <Section title="Indexed allocation">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <IndexedMode />
            <Callout>
              <strong>Common mistake:</strong> assuming indexed allocation is strictly better than
              both others. It has its own cost — the index block itself takes up an extra block of
              storage, and small files can waste a disproportionate amount of space on an index
              block for very little actual data.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
