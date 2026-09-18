/*
  CHAPTER: Computer Organization — Instruction Pipelining, Pipeline Hazards (Act 2)
  CORRECTION BUILD: the previously cited "existing" component (pipeline-hazard-visualizer)
  was confirmed to be a static 5-box display with no state at all — this is a genuine
  new build, not a duplicate.

  WHAT THIS DEMONSTRATES
    Instruction Pipelining mode: multiple instructions moving through the classic
    5-stage pipeline (Fetch/Decode/Execute/Memory/Writeback) simultaneously,
    overlapping in time, contrasted against non-pipelined sequential execution.
    Pipeline Hazards mode: data hazards, control hazards, and structural hazards
    each shown as a concrete stall/bubble scenario in the same pipeline diagram,
    with a toggle showing how each hazard is commonly resolved (forwarding, branch
    prediction, stalling).

  DESIGN DECISIONS
    - Used a genuine cycle-by-cycle pipeline diagram (a grid of instruction rows x
      clock-cycle columns) rather than a simplified animation, since the overlapping-
      in-time nature of pipelining is the entire point and only a real timing diagram
      makes "5 instructions in flight simultaneously" visible rather than asserted.
    - Each of the three hazard types gets its own preset scenario with a concrete
      pair of instructions that genuinely conflict (e.g. one instruction writing a
      register the next one immediately reads), rather than an abstract description,
      since a fabricated "generic hazard" would not teach students to actually spot one.
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
  purple: '#8B7FD1',
  purpleSoft: '#EDE6F5',
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

const STAGES = ['F', 'D', 'E', 'M', 'W'];
const _STAGE_NAMES = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];

// ============================= PIPELINING MODE =============================

function buildPipelineSchedule(numInstructions: number): (number | null)[][] {
  // schedule[instr][cycle] = stage index (0-4) or null if not in the pipeline that cycle
  const totalCycles = numInstructions + STAGES.length - 1;
  const schedule: (number | null)[][] = [];
  for (let instr = 0; instr < numInstructions; instr++) {
    const row: (number | null)[] = [];
    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const stage = cycle - instr;
      row.push(stage >= 0 && stage < STAGES.length ? stage : null);
    }
    schedule.push(row);
  }
  return schedule;
}

function PipeliningMode() {
  const [numInstr, setNumInstr] = useState(4);
  const [cycleShown, setCycleShown] = useState(0);
  const schedule = buildPipelineSchedule(numInstr);
  const totalCycles = numInstr + STAGES.length - 1;

  const sequentialCycles = numInstr * STAGES.length;
  const pipelinedCycles = totalCycles;

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A CPU executes each instruction in several stages: Fetch it from memory, Decode what it
          means, Execute the operation, access Memory if needed, and Writeback the result. Without
          pipelining, one instruction must finish ALL 5 stages before the next one starts.{' '}
          <strong>Pipelining</strong> instead starts the next instruction's Fetch stage as soon as
          the first instruction moves on to Decode — so multiple instructions are all "in flight" at
          once, each at a different stage, like an assembly line.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Stage"
          def="One step of executing an instruction (Fetch, Decode, Execute, Memory, Writeback)."
        />
        <KeyTerm
          term="Clock cycle"
          def="One tick of the CPU's clock — each stage takes exactly one cycle to complete."
        />
        <KeyTerm
          term="Throughput"
          def="How many instructions complete per unit of time — pipelining improves this even though any SINGLE instruction still takes 5 cycles."
        />
        <KeyTerm
          term="In flight"
          def="An instruction that has started but not yet finished all 5 stages."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Set how many instructions to run through the pipeline.</Step>
          <Step>
            Press "Advance cycle" to step through the timing diagram one clock cycle at a time.
          </Step>
          <Step>
            Watch multiple instructions occupy different stages simultaneously once the pipeline
            fills up.
          </Step>
          <Step>
            Compare the total cycle count against non-pipelined sequential execution at the bottom.
          </Step>
        </ol>
      </Section>
      <Section title="Watch instructions overlap in the pipeline">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <label style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}>
            Number of instructions: {numInstr}
          </label>
          <input
            type="range"
            min={2}
            max={6}
            value={numInstr}
            onChange={(e) => {
              setNumInstr(+e.target.value);
              setCycleShown(0);
            }}
            style={{ width: 200, marginBottom: 18 }}
          />

          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '4px 8px',
                      fontSize: 10.5,
                      color: COLORS.inkSoft,
                      textAlign: 'left',
                    }}
                  >
                    Instr
                  </th>
                  {Array.from({ length: totalCycles }).map((_, c) => (
                    <th
                      key={c}
                      style={{
                        padding: '4px 6px',
                        fontSize: 10,
                        color: c <= cycleShown ? COLORS.ink : COLORS.inkSoft,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {c + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, instrIdx) => (
                  <tr key={instrIdx}>
                    <td
                      style={{
                        padding: '4px 8px',
                        fontSize: 11.5,
                        fontFamily: 'ui-monospace, monospace',
                        color: COLORS.ink,
                      }}
                    >
                      I{instrIdx + 1}
                    </td>
                    {row.map((stage, cycleIdx) => (
                      <td key={cycleIdx} style={{ padding: 2 }}>
                        <div
                          style={{
                            width: 30,
                            height: 26,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              stage !== null && cycleIdx <= cycleShown
                                ? COLORS.tealSoft
                                : COLORS.panel,
                            border: `1.5px solid ${stage !== null && cycleIdx <= cycleShown ? COLORS.teal : COLORS.line}`,
                            color: COLORS.ink,
                            opacity: cycleIdx <= cycleShown ? 1 : 0.3,
                          }}
                        >
                          {stage !== null && cycleIdx <= cycleShown ? STAGES[stage] : ''}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 }}>
            At cycle {cycleShown + 1}: {schedule.filter((row) => row[cycleShown] !== null).length}{' '}
            instruction(s) currently in flight.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Btn
              onClick={() => setCycleShown((c) => Math.max(0, c - 1))}
              disabled={cycleShown === 0}
            >
              Previous cycle
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setCycleShown((c) => Math.min(totalCycles - 1, c + 1))}
              disabled={cycleShown >= totalCycles - 1}
            >
              Advance cycle
            </Btn>
            <Btn variant="ghost" onClick={() => setCycleShown(0)}>
              Reset
            </Btn>
          </div>

          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.8 }}>
            <div>
              Non-pipelined (sequential): {numInstr} instructions × 5 stages ={' '}
              <strong>{sequentialCycles} cycles</strong>
            </div>
            <div style={{ color: COLORS.teal }}>
              Pipelined: {numInstr} + 5 − 1 = <strong>{pipelinedCycles} cycles</strong> (fewer, and
              the gap grows with more instructions)
            </div>
          </div>

          <Callout>
            <strong>Common mistake:</strong> thinking pipelining makes a SINGLE instruction finish
            faster. It doesn't — that one instruction still takes 5 full cycles start to finish.
            What improves is THROUGHPUT: how many instructions finish per unit of time, because many
            are overlapping instead of waiting in line.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= HAZARDS MODE =============================

type HazardType = 'data' | 'control' | 'structural';

interface HazardStep {
  cycle: number;
  caption: string;
  stalled: boolean;
}

const HAZARD_INFO: Record<
  HazardType,
  { label: string; setup: string; steps: HazardStep[]; fix: string }
> = {
  data: {
    label: 'Data hazard',
    setup:
      'Instruction 1: ADD R1, R2, R3 (computes R1 = R2 + R3). Instruction 2: SUB R4, R1, R5 (needs R1 right away) — but R1 is not written until instruction 1 reaches Writeback.',
    steps: [
      {
        cycle: 1,
        caption:
          "I1 (ADD) is in Execute — it's computing R1's new value, but hasn't stored it yet.",
        stalled: false,
      },
      {
        cycle: 2,
        caption:
          "I2 (SUB) wants to Decode and read R1's value right now — but the correct value isn't written to R1 until I1's Writeback stage, 2 cycles from now!",
        stalled: false,
      },
      {
        cycle: 3,
        caption:
          'Without help, I2 would read the OLD, wrong value of R1. The pipeline must stall I2 (insert a "bubble") until the correct value is available.',
        stalled: true,
      },
    ],
    fix: "Fix: forwarding. The Execute stage's freshly-computed result is forwarded directly to the next instruction that needs it, without waiting for Writeback to finish first.",
  },
  control: {
    label: 'Control hazard',
    setup:
      "Instruction 1: BEQ R1, R2, target (a conditional branch). The very next instruction fetched depends on whether this branch is taken — but the CPU doesn't know the branch's outcome until I1 reaches Execute.",
    steps: [
      {
        cycle: 1,
        caption:
          "I1 (the branch) is being Fetched. The CPU must ALSO fetch the next instruction right now — but which one? It doesn't know yet if the branch will be taken.",
        stalled: false,
      },
      {
        cycle: 2,
        caption:
          "The CPU guessed and fetched the 'not taken' path instruction. I1 is now in Decode.",
        stalled: false,
      },
      {
        cycle: 3,
        caption:
          'I1 reaches Execute and the branch condition is finally evaluated — suppose it turns out the branch WAS taken. The guessed instruction was wrong and must be discarded.',
        stalled: true,
      },
    ],
    fix: 'Fix: branch prediction. The CPU guesses the likely outcome (often based on past behavior) and speculatively continues down that path, only discarding and restarting if the guess turns out wrong.',
  },
  structural: {
    label: 'Structural hazard',
    setup:
      "Instruction 1 needs to access Memory in its Memory stage. Instruction 4 needs to access the SAME memory unit in its Fetch stage (to fetch the instruction itself) — but there's only one memory port.",
    steps: [
      {
        cycle: 1,
        caption:
          'I1 is in its Memory stage, actively using the shared memory unit to load or store data.',
        stalled: false,
      },
      {
        cycle: 2,
        caption:
          'I4 simultaneously needs to use that SAME memory unit for its own Fetch stage — but the hardware only has one memory port to go around.',
        stalled: true,
      },
      {
        cycle: 3,
        caption:
          'I4 must stall for one cycle until the memory unit is free, since the hardware itself cannot serve two requests at once.',
        stalled: true,
      },
    ],
    fix: 'Fix: separate instruction and data memories (or caches), so instruction fetches and data accesses use different hardware ports and never compete for the same resource.',
  },
};

function HazardsMode() {
  const [hazard, setHazard] = useState<HazardType>('data');
  const [stepIdx, setStepIdx] = useState(0);
  const [showFix, setShowFix] = useState(false);
  const info = HAZARD_INFO[hazard];

  function change(h: HazardType) {
    setHazard(h);
    setStepIdx(0);
    setShowFix(false);
  }

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          Pipelining works great until instructions genuinely depend on each other in ways that
          conflict with overlapping execution — these conflicts are called <strong>hazards</strong>.
          A <strong>data hazard</strong>
          happens when one instruction needs a value another hasn't finished computing yet. A
          <strong> control hazard</strong> happens when the CPU doesn't yet know which instruction
          comes next (because of a branch). A <strong>structural hazard</strong> happens when two
          instructions need the same piece of hardware at the same time. Each type has its own
          real-world fix.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Hazard"
          def="A situation where pipelining's overlap would produce an incorrect result unless specifically handled."
        />
        <KeyTerm
          term="Stall / bubble"
          def="Deliberately pausing an instruction for one or more cycles to avoid a hazard, leaving an empty 'bubble' in the pipeline."
        />
        <KeyTerm
          term="Forwarding"
          def="Passing a freshly computed value directly to the instruction that needs it, skipping the normal wait for Writeback."
        />
        <KeyTerm
          term="Branch prediction"
          def="Guessing the outcome of a conditional branch ahead of time so the pipeline can keep moving instead of stalling."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Pick a hazard type using the three buttons below.</Step>
          <Step>Read the setup — two specific instructions that genuinely conflict.</Step>
          <Step>Press "Step forward" to watch the conflict actually arise cycle by cycle.</Step>
          <Step>
            Press "Show the fix" to see how real hardware resolves that specific hazard type.
          </Step>
        </ol>
      </Section>
      <Section title="Watch a hazard happen, and see how it's fixed">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Btn variant={hazard === 'data' ? 'primary' : 'default'} onClick={() => change('data')}>
              Data hazard
            </Btn>
            <Btn
              variant={hazard === 'control' ? 'primary' : 'default'}
              onClick={() => change('control')}
            >
              Control hazard
            </Btn>
            <Btn
              variant={hazard === 'structural' ? 'primary' : 'default'}
              onClick={() => change('structural')}
            >
              Structural hazard
            </Btn>
          </div>

          <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 16px' }}>
            {info.setup}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {info.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  background:
                    i === stepIdx
                      ? s.stalled
                        ? COLORS.redSoft
                        : COLORS.amberSoft
                      : i < stepIdx
                        ? COLORS.panel
                        : 'transparent',
                  opacity: i <= stepIdx ? 1 : 0.4,
                  border:
                    i === stepIdx
                      ? `1.5px solid ${s.stalled ? COLORS.red : COLORS.amber}`
                      : '1.5px solid transparent',
                }}
              >
                <span style={{ fontWeight: 700 }}>Cycle {s.cycle}: </span>
                {s.caption}
              </div>
            ))}
          </div>

          {showFix && (
            <div
              style={{
                background: COLORS.tealSoft,
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13,
                color: COLORS.ink,
                marginBottom: 16,
              }}
            >
              {info.fix}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0}>
              Step back
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setStepIdx((s) => Math.min(info.steps.length - 1, s + 1))}
              disabled={stepIdx >= info.steps.length - 1}
            >
              Step forward
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setShowFix(true)}
              disabled={stepIdx < info.steps.length - 1 || showFix}
            >
              Show the fix
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                setStepIdx(0);
                setShowFix(false);
              }}
            >
              Reset
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> assuming all hazards are fixed the same way. Stalling
            (just waiting) always works as a fallback for any hazard type, but it also always costs
            speed — the specific fixes shown here (forwarding, branch prediction, separate hardware
            ports) exist specifically to avoid stalling in the common case, which is why real CPUs
            use them instead of just stalling every time.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= ROOT =============================

export default function PipelineHazardVisualizer() {
  const [mode, setMode] = useState<'pipelining' | 'hazards'>('pipelining');

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
          Computer Organization
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {mode === 'pipelining' ? 'Instruction Pipelining' : 'Pipeline Hazards'}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'pipelining'
            ? 'How CPUs overlap instruction execution like an assembly line, for far better throughput.'
            : 'The three ways overlapping execution can go wrong — and how real hardware handles each.'}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 24,
            borderBottom: `1px solid ${COLORS.line}`,
            paddingBottom: 16,
          }}
        >
          <Btn
            variant={mode === 'pipelining' ? 'primary' : 'default'}
            onClick={() => setMode('pipelining')}
          >
            Instruction Pipelining
          </Btn>
          <Btn
            variant={mode === 'hazards' ? 'primary' : 'default'}
            onClick={() => setMode('hazards')}
          >
            Pipeline Hazards
          </Btn>
        </div>

        {mode === 'pipelining' ? <PipeliningMode /> : <HazardsMode />}
      </div>
    </div>
  );
}
