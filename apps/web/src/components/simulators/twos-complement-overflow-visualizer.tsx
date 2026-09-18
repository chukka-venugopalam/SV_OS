/*
  CHAPTER: D1 — Number Systems
    Signed Numbers, 2's Complement & Overflow Detection (numsys-signed-2s-complement-overflow)
    Separate from IEEE-754 (D5) — do not merge.

  WHAT THIS DEMONSTRATES
    - Enter a signed decimal, show sign-magnitude / 1's-complement / 2's-complement side by side.
    - Add two signed binary numbers and detect overflow via carry-into-sign-bit vs
      carry-out comparison, distinct from unsigned carry-out.

  DESIGN DECISIONS
    - Fixed at 8-bit width — big enough to show real overflow behavior, small enough
      to display every bit on a phone screen without wrapping.
    - Overflow rule implemented as: overflow = (carry into sign bit) XOR (carry out
      of sign bit) — the standard, reliable rule — rather than "check if the sign of
      the result looks wrong," which is a shortcut that beginners misapply.
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

const BITS = 8;
const MAX_VAL = 2 ** (BITS - 1) - 1; // 127
const MIN_VAL = -(2 ** (BITS - 1)); // -128

function toBinaryBits(n: number, bits: number): number[] {
  // returns array of 0/1, MSB first, unsigned representation of n (n assumed >= 0, < 2^bits)
  const arr: number[] = [];
  for (let i = bits - 1; i >= 0; i--) arr.push((n >> i) & 1);
  return arr;
}

function signMagnitude(n: number): number[] {
  const mag = Math.abs(n);
  const bits = toBinaryBits(mag, BITS - 1);
  return [n < 0 ? 1 : 0, ...bits];
}

function onesComplement(n: number): number[] {
  if (n >= 0) return toBinaryBits(n, BITS);
  const posBits = toBinaryBits(-n, BITS);
  return posBits.map((b) => (b === 0 ? 1 : 0));
}

function twosComplement(n: number): number[] {
  if (n >= 0) return toBinaryBits(n, BITS);
  const ones = onesComplement(n);
  // add 1
  const result = [...ones];
  let carry = 1;
  for (let i = BITS - 1; i >= 0 && carry; i--) {
    const sum = result[i] + carry;
    result[i] = sum % 2;
    carry = Math.floor(sum / 2);
  }
  return result;
}

function _bitsToString(bits: number[]): string {
  return bits.join('');
}

function addTwosComplement(aBits: number[], bBits: number[]) {
  const result: number[] = new Array(BITS).fill(0);
  let carry = 0;
  const carryIntoBit: number[] = new Array(BITS).fill(0);
  for (let i = BITS - 1; i >= 0; i--) {
    carryIntoBit[i] = carry;
    const sum = aBits[i] + bBits[i] + carry;
    result[i] = sum % 2;
    carry = Math.floor(sum / 2);
  }
  const carryOutOfSign = carry; // carry out of the MSB (leftmost, index 0)
  const carryIntoSign = carryIntoBit[0];
  const overflow = carryIntoSign !== carryOutOfSign;
  return { result, carryIntoSign, carryOutOfSign, overflow, carryIntoBit };
}

function bitsToSignedValue(bits: number[]): number {
  if (bits[0] === 0) {
    return parseInt(bits.slice(1).join(''), 2);
  } else {
    // two's complement negative: invert, add 1, negate
    const inv: number[] = bits.map((b) => (b === 0 ? 1 : 0));
    let carry = 1;
    const res: number[] = [...inv];
    for (let i = BITS - 1; i >= 0 && carry; i--) {
      const sum = res[i] + carry;
      res[i] = sum % 2;
      carry = Math.floor(sum / 2);
    }
    return -parseInt(res.join(''), 2);
  }
}

function BitRow({ bits, highlightSign = false }: { bits: number[]; highlightSign?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {bits.map((b, i) => (
        <div
          key={i}
          style={{
            width: 26,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 14,
            fontWeight: 600,
            background: i === 0 && highlightSign ? COLORS.amberSoft : COLORS.panel,
            border: `1px solid ${i === 0 && highlightSign ? COLORS.amber : COLORS.line}`,
            borderRadius: 3,
            color: COLORS.ink,
          }}
        >
          {b}
        </div>
      ))}
    </div>
  );
}

export default function TwosComplementOverflowVisualizer() {
  const [decimalInput, setDecimalInput] = useState(-45);

  const [addA, setAddA] = useState(90);
  const [addB, setAddB] = useState(70);
  const [addStep, setAddStep] = useState(0);

  const clamped = Math.max(MIN_VAL, Math.min(MAX_VAL, decimalInput));
  const smBits = signMagnitude(clamped);
  const ocBits = onesComplement(clamped);
  const tcBits = twosComplement(clamped);

  const aBits = twosComplement(addA);
  const bBits = twosComplement(addB);
  const addResult = addTwosComplement(aBits, bBits);
  const resultValue = bitsToSignedValue(addResult.result);

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
          Number Systems · D1
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Signed Numbers &amp; Two's Complement Overflow
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          How computers represent negative numbers, and how they know when addition has gone wrong.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Computers only store 0s and 1s, so representing a negative number takes a trick. There
            are three classic tricks: <strong>sign-magnitude</strong> (use one bit to mean + or −,
            then store the size),
            <strong> one's complement</strong> (flip every bit of the positive version), and{' '}
            <strong>two's complement</strong> (flip every bit, then add 1) — the one virtually every
            real computer actually uses, because it makes addition and subtraction "just work" with
            the same circuit as unsigned numbers. The catch: with only {BITS} bits, there's a
            limited range of numbers you can represent ({MIN_VAL} to {MAX_VAL}). If an addition
            tries to escape that range, you get <strong>overflow</strong> — and there's a specific
            rule using carry bits to detect it.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Sign bit"
            def="The leftmost bit — 0 means positive, 1 means negative (in sign-magnitude and two's complement)."
          />
          <KeyTerm
            term="One's complement"
            def="Flip every bit of the positive binary version of the number."
          />
          <KeyTerm
            term="Two's complement"
            def="Flip every bit, then add 1 — this is what real hardware uses to represent negatives."
          />
          <KeyTerm
            term="Carry"
            def="The '1' that gets bumped into the next column when two bits add up to more than 1, just like carrying in decimal addition."
          />
          <KeyTerm
            term="Overflow"
            def="When a result doesn't fit in the available bits — for signed addition, this happens when the carry INTO the sign bit differs from the carry OUT of the sign bit."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Type a decimal number into the box below to see its sign-magnitude, one's complement,
              and two's complement forms side by side, using {BITS} bits.
            </Step>
            <Step>
              Scroll down to the addition box, set two decimal numbers, and press "Step through the
              addition" to watch it happen bit by bit.
            </Step>
            <Step>
              Watch the carry-into-sign-bit and carry-out-of-sign-bit values — when they differ,
              overflow is flagged automatically.
            </Step>
            <Step>
              Try adding two large positive numbers (like 90 + 70) to force an overflow and see it
              caught.
            </Step>
          </ol>
        </Section>

        <Section title={`Represent a number in ${BITS} bits, three ways`}>
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
              Decimal value (range for {BITS}-bit two's complement: {MIN_VAL} to {MAX_VAL})
            </label>
            <input
              type="number"
              value={decimalInput}
              onChange={(e) => setDecimalInput(parseInt(e.target.value || '0', 10))}
              style={{
                width: 100,
                padding: '6px 10px',
                borderRadius: 5,
                border: `1px solid ${COLORS.line}`,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                marginBottom: 18,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                  Sign-magnitude
                </div>
                <BitRow bits={smBits} highlightSign />
              </div>
              <div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                  One's complement
                </div>
                <BitRow bits={ocBits} highlightSign={clamped < 0} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                  Two's complement (what real hardware uses)
                </div>
                <BitRow bits={tcBits} highlightSign={clamped < 0} />
              </div>
            </div>

            {clamped !== decimalInput && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: COLORS.red }}>
                Clamped to {clamped} — that's outside the {BITS}-bit signed range.
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> forgetting to add the "+1" step when computing two's
              complement — that's the difference between one's complement and two's complement, and
              it's easy to drop.
            </Callout>
          </div>
        </Section>

        <Section title="Add two signed binary numbers and check for overflow">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  A
                </label>
                <input
                  type="number"
                  value={addA}
                  onChange={(e) => {
                    setAddA(
                      Math.max(MIN_VAL, Math.min(MAX_VAL, parseInt(e.target.value || '0', 10))),
                    );
                    setAddStep(0);
                  }}
                  style={{
                    width: 80,
                    padding: '6px 10px',
                    borderRadius: 5,
                    border: `1px solid ${COLORS.line}`,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  B
                </label>
                <input
                  type="number"
                  value={addB}
                  onChange={(e) => {
                    setAddB(
                      Math.max(MIN_VAL, Math.min(MAX_VAL, parseInt(e.target.value || '0', 10))),
                    );
                    setAddStep(0);
                  }}
                  style={{
                    width: 80,
                    padding: '6px 10px',
                    borderRadius: 5,
                    border: `1px solid ${COLORS.line}`,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            {addStep >= 1 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 4 }}>
                  A = {addA} in two's complement
                </div>
                <BitRow bits={aBits} highlightSign />
                <div style={{ fontSize: 12, color: COLORS.inkSoft, margin: '10px 0 4px' }}>
                  B = {addB} in two's complement
                </div>
                <BitRow bits={bBits} highlightSign />
              </div>
            )}

            {addStep >= 2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 4 }}>
                  Result (added bit by bit, right to left, carrying as needed)
                </div>
                <BitRow bits={addResult.result} highlightSign />
              </div>
            )}

            {addStep >= 3 && (
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.9 }}>
                <div>Carry INTO the sign bit (leftmost column) = {addResult.carryIntoSign}</div>
                <div>Carry OUT of the sign bit = {addResult.carryOutOfSign}</div>
                <div
                  style={{
                    fontWeight: 600,
                    marginTop: 6,
                    color: addResult.overflow ? COLORS.red : COLORS.teal,
                  }}
                >
                  {addResult.overflow
                    ? `Overflow! Carry-in (${addResult.carryIntoSign}) ≠ carry-out (${addResult.carryOutOfSign}) — the result doesn't fit in ${BITS} bits.`
                    : `No overflow — carry-in (${addResult.carryIntoSign}) = carry-out (${addResult.carryOutOfSign}).`}
                </div>
                <div style={{ marginTop: 6, color: COLORS.inkSoft }}>
                  Bits read back as decimal: {resultValue}{' '}
                  {addResult.overflow ? `(wrong! true answer is ${addA + addB})` : '(correct)'}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn
                variant="primary"
                onClick={() => setAddStep((s) => Math.min(3, s + 1))}
                disabled={addStep >= 3}
              >
                {addStep === 0
                  ? "Convert both to two's complement"
                  : addStep === 1
                    ? 'Add bit by bit'
                    : 'Check for overflow'}
              </Btn>
              <Btn variant="ghost" onClick={() => setAddStep(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> assuming overflow means "the result's sign bit looks
              wrong." That's a symptom, not the rule — the reliable test is always comparing
              carry-in vs carry-out of the sign bit, which works even when eyeballing the sign is
              confusing.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
