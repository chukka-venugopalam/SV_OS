/*
  CHAPTER: D4 — Synchronization (Act 4: Operating Systems)
    Mutex & Semaphores (act4-d4-ch02-mutex-semaphores)

  WHAT THIS DEMONSTRATES
    A mutex as a binary lock held by one thread; a counting semaphore permitting N
    threads into a resource pool simultaneously, with wait/signal (P/V) shown as
    atomic operations on the counter.

  DESIGN DECISIONS
    - Two clearly separate modes (mutex vs counting semaphore) since a mutex is
      really just the N=1 special case, but presenting them as visually distinct
      scenarios (1 slot vs several slots) makes the generalization concrete rather
      than asserting it as a claim.
    - wait()/signal() are shown as explicit counter decrement/increment operations
      with the counter value always visible, since P/V terminology is often
      memorized without students connecting it to "this is just a counter."
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

interface ThreadState {
  id: number;
  status: 'waiting' | 'inside' | 'idle';
}

export default function SemaphoreSignalingSim() {
  const [maxCount, setMaxCount] = useState(2); // 1 = mutex, >1 = counting semaphore
  const [count, setCount] = useState(2);
  const [threads, setThreads] = useState<ThreadState[]>([
    { id: 1, status: 'idle' },
    { id: 2, status: 'idle' },
    { id: 3, status: 'idle' },
    { id: 4, status: 'idle' },
  ]);
  const [log, setLog] = useState<string[]>([]);

  function changeMax(v: number) {
    setMaxCount(v);
    setCount(v);
    setThreads(threads.map((t) => ({ ...t, status: 'idle' })));
    setLog([]);
  }

  function wait(threadId: number) {
    setThreads((prev) => {
      const t = prev.find((x) => x.id === threadId);
      if (!t || t.status !== 'idle') return prev;
      if (count > 0) {
        setCount((c) => c - 1);
        setLog((l) => [
          ...l,
          `Thread ${threadId} calls wait() — count was ${count}, now ${count - 1}. Enters.`,
        ]);
        return prev.map((x) => (x.id === threadId ? { ...x, status: 'inside' } : x));
      } else {
        setLog((l) => [
          ...l,
          `Thread ${threadId} calls wait() — count is 0. BLOCKS until someone signals.`,
        ]);
        return prev.map((x) => (x.id === threadId ? { ...x, status: 'waiting' } : x));
      }
    });
  }

  function signal(threadId: number) {
    setThreads((prev) => {
      const t = prev.find((x) => x.id === threadId);
      if (!t || t.status !== 'inside') return prev;
      // find a waiting thread to wake, if any
      const waiter = prev.find((x) => x.status === 'waiting');
      setLog((l) => [
        ...l,
        `Thread ${threadId} calls signal() — count goes from ${count} to ${count + 1}.${waiter ? ` Thread ${waiter.id} was waiting and wakes up, immediately re-decrementing count to enter.` : ''}`,
      ]);
      if (waiter) {
        setCount((c) => c); // net zero change: +1 then -1 for waiter
        return prev.map((x) => {
          if (x.id === threadId) return { ...x, status: 'idle' };
          if (x.id === waiter.id) return { ...x, status: 'inside' };
          return x;
        });
      } else {
        setCount((c) => c + 1);
        return prev.map((x) => (x.id === threadId ? { ...x, status: 'idle' } : x));
      }
    });
  }

  function reset() {
    setCount(maxCount);
    setThreads(threads.map((t) => ({ ...t, status: 'idle' })));
    setLog([]);
  }

  const insideCount = threads.filter((t) => t.status === 'inside').length;

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
          Mutex &amp; Semaphores
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Controlling how many threads can access a resource at once — from exactly one, to any
          fixed number.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A <strong>semaphore</strong> is a counter that controls access to a limited resource.
            Threads call
            <strong> wait()</strong> (sometimes called P) to try to enter — this decrements the
            counter, but if the counter is already 0, the thread BLOCKS until someone leaves.
            Threads call <strong>signal()</strong>
            (sometimes called V) when they're done — this increments the counter and wakes up a
            waiting thread if one exists. A <strong>mutex</strong> is just a semaphore where the
            counter can only be 0 or 1 — exactly one thread allowed in at a time. A general counting
            semaphore allows any fixed number N simultaneously.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Semaphore counter"
            def="A number tracking how many more threads are currently allowed to enter the resource."
          />
          <KeyTerm
            term="wait() / P"
            def="Decrements the counter to try to enter; blocks the calling thread if the counter is already 0."
          />
          <KeyTerm
            term="signal() / V"
            def="Increments the counter when leaving, and wakes up a waiting thread if one exists."
          />
          <KeyTerm
            term="Mutex"
            def="A semaphore with a maximum count of 1 — allows exactly one thread in at a time."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Choose a maximum count: 1 for a mutex, higher for a counting semaphore.</Step>
            <Step>
              Click "wait()" under different threads to have them try to enter — watch the counter
              drop.
            </Step>
            <Step>
              Once the counter hits 0, watch a new wait() attempt get blocked instead of entering.
            </Step>
            <Step>
              Click "signal()" on a thread that's inside to have it leave — watch a blocked thread
              get woken up.
            </Step>
          </ol>
        </Section>

        <Section title="Try it: control access with a semaphore">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Btn variant={maxCount === 1 ? 'primary' : 'default'} onClick={() => changeMax(1)}>
                Mutex (max = 1)
              </Btn>
              <Btn variant={maxCount === 2 ? 'primary' : 'default'} onClick={() => changeMax(2)}>
                Counting semaphore (max = 2)
              </Btn>
            </div>

            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, marginBottom: 14 }}>
              Counter:{' '}
              <strong style={{ color: count > 0 ? COLORS.teal : COLORS.red }}>{count}</strong> /{' '}
              {maxCount} slots free ({insideCount} thread{insideCount !== 1 ? 's' : ''} currently
              inside)
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {threads.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    minWidth: 90,
                    textAlign: 'center',
                    background:
                      t.status === 'inside'
                        ? COLORS.tealSoft
                        : t.status === 'waiting'
                          ? COLORS.redSoft
                          : COLORS.panel,
                    border: `1.5px solid ${t.status === 'inside' ? COLORS.teal : t.status === 'waiting' ? COLORS.red : COLORS.line}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Thread {t.id}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: COLORS.inkSoft,
                      marginBottom: 8,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t.status}
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <Btn onClick={() => wait(t.id)} disabled={t.status !== 'idle'}>
                      wait()
                    </Btn>
                    <Btn onClick={() => signal(t.id)} disabled={t.status !== 'inside'}>
                      signal()
                    </Btn>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                maxHeight: 140,
                overflowY: 'auto',
                marginBottom: 14,
                fontSize: 11.5,
                fontFamily: 'ui-monospace, monospace',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: 3,
              }}
            >
              {log
                .slice()
                .reverse()
                .map((l, i) => (
                  <div key={i} style={{ color: COLORS.inkSoft }}>
                    {l}
                  </div>
                ))}
            </div>

            <Btn variant="ghost" onClick={reset}>
              Reset
            </Btn>

            <Callout>
              <strong>Common mistake:</strong> forgetting to call signal() after wait(). If a thread
              enters but never signals when it's done, the counter never goes back up — permanently
              reducing how many threads can ever enter again, even if that thread has finished its
              work.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
