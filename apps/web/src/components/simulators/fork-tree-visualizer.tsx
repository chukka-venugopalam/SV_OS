/*
  CHAPTER: D1 — Process Management (Act 4: Operating Systems)
    Process Creation — fork() & exec() (act4-d1-ch05-process-creation-fork-exec)

  WHAT THIS DEMONSTRATES
    fork() branching into parent/child with duplicated address space (different
    PIDs, same code); exec() replacing the child's memory image; show a shell-launch
    sequence as the worked example.

  DESIGN DECISIONS
    - Uses the canonical "shell launches a program" example (e.g. typing `ls` in a
      terminal) since it's the real-world scenario every student will recognize,
      grounding fork+exec in something concrete rather than abstract process trees.
    - Shows the address space contents explicitly changing (not just a label change)
      when exec() runs, since "same PID, completely different program" is the exact
      point that's easy to get wrong if only described in prose.
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

interface ProcessBox {
  pid: number;
  program: string;
  isChild?: boolean;
}

const FRAMES: { processes: ProcessBox[]; caption: string; highlightPid?: number }[] = [
  {
    processes: [{ pid: 100, program: 'bash (shell)' }],
    caption: "You're at a shell prompt. Only one process exists so far: bash, PID 100.",
  },
  {
    processes: [
      { pid: 100, program: 'bash (shell)' },
      { pid: 101, program: 'bash (shell) — EXACT COPY', isChild: true },
    ],
    caption:
      'You type "ls" and hit enter. bash calls fork(). This creates a new process (PID 101) that is an exact duplicate of bash — same code, same variables, same everything, just a new PID.',
    highlightPid: 101,
  },
  {
    processes: [
      { pid: 100, program: 'bash (shell)' },
      { pid: 101, program: 'ls (completely different program!)', isChild: true },
    ],
    caption:
      'The child process (PID 101) calls exec("ls"). This REPLACES its entire memory image with the ls program — same PID, but now running totally different code from scratch.',
    highlightPid: 101,
  },
  {
    processes: [
      { pid: 100, program: 'bash (shell) — waiting' },
      { pid: 101, program: 'ls — running, printing files' },
    ],
    caption:
      'bash (the parent) waits for PID 101 to finish. Meanwhile, ls runs independently and prints the directory listing.',
  },
  {
    processes: [{ pid: 100, program: 'bash (shell) — back at prompt' }],
    caption:
      'ls finishes and exits. bash resumes control and shows you the prompt again, ready for your next command.',
  },
];

function AddressSpaceBox({ proc, highlighted }: { proc: ProcessBox; highlighted: boolean }) {
  return (
    <div
      style={{
        border: `2px solid ${highlighted ? COLORS.amber : proc.isChild ? COLORS.teal : COLORS.line}`,
        borderRadius: 8,
        padding: '12px 16px',
        background: highlighted ? COLORS.amberSoft : proc.isChild ? COLORS.tealSoft : '#fff',
        minWidth: 180,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 4 }}>PID {proc.pid}</div>
      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        {proc.program}
      </div>
    </div>
  );
}

export default function ForkTreeVisualizer() {
  const [frameIdx, setFrameIdx] = useState(0);
  const frame = FRAMES[frameIdx];

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
          Process Creation: fork() &amp; exec()
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How your shell actually launches every program you run.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Every time you run a command in a terminal, two system calls work together behind the
            scenes.
            <strong> fork()</strong> creates a new process that starts as an EXACT duplicate of the
            calling process — same code, same memory, just a new process ID (PID). Right after
            forking, that child process usually calls <strong>exec()</strong>, which throws away its
            current program entirely and loads a completely different one in its place — same PID,
            brand new code. This two-step dance (duplicate, then replace) is how a shell launches
            every program you type.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="fork()"
            def="Creates a new process that is an identical copy of the calling process, with a new PID."
          />
          <KeyTerm
            term="exec()"
            def="Replaces the CURRENT process's memory image with a different program, keeping the same PID."
          />
          <KeyTerm
            term="PID"
            def="Process ID — a unique number the OS assigns to identify each running process."
          />
          <KeyTerm
            term="Parent / child"
            def="The original process that called fork() is the parent; the new copy it creates is the child."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Press "Next" to walk through a shell launching the "ls" command, step by step.
            </Step>
            <Step>Watch the child process appear as an exact duplicate right after fork().</Step>
            <Step>Notice its content completely change (same PID!) the moment exec() runs.</Step>
            <Step>See the parent wait, then resume once the child process finishes.</Step>
          </ol>
        </Section>

        <Section title='Worked example: your shell running "ls"'>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {frame.processes.map((p) => (
                <AddressSpaceBox key={p.pid} proc={p} highlighted={frame.highlightPid === p.pid} />
              ))}
            </div>

            <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '0 0 14px' }}>
              {frame.caption}
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setFrameIdx((f) => Math.max(0, f - 1))} disabled={frameIdx === 0}>
                Previous
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setFrameIdx((f) => Math.min(FRAMES.length - 1, f + 1))}
                disabled={frameIdx >= FRAMES.length - 1}
              >
                Next
              </Btn>
              <Btn variant="ghost" onClick={() => setFrameIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> thinking fork() and exec() are the same thing, or
              that you always need both together. fork() alone is useful on its own (e.g. a web
              server forking to handle multiple clients running the SAME code). It's specifically
              the fork-then-exec COMBO that's used for "launch a different program," like a shell
              does.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
