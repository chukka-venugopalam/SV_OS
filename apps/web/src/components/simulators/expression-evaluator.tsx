/*
  CHAPTER: D2 — Linear Data Structures
    Expression Evaluation (d2-06-expression-evaluation)

  WHAT THIS DEMONSTRATES
    Infix→postfix conversion and postfix evaluation, both animated using an explicit
    operator/operand stack.

  DESIGN DECISIONS
    - Two clearly separated phases (convert, then evaluate) rather than one combined
      animation, since they use the stack for genuinely different purposes (operator
      precedence holding vs. operand accumulation) and conflating them would confuse
      which stack is doing what.
    - Fixed to +, -, *, / with standard precedence (no exponent, no parentheses) to
      keep the precedence table small and memorizable within this one tool.
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

function StackRow({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, minHeight: 34, alignItems: 'center' }}>
      {items.length === 0 && (
        <span style={{ fontSize: 12, color: COLORS.inkSoft, fontStyle: 'italic' }}>(empty)</span>
      )}
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            padding: '5px 10px',
            borderRadius: 5,
            background: i === items.length - 1 ? COLORS.amberSoft : COLORS.tealSoft,
            border: `1.5px solid ${i === items.length - 1 ? COLORS.amber : COLORS.teal}`,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {it}
        </div>
      ))}
    </div>
  );
}

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
function isOperator(tok: string) {
  return tok in PRECEDENCE;
}

function tokenize(expr: string): string[] {
  return expr.match(/\d+(\.\d+)?|[+\-*/]/g) || [];
}

function infixToPostfixTrace(tokens: string[]) {
  const trace: { token: string; stack: string[]; output: string[]; note: string }[] = [];
  const stack: string[] = [];
  const output: string[] = [];
  for (const tok of tokens) {
    if (!isOperator(tok)) {
      output.push(tok);
      trace.push({
        token: tok,
        stack: [...stack],
        output: [...output],
        note: `'${tok}' is a number — send it straight to the output.`,
      });
    } else {
      while (stack.length > 0 && PRECEDENCE[stack[stack.length - 1]] >= PRECEDENCE[tok]) {
        output.push(stack.pop() as string);
      }
      stack.push(tok);
      trace.push({
        token: tok,
        stack: [...stack],
        output: [...output],
        note: `'${tok}' is an operator — pop any higher/equal precedence operators to output first, then push '${tok}'.`,
      });
    }
  }
  while (stack.length > 0) {
    output.push(stack.pop() as string);
    trace.push({
      token: '(flush)',
      stack: [...stack],
      output: [...output],
      note: `End of expression — pop all remaining operators to output.`,
    });
  }
  return { trace, result: output };
}

function postfixEvalTrace(postfix: string[]) {
  const trace: { token: string; stack: string[]; note: string }[] = [];
  const stack: string[] = [];
  for (const tok of postfix) {
    if (!isOperator(tok)) {
      stack.push(tok);
      trace.push({ token: tok, stack: [...stack], note: `Push number ${tok} onto the stack.` });
    } else {
      const b = parseFloat(stack.pop() as string);
      const a = parseFloat(stack.pop() as string);
      let result: number;
      if (tok === '+') result = a + b;
      else if (tok === '-') result = a - b;
      else if (tok === '*') result = a * b;
      else result = a / b;
      stack.push(String(result));
      trace.push({
        token: tok,
        stack: [...stack],
        note: `Pop two values (${a}, ${b}), compute ${a} ${tok} ${b} = ${result}, push the result back.`,
      });
    }
  }
  return { trace, result: stack[0] };
}

