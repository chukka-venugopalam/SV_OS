/*
  CHAPTER: D3 — Memory Management (Act 4: Operating Systems)
    Segmentation (act4-d3-ch04-segmentation)

  WHAT THIS DEMONSTRATES
    A (segment, offset) address checked against a segment table's base+limit,
    flagging an out-of-bounds access; show variable-sized segments causing external
    fragmentation over time.

  DESIGN DECISIONS
    - The bounds-check is shown as an explicit comparison (offset vs limit) with a
      pass/fail readout, since "how does the OS actually catch an invalid access" is
      the mechanical detail that's easy to hand-wave without a concrete numeric check.
    - Reuses the same visual fragmentation language as the memory-allocation-sim
      tool (scattered free blocks) since segmentation causes the exact same external
      fragmentation phenomenon as dynamic partitioning, for the same underlying reason
      (variable-sized allocations).
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

interface Segment {
  name: string;
  base: number;
  limit: number;
}
const SEGMENT_TABLE: Segment[] = [
  { name: 'Code', base: 1000, limit: 400 },
  { name: 'Stack', base: 1600, limit: 150 },
  { name: 'Heap', base: 2200, limit: 300 },
];

export default function SegmentMapVisualizer() {
  const [segIdx, setSegIdx] = useState(0);
  const [offset, setOffset] = useState(50);
  const [step, setStep] = useState(0);

  const segment = SEGMENT_TABLE[segIdx];
  const inBounds = offset < segment.limit;
  const physicalAddr = segment.base + offset;

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
          Segmentation
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Dividing memory by MEANING (code, stack, heap) instead of by fixed-size chunks — with
          built-in bounds checking.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Segmentation divides a program's memory into logically meaningful pieces — like "code,"
            "stack," and "heap" — each of a DIFFERENT size, matching how the programmer actually
            thinks about their program. Each segment has a <strong>base</strong> (where it starts in
            physical memory) and a <strong>limit</strong>
            (how big it's allowed to be). An address is given as (segment, offset). Before allowing
            access, the hardware checks the offset against the segment's limit — if the offset is
            too large, that's an
            <strong> out-of-bounds access</strong>, caught immediately instead of silently
            corrupting other memory.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Segment"
            def="A variable-sized, logically meaningful chunk of memory (like code, stack, or heap)."
          />
          <KeyTerm term="Base" def="The starting physical address of a segment." />
          <KeyTerm
            term="Limit"
            def="The maximum allowed offset within a segment — anything beyond this is invalid."
          />
          <KeyTerm
            term="Bounds check"
            def="Comparing a requested offset against the segment's limit before allowing the access."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Pick a segment and enter an offset within it.</Step>
            <Step>
              Press "Step forward" to see the offset checked against that segment's limit.
            </Step>
            <Step>
              Try an offset LARGER than the limit and watch it get flagged as out-of-bounds instead
              of silently computing a wrong address.
            </Step>
            <Step>
              Try a valid offset and see the physical address get computed as base + offset.
            </Step>
          </ol>
        </Section>

        <Section title="Segment table">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <table
              style={{
                borderCollapse: 'collapse',
                fontSize: 12.5,
                fontFamily: 'ui-monospace, monospace',
                marginBottom: 8,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '4px 12px',
                      borderBottom: `2px solid ${COLORS.line}`,
                      textAlign: 'left',
                    }}
                  >
                    Segment
                  </th>
                  <th
                    style={{
                      padding: '4px 12px',
                      borderBottom: `2px solid ${COLORS.line}`,
                      textAlign: 'left',
                    }}
                  >
                    Base
                  </th>
                  <th
                    style={{
                      padding: '4px 12px',
                      borderBottom: `2px solid ${COLORS.line}`,
                      textAlign: 'left',
                    }}
                  >
                    Limit
                  </th>
                </tr>
              </thead>
              <tbody>
                {SEGMENT_TABLE.map((s, i) => (
                  <tr
                    key={i}
                    style={{ background: i === segIdx ? COLORS.amberSoft : 'transparent' }}
                  >
                    <td style={{ padding: '4px 12px' }}>{s.name}</td>
                    <td style={{ padding: '4px 12px' }}>{s.base}</td>
                    <td style={{ padding: '4px 12px' }}>{s.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Translate a (segment, offset) address">
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
                gap: 16,
                marginBottom: 16,
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  Segment
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SEGMENT_TABLE.map((s, i) => (
                    <Btn
                      key={i}
                      variant={segIdx === i ? 'primary' : 'default'}
                      onClick={() => {
                        setSegIdx(i);
                        setStep(0);
                      }}
                    >
                      {s.name}
                    </Btn>
                  ))}
                </div>
              </div>
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  Offset
                </label>
                <input
                  type="number"
                  value={offset}
                  onChange={(e) => {
                    setOffset(parseInt(e.target.value || '0', 10));
                    setStep(0);
                  }}
                  style={{
                    width: 80,
                    padding: '6px 10px',
                    borderRadius: 5,
                    border: `1px solid ${COLORS.line}`,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            {step >= 1 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  marginBottom: 8,
                }}
              >
                <div>
                  Step 1 — bounds check: is offset ({offset}) {'<'} limit ({segment.limit})?
                </div>
                <div style={{ color: inBounds ? COLORS.teal : COLORS.red, fontWeight: 700 }}>
                  {inBounds
                    ? '✓ Yes — within bounds.'
                    : '✗ No — OUT OF BOUNDS. Access denied (this would trigger a segmentation fault).'}
                </div>
              </div>
            )}

            {step >= 2 && inBounds && (
              <div
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, marginBottom: 14 }}
              >
                Step 2 — compute physical address: base ({segment.base}) + offset ({offset}) ={' '}
                <strong style={{ color: COLORS.teal }}>{physicalAddr}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setStep((s) => Math.min(inBounds ? 2 : 1, s + 1))}
                disabled={step >= (inBounds ? 2 : 1)}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> confusing "limit" with "the last valid address." The
              limit is a SIZE — a valid offset must be strictly LESS than the limit (offset 0
              through limit−1), not less-than-or-equal-to it. This off-by-one distinction matters
              for exactly where the boundary sits.
            </Callout>
          </div>
        </Section>

        <Section title="Variable segment sizes also cause external fragmentation">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, margin: 0 }}>
              Because segments (like the ones above) can be any size, freeing and re-allocating them
              over time causes the exact same problem as dynamic partitioning: leftover gaps between
              segments end up scattered around physical memory, potentially too small individually
              to fit a new segment even though enough total free space exists. This is the same
              external fragmentation phenomenon covered in the dynamic partitioning tool —
              segmentation doesn't avoid it, since it's still allocating variable-sized chunks.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
