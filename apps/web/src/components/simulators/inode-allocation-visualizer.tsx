/*
  CHAPTER: D5 — File Systems (Act 4: Operating Systems)
    Inodes & Unix File System (act4-d5-ch03-inodes-unix-file-system)

  WHAT THIS DEMONSTRATES
    An inode's direct pointers reaching data blocks directly, then a single-indirect
    pointer reaching a block full of more pointers for larger files; show a
    directory entry mapping a filename to an inode number, and two names (hard
    links) pointing at the same inode.

  DESIGN DECISIONS
    - Uses a small inode (4 direct pointers + 1 single-indirect pointer holding up
      to 4 more) so a file can be shown BOTH small (using only direct pointers) and
      large enough to need the indirect block, within the same visual scale.
    - Hard links are shown as two SEPARATE directory entries pointing at the SAME
      inode number, with the inode's own link-count field visibly incrementing, since
      "two names, one file" is exactly the kind of claim that benefits from a
      concrete counter rather than just an assertion.
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

const DIRECT_CAPACITY = 4;
const INDIRECT_CAPACITY = 4;

function InodeMode() {
  const [fileSize, setFileSize] = useState(2); // number of data blocks the file needs

  const directUsed = Math.min(fileSize, DIRECT_CAPACITY);
  const overflow = Math.max(0, fileSize - DIRECT_CAPACITY);
  const needsIndirect = overflow > 0;
  const indirectUsed = Math.min(overflow, INDIRECT_CAPACITY);

  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}>
        File size (data blocks needed): {fileSize}
      </label>
      <input
        type="range"
        min={1}
        max={8}
        value={fileSize}
        onChange={(e) => setFileSize(+e.target.value)}
        style={{ width: 200, marginBottom: 18 }}
      />

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6 }}>Inode</div>
          <div
            style={{ border: `2px solid ${COLORS.ink}`, borderRadius: 6, padding: 10, width: 110 }}
          >
            <div style={{ fontSize: 9.5, color: COLORS.inkSoft, marginBottom: 6 }}>
              metadata (size, owner, permissions...)
            </div>
            {Array.from({ length: DIRECT_CAPACITY }).map((_, i) => (
              <div
                key={i}
                style={{
                  fontSize: 10,
                  padding: '3px 6px',
                  marginBottom: 3,
                  borderRadius: 3,
                  background: i < directUsed ? COLORS.tealSoft : COLORS.panel,
                  border: `1px solid ${i < directUsed ? COLORS.teal : COLORS.line}`,
                }}
              >
                direct[{i}] {i < directUsed ? `→ block D${i}` : ''}
              </div>
            ))}
            <div
              style={{
                fontSize: 10,
                padding: '3px 6px',
                borderRadius: 3,
                background: needsIndirect ? COLORS.amberSoft : COLORS.panel,
                border: `1px solid ${needsIndirect ? COLORS.amber : COLORS.line}`,
              }}
            >
              indirect {needsIndirect ? '→ index block' : '(unused)'}
            </div>
          </div>
        </div>

        {needsIndirect && (
          <>
            <div style={{ alignSelf: 'center', fontSize: 18, color: COLORS.inkSoft }}>→</div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6 }}>
                Single-indirect block
              </div>
              <div
                style={{
                  border: `2px solid ${COLORS.amber}`,
                  borderRadius: 6,
                  padding: 10,
                  width: 110,
                }}
              >
                {Array.from({ length: INDIRECT_CAPACITY }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: '3px 6px',
                      marginBottom: 3,
                      borderRadius: 3,
                      background: i < indirectUsed ? COLORS.tealSoft : COLORS.panel,
                      border: `1px solid ${i < indirectUsed ? COLORS.teal : COLORS.line}`,
                    }}
                  >
                    ptr[{i}] {i < indirectUsed ? `→ block I${i}` : ''}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 16 }}>
        {fileSize <= DIRECT_CAPACITY
          ? `This file fits entirely using ${directUsed} direct pointer(s) — no indirect block needed at all.`
          : `This file needs all ${DIRECT_CAPACITY} direct pointers PLUS the indirect block, which itself points to ${indirectUsed} more data block(s) — reaching ${fileSize} blocks total via one extra layer of indirection.`}
      </div>

      <Callout>
        <strong>Common mistake:</strong> thinking the indirect pointer points directly at file data.
        It doesn't — it points at ANOTHER block that's entirely full of more pointers, which THEN
        point at the actual data. That's one extra hop of indirection, which is exactly why it's
        called "indirect."
      </Callout>
    </div>
  );
}

interface DirEntry {
  name: string;
  inode: number;
}

function HardLinkMode() {
  const [entries, setEntries] = useState<DirEntry[]>([{ name: 'report.txt', inode: 42 }]);
  const [linkCount, setLinkCount] = useState(1);

  function addHardLink() {
    setEntries((e) => [...e, { name: 'backup_report.txt', inode: 42 }]);
    setLinkCount((c) => c + 1);
  }
  function reset() {
    setEntries([{ name: 'report.txt', inode: 42 }]);
    setLinkCount(1);
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        A directory doesn't store file data directly — it just maps a NAME to an inode number.
        Multiple different names can point at the exact same inode — that's a hard link.
      </p>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6 }}>
            Directory entries
          </div>
          {entries.map((e, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '6px 10px',
                background: COLORS.tealSoft,
                border: `1.5px solid ${COLORS.teal}`,
                borderRadius: 5,
                marginBottom: 6,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
              }}
            >
              <span>{e.name}</span>
              <span style={{ color: COLORS.inkSoft }}>→ inode {e.inode}</span>
            </div>
          ))}
        </div>
        <div style={{ alignSelf: 'center', fontSize: 18, color: COLORS.inkSoft }}>→</div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6 }}>
            Inode 42 (the actual file)
          </div>
          <div
            style={{ border: `2px solid ${COLORS.ink}`, borderRadius: 6, padding: 12, width: 160 }}
          >
            <div style={{ fontSize: 11, marginBottom: 4 }}>
              Link count: <strong style={{ color: COLORS.teal }}>{linkCount}</strong>
            </div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft }}>
              File data lives here, only once — regardless of how many names point to it.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Btn variant="primary" onClick={addHardLink} disabled={entries.length >= 2}>
          Create a hard link ("backup_report.txt")
        </Btn>
        <Btn variant="ghost" onClick={reset}>
          Reset
        </Btn>
      </div>

      <Callout>
        <strong>Common mistake:</strong> thinking a hard link is a COPY of the file. It's not — both
        names point at the exact same inode and the exact same data blocks. Editing the file through
        either name changes the same underlying data, and the file's data isn't actually deleted
        until the link count drops to zero.
      </Callout>
    </div>
  );
}

export default function InodeAllocationVisualizer() {
  const [mode, setMode] = useState<'inode' | 'link'>('inode');

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
          Inodes &amp; the Unix File System
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How Unix-style file systems track a file's data blocks — and how one file can have two
          names.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            An <strong>inode</strong> is a data structure holding everything about a file EXCEPT its
            name — size, permissions, and crucially, pointers to where its actual data blocks live.
            A small file's inode can point directly at its data blocks using a handful of{' '}
            <strong>direct pointers</strong>. A larger file that needs more blocks than direct
            pointers allow uses a <strong>single-indirect pointer</strong> instead — pointing at
            ANOTHER block that's entirely full of more pointers. Separately, a directory just maps
            filenames to inode numbers — which means multiple filenames (a
            <strong> hard link</strong>) can point at the exact same inode and underlying data.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Inode"
            def="A structure storing a file's metadata and data-block pointers — everything except its name."
          />
          <KeyTerm
            term="Direct pointer"
            def="A pointer in the inode that points straight at one of the file's actual data blocks."
          />
          <KeyTerm
            term="Single-indirect pointer"
            def="A pointer to ANOTHER block that itself holds more pointers to data blocks — one extra hop."
          />
          <KeyTerm
            term="Hard link"
            def="A second directory entry (a different filename) pointing at the SAME inode as an existing file."
          />
          <KeyTerm
            term="Link count"
            def="How many directory entries currently point at a given inode."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              In inode mode, drag the file size slider and watch when the indirect block gets used.
            </Step>
            <Step>
              Switch to hard link mode and press "Create a hard link" to add a second name pointing
              at the same inode.
            </Step>
            <Step>
              Watch the link count increase — the underlying file data never gets duplicated.
            </Step>
          </ol>
        </Section>

        <Section title="See it in action">
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
                variant={mode === 'inode' ? 'primary' : 'default'}
                onClick={() => setMode('inode')}
              >
                Inode pointers
              </Btn>
              <Btn
                variant={mode === 'link' ? 'primary' : 'default'}
                onClick={() => setMode('link')}
              >
                Hard links
              </Btn>
            </div>
            {mode === 'inode' ? <InodeMode /> : <HardLinkMode />}
          </div>
        </Section>
      </div>
    </div>
  );
}
