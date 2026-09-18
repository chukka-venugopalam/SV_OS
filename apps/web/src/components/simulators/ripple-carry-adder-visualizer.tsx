/*
  CHAPTER: D3 — Combinational Circuits
    Half Adder & Full Adder (combcirc-half-full-adder)

  WHAT THIS DEMONSTRATES
    - Half adder (Sum=XOR, Carry=AND) with truth table.
    - Chain multiple full adders (with carry-in) into a ripple-carry multi-bit adder,
      animating the carry propagating left to right... actually right to left in terms
      of bit significance, but visually left-to-right in reading order since that's
      how students read binary addition by hand (see design decision below).

  DESIGN DECISIONS
    - Chose to animate carry propagation in the same left-to-right reading direction
      a student would use doing binary addition by hand on paper (rightmost bit first,
      carry moving leftward) rather than a strict circuit left-to-right signal-flow
      diagram, since this matches the "Must demonstrate" framing of watching the carry
      move the way the arithmetic actually works.
    - Fixed at 4-bit width for the ripple adder — enough to show 2+ carry propagations
      without becoming unreadable on a phone screen.
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

function Bit({ v, size = 32 }: { v: number; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 14,
        fontWeight: 700,
        background: v ? COLORS.tealSoft : COLORS.panel,
        border: `1.5px solid ${v ? COLORS.teal : COLORS.line}`,
        borderRadius: 5,
        color: COLORS.ink,
      }}
    >
      {v}
    </div>
  );
}

const BITS = 4;

function toBits(n: number, width: number): number[] {
  const arr: number[] = [];
  for (let i = width - 1; i >= 0; i--) arr.push((n >> i) & 1);
  return arr;
}

function rippleAdd(a: number[], b: number[]) {
  const width = a.length;
  const sum: number[] = new Array(width).fill(0);
  const carries: number[] = new Array(width + 1).fill(0); // carries[width] = carry-in to LSB = 0; carries[0] = final carry-out
  let carry = 0;
  for (let i = width - 1; i >= 0; i--) {
    carries[i + 1] = carry;
    const s = a[i] + b[i] + carry;
    sum[i] = s % 2;
    carry = Math.floor(s / 2);
  }
  carries[0] = carry;
  return { sum, carries, finalCarryOut: carry };
}

export default function RippleCarryAdderVisualizer() {
  const [haA, setHaA] = useState(1);
  const [haB, setHaB] = useState(1);

  const [faA, setFaA] = useState(1);
  const [faB, setFaB] = useState(1);
  const [faCin, setFaCin] = useState(1);

  const [multiA, setMultiA] = useState(11); // 1011
  const [multiB, setMultiB] = useState(6); // 0110
  const [activeStage, setActiveStage] = useState(-1); // -1 = not started, 0..BITS-1 = which bit position is highlighted, BITS = done

  const haSum = haA ^ haB;
  const haCarry = haA & haB;

  const faSum = faA ^ faB ^ faCin;
  const faCarryOut = (faA & faB) | (faCin & (faA ^ faB));

  const aBits = toBits(multiA, BITS);
  const bBits = toBits(multiB, BITS);
  const { sum, carries, finalCarryOut } = rippleAdd(aBits, bBits);

  function stepMulti() {
    setActiveStage((s) => Math.min(BITS, s + 1));
  }
  function resetMulti() {
    setActiveStage(-1);
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
          Combinational Circuits · D3
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Half Adder, Full Adder &amp; Ripple-Carry Addition
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          The building blocks computers use to add binary numbers, one bit at a time.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Adding two binary digits is almost like adding decimal digits by hand — except when a
            column adds up to more than 1, you "carry" into the next column, just like carrying a 1
            in decimal addition. A <strong>half adder</strong> is a tiny circuit that adds two
            single bits and produces a sum and a carry — but it can't accept a carry FROM a previous
            column. A <strong>full adder</strong> fixes that by also taking a carry-in, so many full
            adders can be chained together to add multi-bit numbers. Chaining them so the carry
            ripples from the rightmost bit to the leftmost is called a
            <strong> ripple-carry adder</strong> — exactly how binary addition works on paper.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="XOR (⊕)"
            def="A logic gate that outputs 1 only when its two inputs are different (0,1 or 1,0)."
          />
          <KeyTerm term="AND (·)" def="A logic gate that outputs 1 only when both inputs are 1." />
          <KeyTerm
            term="Sum"
            def="The result bit at this column, after adding the inputs (and any carry-in)."
          />
          <KeyTerm
            term="Carry"
            def="The bit bumped into the next column to the left when the total at this column is 2 or more."
          />
          <KeyTerm
            term="Ripple-carry adder"
            def="Multiple full adders chained together, where each one's carry-out feeds the next one's carry-in."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Toggle the two half-adder input bits below and watch the sum and carry outputs update
              instantly, alongside a full truth table.
            </Step>
            <Step>Do the same for the full adder — notice it has a third input, carry-in.</Step>
            <Step>
              Scroll to the 4-bit ripple adder, set two numbers, and press "Step forward" to watch
              the carry ripple from the rightmost column to the left.
            </Step>
            <Step>
              Try inputs that force several carries in a row (like 1011 + 0110) to see the ripple
              travel multiple columns.
            </Step>
          </ol>
        </Section>

        <Section title="Half adder: adds two bits, no carry-in">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center' }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                A:{' '}
                <input
                  type="checkbox"
                  checked={!!haA}
                  onChange={(e) => setHaA(e.target.checked ? 1 : 0)}
                />
              </label>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                B:{' '}
                <input
                  type="checkbox"
                  checked={!!haB}
                  onChange={(e) => setHaB(e.target.checked ? 1 : 0)}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 18 }}>
              <div style={{ textAlign: 'center' }}>
                <Bit v={haA} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>A</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={haB} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>B</div>
              </div>
              <div style={{ fontSize: 20, color: COLORS.inkSoft }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={haSum} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>Sum (A⊕B)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={haCarry} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>Carry (A·B)</div>
              </div>
            </div>

            <table
              style={{
                borderCollapse: 'collapse',
                fontSize: 12.5,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              <thead>
                <tr>
                  {['A', 'B', 'Sum', 'Carry'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '4px 12px',
                        borderBottom: `2px solid ${COLORS.line}`,
                        textAlign: 'center',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [0, 0],
                  [0, 1],
                  [1, 0],
                  [1, 1],
                ].map(([a, b], i) => (
                  <tr
                    key={i}
                    style={{
                      background: a === haA && b === haB ? COLORS.amberSoft : 'transparent',
                    }}
                  >
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>{a}</td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>{b}</td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>{a ^ b}</td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>{a & b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Full adder: adds two bits PLUS a carry-in">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                A:{' '}
                <input
                  type="checkbox"
                  checked={!!faA}
                  onChange={(e) => setFaA(e.target.checked ? 1 : 0)}
                />
              </label>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                B:{' '}
                <input
                  type="checkbox"
                  checked={!!faB}
                  onChange={(e) => setFaB(e.target.checked ? 1 : 0)}
                />
              </label>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                Carry-in:{' '}
                <input
                  type="checkbox"
                  checked={!!faCin}
                  onChange={(e) => setFaCin(e.target.checked ? 1 : 0)}
                />
              </label>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Bit v={faA} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>A</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={faB} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>B</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={faCin} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>Carry-in</div>
              </div>
              <div style={{ fontSize: 20, color: COLORS.inkSoft }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={faSum} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>Sum</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Bit v={faCarryOut} />
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>Carry-out</div>
              </div>
            </div>
            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12.5,
                color: COLORS.inkSoft,
              }}
            >
              Sum = A ⊕ B ⊕ Cin = {faA} ⊕ {faB} ⊕ {faCin} = {faSum}
              <br />
              Carry-out = (A·B) + (Cin·(A⊕B)) = {faCarryOut}
            </div>

            <Callout>
              <strong>Common mistake:</strong> forgetting the full adder's carry-out formula has TWO
              ways to produce a carry — either A and B are both 1, OR the carry-in combines with
              exactly one of A/B being 1. Missing the second case is a common bug when building this
              by hand.
            </Callout>
          </div>
        </Section>

        <Section title="4-bit ripple-carry adder: chaining full adders together">
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
                  A (0-15): {multiA}
                </label>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={multiA}
                  onChange={(e) => {
                    setMultiA(+e.target.value);
                    resetMulti();
                  }}
                  style={{ width: 160 }}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
                >
                  B (0-15): {multiB}
                </label>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={multiB}
                  onChange={(e) => {
                    setMultiB(+e.target.value);
                    resetMulti();
                  }}
                  style={{ width: 160 }}
                />
              </div>
            </div>

            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6 }}>
              bit position → (left = most significant, right = least significant, added first)
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {aBits.map((b, i) => (
                <Bit key={i} v={b} size={36} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, marginBottom: 10 }}>
              A = {multiA}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {bBits.map((b, i) => (
                <Bit key={i} v={b} size={36} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, marginBottom: 14 }}>
              B = {multiB}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {sum.map((b, i) => {
                const columnFromRight = BITS - 1 - i; // 0 = rightmost
                const isRevealed = activeStage > columnFromRight || activeStage === BITS;
                return (
                  <div
                    key={i}
                    style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 5,
                      background: isRevealed
                        ? activeStage - 1 === columnFromRight || (activeStage === BITS && i === 0)
                          ? COLORS.amberSoft
                          : COLORS.tealSoft
                        : COLORS.panel,
                      border: `1.5px solid ${isRevealed ? COLORS.teal : COLORS.line}`,
                      color: COLORS.ink,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isRevealed ? b : '?'}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, marginBottom: 4 }}>Sum</div>

            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 }}>
              Carry chain (right to left): {carries.slice(1).reverse().join(' → ')}{' '}
              {finalCarryOut
                ? `→ final carry-out = 1 (overflowed 4 bits!)`
                : '→ final carry-out = 0'}
            </div>

            {activeStage >= 0 && activeStage < BITS && (
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 14,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                Working on column {BITS - activeStage} from the right: adding bit{' '}
                {aBits[BITS - 1 - activeStage]} + bit {bBits[BITS - 1 - activeStage]} + carry-in{' '}
                {carries[BITS - activeStage]}.
              </div>
            )}
            {activeStage === BITS && (
              <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 600, marginBottom: 14 }}>
                Done! {multiA} + {multiB} = {parseInt(sum.join(''), 2)}
                {finalCarryOut ? ' (plus an overflow carry, since 4 bits can only hold 0-15)' : ''}.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="primary" onClick={stepMulti} disabled={activeStage >= BITS}>
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={resetMulti}>
                Reset
              </Btn>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