export default function ExpressionEvaluator() {
  const [infixInput, setInfixInput] = useState('3+4*2-1');
  const tokens = tokenize(infixInput);
  const conversion = infixToPostfixTrace(tokens);
  const [convStep, setConvStep] = useState(0);

  const evalResult = postfixEvalTrace(conversion.result);
  const [evalStep, setEvalStep] = useState(0);

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
          Expression Evaluation with Stacks
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Converting the math you write into a form a computer can evaluate without guessing
          precedence.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            The way humans normally write math — "3 + 4 × 2" — is called <strong>infix</strong>{' '}
            notation (operators sit between numbers). It's natural for us, but tricky for a computer
            to evaluate directly, because it has to remember precedence rules (do multiplication
            before addition) using extra logic.
            <strong> Postfix</strong> notation puts operators AFTER their numbers instead — "3 4 2 ×
            +" — which can be evaluated left to right with a simple stack and NO precedence rules
            needed at evaluation time. Converting infix to postfix, and then evaluating postfix, are
            both classic stack-based algorithms.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Infix"
            def="The normal way of writing math, with operators between operands: 3 + 4."
          />
          <KeyTerm
            term="Postfix"
            def="Operators come AFTER their operands: 3 4 +. Also called Reverse Polish Notation."
          />
          <KeyTerm
            term="Precedence"
            def="The rule for which operator gets evaluated first — multiplication and division outrank addition and subtraction."
          />
          <KeyTerm
            term="Operator stack"
            def="Used during conversion to temporarily hold operators until it's their turn to be output."
          />
          <KeyTerm
            term="Operand stack"
            def="Used during postfix evaluation to hold numbers waiting to be combined."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Type an infix expression using +, -, *, / and numbers (e.g. 3+4*2-1).</Step>
            <Step>
              Press "Step forward" in the conversion box to build the postfix version token by
              token.
            </Step>
            <Step>
              Once conversion is done, scroll to the evaluation box and step through — numbers get
              pushed, operators pop two and combine them.
            </Step>
            <Step>
              Try an expression where precedence actually matters, like 2+3*4, and see the
              multiplication get sequenced first even though addition appears first.
            </Step>
          </ol>
        </Section>

        <Section title="Step 1: convert infix to postfix">
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
              Infix expression
            </label>
            <input
              type="text"
              value={infixInput}
              onChange={(e) => {
                setInfixInput(e.target.value);
                setConvStep(0);
                setEvalStep(0);
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
              {tokens.map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 4,
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      i < convStep
                        ? COLORS.tealSoft
                        : i === convStep
                          ? COLORS.amberSoft
                          : COLORS.panel,
                    border: `1.5px solid ${i < convStep ? COLORS.teal : i === convStep ? COLORS.amber : COLORS.line}`,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 4 }}>
                Operator stack
              </div>
              <StackRow items={convStep > 0 ? conversion.trace[convStep - 1].stack : []} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 4 }}>
                Output (postfix so far)
              </div>
              <StackRow items={convStep > 0 ? conversion.trace[convStep - 1].output : []} />
            </div>

            {convStep > 0 && convStep <= conversion.trace.length && (
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 14,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {conversion.trace[convStep - 1].note}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setConvStep((s) => Math.min(conversion.trace.length, s + 1))}
                disabled={convStep >= conversion.trace.length}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setConvStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> using strictly-greater-than instead of
              greater-than-or-EQUAL when comparing precedence. For left-to-right operators like +
              and -, you need to pop equal-precedence operators too, or you'll get the wrong
              evaluation order for expressions like "10-3-2".
            </Callout>
          </div>
        </Section>

        <Section title="Step 2: evaluate the postfix expression">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, marginBottom: 16 }}>
              Postfix: {conversion.result.join(' ')}
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
              {conversion.result.map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 4,
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      i < evalStep
                        ? COLORS.tealSoft
                        : i === evalStep
                          ? COLORS.amberSoft
                          : COLORS.panel,
                    border: `1.5px solid ${i < evalStep ? COLORS.teal : i === evalStep ? COLORS.amber : COLORS.line}`,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 4 }}>
                Operand stack
              </div>
              <StackRow items={evalStep > 0 ? evalResult.trace[evalStep - 1].stack : []} />
            </div>

            {evalStep > 0 && evalStep <= evalResult.trace.length && (
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 14,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {evalResult.trace[evalStep - 1].note}
              </div>
            )}

            {evalStep >= evalResult.trace.length && evalResult.trace.length > 0 && (
              <div
                style={{
                  background: COLORS.tealSoft,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.teal,
                  marginBottom: 14,
                }}
              >
                Final result: {evalResult.result}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setEvalStep((s) => Math.min(evalResult.trace.length, s + 1))}
                disabled={evalStep >= evalResult.trace.length}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setEvalStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> popping the two operands in the wrong order for
              subtraction/division. The stack gives you the SECOND number first — so for "a b -",
              you must compute a − b, not b − a. Getting this backwards silently produces the wrong
              answer.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
