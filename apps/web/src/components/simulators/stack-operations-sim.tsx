/*
  CHAPTER: D2 — Linear Data Structures
    Stacks (d2-03-stacks)

  WHAT THIS DEMONSTRATES
    push/pop/peek animated as a LIFO stack; a balanced-parentheses checker running
    live as a worked example.

  DESIGN DECISIONS
    - Two clearly separated sub-sections: a free-play stack (student pushes/pops
      whatever they want) and the parentheses checker (a guided worked example) —
      keeping them apart avoids conflating "here's what a stack is" with "here's
      what you can build with one."
    - The parentheses checker shows the stack's contents at every character position,
      not just the final yes/no answer, since watching the stack grow and shrink IS
      the mechanism being taught.
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

function StackDisplay({
  items,
  highlightTop,
}: {
  items: (string | number)[];
  highlightTop?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 4,
        minHeight: 50,
        alignItems: 'flex-start',
      }}
    >
      {items.length === 0 && (
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontStyle: 'italic' }}>
          (empty stack)
        </div>
      )}
      {items.map((item, i) => {
        const isTop = i === items.length - 1;
        return (
          <div
            key={i}
            style={{
              width: 100,
              padding: '8px 12px',
              borderRadius: 5,
              background: isTop && highlightTop ? COLORS.amberSoft : COLORS.tealSoft,
              border: `1.5px solid ${isTop && highlightTop ? COLORS.amber : COLORS.teal}`,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.ink,
              position: 'relative',
            }}
          >
            {item}
            {isTop && (
              <span
                style={{
                  position: 'absolute',
                  right: -46,
                  top: 8,
                  fontSize: 10.5,
                  color: COLORS.inkSoft,
                }}
              >
                ← top
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const OPEN = { '(': ')', '[': ']', '{': '}' } as const;
const CLOSE = { ')': '(', ']': '[', '}': '{' } as const;

function checkBalanced(s: string) {
  const trace: { char: string; stackAfter: string[]; ok: boolean; note: string }[] = [];
  const stack: string[] = [];
  let failed = false;
  for (const char of s) {
    if (char in OPEN) {
      stack.push(char);
      trace.push({
        char,
        stackAfter: [...stack],
        ok: true,
        note: `Push '${char}' onto the stack.`,
      });
    } else if (char in CLOSE) {
      const expectedOpen = CLOSE[char as keyof typeof CLOSE];
      const top = stack[stack.length - 1];
      if (top === expectedOpen) {
        stack.pop();
        trace.push({
          char,
          stackAfter: [...stack],
          ok: true,
          note: `'${char}' matches the top of the stack ('${top}') — pop it.`,
        });
      } else {
        trace.push({
          char,
          stackAfter: [...stack],
          ok: false,
          note: top
            ? `'${char}' does NOT match the top ('${top}') — unbalanced!`
            : `'${char}' has nothing to match — stack is empty!`,
        });
        failed = true;
        break;
      }
    }
  }
  const balanced = !failed && stack.length === 0;
  return { trace, balanced, leftoverStack: stack };
}

export default function StackOperationsSim() {
  const [stack, setStack] = useState<number[]>([5, 12, 8]);
  const [pushValue, setPushValue] = useState(1);

  const [expr, setExpr] = useState('({[]})');
  const [charIdx, setCharIdx] = useState(0);
  const result = checkBalanced(expr);
  const visibleTrace = result.trace.slice(0, charIdx);
  const currentStackShown =
    charIdx === 0 ? [] : (visibleTrace[visibleTrace.length - 1]?.stackAfter ?? []);
  const isDone = charIdx >= result.trace.length;

  function push() {
    setStack((s) => [...s, pushValue]);
  }
  function pop() {
    setStack((s) => s.slice(0, -1));
  }
  function _peek() {
    // no-op state change; visual highlight handled by highlightTop prop always on for demonstration
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
          Linear Data Structures · D2
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Stacks: Push, Pop &amp; Peek
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Last in, first out — and a real use case: checking if brackets match up.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A stack is a collection where you can only add or remove from ONE end — think of a stack
            of plates: you put a new plate on top, and you take plates off the top too. This rule is
            called
            <strong> LIFO</strong> (last in, first out) — whatever was added most recently is the
            first thing to come back out. The three basic operations are <strong>push</strong> (add
            to the top),
            <strong> pop</strong> (remove from the top), and <strong>peek</strong> (look at the top
            without removing it). Stacks show up constantly in real programming — undo buttons,
            browser back buttons, and (as shown below) checking whether brackets in code are
            properly matched.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="LIFO"
            def="Last In, First Out — the most recently added item is always the first one removed."
          />
          <KeyTerm term="Push" def="Add a new item to the top of the stack." />
          <KeyTerm term="Pop" def="Remove and return the item currently on top of the stack." />
          <KeyTerm term="Peek" def="Look at the top item without removing it." />
          <KeyTerm
            term="Top"
            def="The single item currently accessible — the only one you can push onto or pop from."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Type a number and press "Push" to add it to the top of the stack below.</Step>
            <Step>Press "Pop" to remove whatever's currently on top.</Step>
            <Step>
              Scroll down to the bracket checker, type any mix of brackets, and press "Step forward"
              to watch the stack grow and shrink character by character.
            </Step>
            <Step>
              Try an unbalanced example like "([)]" to see exactly where and why it fails.
            </Step>
          </ol>
        </Section>

        <Section title="Free play: push and pop">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <input
                type="number"
                value={pushValue}
                onChange={(e) => setPushValue(+e.target.value)}
                style={{
                  width: 70,
                  padding: '6px 10px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                }}
              />
              <Btn variant="primary" onClick={push}>
                Push
              </Btn>
              <Btn onClick={pop} disabled={stack.length === 0}>
                Pop
              </Btn>
            </div>
            <StackDisplay items={stack} highlightTop />
            {stack.length > 0 && (
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 10 }}>
                Peek would show: <strong>{stack[stack.length - 1]}</strong> (without removing it)
              </div>
            )}
          </div>
        </Section>

        <Section title="Worked example: checking balanced brackets">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <label
              style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
            >
              Expression to check
            </label>
            <input
              type="text"
              value={expr}
              onChange={(e) => {
                setExpr(e.target.value);
                setCharIdx(0);
              }}
              style={{
                width: 200,
                padding: '6px 10px',
                borderRadius: 5,
                border: `1px solid ${COLORS.line}`,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 15,
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
              {expr.split('').map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 14,
                    background:
                      i < charIdx
                        ? result.trace[i]?.ok
                          ? COLORS.tealSoft
                          : COLORS.redSoft
                        : i === charIdx
                          ? COLORS.amberSoft
                          : COLORS.panel,
                    border: `1.5px solid ${i < charIdx ? (result.trace[i]?.ok ? COLORS.teal : COLORS.red) : i === charIdx ? COLORS.amber : COLORS.line}`,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                Stack contents right now:
              </div>
              <StackDisplay items={currentStackShown} />
            </div>

            {charIdx > 0 && charIdx <= result.trace.length && (
              <div
                style={{
                  fontSize: 13,
                  fontFamily: 'ui-monospace, monospace',
                  color: result.trace[charIdx - 1]?.ok ? COLORS.ink : COLORS.red,
                  marginBottom: 14,
                }}
              >
                {result.trace[charIdx - 1]?.note}
              </div>
            )}

            {isDone && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  background: result.balanced ? COLORS.tealSoft : COLORS.redSoft,
                  color: result.balanced ? COLORS.teal : COLORS.red,
                }}
              >
                {result.balanced
                  ? '✓ Balanced! Every bracket was matched and the stack ended up empty.'
                  : '✗ Not balanced.'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setCharIdx((i) => Math.min(result.trace.length, i + 1))}
                disabled={isDone}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setCharIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> forgetting to check that the stack ends up completely
              EMPTY. An expression like "(()" never triggers a mismatch, but it's still unbalanced —
              there's a leftover unmatched '(' still sitting on the stack at the end.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
