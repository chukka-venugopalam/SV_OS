/*
  CHAPTER: D4 — Sequential Circuits
    Mode "fsm":     Finite State Machines (seqcirc-finite-state-machines)
    Mode "timing":  JK, T, D Flip-Flops (seqcirc-jk-t-d-flipflops)
    Mode "counter": Ripple & Synchronous Counters (seqcirc-ripple-sync-counters-gap)
      — no source content exists for this chapter yet; built from general knowledge,
      flagged to content team per the build spec.

  WHAT THIS DEMONSTRATES
    FSM mode: student steps through an input sequence, watching current-state
      highlight change, with next-state logic feeding back into flip-flop inputs.
    Timing mode: SR/D/JK/T truth tables side by side; a clock-edge timing diagram
      showing setup/hold time and a metastability failure when violated.
    Counter mode: 3-bit counter counting up, ripple mode showing propagation delay
      through each flip-flop vs synchronous mode showing simultaneous clocking.

  DESIGN DECISIONS
    - All three modes share this file per spec naming, but each gets its own full
      WHAT IS THIS / KEY TERMS / HOW TO USE — no shared generic intro across modes.
    - FSM example uses a simple "detect the pattern 1-0-1 in a bit stream" machine,
      since it's concrete or a beginner can act out the input themselves bit by bit.
    - Metastability in the timing section is illustrated as a visual "glitch" state
      (input changing too close to the clock edge) rather than physically simulating
      analog voltage settling, which is out of scope for a conceptual visualizer.
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

// ============================= FSM MODE =============================
// Detects the pattern "1,0,1" appearing anywhere in an input bit stream (with overlap).
// States: S0 (no progress), S1 (saw '1'), S2 (saw '1,0'), S3 (MATCH, saw '1,0,1')
type FsmState = 'S0' | 'S1' | 'S2' | 'S3';
function fsmNext(state: FsmState, input: 0 | 1): FsmState {
  if (state === 'S0') return input === 1 ? 'S1' : 'S0';
  if (state === 'S1') return input === 0 ? 'S2' : 'S1';
  if (state === 'S2') return input === 1 ? 'S3' : 'S0';
  // S3 (match found) - restart tracking, allowing overlap: last bit was '1', treat like S1
  return input === 1 ? 'S1' : 'S0';
}

const FSM_POS: Record<FsmState, [number, number]> = {
  S0: [60, 120],
  S1: [180, 50],
  S2: [300, 120],
  S3: [180, 190],
};

function FsmMode() {
  const inputSequence = [1, 1, 0, 1, 0, 1, 0];
  const [pos, setPos] = useState(0); // how many inputs consumed
  const [state, setState] = useState<FsmState>('S0');
  const [_history, setHistory] = useState<FsmState[]>(['S0']);

  function step() {
    if (pos >= inputSequence.length) return;
    const input = inputSequence[pos] as 0 | 1;
    const next = fsmNext(state, input);
    setState(next);
    setHistory((h) => [...h, next]);
    setPos((p) => p + 1);
  }
  function reset() {
    setPos(0);
    setState('S0');
    setHistory(['S0']);
  }

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A <strong>finite state machine</strong> (FSM) is a system that's always in exactly one of
          a small, fixed number of "states," and moves between them based on input it receives.
          Think of a vending machine: it's in a "waiting for coins" state until you insert enough
          money, then it moves to a "ready to dispense" state. Here, the machine watches a stream of
          1s and 0s and tries to detect the exact pattern <strong>1, 0, 1</strong> appearing
          anywhere in it — each new bit either advances it closer to a match, or sends it back to
          start over.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="State"
          def="One specific 'situation' the machine can be in — here, how much progress it's made toward spotting the pattern."
        />
        <KeyTerm
          term="Transition"
          def="The rule for moving from one state to another, triggered by the next input bit."
        />
        <KeyTerm
          term="Current state"
          def="Which state the machine is in right now — highlighted below."
        />
        <KeyTerm
          term="Accepting / match state"
          def="A special state meaning 'the pattern was just found' — shown here as S3."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>The input bit stream is fixed below: 1, 1, 0, 1, 0, 1, 0.</Step>
          <Step>
            Press "Feed next bit" to send one bit into the machine and watch the highlighted state
            change.
          </Step>
          <Step>
            Watch for when the machine lands on S3 — that means it just found the pattern "1, 0, 1".
          </Step>
          <Step>Press reset to start over from the beginning of the stream.</Step>
        </ol>
      </Section>
      <Section title="Step through the bit stream: detecting pattern 1-0-1">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <svg
            viewBox="0 0 360 240"
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
                id="fsmArrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={COLORS.inkSoft} />
              </marker>
            </defs>
            {(['S0', 'S1', 'S2', 'S3'] as FsmState[]).map((s) => {
              const [x, y] = FSM_POS[s];
              const isActive = s === state;
              return (
                <g key={s}>
                  <circle
                    cx={x}
                    cy={y}
                    r={28}
                    fill={isActive ? COLORS.tealSoft : '#fff'}
                    stroke={isActive ? COLORS.teal : COLORS.line}
                    strokeWidth={isActive ? 3 : 1.5}
                  />
                  <text
                    x={x}
                    y={y + 5}
                    fontSize="14"
                    fontWeight={700}
                    fill={COLORS.ink}
                    textAnchor="middle"
                  >
                    {s}
                  </text>
                </g>
              );
            })}
            <text x={180} y={225} fontSize="10" fill={COLORS.inkSoft} textAnchor="middle">
              S3 = match just found (pattern 1-0-1 detected)
            </text>
          </svg>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {inputSequence.map((bit, i) => (
              <div
                key={i}
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 5,
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 700,
                  fontSize: 13,
                  background:
                    i < pos ? COLORS.tealSoft : i === pos ? COLORS.amberSoft : COLORS.panel,
                  border: `1.5px solid ${i === pos ? COLORS.amber : i < pos ? COLORS.teal : COLORS.line}`,
                }}
              >
                {bit}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginBottom: 14 }}>
            Current state: <strong style={{ color: COLORS.teal }}>{state}</strong>
            {state === 'S3' && (
              <span style={{ color: COLORS.red, marginLeft: 10, fontWeight: 700 }}>
                ← pattern matched!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={step} disabled={pos >= inputSequence.length}>
              Feed next bit
            </Btn>
            <Btn variant="ghost" onClick={reset}>
              Reset
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> thinking the machine "remembers" the whole input
            history. It doesn't — it only ever knows its CURRENT state. All the useful history is
            compressed into which of the 4 states it's sitting in right now.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= TIMING MODE =============================

function TimingMode() {
  const [violateTiming, setViolateTiming] = useState(false);

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A <strong>flip-flop</strong> is a tiny memory cell that holds a single bit (0 or 1), and
          only updates that bit at a specific moment — the "edge" of a clock signal ticking. There
          are a few standard flavors (SR, D, JK, T) that differ in how their inputs decide the next
          stored value. Because the flip-flop only looks at its inputs briefly around the clock
          edge, there are two timing rules it needs: inputs must be stable for a bit of time{' '}
          <em>before</em> the edge (<strong>setup time</strong>) and a bit of time
          <em> after</em> it (<strong>hold time</strong>). Break those rules and you can trigger
          <strong> metastability</strong> — the flip-flop gets stuck between 0 and 1 and its output
          becomes unpredictable.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Clock edge"
          def="The instant the clock signal switches (usually low to high) — the only moment a flip-flop updates."
        />
        <KeyTerm
          term="Setup time"
          def="How long the input must stay stable BEFORE the clock edge for the flip-flop to read it reliably."
        />
        <KeyTerm term="Hold time" def="How long the input must stay stable AFTER the clock edge." />
        <KeyTerm
          term="Metastability"
          def="An unpredictable, unstable output that happens when setup or hold time is violated — the flip-flop can't decide 0 or 1."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>
            Compare the four truth tables below to see how SR, D, JK, and T flip-flops differ.
          </Step>
          <Step>
            Look at the timing diagram — the input changes at a "safe" distance from the clock edge
            by default.
          </Step>
          <Step>
            Toggle "violate timing" to move the input change too close to the clock edge and see the
            metastability glitch appear.
          </Step>
        </ol>
      </Section>

      <Section title="Four flip-flop types, side by side">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <MiniTruthTable
              title="SR (Set-Reset)"
              cols={['S', 'R', 'Q next']}
              rows={[
                ['0', '0', 'Q (no change)'],
                ['0', '1', '0'],
                ['1', '0', '1'],
                ['1', '1', 'invalid'],
              ]}
            />
            <MiniTruthTable
              title="D (Data)"
              cols={['D', 'Q next']}
              rows={[
                ['0', '0'],
                ['1', '1'],
              ]}
            />
            <MiniTruthTable
              title="JK"
              cols={['J', 'K', 'Q next']}
              rows={[
                ['0', '0', 'Q (no change)'],
                ['0', '1', '0'],
                ['1', '0', '1'],
                ['1', '1', 'toggle (flip Q)'],
              ]}
            />
            <MiniTruthTable
              title="T (Toggle)"
              cols={['T', 'Q next']}
              rows={[
                ['0', 'Q (no change)'],
                ['1', 'toggle (flip Q)'],
              ]}
            />
          </div>
          <Callout>
            <strong>Common mistake:</strong> mixing up JK's "1,1 = toggle" with SR's "1,1 =
            invalid". JK was specifically designed to FIX that invalid SR case — that's the whole
            reason it exists.
          </Callout>
        </div>
      </Section>

      <Section title="Clock edge timing: setup, hold, and metastability">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <label
            style={{
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <input
              type="checkbox"
              checked={violateTiming}
              onChange={(e) => setViolateTiming(e.target.checked)}
            />
            Violate timing (move input change too close to the clock edge)
          </label>

          <svg
            viewBox="0 0 340 160"
            width="100%"
            style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
          >
            {/* clock signal */}
            <text x={10} y={20} fontSize="10" fill={COLORS.inkSoft}>
              Clock
            </text>
            <path
              d="M 50 30 L 50 15 L 150 15 L 150 30 L 250 30 L 250 15 L 320 15"
              stroke={COLORS.ink}
              strokeWidth={2}
              fill="none"
            />
            <line
              x1={150}
              y1={5}
              x2={150}
              y2={140}
              stroke={COLORS.red}
              strokeDasharray="3,3"
              strokeWidth={1}
            />
            <text x={152} y={12} fontSize="9" fill={COLORS.red}>
              clock edge
            </text>

            {/* data signal */}
            <text x={10} y={70} fontSize="10" fill={COLORS.inkSoft}>
              Data
            </text>
            <path
              d={
                violateTiming
                  ? 'M 50 80 L 140 80 L 140 65 L 320 65' // changes right before the edge (setup violation)
                  : 'M 50 80 L 100 80 L 100 65 L 320 65' // changes safely early
              }
              stroke={COLORS.teal}
              strokeWidth={2}
              fill="none"
            />

            {/* setup/hold window */}
            <rect
              x={violateTiming ? 138 : 100}
              y={55}
              width={violateTiming ? 45 : 60}
              height={30}
              fill={violateTiming ? COLORS.redSoft : COLORS.tealSoft}
              opacity={0.6}
            />
            <text x={violateTiming ? 145 : 105} y={100} fontSize="8" fill={COLORS.inkSoft}>
              setup window
            </text>

            {violateTiming && (
              <>
                <text x={160} y={125} fontSize="10" fill={COLORS.red} fontWeight={700}>
                  ⚠ metastable: Q output glitches
                </text>
                <path
                  d="M 150 125 L 155 118 L 160 132 L 165 122 L 170 128 L 175 120"
                  stroke={COLORS.red}
                  strokeWidth={1.5}
                  fill="none"
                />
              </>
            )}
            {!violateTiming && (
              <text x={160} y={125} fontSize="10" fill={COLORS.teal}>
                ✓ input stable well before the edge — reliable capture
              </text>
            )}
          </svg>

          <Callout>
            <strong>Common mistake:</strong> thinking metastability just means "the flip-flop gets
            the wrong value." It's worse than that — the output can hover at an invalid in-between
            voltage for an unpredictable amount of time, which is why real designs add extra margin
            around every clock edge.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

