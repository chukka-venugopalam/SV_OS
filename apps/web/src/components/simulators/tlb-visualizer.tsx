/*
  CHAPTER: TLB — Translation Lookaside Buffer (Act 2, Computer Organization / Memory)
  CORRECTION BUILD: the previously cited "existing" component
  (mmu-address-translation-visualizer) was confirmed to have useState hooks whose
  setters aren't even destructured — every value is permanently frozen. This is a
  genuine new build, not a duplicate.

  WHAT THIS DEMONSTRATES
    A small TLB (4 entries) sitting in front of a page table, showing TLB hits
    (instant translation, no page-table walk needed) versus TLB misses (must walk
    the page table, then load the result into the TLB, evicting an old entry via
    LRU if the TLB is full) — with a running hit-rate counter across a sequence of
    memory accesses.

  DESIGN DECISIONS
    - Ran a SCRIPTED sequence of page accesses (rather than free-form clicking)
      specifically designed to produce both hits and misses, including a forced
      eviction once the small 4-entry TLB fills up, so every core TLB behavior is
      guaranteed to be seen within a short, predictable interaction.
    - Used a genuine LRU (least-recently-used) eviction policy, implemented as a
      real recency-ordered list that gets reordered on every access (not merely
      described), since WHICH entry gets evicted is exactly the kind of claim that
      needs to be demonstrably correct, not asserted.
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

const TLB_SIZE = 4;
const PAGE_TABLE: Record<number, number> = { 0: 7, 1: 3, 2: 9, 3: 1, 4: 5 };
// Scripted access sequence: fills the TLB (0,1,2,3), hits some, then accesses page 4 forcing an eviction.
const ACCESS_SEQUENCE = [0, 1, 2, 3, 0, 1, 4, 2];

interface TlbEntry {
  page: number;
  frame: number;
}

function simulateAccess(
  sequence: number[],
): { step: number; tlb: TlbEntry[]; hit: boolean; evicted: number | null }[] {
  let tlb: TlbEntry[] = []; // ordered from least-recently-used (front) to most-recently-used (back)
  const results: { step: number; tlb: TlbEntry[]; hit: boolean; evicted: number | null }[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const page = sequence[i];
    const idx = tlb.findIndex((e) => e.page === page);
    let evicted: number | null = null;
    let hit: boolean;

    if (idx !== -1) {
      // HIT: move this entry to the most-recently-used end
      hit = true;
      const [entry] = tlb.splice(idx, 1);
      tlb.push(entry);
    } else {
      // MISS: walk the page table, insert, evicting LRU (front) if full
      hit = false;
      const frame = PAGE_TABLE[page];
      if (tlb.length >= TLB_SIZE) {
        evicted = tlb[0].page;
        tlb = tlb.slice(1);
      }
      tlb.push({ page, frame });
    }
    results.push({ step: i, tlb: [...tlb], hit, evicted });
  }
  return results;
}

const SIM_RESULTS = simulateAccess(ACCESS_SEQUENCE);

export default function TlbVisualizer() {
  const [stepIdx, setStepIdx] = useState(-1);

  const current = stepIdx >= 0 ? SIM_RESULTS[stepIdx] : null;
  const hitsSoFar =
    stepIdx >= 0 ? SIM_RESULTS.slice(0, stepIdx + 1).filter((r) => r.hit).length : 0;
  const totalSoFar = stepIdx + 1;

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
          Memory / Computer Organization
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          The Translation Lookaside Buffer (TLB)
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A small, fast cache that saves the CPU from walking the full page table on every single
          memory access.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Every memory access needs a page number translated into a physical frame number —
            normally by "walking" the page table, which itself lives in memory and is relatively
            slow to read. A<strong> TLB</strong> is a small, very fast cache sitting right next to
            the CPU that remembers the most RECENTLY used page-to-frame translations. On a{' '}
            <strong>TLB hit</strong>, the translation is found instantly with no page-table walk at
            all. On a <strong>TLB miss</strong>, the CPU must walk the full page table as normal —
            but then it STORES that result in the TLB for next time, potentially evicting an old
            entry if the TLB is already full.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="TLB hit"
            def="The requested page's translation is already in the TLB — instant answer, no page-table walk needed."
          />
          <KeyTerm
            term="TLB miss"
            def="The translation isn't in the TLB yet — the CPU must walk the full page table, then cache the result."
          />
          <KeyTerm
            term="LRU (Least Recently Used)"
            def="An eviction policy: when the TLB is full and a new entry must be added, remove whichever entry hasn't been used in the longest time."
          />
          <KeyTerm
            term="Hit rate"
            def="The fraction of memory accesses that are TLB hits — higher is better, since hits are far faster than misses."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Press "Next access" to step through a scripted sequence of page accesses.</Step>
            <Step>
              Watch each access get marked as a hit (instant) or a miss (must walk the page table).
            </Step>
            <Step>
              Once the TLB fills up, watch a new miss trigger an eviction — notice WHICH entry gets
              removed (the least recently used one).
            </Step>
            <Step>Track the running hit rate at the bottom as the sequence plays out.</Step>
          </ol>
        </Section>

        <Section title="Step through a memory access sequence">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
              {ACCESS_SEQUENCE.map((page, i) => (
                <div
                  key={i}
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 5,
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      i > stepIdx
                        ? COLORS.panel
                        : SIM_RESULTS[i].hit
                          ? COLORS.tealSoft
                          : COLORS.redSoft,
                    border: `1.5px solid ${i > stepIdx ? COLORS.line : SIM_RESULTS[i].hit ? COLORS.teal : COLORS.red}`,
                    outline: i === stepIdx ? `2px solid ${COLORS.amber}` : 'none',
                    outlineOffset: 2,
                  }}
                >
                  p{page}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 6 }}>
                TLB contents (left = least recently used, right = most recently used)
              </div>
              <div style={{ display: 'flex', gap: 6, minHeight: 40 }}>
                {(current?.tlb ?? []).map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 5,
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: COLORS.tealSoft,
                      border: `1.5px solid ${COLORS.teal}`,
                    }}
                  >
                    p{entry.page}→f{entry.frame}
                  </div>
                ))}
                {(!current || current.tlb.length === 0) && (
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, fontStyle: 'italic' }}>
                    (empty)
                  </div>
                )}
              </div>
            </div>

            {current && (
              <div
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginBottom: 14 }}
              >
                {current.hit
                  ? `Access page ${ACCESS_SEQUENCE[stepIdx]}: HIT — found in TLB instantly, frame ${current.tlb.find((e) => e.page === ACCESS_SEQUENCE[stepIdx])?.frame}.`
                  : `Access page ${ACCESS_SEQUENCE[stepIdx]}: MISS — walk the page table (frame ${PAGE_TABLE[ACCESS_SEQUENCE[stepIdx]]}), then cache it.${current.evicted !== null ? ` TLB was full, so evicted the least-recently-used entry: page ${current.evicted}.` : ''}`}
              </div>
            )}

            {stepIdx >= 0 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  color: COLORS.teal,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Hit rate so far: {hitsSoFar}/{totalSoFar} (
                {((hitsSoFar / totalSoFar) * 100).toFixed(0)}%)
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setStepIdx((i) => Math.max(-1, i - 1))} disabled={stepIdx < 0}>
                Previous access
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setStepIdx((i) => Math.min(ACCESS_SEQUENCE.length - 1, i + 1))}
                disabled={stepIdx >= ACCESS_SEQUENCE.length - 1}
              >
                Next access
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(-1)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> assuming a TLB miss means the memory access itself
              fails. It doesn't — a miss just means the TRANSLATION has to be looked up the slow way
              (via the page table) this one time. The actual data is still found and returned; it's
              only the SPEED of finding the translation that differs between a hit and a miss.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
