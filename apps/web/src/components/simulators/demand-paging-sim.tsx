/*
  CHAPTER: D3 — Memory Management (Act 4: Operating Systems)
    Virtual Memory & Demand Paging (act4-d3-ch05-virtual-memory-demand-paging)

  WHAT THIS DEMONSTRATES
    A page reference to a not-yet-loaded page triggering a page fault, OS
    finds/evicts a frame, loads from disk, updates the page table, restarts the
    instruction — animate the full fault-handling sequence.

  DESIGN DECISIONS
    - The full fault sequence is broken into explicit named stages (not a single
      "loading..." animation) since each stage is a distinct, testable concept
      students need to be able to name and order correctly.
    - Includes an eviction sub-step even in the simple case (with an obviously-empty
      frame available) AND a forced-eviction case (all frames full) as two separate
      scenarios, since "what happens when there's no free frame" is a common point
      of confusion that a single always-has-room scenario would never surface.
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

interface FaultStage {
  label: string;
  detail: string;
}

const STAGES_WITH_FREE_FRAME: FaultStage[] = [
  {
    label: '1. Process references page 3',
    detail: 'The CPU tries to access a memory address that falls on page 3.',
  },
  {
    label: '2. Page table checked — not present!',
    detail:
      'Page 3\'s page table entry has a "not present" flag set — it\'s not currently loaded into physical memory. This triggers a PAGE FAULT (a hardware trap into the OS).',
  },
  {
    label: '3. OS finds a free frame',
    detail:
      'The OS checks its list of physical frames and finds frame 2 is empty — no eviction needed this time.',
  },
  {
    label: '4. Load page from disk',
    detail:
      "The OS issues a disk read to load page 3's actual data from the swap file / disk into frame 2. This is relatively slow — disk I/O takes far longer than a memory access.",
  },
  {
    label: '5. Update the page table',
    detail: "Page 3's page table entry is updated: now marked present, pointing at frame 2.",
  },
  {
    label: '6. Restart the instruction',
    detail:
      'The CPU instruction that originally caused the fault is restarted from scratch — this time, page 3 IS present, so it succeeds normally.',
  },
];

const STAGES_WITH_EVICTION: FaultStage[] = [
  {
    label: '1. Process references page 5',
    detail: 'The CPU tries to access a memory address that falls on page 5.',
  },
  {
    label: '2. Page table checked — not present!',
    detail: "Page 5 isn't loaded — PAGE FAULT triggered.",
  },
  {
    label: '3. OS checks for a free frame — NONE available',
    detail:
      'All physical frames are currently occupied by other pages. The OS must pick a VICTIM page to evict first.',
  },
  {
    label: '4. Evict a victim page (page 1 chosen)',
    detail:
      'Using a replacement policy (like picking the least-recently-used page), the OS selects page 1 to evict. If page 1 was modified, its data gets written back to disk first.',
  },
  {
    label: '5. Load page 5 into the now-free frame',
    detail: "With frame 0 now empty, the OS reads page 5's data from disk into it.",
  },
  {
    label: '6. Update both page table entries',
    detail:
      'Page 1\'s entry is marked "not present" again; page 5\'s entry is marked present, pointing to frame 0.',
  },
  {
    label: '7. Restart the instruction',
    detail: 'The original instruction retries — page 5 is now present, so it succeeds.',
  },
];

function FaultTrace({ stages }: { stages: FaultStage[] }) {
  const [idx, setIdx] = useState(0);
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        {stages.map((s, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              background: i === idx ? COLORS.amberSoft : i < idx ? COLORS.tealSoft : COLORS.panel,
              border: `1.5px solid ${i === idx ? COLORS.amber : i < idx ? COLORS.teal : 'transparent'}`,
              opacity: i <= idx ? 1 : 0.5,
            }}
          >
            <div style={{ fontWeight: 700, color: COLORS.ink, marginBottom: i === idx ? 4 : 0 }}>
              {s.label}
            </div>
            {i === idx && <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>{s.detail}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
          Step back
        </Btn>
        <Btn
          variant="primary"
          onClick={() => setIdx((i) => Math.min(stages.length - 1, i + 1))}
          disabled={idx >= stages.length - 1}
        >
          Step forward
        </Btn>
        <Btn variant="ghost" onClick={() => setIdx(0)}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

export default function DemandPagingSim() {
  const [scenario, setScenario] = useState<'free' | 'evict'>('free');

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
          Virtual Memory &amp; Demand Paging
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How the OS lets programs use more memory than physically exists, loading pages only when
          actually needed.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            <strong>Demand paging</strong> means pages of a program are only loaded into physical
            memory when they're actually accessed — not all upfront. If a program touches a page
            that isn't currently loaded, the hardware triggers a <strong>page fault</strong> — a
            trap into the OS, which has to find or free up a physical frame, load the needed page in
            from disk, fix up the page table, and then retry the instruction that originally failed.
            This lets programs use more "virtual" memory than the computer physically has, at the
            cost of occasional slow disk-loading pauses.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Page fault"
            def="A hardware trap triggered when a program accesses a page that isn't currently loaded into physical memory."
          />
          <KeyTerm
            term="Victim page"
            def="A currently-loaded page chosen to be evicted (removed) to free up a frame for a new page."
          />
          <KeyTerm
            term="Swap / disk"
            def="Where pages live when they're not currently loaded into physical RAM."
          />
          <KeyTerm
            term="Instruction restart"
            def="After a page fault is handled, the CPU re-runs the instruction that failed, from the very beginning."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Choose a scenario: a free frame is available, or all frames are full and something
              must be evicted.
            </Step>
            <Step>
              Press "Step forward" to walk through the full fault-handling sequence, stage by stage.
            </Step>
            <Step>
              Compare the two scenarios — notice the eviction case has extra steps the simple case
              doesn't need.
            </Step>
          </ol>
        </Section>

        <Section title="Watch a page fault get handled, step by step">
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
                variant={scenario === 'free' ? 'primary' : 'default'}
                onClick={() => setScenario('free')}
              >
                Free frame available
              </Btn>
              <Btn
                variant={scenario === 'evict' ? 'primary' : 'default'}
                onClick={() => setScenario('evict')}
              >
                All frames full (eviction needed)
              </Btn>
            </div>

            {scenario === 'free' ? (
              <FaultTrace stages={STAGES_WITH_FREE_FRAME} key="free" />
            ) : (
              <FaultTrace stages={STAGES_WITH_EVICTION} key="evict" />
            )}

            <Callout>
              <strong>Common mistake:</strong> forgetting the instruction RESTART step. The CPU
              doesn't just "continue on" after a page fault is fixed — the entire instruction that
              triggered the fault runs again from scratch, since it never actually completed the
              first time.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