function MiniTruthTable({
  title,
  cols,
  rows,
}: {
  title: string;
  cols: string[];
  rows: string[][];
}) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: COLORS.ink }}>
        {title}
      </div>
      <table
        style={{
          borderCollapse: 'collapse',
          fontSize: 11.5,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                style={{
                  padding: '3px 8px',
                  borderBottom: `1.5px solid ${COLORS.line}`,
                  textAlign: 'center',
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} style={{ padding: '3px 8px', textAlign: 'center' }}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================= COUNTER MODE =============================

function CounterMode() {
  const [count, setCount] = useState(0); // 0-7, 3-bit
  const [mode, setMode] = useState<'ripple' | 'sync'>('ripple');
  const [rippleStage, setRippleStage] = useState(0); // for ripple animation, how many bits have updated so far

  const nextCount = (count + 1) % 8;
  const bits = (n: number) => [(n >> 2) & 1, (n >> 1) & 1, n & 1];
  const currentBits = bits(count);
  const nextBits = bits(nextCount);

  function tick() {
    if (mode === 'sync') {
      setCount(nextCount);
      return;
    }
    // ripple: animate bit 2 (LSB) first, then bit 1, then bit 0, each depending on previous flipping
    if (rippleStage < 3) {
      setRippleStage((s) => s + 1);
    } else {
      setCount(nextCount);
      setRippleStage(0);
    }
  }

  function reset() {
    setCount(0);
    setRippleStage(0);
  }

  const displayBits =
    mode === 'ripple' && rippleStage > 0 && rippleStage < 3
      ? currentBits.map((b, i) => (i >= 3 - rippleStage ? nextBits[i] : b))
      : mode === 'ripple' && rippleStage === 3
        ? nextBits
        : currentBits;

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A binary counter is just a chain of flip-flops that counts upward in binary each time the
          clock ticks — 000, 001, 010, 011, and so on. But there are two different ways to wire that
          chain. In a<strong> ripple counter</strong>, each flip-flop's clock comes from the
          PREVIOUS flip-flop's output — so a change has to "ripple" through one flip-flop at a time,
          causing a small delay at each stage. In a<strong> synchronous counter</strong>, every
          flip-flop shares the exact same clock signal, so they all update simultaneously with no
          ripple delay at all.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Bit position"
          def="Which power of 2 a bit represents — in a 3-bit counter, the bits represent 4, 2, and 1 (left to right)."
        />
        <KeyTerm
          term="Ripple counter"
          def="Each flip-flop is clocked by the previous one's output, so changes propagate one stage at a time."
        />
        <KeyTerm
          term="Synchronous counter"
          def="All flip-flops share one common clock, so they all change at exactly the same instant."
        />
        <KeyTerm
          term="Propagation delay"
          def="The tiny time lag before a flip-flop's output reflects its new input — the source of ripple delay."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Switch between "ripple" and "synchronous" mode using the buttons below.</Step>
          <Step>
            Press "Tick the clock" repeatedly to count up from 0 to 7 and watch it wrap back to 0.
          </Step>
          <Step>
            In ripple mode, press "Tick" multiple times per count to see the bits update one at a
            time, left to right, instead of all at once.
          </Step>
          <Step>Compare how synchronous mode updates every bit in a single step.</Step>
        </ol>
      </Section>
      <Section title="3-bit counter: ripple vs synchronous">
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
              variant={mode === 'ripple' ? 'primary' : 'default'}
              onClick={() => {
                setMode('ripple');
                reset();
              }}
            >
              Ripple counter
            </Btn>
            <Btn
              variant={mode === 'sync' ? 'primary' : 'default'}
              onClick={() => {
                setMode('sync');
                reset();
              }}
            >
              Synchronous counter
            </Btn>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            {displayBits.map((b, i) => (
              <div
                key={i}
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 18,
                  fontWeight: 700,
                  borderRadius: 6,
                  background:
                    mode === 'ripple' && rippleStage > 0 && i === 3 - rippleStage
                      ? COLORS.amberSoft
                      : COLORS.tealSoft,
                  border: `2px solid ${mode === 'ripple' && rippleStage > 0 && i === 3 - rippleStage ? COLORS.amber : COLORS.teal}`,
                  transition: 'all 0.25s ease',
                }}
              >
                {b}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {['4s place', '2s place', '1s place'].map((label) => (
              <div
                key={label}
                style={{ width: 44, textAlign: 'center', fontSize: 9.5, color: COLORS.inkSoft }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, marginBottom: 14 }}>
            Decimal value: <strong>{parseInt(displayBits.join(''), 2)}</strong>
            {mode === 'ripple' && rippleStage > 0 && rippleStage < 3 && (
              <span style={{ color: COLORS.amber, marginLeft: 10 }}>
                — mid-ripple, not all bits updated yet
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={tick}>
              {mode === 'sync'
                ? 'Tick the clock'
                : rippleStage < 3
                  ? 'Propagate to next bit'
                  : 'Tick the clock'}
            </Btn>
            <Btn variant="ghost" onClick={reset}>
              Reset to 0
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> assuming ripple counters are "wrong" — they're not,
            they're just slower for large bit widths, since the delay adds up stage by stage.
            Synchronous counters need more wiring (a shared clock to every stage) to avoid that
            cost.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= ROOT =============================

export default function FlipflopFsmVisualizer() {
  const [mode, setMode] = useState<'fsm' | 'timing' | 'counter'>('fsm');

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
          Sequential Circuits · D4
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {mode === 'fsm'
            ? 'Finite State Machines'
            : mode === 'timing'
              ? 'Flip-Flop Types & Timing'
              : 'Ripple vs Synchronous Counters'}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'fsm'
            ? 'A machine that remembers "where it is" and reacts to input, one step at a time.'
            : mode === 'timing'
              ? 'How memory circuits capture a bit safely — and what happens when timing goes wrong.'
              : 'Two ways to wire flip-flops into a binary counter, with very different speed tradeoffs.'}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 24,
            borderBottom: `1px solid ${COLORS.line}`,
            paddingBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Btn variant={mode === 'fsm' ? 'primary' : 'default'} onClick={() => setMode('fsm')}>
            FSM mode
          </Btn>
          <Btn
            variant={mode === 'timing' ? 'primary' : 'default'}
            onClick={() => setMode('timing')}
          >
            Flip-flop timing mode
          </Btn>
          <Btn
            variant={mode === 'counter' ? 'primary' : 'default'}
            onClick={() => setMode('counter')}
          >
            Counter mode
          </Btn>
        </div>

        {mode === 'fsm' ? <FsmMode /> : mode === 'timing' ? <TimingMode /> : <CounterMode />}
      </div>
    </div>
  );
}
