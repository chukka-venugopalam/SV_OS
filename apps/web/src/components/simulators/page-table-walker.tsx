/*
  CHAPTER: D3 — Memory Management (Act 4: Operating Systems)
    Paging & Page Tables (act4-d3-ch02-paging-page-tables)
    NOTE: spec says to verify mmu-address-translation-visualizer (already built for
    TLB) doesn't already cover this before building separately — user has opted to
    build this now and will dedupe against the existing component themselves.

  WHAT THIS DEMONSTRATES
    A logical address splitting into page number + offset, walking the page table
    to find the frame, then computing the physical address — with pages mapped to
    non-contiguous frames.

  DESIGN DECISIONS
    - Uses small numbers (16-bit logical address space, 4 pages, 8 frames, tiny page
      size) so every bit and every table entry is visible and hand-checkable, rather
      than realistic 32/64-bit sizes which would be unreadable and unnecessary for
      the concept being taught.
    - Page table entries are deliberately mapped to NON-sequential frames (page 0
      isn't in frame 0, etc.) since demonstrating that pages do NOT need contiguous
      physical frames is a key part of what makes paging different from earlier
      contiguous allocation schemes.
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

// Setup: page size = 16 bytes (4 bits offset), 4 pages (2 bits page number) => 6-bit logical address.
// Page table maps pages to NON-sequential frames to show pages don't need contiguous physical memory.
const OFFSET_BITS = 4;
const PAGE_BITS = 2;
const PAGE_SIZE = 1 << OFFSET_BITS; // 16
const PAGE_TABLE: number[] = [5, 2, 7, 0]; // page 0 -> frame 5, page 1 -> frame 2, page 2 -> frame 7, page 3 -> frame 0

function toBinary(n: number, bits: number): string {
  return n.toString(2).padStart(bits, '0');
}

export default function PageTableWalker() {
  const [logicalAddr, setLogicalAddr] = useState(21); // example: page 1, offset 5
  const [step, setStep] = useState(0);

  const totalBits = PAGE_BITS + OFFSET_BITS;
  const clamped = Math.max(0, Math.min((1 << totalBits) - 1, logicalAddr));
  const pageNumber = clamped >> OFFSET_BITS;
  const offset = clamped & (PAGE_SIZE - 1);
  const frameNumber = PAGE_TABLE[pageNumber];
  const physicalAddr = frameNumber * PAGE_SIZE + offset;

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
          Paging &amp; Page Tables
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How a program's "fake" addresses get translated into real physical memory locations.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Every program thinks it has its own private, continuous block of memory — these are
            <strong> logical addresses</strong>. But behind the scenes, that logical memory is
            chopped into fixed-size <strong>pages</strong>, and each page can be stored ANYWHERE in
            physical memory, in chunks called <strong>frames</strong> — not necessarily in order,
            and not necessarily next to each other. A <strong>page table</strong> is the lookup map
            the OS uses to translate "which frame is page 2 actually stored in?" Converting a
            logical address to a physical one means splitting it into a page number and an offset,
            looking up the frame, then recombining.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Logical address"
            def="The address a program uses, from its own private point of view — not the real physical location."
          />
          <KeyTerm
            term="Physical address"
            def="The REAL location in physical RAM where data actually lives."
          />
          <KeyTerm term="Page" def="A fixed-size chunk of a program's logical memory." />
          <KeyTerm
            term="Frame"
            def="A fixed-size chunk of physical memory — exactly the same size as a page, so any page can fit in any frame."
          />
          <KeyTerm
            term="Offset"
            def="The position WITHIN a page/frame — this part of the address never changes during translation."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Enter a logical address (0 to {(1 << totalBits) - 1}) below.</Step>
            <Step>Press "Step forward" to watch it split into a page number and an offset.</Step>
            <Step>Watch the page table get looked up to find which frame that page lives in.</Step>
            <Step>
              See the final physical address get computed by combining the frame number with the
              SAME offset.
            </Step>
          </ol>
        </Section>

        <Section
          title={`Translate a logical address (${totalBits}-bit address space, ${PAGE_SIZE}-byte pages)`}
        >
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <label
              style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
            >
              Logical address (decimal, 0-{(1 << totalBits) - 1})
            </label>
            <input
              type="number"
              min={0}
              max={(1 << totalBits) - 1}
              value={logicalAddr}
              onChange={(e) => {
                setLogicalAddr(
                  Math.max(0, Math.min((1 << totalBits) - 1, parseInt(e.target.value || '0', 10))),
                );
                setStep(0);
              }}
              style={{
                width: 80,
                padding: '6px 10px',
                borderRadius: 5,
                border: `1px solid ${COLORS.line}`,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                marginBottom: 16,
              }}
            />

            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginBottom: 16 }}>
              Binary: {toBinary(clamped, totalBits)} ={' '}
              <span style={{ color: COLORS.teal, fontWeight: 700 }}>
                {toBinary(pageNumber, PAGE_BITS)}
              </span>{' '}
              (page) +{' '}
              <span style={{ color: COLORS.amber, fontWeight: 700 }}>
                {toBinary(offset, OFFSET_BITS)}
              </span>{' '}
              (offset)
            </div>

            {step >= 1 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  lineHeight: 1.9,
                  marginBottom: 14,
                }}
              >
                <div>
                  Step 1 — split the address: page number = {pageNumber}, offset = {offset}
                </div>
              </div>
            )}

            {step >= 2 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                  Step 2 — look up page {pageNumber} in the page table:
                </div>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    fontSize: 12.5,
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: '3px 12px',
                          borderBottom: `2px solid ${COLORS.line}`,
                          textAlign: 'left',
                        }}
                      >
                        Page #
                      </th>
                      <th
                        style={{
                          padding: '3px 12px',
                          borderBottom: `2px solid ${COLORS.line}`,
                          textAlign: 'left',
                        }}
                      >
                        Frame #
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAGE_TABLE.map((frame, p) => (
                      <tr
                        key={p}
                        style={{ background: p === pageNumber ? COLORS.amberSoft : 'transparent' }}
                      >
                        <td style={{ padding: '3px 12px' }}>{p}</td>
                        <td style={{ padding: '3px 12px' }}>{frame}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
                  Notice the frames aren't in page order — page 3 maps to frame 0, and page 0 maps
                  to frame 5. Pages don't need contiguous physical storage.
                </div>
              </div>
            )}

            {step >= 3 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  marginBottom: 14,
                }}
              >
                <div>
                  Step 3 — recombine: physical address = (frame {frameNumber} × page size{' '}
                  {PAGE_SIZE}) + offset {offset} = {frameNumber * PAGE_SIZE} + {offset}
                </div>
                <div style={{ color: COLORS.teal, fontWeight: 700 }}>
                  Physical address = {physicalAddr}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={step >= 3}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> thinking the OFFSET gets translated too. It doesn't —
              the offset stays EXACTLY the same number in both the logical and physical address.
              Only the page number changes (into a frame number); the offset just tells you where
              within that chunk to look, and that position doesn't move.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
