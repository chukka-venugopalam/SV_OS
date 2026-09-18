/*
  CHAPTER: D5 — Data Representation
    IEEE 754 Floating Point (numsys-ieee754-floating-point)

  WHAT THIS DEMONSTRATES
    - Enter a decimal, show the sign/exponent/mantissa bit breakdown live, including
      the biased exponent and implicit leading 1.
    - Demonstrate a non-associativity example (rounding error from reordering additions).

  DESIGN DECISIONS
    - Uses 32-bit single precision (sign 1 / exponent 8 / mantissa 23) since it's the
      standard teaching example and fits on a phone screen bit-by-bit.
    - The non-associativity demo uses a genuinely famous illustrative case (adding a
      tiny number to a huge number, then a moderate number, in different orders) with
      real floating point arithmetic computed live via JS numbers (which are IEEE 754
      doubles) so the rounding behavior shown is real, not scripted.
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

// Convert a JS number to IEEE-754 single precision bit fields using a DataView.
function toIEEE754Single(value: number) {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, value, false); // big-endian
  const bits = view.getUint32(0, false);
  const sign = (bits >>> 31) & 1;
  const exponentRaw = (bits >>> 23) & 0xff;
  const mantissaRaw = bits & 0x7fffff;
  const mantissaBits = mantissaRaw.toString(2).padStart(23, '0');
  const exponentBits = exponentRaw.toString(2).padStart(8, '0');
  const actualExponent = exponentRaw - 127;
  // reconstruct the actual stored float32 value (may differ from `value` due to rounding)
  const storedValue = view.getFloat32(0, false);
  return {
    sign,
    exponentRaw,
    exponentBits,
    mantissaRaw,
    mantissaBits,
    actualExponent,
    storedValue,
  };
}

function BitBox({ v, color, size = 22 }: { v: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size + 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        fontWeight: 700,
        background: color,
        borderRadius: 3,
        color: COLORS.ink,
        flexShrink: 0,
      }}
    >
      {v}
    </div>
  );
}

export default function Ieee754Visualizer() {
  const [decimalInput, setDecimalInput] = useState('13.375');
  const parsed = parseFloat(decimalInput);
  const valid = !isNaN(parsed);
  const rep = valid ? toIEEE754Single(parsed) : null;

  const [assocStep, setAssocStep] = useState(0);

  // classic non-associativity example: (a + b) + c vs a + (b + c)
  // Using values that expose float32 rounding by simulating float32 truncation via Math.fround
  const a = 1e20,
    b = -1e20,
    c = 1;
  const leftAssoc = Math.fround(Math.fround(a + b) + c); // (a+b)+c
  const rightAssoc = Math.fround(a + Math.fround(b + c)); // a+(b+c)

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
          Data Representation · D5
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          IEEE 754 Floating Point
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How computers store decimal numbers in bits — and why floating-point math can surprise
          you.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Computers can't store an infinitely precise decimal like 13.375 directly — instead, they
            use a standard called <strong>IEEE 754</strong> that splits a number into three parts
            packed into bits: a <strong>sign</strong> (positive or negative), an{' '}
            <strong>exponent</strong> (how large or small the number's scale is, like scientific
            notation), and a <strong>mantissa</strong> (the significant digits). This is essentially
            scientific notation in binary. Because only a limited number of bits are available, most
            decimal values get slightly rounded to the nearest representable value — which is why
            floating-point addition doesn't always behave the way you'd expect from real math.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm term="Sign bit" def="1 bit: 0 means positive, 1 means negative." />
          <KeyTerm
            term="Exponent (biased)"
            def="8 bits storing the power-of-2 scale, offset by +127 so it can represent negative exponents using only positive bit patterns."
          />
          <KeyTerm
            term="Mantissa (fraction)"
            def="23 bits storing the significant digits of the number, after the leading 1."
          />
          <KeyTerm
            term="Implicit leading 1"
            def="Normalized numbers always start with a 1 before the binary point, so that 1 isn't even stored — it's assumed, saving a bit."
          />
          <KeyTerm
            term="Rounding error"
            def="The tiny gap between the exact decimal value and the nearest value that IEEE 754 can actually represent."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Type any decimal number into the box below to see its 32-bit sign/exponent/mantissa
              breakdown update live.
            </Step>
            <Step>
              Read the "actual exponent" line to see the bias (+127) being subtracted back out.
            </Step>
            <Step>
              Try a number like 0.1 to see how it doesn't fit exactly — check the "stored value"
              line for the rounding error.
            </Step>
            <Step>
              Scroll down and press "Step through" to watch a real example where changing the ORDER
              of additions changes the answer.
            </Step>
          </ol>
        </Section>

        <Section title="Break a decimal number into its IEEE 754 bits">
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
              Decimal value
            </label>
            <input
              type="text"
              value={decimalInput}
              onChange={(e) => setDecimalInput(e.target.value)}
              style={{
                width: 140,
                padding: '6px 10px',
                borderRadius: 5,
                border: `1px solid ${COLORS.line}`,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                marginBottom: 18,
              }}
            />

            {!valid && (
              <div style={{ color: COLORS.red, fontSize: 13 }}>That's not a valid number.</div>
            )}

            {valid && rep && (
              <>
                <div style={{ marginBottom: 6, fontSize: 11.5, color: COLORS.inkSoft }}>
                  sign (1 bit) · exponent (8 bits, biased +127) · mantissa (23 bits)
                </div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16, flexWrap: 'wrap' }}>
                  <BitBox v={String(rep.sign)} color={COLORS.redSoft} />
                  {rep.exponentBits.split('').map((b, i) => (
                    <BitBox key={'e' + i} v={b} color={COLORS.amberSoft} />
                  ))}
                  {rep.mantissaBits.split('').map((b, i) => (
                    <BitBox key={'m' + i} v={b} color={COLORS.tealSoft} size={18} />
                  ))}
                </div>

                <div
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.9 }}
                >
                  <div>
                    Sign = {rep.sign} → {rep.sign === 0 ? 'positive' : 'negative'}
                  </div>
                  <div>
                    Exponent bits = {rep.exponentBits} = {rep.exponentRaw} (raw, biased)
                  </div>
                  <div>
                    Actual exponent = {rep.exponentRaw} − 127 = {rep.actualExponent}
                  </div>
                  <div>Mantissa bits = {rep.mantissaBits}</div>
                  <div>
                    Value = (implicit 1).{rep.mantissaBits} × 2^{rep.actualExponent}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: rep.storedValue !== parsed ? COLORS.red : COLORS.teal,
                    }}
                  >
                    Stored value = {rep.storedValue}{' '}
                    {rep.storedValue !== parsed
                      ? `(rounded from your input ${parsed} — this is the representable value)`
                      : '(exact match)'}
                  </div>
                </div>
              </>
            )}

            <Callout>
              <strong>Common mistake:</strong> forgetting the "implicit leading 1." The mantissa
              bits alone don't include that first 1 — it's assumed for every normalized number,
              which is why the value formula starts with "1." not "0.".
            </Callout>
          </div>
        </Section>

        <Section title="Non-associativity: order of addition can change the answer">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 14px 0' }}>
              In exact math, (a + b) + c always equals a + (b + c). With floating point, that's not
              guaranteed — rounding at each step can make the two orders disagree. Using a ={' '}
              {a.toExponential()}, b = {b.toExponential()}, c = {c}:
            </p>

            {assocStep >= 1 && (
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  lineHeight: 2,
                  marginBottom: 14,
                }}
              >
                <div>
                  Order 1 — (a + b) first: a + b = {a + b} (a and b cancel out exactly here), then +
                  c = {leftAssoc}
                </div>
                {assocStep >= 2 && (
                  <div style={{ marginTop: 8 }}>
                    Order 2 — (b + c) first: b + c = {Math.fround(b + c)} (c is utterly swallowed —
                    too small to register against b's huge scale), then + a = {rightAssoc}
                  </div>
                )}
                {assocStep >= 3 && (
                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 600,
                      color: leftAssoc !== rightAssoc ? COLORS.red : COLORS.teal,
                    }}
                  >
                    {leftAssoc !== rightAssoc
                      ? `Different answers! (a+b)+c = ${leftAssoc}, but a+(b+c) = ${rightAssoc}. The order of operations mattered.`
                      : `Both orders happened to agree this time: ${leftAssoc}.`}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setAssocStep((s) => Math.min(3, s + 1))}
                disabled={assocStep >= 3}
              >
                Step through
              </Btn>
              <Btn variant="ghost" onClick={() => setAssocStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> assuming floating-point rounding errors are rare edge
              cases you'll never hit. In reality, adding a huge number to a tiny one is common in
              real programs (running totals, simulations) — that's exactly why summation ORDER is a
              real engineering concern, not just a textbook curiosity.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
