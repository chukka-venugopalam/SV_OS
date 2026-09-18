/*
  CHAPTER: D1 — Process Management (Act 4: Operating Systems)
    Inter-Process Communication (act4-d1-ch06-interprocess-communication)

  WHAT THIS DEMONSTRATES
    Pipes, shared memory, message passing, and sockets shown as four distinct
    data-flow animations between two isolated processes, with a
    throughput/complexity tradeoff callout for each.

  DESIGN DECISIONS
    - Each of the 4 mechanisms gets its own tab with its own animation, since
      they're structurally different enough (direct memory access vs. copied
      messages vs. network-style addressing) that cramming them into one shared
      animation would blur the actual differences between them.
    - A tradeoff line for each is placed directly under its animation, not in a
      separate combined comparison table, since the tradeoff only makes sense once
      you've seen how that specific mechanism actually moves data.
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
      <span style={{ fontWeight: 600, color: COLORS.ink, minWidth: 140, flexShrink: 0 }}>
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

type Mechanism = 'pipe' | 'shared' | 'message' | 'socket';

const MECH_INFO: Record<Mechanism, { label: string; tradeoff: string }> = {
  pipe: {
    label: 'Pipes',
    tradeoff:
      'Simple and fast for a direct producer-consumer relationship, but strictly one-directional and only works between related processes (like parent/child).',
  },
  shared: {
    label: 'Shared Memory',
    tradeoff:
      "The FASTEST option — no copying at all, both processes read/write the same physical memory directly — but requires manual synchronization (locks) to avoid race conditions, since there's no built-in coordination.",
  },
  message: {
    label: 'Message Passing',
    tradeoff:
      'Safer by design (the OS handles delivery, no shared state to corrupt) but slower than shared memory since every message gets copied.',
  },
  socket: {
    label: 'Sockets',
    tradeoff:
      'Works across DIFFERENT machines over a network, not just within one computer — most flexible, but has the most overhead due to network-style addressing and protocol handling.',
  },
};

function PipeAnim({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 320 120"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      <rect
        x={20}
        y={40}
        width={80}
        height={40}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={60} y={64} fontSize="11" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Writer
      </text>
      <rect
        x={125}
        y={50}
        width={70}
        height={20}
        rx={10}
        fill={COLORS.panel}
        stroke={COLORS.teal}
        strokeWidth={1.5}
      />
      <text x={160} y={45} fontSize="9" textAnchor="middle" fill={COLORS.inkSoft}>
        pipe buffer
      </text>
      {step >= 1 && <circle cx={160} cy={60} r={6} fill={COLORS.amber} />}
      <rect
        x={220}
        y={40}
        width={80}
        height={40}
        rx={6}
        fill={step >= 2 ? COLORS.tealSoft : '#fff'}
        stroke={step >= 2 ? COLORS.teal : COLORS.line}
        strokeWidth={1.5}
      />
      <text x={260} y={64} fontSize="11" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Reader
      </text>
      <text x={160} y={100} fontSize="9.5" textAnchor="middle" fill={COLORS.inkSoft}>
        Data flows ONE direction only, through a kernel-managed buffer
      </text>
    </svg>
  );
}
function SharedMemAnim({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 320 120"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      <rect
        x={20}
        y={20}
        width={80}
        height={40}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={60} y={44} fontSize="11" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Process A
      </text>
      <rect
        x={220}
        y={20}
        width={80}
        height={40}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={260} y={44} fontSize="11" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Process B
      </text>
      <rect
        x={120}
        y={75}
        width={80}
        height={30}
        rx={6}
        fill={step >= 1 ? COLORS.amberSoft : COLORS.tealSoft}
        stroke={step >= 1 ? COLORS.amber : COLORS.teal}
        strokeWidth={2}
      />
      <text x={160} y={95} fontSize="10" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        SAME memory
      </text>
      <line x1={60} y1={60} x2={140} y2={80} stroke={COLORS.line} strokeWidth={1.5} />
      <line x1={260} y1={60} x2={180} y2={80} stroke={COLORS.line} strokeWidth={1.5} />
      <text x={160} y={20} fontSize="9.5" textAnchor="middle" fill={COLORS.inkSoft}>
        Both processes access the SAME physical memory block directly — no copying
      </text>
    </svg>
  );
}
function MessageAnim({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 320 120"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      <rect
        x={20}
        y={40}
        width={80}
        height={40}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={60} y={64} fontSize="11" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Process A
      </text>
      <rect
        x={220}
        y={40}
        width={80}
        height={40}
        rx={6}
        fill={step >= 2 ? COLORS.tealSoft : '#fff'}
        stroke={step >= 2 ? COLORS.teal : COLORS.line}
        strokeWidth={1.5}
      />
      <text x={260} y={64} fontSize="11" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Process B
      </text>
      <rect
        x={140}
        y={45}
        width={40}
        height={24}
        rx={4}
        fill={step >= 1 ? COLORS.amberSoft : 'transparent'}
        stroke={step >= 1 ? COLORS.amber : 'transparent'}
        strokeWidth={1.5}
      />
      {step >= 1 && (
        <text x={160} y={62} fontSize="9" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
          msg
        </text>
      )}
      <text x={160} y={100} fontSize="9.5" textAnchor="middle" fill={COLORS.inkSoft}>
        OS COPIES a discrete message from A's queue into B's queue
      </text>
    </svg>
  );
}
function SocketAnim({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 320 120"
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      <rect
        x={10}
        y={40}
        width={70}
        height={40}
        rx={6}
        fill="#fff"
        stroke={COLORS.line}
        strokeWidth={1.5}
      />
      <text x={45} y={64} fontSize="10" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Process A
      </text>
      <text x={45} y={30} fontSize="8" textAnchor="middle" fill={COLORS.inkSoft}>
        Machine 1
      </text>
      <rect
        x={240}
        y={40}
        width={70}
        height={40}
        rx={6}
        fill={step >= 2 ? COLORS.tealSoft : '#fff'}
        stroke={step >= 2 ? COLORS.teal : COLORS.line}
        strokeWidth={1.5}
      />
      <text x={275} y={64} fontSize="10" fontWeight={700} textAnchor="middle" fill={COLORS.ink}>
        Process B
      </text>
      <text x={275} y={30} fontSize="8" textAnchor="middle" fill={COLORS.inkSoft}>
        Machine 2 (different computer!)
      </text>
      <line
        x1={80}
        y1={60}
        x2={240}
        y2={60}
        stroke={COLORS.line}
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />
      {step >= 1 && <circle cx={160} cy={60} r={6} fill={COLORS.amber} />}
      <text x={160} y={95} fontSize="9.5" textAnchor="middle" fill={COLORS.inkSoft}>
        Data travels over a NETWORK connection, addressed by IP + port
      </text>
    </svg>
  );
}

export default function IpcChannelSim() {
  const [mech, setMech] = useState<Mechanism>('pipe');
  const [step, setStep] = useState(0);

  function change(m: Mechanism) {
    setMech(m);
    setStep(0);
  }

  const anims: Record<Mechanism, (props: { step: number }) => React.ReactElement> = {
    pipe: PipeAnim,
    shared: SharedMemAnim,
    message: MessageAnim,
    socket: SocketAnim,
  };
  const AnimComponent = anims[mech];

  const stepLabels: Record<Mechanism, string[]> = {
    pipe: ['Writer sends data into the pipe buffer', 'Reader receives data from the buffer'],
    shared: ['Both processes map the same memory block into their own address space'],
    message: [
      'Process A sends a message (copied by the OS)',
      'Process B receives the message from its queue',
    ],
    socket: [
      'Process A sends data over the network connection',
      'Process B receives it on the other machine',
    ],
  };

  const maxStep = stepLabels[mech].length;

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
          Inter-Process Communication (IPC)
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Four different ways for isolated processes to exchange data — each with a different
          speed/safety tradeoff.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Processes are normally completely isolated from each other — one process can't just
            reach into another's memory. But often processes NEED to communicate, so the OS provides
            several mechanisms for it. <strong>Pipes</strong> stream data one-directionally through
            a kernel buffer. <strong>Shared memory</strong> lets two processes access the exact same
            block of memory directly, no copying.
            <strong> Message passing</strong> has the OS copy discrete messages between processes'
            queues.
            <strong> Sockets</strong> extend the idea across a network, letting processes on
            different machines talk. Each one trades off speed, safety, and flexibility differently.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="IPC"
            def="Inter-Process Communication — any mechanism letting separate processes exchange data."
          />
          <KeyTerm
            term="Kernel buffer"
            def="A temporary storage area managed by the OS, used by pipes to hold data in transit."
          />
          <KeyTerm
            term="Synchronization"
            def="Coordination needed to prevent processes from corrupting shared data by accessing it at the same time."
          />
          <KeyTerm
            term="IP + port"
            def="The addressing scheme sockets use to identify exactly which process on which machine to talk to."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Pick a mechanism using the four tabs below.</Step>
            <Step>Press "Step forward" to watch data actually move between the two processes.</Step>
            <Step>
              Read the tradeoff note under each animation — notice speed and safety pull in opposite
              directions.
            </Step>
            <Step>Compare all four to see which fits which real-world scenario best.</Step>
          </ol>
        </Section>

        <Section title="Four IPC mechanisms, animated">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(Object.keys(MECH_INFO) as Mechanism[]).map((m) => (
                <Btn key={m} variant={mech === m ? 'primary' : 'default'} onClick={() => change(m)}>
                  {MECH_INFO[m].label}
                </Btn>
              ))}
            </div>

            <AnimComponent step={step} />

            <div
              style={{
                marginTop: 14,
                marginBottom: 14,
                fontSize: 13,
                fontFamily: 'ui-monospace, monospace',
                minHeight: 18,
              }}
            >
              {step > 0 && step <= maxStep
                ? stepLabels[mech][step - 1]
                : 'Press step forward to begin.'}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn
                variant="primary"
                onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
                disabled={step >= maxStep}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStep(0)}>
                Reset
              </Btn>
            </div>

            <div
              style={{
                fontSize: 12.5,
                color: COLORS.inkSoft,
                lineHeight: 1.6,
                padding: '10px 12px',
                background: COLORS.panel,
                borderRadius: 6,
              }}
            >
              <strong>Tradeoff:</strong> {MECH_INFO[mech].tradeoff}
            </div>

            <Callout>
              <strong>Common mistake:</strong> assuming shared memory is always the "best" choice
              since it's fastest. Speed isn't everything — shared memory pushes ALL the
              synchronization responsibility onto you, the programmer, with zero safety net. Message
              passing is slower but much harder to get wrong, which is often the better tradeoff.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
