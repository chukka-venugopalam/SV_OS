/*
  CHAPTER: D4 — Synchronization (Act 4: Operating Systems)
    Dining Philosophers Problem (act4-d4-ch03-dining-philosophers-problem)

  WHAT THIS DEMONSTRATES
    5 philosophers/forks with the naive left-then-right strategy deadlocking when
    all grab left simultaneously; toggle the asymmetric-ordering fix and show
    deadlock resolved.

  DESIGN DECISIONS
    - Deadlock is triggered as a SCRIPTED simultaneous-grab scenario (not randomized
      timing) since randomness might not reliably deadlock on every run, undermining
      the demo; the "everyone grabs left at once" framing is also the canonical
      textbook setup students will recognize.
    - The fix (last philosopher picks right-then-left instead of left-then-right) is
      shown as a single flipped icon/order for philosopher 5 specifically, since
      seeing that ONE asymmetry breaks the whole deadlock is the actual insight —
      not a wholesale different algorithm.
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

const N = 5;
const POSITIONS: [number, number][] = Array.from({ length: N }).map((_, i) => {
  const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
  return [160 + 110 * Math.cos(angle), 120 + 110 * Math.sin(angle)];
});
const FORK_POSITIONS: [number, number][] = Array.from({ length: N }).map((_, i) => {
  const angle = ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
  return [160 + 65 * Math.cos(angle), 120 + 65 * Math.sin(angle)];
});

type ForkHeldBy = number | null; // philosopher index or null

export default function DiningPhilosophersSim() {
  const [fixed, setFixed] = useState(false);
  const [step, setStep] = useState(0);
  // forks[i] = fork between philosopher i and philosopher (i+1)%N
  const [forks, setForks] = useState<ForkHeldBy[]>(new Array(N).fill(null));

  function leftForkOf(p: number) {
    return (p - 1 + N) % N;
  } // fork to philosopher p's left
  function rightForkOf(p: number) {
    return p;
  } // fork to philosopher p's right

  function reset() {
    setStep(0);
    setForks(new Array(N).fill(null));
  }

  function advance() {
    const next = [...forks];
    if (!fixed) {
      // Naive: everyone tries to grab LEFT fork first, simultaneously
      if (step === 0) {
        for (let p = 0; p < N; p++) next[leftForkOf(p)] = p;
        setForks(next);
        setStep(1);
      }
      // step 1 is the deadlock state — no further progress possible
    } else {
      // Fixed: philosophers 0..N-2 grab left-then-right; philosopher N-1 grabs right-then-left (asymmetric)
      if (step === 0) {
        for (let p = 0; p < N - 1; p++) next[leftForkOf(p)] = p;
        // philosopher N-1 grabs its RIGHT fork first instead of left
        next[rightForkOf(N - 1)] = N - 1;
        setForks(next);
        setStep(1);
      } else if (step === 1) {
        // Now philosopher N-1 tries its left fork too — but that's fork N-2, held by philosopher N-2? Let's check: leftForkOf(N-1) = N-2, which was grabbed by philosopher N-2 already.
        // Actually the resolution: since N-1 grabbed its RIGHT fork (fork N-1, shared with philosopher 0), and philosopher 0 wants LEFT fork = fork (N-1) too (leftForkOf(0) = N-1).
        // So philosopher 0 is now blocked waiting for fork N-1, which N-1 holds. But N-1 can now also grab its LEFT fork (fork N-2) IF philosopher N-2 hasn't taken it as their right yet.
        // Simplify for teaching: philosopher N-2 only holds their LEFT fork (fork N-3), so fork N-2 is free for N-1 to grab as their second fork.
        next[leftForkOf(N - 1)] = N - 1;
        setForks(next);
        setStep(2);
      }
    }
  }

  const isDeadlocked = !fixed && step >= 1;
  const philosopherEating = fixed && step >= 2 ? N - 1 : null;

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
          The Dining Philosophers Problem
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A classic scenario showing how naive resource-locking can freeze an entire system solid.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Picture {N} philosophers sitting around a circular table, with one fork between each
            adjacent pair —{N} forks total. Each philosopher needs BOTH their left and right fork to
            eat. If every philosopher follows the same naive rule — "pick up my left fork, then my
            right fork" — and they all reach for their left fork at the exact same moment, EVERYONE
            ends up holding one fork and waiting forever for the other, which is already held by
            their neighbor. This is a <strong>deadlock</strong>: a standstill where no one can make
            progress, and no one will ever give up what they're holding. A simple fix: make just ONE
            philosopher pick up their forks in the opposite order.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Deadlock"
            def="A situation where multiple processes are each waiting for a resource the others hold, and none can proceed."
          />
          <KeyTerm
            term="Resource ordering"
            def="A fix for deadlock: forcing all processes to request shared resources in a consistent order, so a circular wait can't form."
          />
          <KeyTerm
            term="Circular wait"
            def="A cycle of processes, each waiting for a resource held by the next one in the cycle — required for deadlock to occur."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Start in "naive strategy" mode and press "Advance" to watch every philosopher grab
              their left fork simultaneously.
            </Step>
            <Step>
              Notice the whole table freezes — every philosopher holds one fork and waits forever
              for the other.
            </Step>
            <Step>
              Switch to "asymmetric fix" and advance again — watch the SAME scenario resolve because
              one philosopher's order was flipped.
            </Step>
          </ol>
        </Section>

        <Section title={`${N} philosophers, ${N} forks`}>
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
                variant={!fixed ? 'primary' : 'default'}
                onClick={() => {
                  setFixed(false);
                  reset();
                }}
              >
                Naive strategy (deadlocks)
              </Btn>
              <Btn
                variant={fixed ? 'primary' : 'default'}
                onClick={() => {
                  setFixed(true);
                  reset();
                }}
              >
                Asymmetric fix
              </Btn>
            </div>

            <svg
              viewBox="0 0 320 240"
              width="100%"
              style={{
                display: 'block',
                background: COLORS.panel,
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <circle cx={160} cy={120} r={50} fill="#fff" stroke={COLORS.line} strokeWidth={1.5} />
              {POSITIONS.map(([x, y], i) => (
                <g key={`p${i}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={22}
                    fill={
                      philosopherEating === i
                        ? COLORS.tealSoft
                        : isDeadlocked
                          ? COLORS.redSoft
                          : '#fff'
                    }
                    stroke={
                      philosopherEating === i
                        ? COLORS.teal
                        : isDeadlocked
                          ? COLORS.red
                          : COLORS.line
                    }
                    strokeWidth={2}
                  />
                  <text
                    x={x}
                    y={y + 4}
                    fontSize="10"
                    fontWeight={700}
                    fill={COLORS.ink}
                    textAnchor="middle"
                  >
                    P{i}
                  </text>
                </g>
              ))}
              {FORK_POSITIONS.map(([x, y], i) => {
                const heldBy = forks[i];
                return (
                  <g key={`f${i}`}>
                    <rect
                      x={x - 8}
                      y={y - 4}
                      width={16}
                      height={8}
                      rx={2}
                      fill={heldBy !== null ? COLORS.amber : '#fff'}
                      stroke={heldBy !== null ? COLORS.amber : COLORS.inkSoft}
                      strokeWidth={1.2}
                    />
                  </g>
                );
              })}
            </svg>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn
                variant="primary"
                onClick={advance}
                disabled={(!fixed && step >= 1) || (fixed && step >= 2)}
              >
                Advance
              </Btn>
              <Btn variant="ghost" onClick={reset}>
                Reset
              </Btn>
            </div>

            {isDeadlocked && (
              <div
                style={{
                  background: COLORS.redSoft,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.red,
                  marginBottom: 14,
                }}
              >
                DEADLOCK — every philosopher holds exactly one fork (their left) and is waiting
                forever for their right fork, which their neighbor is holding. Nobody can proceed.
              </div>
            )}
            {philosopherEating !== null && (
              <div
                style={{
                  background: COLORS.tealSoft,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.teal,
                  marginBottom: 14,
                }}
              >
                Resolved! Philosopher {N - 1} grabbed their RIGHT fork first instead of left —
                breaking the circular pattern, so they could get both forks and start eating without
                anyone else being permanently blocked.
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> assuming the fix requires changing EVERY
              philosopher's behavior. It doesn't — breaking the cycle at just ONE point (one
              philosopher using the opposite order) is enough to prevent the circular wait that
              deadlock requires.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
