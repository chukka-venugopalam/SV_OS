/*
  CHAPTER: D1 — Process Management (Act 4: Operating Systems)
    Threads (act4-d1-ch04-threads)

  WHAT THIS DEMONSTRATES
    Multiple threads sharing one process's code/data/heap while each keeps its own
    stack/PC/registers, visualized side by side; show a shared-variable race as
    motivation for synchronization.

  DESIGN DECISIONS
    - Uses a literal box-diagram layout (shared region vs per-thread private
      regions) since "what's shared vs what's private" is inherently spatial and a
      diagram communicates it faster than prose ever could.
    - The race condition demo deliberately shows the INTERLEAVED read-modify-write
      steps of both threads side by side (not just "final answer is wrong"), since
      seeing exactly where the interleaving corrupts the result is the actual lesson,
      and sets up WHY synchronization (covered in D4) will be needed.
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

function MemoryDiagram() {
  return (
    <svg
      viewBox="0 0 340 220"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      <rect
        x={20}
        y={15}
        width={300}
        height={70}
        rx={6}
        fill={COLORS.tealSoft}
        stroke={COLORS.teal}
        strokeWidth={1.5}
      />
      <text x={170} y={35} fontSize="11" fontWeight={700} fill={COLORS.ink} textAnchor="middle">
        SHARED (all threads see the same copy)
      </text>
      <text x={170} y={55} fontSize="10" fill={COLORS.inkSoft} textAnchor="middle">
        Code, global/heap data
      </text>
      <text x={170} y={72} fontSize="9" fill={COLORS.inkSoft} textAnchor="middle">
        e.g. shared counter variable
      </text>

      <rect
        x={20}
        y={105}
        width={140}
        height={100}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={90} y={125} fontSize="11" fontWeight={700} fill={COLORS.ink} textAnchor="middle">
        Thread 1 (private)
      </text>
      <text x={90} y={145} fontSize="9.5" fill={COLORS.inkSoft} textAnchor="middle">
        Own stack
      </text>
      <text x={90} y={162} fontSize="9.5" fill={COLORS.inkSoft} textAnchor="middle">
        Own PC
      </text>
      <text x={90} y={179} fontSize="9.5" fill={COLORS.inkSoft} textAnchor="middle">
        Own registers
      </text>

      <rect
        x={180}
        y={105}
        width={140}
        height={100}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={250} y={125} fontSize="11" fontWeight={700} fill={COLORS.ink} textAnchor="middle">
        Thread 2 (private)
      </text>
      <text x={250} y={145} fontSize="9.5" fill={COLORS.inkSoft} textAnchor="middle">
        Own stack
      </text>
      <text x={250} y={162} fontSize="9.5" fill={COLORS.inkSoft} textAnchor="middle">
        Own PC
      </text>
      <text x={250} y={179} fontSize="9.5" fill={COLORS.inkSoft} textAnchor="middle">
        Own registers
      </text>
    </svg>
  );
}

interface RaceStep {
  thread: 1 | 2;
  action: string;
  counterValue: number;
  local: number;
}

function buildRaceSteps(interleaved: boolean): RaceStep[] {
  // Both threads do counter++ starting from counter=0. counter++ is really: read, add 1, write.
  if (!interleaved) {
    return [
      { thread: 1, action: 'Read counter (=0) into local', counterValue: 0, local: 0 },
      { thread: 1, action: 'Add 1 to local (local=1)', counterValue: 0, local: 1 },
      { thread: 1, action: 'Write local back to counter', counterValue: 1, local: 1 },
      { thread: 2, action: 'Read counter (=1) into local', counterValue: 1, local: 1 },
      { thread: 2, action: 'Add 1 to local (local=2)', counterValue: 1, local: 2 },
      { thread: 2, action: 'Write local back to counter', counterValue: 2, local: 2 },
    ];
  } else {
    return [
      { thread: 1, action: 'Read counter (=0) into local', counterValue: 0, local: 0 },
      {
        thread: 2,
        action: "Read counter (=0) into local (Thread 1 hasn't written yet!)",
        counterValue: 0,
        local: 0,
      },
      { thread: 1, action: 'Add 1 to local (local=1)', counterValue: 0, local: 1 },
      { thread: 2, action: 'Add 1 to local (local=1)', counterValue: 0, local: 1 },
      { thread: 1, action: 'Write local back to counter (counter=1)', counterValue: 1, local: 1 },
      {
        thread: 2,
        action: "Write local back to counter (counter=1 — OVERWRITES Thread 1's update!)",
        counterValue: 1,
        local: 1,
      },
    ];
  }
}

function ThreadRaceMode() {
  const [interleaved, setInterleaved] = useState(false);
  const steps = buildRaceSteps(interleaved);
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const finalCounter = steps[steps.length - 1].counterValue;

  function switchMode(v: boolean) {
    setInterleaved(v);
    setStepIdx(0);
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Two threads both run{' '}
        <code style={{ background: COLORS.panel, padding: '1px 5px', borderRadius: 3 }}>
          counter++
        </code>{' '}
        once, starting from counter = 0. That single line is secretly THREE steps: read, add 1,
        write. Watch what happens when those steps interleave badly.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Btn variant={!interleaved ? 'primary' : 'default'} onClick={() => switchMode(false)}>
          Safe order (no overlap)
        </Btn>
        <Btn variant={interleaved ? 'primary' : 'default'} onClick={() => switchMode(true)}>
          Interleaved (race condition)
        </Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 5,
              fontSize: 12.5,
              fontFamily: 'ui-monospace, monospace',
              background:
                i === stepIdx ? COLORS.amberSoft : i < stepIdx ? COLORS.panel : 'transparent',
              opacity: i <= stepIdx ? 1 : 0.35,
              border: i === stepIdx ? `1.5px solid ${COLORS.amber}` : '1.5px solid transparent',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: s.thread === 1 ? COLORS.teal : '#8B7FD1',
                minWidth: 60,
              }}
            >
              Thread {s.thread}
            </span>
            <span>{s.action}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, marginBottom: 14 }}>
        Shared counter value:{' '}
        <strong style={{ color: COLORS.teal }}>
          {stepIdx < steps.length ? step.counterValue : finalCounter}
        </strong>
      </div>

      {stepIdx >= steps.length - 1 && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 14,
            fontSize: 13,
            fontWeight: 600,
            background: finalCounter === 2 ? COLORS.tealSoft : COLORS.redSoft,
            color: finalCounter === 2 ? COLORS.teal : COLORS.red,
          }}
        >
          {finalCounter === 2
            ? 'Correct! Final counter = 2, as expected from two increments.'
            : `Lost update! Final counter = ${finalCounter}, but TWO increments happened — it should be 2. Thread 2 overwrote Thread 1's work because it read the counter before Thread 1 finished writing.`}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0}>
          Step back
        </Btn>
        <Btn
          variant="primary"
          onClick={() => setStepIdx((s) => Math.min(steps.length - 1, s + 1))}
          disabled={stepIdx >= steps.length - 1}
        >
          Step forward
        </Btn>
        <Btn variant="ghost" onClick={() => setStepIdx(0)}>
          Reset
        </Btn>
      </div>
    </div>
  );
}

export default function ThreadLifecycleSim() {
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
          Threads
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Multiple execution paths sharing one process's memory — and why that sharing needs careful
          handling.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A thread is a single sequence of execution within a process. A process can have MULTIPLE
            threads, and they all share the same code, global variables, and heap memory — but each
            thread keeps its own private <strong>stack</strong>, <strong>program counter</strong>,
            and <strong>registers</strong>, so each can be at a different point in the program at
            any given moment. This sharing is powerful (fast communication between threads, no
            copying needed) but dangerous: if two threads modify the same shared variable at the
            same time without coordination, you get a <strong>race condition</strong> —
            unpredictable, often wrong, results.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm term="Thread" def="One independent sequence of execution within a process." />
          <KeyTerm
            term="Shared memory"
            def="Code, global variables, and heap data — all threads in a process see the exact same copy."
          />
          <KeyTerm
            term="Private per-thread state"
            def="Each thread's own stack, program counter, and registers — not shared with other threads."
          />
          <KeyTerm
            term="Race condition"
            def="A bug where the outcome depends on the unpredictable timing/order of multiple threads' operations."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Look at the diagram — notice which parts are shared and which are private per thread.
            </Step>
            <Step>
              Scroll down and step through the "safe order" scenario to see two increments produce
              the correct result.
            </Step>
            <Step>
              Switch to "interleaved" and step through again — watch exactly where the operations
              overlap badly.
            </Step>
            <Step>Compare the final counter values between the two scenarios.</Step>
          </ol>
        </Section>

        <Section title="What's shared vs. what's private">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <MemoryDiagram />
          </div>
        </Section>

        <Section title="Motivation: a shared-variable race condition">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <ThreadRaceMode />
            <Callout>
              <strong>Common mistake:</strong> assuming a single line of code like "counter++"
              happens all at once. On real hardware, it's actually multiple separate steps (read,
              modify, write) — and another thread can interleave its own steps in between yours,
              which is exactly how this bug happens. Fixing this properly requires synchronization
              tools (covered separately) that prevent that interleaving.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
