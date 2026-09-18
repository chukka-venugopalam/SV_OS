/*
  CHAPTER: D4 — Synchronization (Act 4: Operating Systems)
    Race Conditions & Critical Section (act4-d4-ch01-race-conditions-critical-section)

  WHAT THIS DEMONSTRATES
    Two threads incrementing a shared counter without protection, showing lost
    updates from interleaved reads/writes; toggle mutual exclusion on and show the
    race disappear.

  DESIGN DECISIONS
    - This tool is the formal "critical section" companion to the informal race demo
      already shown in thread-lifecycle-sim (D1) — that one motivates the PROBLEM;
      this one names the SOLUTION concept (critical section, mutual exclusion) and
      shows protection actually fixing it, since D1 intentionally stopped short of
      introducing synchronization vocabulary.
    - The "lock" is shown as a literal visual gate that blocks the second thread's
      entry into the critical section until the first releases it, since that
      blocking behavior IS what mutual exclusion means operationally.
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

interface RaceStep {
  thread: 1 | 2;
  action: string;
  counterValue: number;
  lockHeldBy: 1 | 2 | null;
  blocked?: boolean;
}

function buildSteps(protectedMode: boolean): RaceStep[] {
  if (!protectedMode) {
    // Interleaved, unprotected -> lost update
    return [
      { thread: 1, action: 'Read counter (=0)', counterValue: 0, lockHeldBy: null },
      {
        thread: 2,
        action: "Read counter (=0) — Thread 1 hasn't written yet!",
        counterValue: 0,
        lockHeldBy: null,
      },
      { thread: 1, action: 'Increment local copy to 1', counterValue: 0, lockHeldBy: null },
      { thread: 2, action: 'Increment local copy to 1', counterValue: 0, lockHeldBy: null },
      { thread: 1, action: 'Write 1 back to counter', counterValue: 1, lockHeldBy: null },
      {
        thread: 2,
        action: "Write 1 back to counter — OVERWRITES Thread 1's update!",
        counterValue: 1,
        lockHeldBy: null,
      },
    ];
  } else {
    // Protected with a lock -> Thread 2 must wait
    return [
      {
        thread: 1,
        action: 'Acquire lock — enters critical section',
        counterValue: 0,
        lockHeldBy: 1,
      },
      {
        thread: 2,
        action: 'Tries to acquire lock — BLOCKED (Thread 1 holds it)',
        counterValue: 0,
        lockHeldBy: 1,
        blocked: true,
      },
      {
        thread: 1,
        action: 'Read counter (=0), increment to 1, write back',
        counterValue: 1,
        lockHeldBy: 1,
      },
      {
        thread: 1,
        action: 'Release lock — exits critical section',
        counterValue: 1,
        lockHeldBy: null,
      },
      {
        thread: 2,
        action: 'Acquire lock — enters critical section (finally allowed in)',
        counterValue: 1,
        lockHeldBy: 2,
      },
      {
        thread: 2,
        action: 'Read counter (=1), increment to 2, write back',
        counterValue: 2,
        lockHeldBy: 2,
      },
      {
        thread: 2,
        action: 'Release lock — exits critical section',
        counterValue: 2,
        lockHeldBy: null,
      },
    ];
  }
}

export default function RaceConditionDemonstrator() {
  const [protectedMode, setProtectedMode] = useState(false);
  const steps = buildSteps(protectedMode);
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const finalCounter = steps[steps.length - 1].counterValue;

  function toggle(v: boolean) {
    setProtectedMode(v);
    setIdx(0);
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
          Synchronization · D4 (Act 4: OS)
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Race Conditions &amp; Critical Sections
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Watch a shared-counter bug happen — then watch protection make it disappear.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A <strong>critical section</strong> is a piece of code that accesses shared data — like
            a shared counter — in a way that can go wrong if two threads execute it at the same
            time. Without protection, two threads can interleave their steps and produce a{' '}
            <strong>race condition</strong>: an update gets silently lost. The fix is{' '}
            <strong>mutual exclusion</strong> — ensuring only ONE thread can be inside the critical
            section at any given moment, usually enforced with a <strong>lock</strong>. Any other
            thread trying to enter must wait until the lock is released.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Critical section"
            def="Code that accesses shared data in a way that's unsafe if multiple threads run it simultaneously."
          />
          <KeyTerm
            term="Mutual exclusion"
            def="The guarantee that only one thread can be inside a critical section at a time."
          />
          <KeyTerm
            term="Lock"
            def="A mechanism a thread must acquire before entering a critical section, and release when leaving."
          />
          <KeyTerm
            term="Blocked"
            def="A thread waiting for a lock it cannot yet acquire, because another thread currently holds it."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Start in "unprotected" mode and step through — watch the final counter come out wrong.
            </Step>
            <Step>Switch to "protected with a lock" and step through the same scenario.</Step>
            <Step>
              Notice Thread 2 gets BLOCKED until Thread 1 releases the lock — it can no longer
              interleave.
            </Step>
            <Step>Compare the final counter values between the two modes.</Step>
          </ol>
        </Section>

        <Section title="Two threads, one shared counter">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Btn variant={!protectedMode ? 'primary' : 'default'} onClick={() => toggle(false)}>
                Unprotected (race condition)
              </Btn>
              <Btn variant={protectedMode ? 'primary' : 'default'} onClick={() => toggle(true)}>
                Protected with a lock
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
                      i === idx
                        ? s.blocked
                          ? COLORS.redSoft
                          : COLORS.amberSoft
                        : i < idx
                          ? COLORS.panel
                          : 'transparent',
                    opacity: i <= idx ? 1 : 0.35,
                    border:
                      i === idx
                        ? `1.5px solid ${s.blocked ? COLORS.red : COLORS.amber}`
                        : '1.5px solid transparent',
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

            <div
              style={{
                display: 'flex',
                gap: 16,
                marginBottom: 14,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
              }}
            >
              <span>
                Counter:{' '}
                <strong style={{ color: COLORS.teal }}>
                  {idx < steps.length ? step.counterValue : finalCounter}
                </strong>
              </span>
              <span>
                Lock held by:{' '}
                <strong>{step.lockHeldBy ? `Thread ${step.lockHeldBy}` : 'nobody'}</strong>
              </span>
            </div>

            {idx >= steps.length - 1 && (
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
                  ? '✓ Correct! Final counter = 2, exactly as expected from two increments.'
                  : `✗ Lost update! Final counter = ${finalCounter}, but two increments happened.`}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
                disabled={idx >= steps.length - 1}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> thinking a lock slows down EVERY part of a program.
              It only serializes access to the CRITICAL SECTION specifically — code outside that
              protected region still runs freely and concurrently on both threads.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
