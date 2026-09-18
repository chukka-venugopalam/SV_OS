/*
  CHAPTER: D5 — File Systems (Act 4: Operating Systems)
    Disk Scheduling (act4-d5-ch05-disk-scheduling)

  WHAT THIS DEMONSTRATES
    A request queue serviced by FCFS (wild head swings), SSTF (closest-first, risk
    of starvation), SCAN, and C-SCAN, animating the disk arm's physical movement and
    total seek distance for each.

  DESIGN DECISIONS
    - All 4 algorithms run against the IDENTICAL request queue and starting head
      position, with total seek distance computed and displayed for each, so the
      comparison is a direct, honest apples-to-apples number rather than four
      separately-tuned examples.
    - The disk is drawn as a horizontal track (not a circular platter) since seek
      distance as literal horizontal pixel distance is more immediately legible than
      an abstract angular representation, even though real disks are circular.
    - SSTF's starvation risk is called out via an explicit note when a request would
      be serviced last purely because of ordering, not distance — making the
      abstract "risk of starvation" concrete with the actual request that suffers.
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

const TRACK_MAX = 200;
const REQUESTS = [45, 170, 90, 15, 130, 60];
const START_HEAD = 100;

type Algo = 'fcfs' | 'sstf' | 'scan' | 'cscan';

function computeOrder(algo: Algo, requests: number[], start: number): number[] {
  if (algo === 'fcfs') return [start, ...requests];

  if (algo === 'sstf') {
    const remaining = [...requests];
    const order = [start];
    let cur = start;
    while (remaining.length > 0) {
      let closestIdx = 0;
      for (let i = 1; i < remaining.length; i++) {
        if (Math.abs(remaining[i] - cur) < Math.abs(remaining[closestIdx] - cur)) closestIdx = i;
      }
      cur = remaining[closestIdx];
      order.push(cur);
      remaining.splice(closestIdx, 1);
    }
    return order;
  }

  if (algo === 'scan') {
    // move toward higher tracks first (down toward TRACK_MAX), servicing along the way, then reverse
    const higher = requests.filter((r) => r >= start).sort((a, b) => a - b);
    const lower = requests.filter((r) => r < start).sort((a, b) => b - a);
    return [start, ...higher, TRACK_MAX, ...lower];
  }

  // cscan: move toward higher tracks, service along the way, jump back to 0, then continue up servicing remaining
  const higher = requests.filter((r) => r >= start).sort((a, b) => a - b);
  const lower = requests.filter((r) => r < start).sort((a, b) => a - b);
  return [start, ...higher, TRACK_MAX, 0, ...lower];
}

function totalSeek(order: number[]): number {
  let total = 0;
  for (let i = 1; i < order.length; i++) total += Math.abs(order[i] - order[i - 1]);
  return total;
}

const ALGO_INFO: Record<Algo, { label: string; desc: string }> = {
  fcfs: {
    label: 'FCFS',
    desc: 'Service requests in the exact order they arrived — simple, but can cause wild back-and-forth arm swings.',
  },
  sstf: {
    label: 'SSTF',
    desc: 'Always service whichever remaining request is CLOSEST to the current head position — minimizes immediate movement, but can starve far-away requests.',
  },
  scan: {
    label: 'SCAN',
    desc: 'Sweep in one direction all the way to the end, servicing requests along the way, then reverse and sweep back — like an elevator.',
  },
  cscan: {
    label: 'C-SCAN',
    desc: 'Like SCAN, but after reaching one end, jump immediately back to the start WITHOUT servicing on the way back, then sweep again — keeps wait times more even.',
  },
};

export default function DiskArmScheduler() {
  const [algo, setAlgo] = useState<Algo>('fcfs');
  const [stepIdx, setStepIdx] = useState(0);

  const order = computeOrder(algo, REQUESTS, START_HEAD);
  const seek = totalSeek(order);

  function changeAlgo(a: Algo) {
    setAlgo(a);
    setStepIdx(0);
  }

  // Starvation note for SSTF: find a request serviced last purely due to distance ordering, not arrival order
  const sstfOrder = computeOrder('sstf', REQUESTS, START_HEAD);
  const lastServiced = sstfOrder[sstfOrder.length - 1];
  const arrivalIndexOfLast = REQUESTS.indexOf(lastServiced);

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
          File Systems · D5 (Act 4: OS)
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Disk Arm Scheduling
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Four strategies for deciding which disk request to service next — each with a different
          movement pattern.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A spinning disk's read/write head physically has to move to different tracks to service
            different requests — and that physical movement (the <strong>seek</strong>) is slow
            compared to everything else the computer does. When multiple requests are waiting, the
            ORDER you service them in dramatically changes how much total distance the arm travels.{' '}
            <strong>FCFS</strong> just goes in arrival order. <strong>SSTF</strong> always jumps to
            the nearest waiting request.
            <strong> SCAN</strong> sweeps like an elevator, servicing everything along the way.
            <strong> C-SCAN</strong> is a SCAN variant that keeps service times more evenly spread
            out.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Seek"
            def="The disk arm physically moving from its current track to a new one — the slow part of a disk operation."
          />
          <KeyTerm
            term="Seek distance"
            def="How many tracks the arm has to move — the total across all requests is what these algorithms try to minimize."
          />
          <KeyTerm
            term="Starvation"
            def="A request that keeps getting skipped over in favor of closer ones, potentially waiting a very long time."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              All four algorithms below service the SAME request queue, starting from the same head
              position.
            </Step>
            <Step>
              Pick an algorithm and press "Step forward" to watch the arm move request by request.
            </Step>
            <Step>
              Compare the total seek distance across algorithms — notice how much the ordering
              strategy matters.
            </Step>
            <Step>
              Check the SSTF starvation note to see a concrete case of a request getting delayed.
            </Step>
          </ol>
        </Section>

        <Section title={`Requests: {${REQUESTS.join(', ')}}, starting head at ${START_HEAD}`}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(Object.keys(ALGO_INFO) as Algo[]).map((a) => (
                <Btn
                  key={a}
                  variant={algo === a ? 'primary' : 'default'}
                  onClick={() => changeAlgo(a)}
                >
                  {ALGO_INFO[a].label}
                </Btn>
              ))}
            </div>

            <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 16px' }}>
              {ALGO_INFO[algo].desc}
            </p>

            <svg
              viewBox="0 0 340 100"
              width="100%"
              style={{
                display: 'block',
                background: COLORS.panel,
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <line x1={20} y1={50} x2={320} y2={50} stroke={COLORS.inkSoft} strokeWidth={1.5} />
              <text x={20} y={70} fontSize="9" fill={COLORS.inkSoft} textAnchor="middle">
                0
              </text>
              <text x={320} y={70} fontSize="9" fill={COLORS.inkSoft} textAnchor="middle">
                {TRACK_MAX}
              </text>

              {REQUESTS.map((r, i) => {
                const x = 20 + (r / TRACK_MAX) * 300;
                const serviced = order.slice(1, stepIdx + 1).includes(r);
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={50}
                      r={5}
                      fill={serviced ? COLORS.teal : COLORS.panel}
                      stroke={serviced ? COLORS.teal : COLORS.inkSoft}
                      strokeWidth={1.5}
                    />
                    <text x={x} y={35} fontSize="9" fill={COLORS.inkSoft} textAnchor="middle">
                      {r}
                    </text>
                  </g>
                );
              })}

              {/* head position marker */}
              {(() => {
                const headPos = order[Math.min(stepIdx, order.length - 1)];
                const x = 20 + (headPos / TRACK_MAX) * 300;
                return (
                  <polygon
                    points={`${x - 6},${20} ${x + 6},${20} ${x},${30}`}
                    fill={COLORS.amber}
                  />
                );
              })()}
            </svg>

            <div
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, marginBottom: 14 }}
            >
              Order so far: {order.slice(0, stepIdx + 1).join(' → ')}
              <div style={{ marginTop: 4 }}>
                Total seek distance (full sequence):{' '}
                <strong style={{ color: COLORS.teal }}>{seek}</strong> tracks
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setStepIdx((i) => Math.min(order.length - 1, i + 1))}
                disabled={stepIdx >= order.length - 1}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(0)}>
                Reset
              </Btn>
            </div>

            {algo === 'sstf' && (
              <div
                style={{
                  padding: '8px 12px',
                  background: COLORS.redSoft,
                  borderRadius: 6,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                <strong>Starvation note:</strong> request {lastServiced} (the{' '}
                {arrivalIndexOfLast + 1}
                {arrivalIndexOfLast === 0
                  ? 'st'
                  : arrivalIndexOfLast === 1
                    ? 'nd'
                    : arrivalIndexOfLast === 2
                      ? 'rd'
                      : 'th'}{' '}
                to arrive) gets serviced LAST under SSTF — not because it arrived late, but purely
                because it's far from every other request. Under heavy load, a request like this
                could wait indefinitely.
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> assuming SSTF always has the lowest total seek
              distance since it's "greedy." It often does well, but it's not GUARANTEED optimal —
              being locally greedy at every step can occasionally lead to more total movement than a
              strategy that plans a full sweep, like SCAN.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
