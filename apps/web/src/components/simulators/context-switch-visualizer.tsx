/*
  CHAPTER: D1 — Process Management (Act 4: Operating Systems)
    Context Switching (act4-d1-ch03-context-switching)

  WHAT THIS DEMONSTRATES
    Two processes alternating on one CPU, animate the PCB save/restore of PC and
    registers at each switch, with the switch itself shown as pure overhead (no
    progress bar movement).

  DESIGN DECISIONS
    - The progress bars for each process are the central visual — freezing during a
      switch is the concrete, undeniable way to show "this is overhead, not useful
      work," which is the entire point of teaching context switching cost.
    - PCB (process control block) contents are shown explicitly as save/restore
      operations with actual register-like values, not just an abstract "switching..."
      label, since seeing WHAT gets saved and restored is the mechanism being taught.
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

type EventType = 'run-a' | 'run-b' | 'switch-to-b' | 'switch-to-a';

interface TimelineEvent {
  type: EventType;
  label: string;
}

const TIMELINE: TimelineEvent[] = [
  { type: 'run-a', label: 'Process A runs (progress advances)' },
  { type: 'switch-to-b', label: "Context switch: save A's state, load B's state" },
  { type: 'run-b', label: 'Process B runs (progress advances)' },
  { type: 'switch-to-a', label: "Context switch: save B's state, load A's state" },
  { type: 'run-a', label: 'Process A runs (progress advances)' },
  { type: 'switch-to-b', label: "Context switch: save A's state, load B's state" },
  { type: 'run-b', label: 'Process B runs (progress advances)' },
];

export default function ContextSwitchVisualizer() {
  const [idx, setIdx] = useState(0);
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);
  const [pcbA, setPcbA] = useState({ pc: '0x1000', reg: 'R1=5, R2=12' });
  const [pcbB, setPcbB] = useState({ pc: '0x2000', reg: 'R1=99, R2=3' });
  const [cpuOwner, setCpuOwner] = useState<'A' | 'B' | 'switching'>('A');
  const [overheadTicks, setOverheadTicks] = useState(0);
  const [usefulTicks, setUsefulTicks] = useState(0);

  const event = idx < TIMELINE.length ? TIMELINE[idx] : null;

  function advance() {
    if (!event) return;
    if (event.type === 'run-a') {
      setCpuOwner('A');
      setProgressA((p) => Math.min(100, p + 25));
      setPcbA((p) => ({ pc: `0x${(parseInt(p.pc, 16) + 4).toString(16)}`, reg: p.reg }));
      setUsefulTicks((t) => t + 1);
    } else if (event.type === 'run-b') {
      setCpuOwner('B');
      setProgressB((p) => Math.min(100, p + 25));
      setPcbB((p) => ({ pc: `0x${(parseInt(p.pc, 16) + 4).toString(16)}`, reg: p.reg }));
      setUsefulTicks((t) => t + 1);
    } else {
      setCpuOwner('switching');
      setOverheadTicks((t) => t + 1);
    }
    setIdx((i) => i + 1);
  }
  function reset() {
    setIdx(0);
    setProgressA(0);
    setProgressB(0);
    setCpuOwner('A');
    setOverheadTicks(0);
    setUsefulTicks(0);
    setPcbA({ pc: '0x1000', reg: 'R1=5, R2=12' });
    setPcbB({ pc: '0x2000', reg: 'R1=99, R2=3' });
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
          Process Management · D1 (Act 4: OS)
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Context Switching
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How the CPU juggles multiple processes — and the real cost of switching between them.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A single CPU can only run one process at a time, but your computer FEELS like it's
            running many things simultaneously because the OS rapidly switches between them. Each
            time it switches, it has to
            <strong> save</strong> the current process's exact state (its program counter and
            register values) into that process's <strong>PCB</strong> (process control block), then{' '}
            <strong>restore</strong> the next process's saved state so it can resume exactly where
            it left off. This save/restore work is pure overhead — it doesn't advance any process's
            actual progress, it just costs time.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="PCB (Process Control Block)"
            def="A data structure the OS keeps for each process, storing everything needed to pause and later resume it exactly."
          />
          <KeyTerm
            term="Program counter (PC)"
            def="A register tracking which instruction the process should execute next."
          />
          <KeyTerm
            term="Save / restore"
            def="Writing the current process's state into its PCB, then reading the next process's state back out of its own PCB."
          />
          <KeyTerm
            term="Overhead"
            def="Time spent on bookkeeping (like switching) rather than on actual useful work."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Press "Advance" repeatedly to step through the timeline.</Step>
            <Step>
              Watch each process's progress bar — it only moves while THAT process actually holds
              the CPU.
            </Step>
            <Step>
              During a switch, notice the progress bars freeze completely — that pause represents
              the wasted overhead.
            </Step>
            <Step>
              Check the PCB values update as each process's state gets saved and later restored.
            </Step>
          </ol>
        </Section>

        <Section title="Watch two processes share one CPU">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{ fontWeight: 600, color: cpuOwner === 'A' ? COLORS.teal : COLORS.ink }}
                >
                  Process A {cpuOwner === 'A' && '← running now'}
                </span>
                <span style={{ color: COLORS.inkSoft }}>{progressA}%</span>
              </div>
              <div
                style={{
                  height: 14,
                  background: COLORS.panel,
                  borderRadius: 7,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressA}%`,
                    background: COLORS.teal,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: COLORS.inkSoft,
                  marginTop: 3,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                PCB: PC={pcbA.pc}, {pcbA.reg}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{ fontWeight: 600, color: cpuOwner === 'B' ? COLORS.teal : COLORS.ink }}
                >
                  Process B {cpuOwner === 'B' && '← running now'}
                </span>
                <span style={{ color: COLORS.inkSoft }}>{progressB}%</span>
              </div>
              <div
                style={{
                  height: 14,
                  background: COLORS.panel,
                  borderRadius: 7,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressB}%`,
                    background: COLORS.teal,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: COLORS.inkSoft,
                  marginTop: 3,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                PCB: PC={pcbB.pc}, {pcbB.reg}
              </div>
            </div>

            {cpuOwner === 'switching' && (
              <div
                style={{
                  background: COLORS.amberSoft,
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  marginBottom: 14,
                  fontWeight: 600,
                }}
              >
                ⏸ Context switch in progress — CPU is saving/restoring state, NOT running either
                process. Notice neither progress bar moved.
              </div>
            )}

            {event && (
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 14,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {event.label}
              </div>
            )}
            {!event && (
              <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 600, marginBottom: 14 }}>
                Timeline complete.
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, marginBottom: 14 }}>
              <span>
                Useful work ticks: <strong style={{ color: COLORS.teal }}>{usefulTicks}</strong>
              </span>
              <span>
                Overhead ticks: <strong style={{ color: COLORS.red }}>{overheadTicks}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="primary" onClick={advance} disabled={!event}>
                Advance
              </Btn>
              <Btn variant="ghost" onClick={reset}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> thinking context switches are free or instantaneous.
              They cost real CPU time doing nothing but bookkeeping — which is exactly why operating
              systems try to switch as INFREQUENTLY as reasonably possible while still staying
              responsive.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
