/*
  CHAPTER: D1 — Process Management (Act 4: Operating Systems)
    Process States & Transitions (act4-d1-ch02-process-states-transitions)

  WHAT THIS DEMONSTRATES
    A state diagram (new/ready/running/waiting/terminated) where triggering
    scheduler dispatch, preemption, I/O completion, or a blocking call animates the
    correct transition.

  DESIGN DECISIONS
    - Buttons are explicitly labeled by the TRIGGERING EVENT (not just "next state"),
      since understanding WHICH event causes WHICH transition is the actual point —
      a generic "advance" button would hide that mapping.
    - Only valid transitions are enabled at each state (invalid buttons are disabled
      with a tooltip-style note), so students learn the state diagram's actual edges
      by direct interaction rather than by reading a description of them.
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
        padding: '7px 12px',
        borderRadius: 6,
        fontSize: 12.5,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
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

type PState = 'new' | 'ready' | 'running' | 'waiting' | 'terminated';

const POSITIONS: Record<PState, [number, number]> = {
  new: [50, 100],
  ready: [160, 40],
  running: [280, 100],
  waiting: [160, 160],
  terminated: [400, 100],
};

interface Transition {
  event: string;
  from: PState;
  to: PState;
  explanation: string;
}

const TRANSITIONS: Transition[] = [
  {
    event: 'Admitted',
    from: 'new',
    to: 'ready',
    explanation:
      'The OS finishes setting up the process (allocates memory, creates its PCB) and admits it into the ready queue.',
  },
  {
    event: 'Scheduler dispatch',
    from: 'ready',
    to: 'running',
    explanation: 'The CPU scheduler picks this process from the ready queue and gives it the CPU.',
  },
  {
    event: 'Preemption (time slice expires)',
    from: 'running',
    to: 'ready',
    explanation:
      "The process's time slice runs out, or a higher-priority process arrives — the OS pulls it off the CPU and back into the ready queue.",
  },
  {
    event: 'I/O or event wait',
    from: 'running',
    to: 'waiting',
    explanation:
      'The process makes a blocking call (like requesting disk I/O) and cannot continue until that operation completes.',
  },
  {
    event: 'I/O completion',
    from: 'waiting',
    to: 'ready',
    explanation:
      "The event it was waiting for finishes — it's ready to run again, but must wait its turn for the CPU.",
  },
  {
    event: 'Exit',
    from: 'running',
    to: 'terminated',
    explanation: 'The process finishes execution (or is killed) and is removed from the system.',
  },
];

function _availableTransitions(state: PState): Transition[] {
  return TRANSITIONS.filter((t) => t.from === state);
}

export default function ProcessStateVisualizer() {
  const [state, setState] = useState<PState>('new');
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string>(
    'This process was just created by the OS (e.g. via fork() or a new program launch) — it starts in the "new" state.',
  );

  function trigger(t: Transition) {
    setState(t.to);
    setLastEvent(t.event);
    setLastExplanation(t.explanation);
  }
  function reset() {
    setState('new');
    setLastEvent(null);
    setLastExplanation(
      'This process was just created by the OS (e.g. via fork() or a new program launch) — it starts in the "new" state.',
    );
  }

  const edges: [PState, PState][] = [
    ['new', 'ready'],
    ['ready', 'running'],
    ['running', 'ready'],
    ['running', 'waiting'],
    ['waiting', 'ready'],
    ['running', 'terminated'],
  ];

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
          Process States &amp; Transitions
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Every process is always in exactly one of five states — and specific events cause it to
          move between them.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            At any given moment, a process running on your computer is in one of five states:{' '}
            <strong>new</strong>
            (just created), <strong>ready</strong> (waiting for CPU time), <strong>running</strong>{' '}
            (actually executing on the CPU right now), <strong>waiting</strong> (blocked on
            something like disk I/O), or
            <strong> terminated</strong> (finished). The operating system moves a process between
            these states in response to specific triggering events — like the scheduler deciding
            it's this process's turn, or an I/O operation finally completing.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Ready queue"
            def="The list of processes that are ready to run and just waiting for CPU time."
          />
          <KeyTerm
            term="Scheduler"
            def="The OS component that decides which ready process gets the CPU next."
          />
          <KeyTerm
            term="Preemption"
            def="Forcibly taking the CPU away from a running process, usually because its time slice ran out."
          />
          <KeyTerm
            term="Blocking call"
            def="An action (like reading from disk) that the process must wait for before it can continue."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>The highlighted circle shows the process's current state.</Step>
            <Step>
              Only the event buttons that are VALID from the current state are enabled — press one
              to trigger that transition.
            </Step>
            <Step>
              Read the explanation below to understand exactly what real-world event that button
              represents.
            </Step>
            <Step>
              Try to reach "terminated," then press reset and try a different path (e.g. go through
              "waiting" this time).
            </Step>
          </ol>
        </Section>

        <Section title="Trigger transitions and watch the state change">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <svg
              viewBox="0 0 440 200"
              width="100%"
              style={{
                display: 'block',
                background: COLORS.panel,
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <defs>
                <marker
                  id="psArrow"
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,0 L7,3.5 L0,7 Z" fill={COLORS.inkSoft} />
                </marker>
              </defs>
              {edges.map(([from, to], i) => {
                const [x1, y1] = POSITIONS[from],
                  [x2, y2] = POSITIONS[to];
                const dx = x2 - x1,
                  dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const shrink = 26;
                const ex = x1 + (dx / len) * (len - shrink),
                  ey = y1 + (dy / len) * (len - shrink);
                const sx = x1 + (dx / len) * shrink,
                  sy = y1 + (dy / len) * shrink;
                return (
                  <line
                    key={i}
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke={COLORS.inkSoft}
                    strokeWidth={1.3}
                    markerEnd="url(#psArrow)"
                    opacity={0.5}
                  />
                );
              })}
              {(Object.keys(POSITIONS) as PState[]).map((s) => {
                const [x, y] = POSITIONS[s];
                const isActive = s === state;
                return (
                  <g key={s}>
                    <circle
                      cx={x}
                      cy={y}
                      r={30}
                      fill={isActive ? COLORS.tealSoft : '#fff'}
                      stroke={isActive ? COLORS.teal : COLORS.line}
                      strokeWidth={isActive ? 3 : 1.5}
                    />
                    <text
                      x={x}
                      y={y + 4}
                      fontSize="11"
                      fontWeight={700}
                      fill={COLORS.ink}
                      textAnchor="middle"
                    >
                      {s}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {TRANSITIONS.map((t, i) => (
                <Btn
                  key={i}
                  variant="primary"
                  onClick={() => trigger(t)}
                  disabled={t.from !== state}
                >
                  {t.event}
                </Btn>
              ))}
            </div>

            {lastEvent && (
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 6 }}>
                Last event: <strong style={{ color: COLORS.ink }}>{lastEvent}</strong>
              </div>
            )}
            <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '0 0 14px' }}>
              {lastExplanation}
            </p>

            {state === 'terminated' && (
              <div
                style={{
                  background: COLORS.tealSoft,
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  marginBottom: 14,
                }}
              >
                Process lifecycle complete.
              </div>
            )}

            <Btn variant="ghost" onClick={reset}>
              Reset to "new"
            </Btn>

            <Callout>
              <strong>Common mistake:</strong> assuming a process goes straight from "running" back
              to "running" after preemption. It doesn't — it always passes through "ready" first and
              has to wait its turn again, even if the wait ends up being very short.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
