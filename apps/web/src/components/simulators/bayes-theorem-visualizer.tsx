/*
  CHAPTER: D0 — Engineering Mathematics
    Mode "counting": Counting Principles & Permutations/Combinations (math-counting-permutations-combinations)
    Mode "bayes":    Probability Theory & Bayes' Theorem (math-probability-bayes-theorem)

  WHAT THIS DEMONSTRATES
    Counting mode: sum rule vs product rule via an editable live example, step-by-step
    nPr/nCr computation, and a pigeonhole-principle collision animation.
    Bayes mode: editable prior/likelihood sliders updating P(A|B) live, plus a worked
    base-rate-fallacy example (rare disease test) showing P(A|B) != P(B|A).

  DESIGN DECISIONS
    - Two modes share this file (per spec: "same tool, second mode") but each has its
      own complete WHAT IS THIS / KEY TERMS / HOW TO USE — no shared generic intro.
    - Pigeonhole demo uses literal pigeons-into-holes visual since it's the classic
      framing and gives a concrete image beginners can hold onto.
    - Bayes disease-test example deliberately uses whole-number counts (out of 1000
      people) instead of raw probabilities first, then shows the percentage — counts
      are easier for beginners to reason about than abstract percentages.
*/

import React, { useState, useEffect, useRef } from 'react';

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
          letterSpacing: '0.01em',
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
        transition: 'transform 0.1s ease',
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}

function factorial(n: number): number {
  if (n < 0) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function nPr(n: number, r: number): number {
  if (r > n || r < 0) return 0;
  return factorial(n) / factorial(n - r);
}
function nCr(n: number, r: number): number {
  if (r > n || r < 0) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

// ============================= COUNTING MODE =============================

function CountingMode() {
  const [shirts, setShirts] = useState(3);
  const [pants, setPants] = useState(2);
  const [ruleStep, setRuleStep] = useState(0); // 0 idle, 1 show shirts, 2 show pants, 3 show product

  const [n, setN] = useState(5);
  const [r, setR] = useState(2);
  const [permStep, setPermStep] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  const [pigeons, setPigeons] = useState(5);
  const [holes, setHoles] = useState(4);
  const [pigeonStep, setPigeonStep] = useState(0);
  const [assignment, setAssignment] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function runPigeonhole() {
    setAssignment([]);
    setPigeonStep(1);
    let i = 0;
    const arr: number[] = [];
    function placeNext() {
      if (i >= pigeons) {
        setPigeonStep(3);
        return;
      }
      arr.push(i % holes);
      setAssignment([...arr]);
      i++;
      timerRef.current = setTimeout(placeNext, 500);
    }
    timerRef.current = setTimeout(placeNext, 300);
    setPigeonStep(2);
  }

  function resetPigeonhole() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAssignment([]);
    setPigeonStep(0);
  }

  // detect first collision hole
  const holeCounts = Array(holes).fill(0);
  assignment.forEach((h) => holeCounts[h]++);
  const collisionHole = holeCounts.findIndex((c) => c >= 2);

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          Counting problems ask "how many different ways can this happen?" There are two basic rules
          for combining choices. The <strong>sum rule</strong> applies when you're picking{' '}
          <em>one option from a group OR another group</em> (add the possibilities). The{' '}
          <strong>product rule</strong> applies when you're making{' '}
          <em>one choice AND then another choice</em> (multiply the possibilities). This tool also
          shows the
          <strong> pigeonhole principle</strong>: if you have more items than containers, at least
          one container must end up with more than one item — guaranteed, no luck involved.
        </p>
      </Section>

      <Section title="Key terms">
        <KeyTerm
          term="Sum rule"
          def="If task A can be done in m ways and task B in n ways, and you do A or B (not both), total ways = m + n."
        />
        <KeyTerm
          term="Product rule"
          def="If task A can be done in m ways and task B in n ways, and you do A then B, total ways = m × n."
        />
        <KeyTerm
          term="Permutation (nPr)"
          def="The number of ways to arrange r items out of n, where order matters."
        />
        <KeyTerm
          term="Combination (nCr)"
          def="The number of ways to choose r items out of n, where order does NOT matter."
        />
        <KeyTerm
          term="Pigeonhole principle"
          def="If you place more items into containers than there are containers, some container must hold at least 2 items."
        />
      </Section>

      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>
            Use the sliders below to change how many shirts and pants you have, and watch the outfit
            count update.
          </Step>
          <Step>Click "Walk through the product rule" to see it build up step by step.</Step>
          <Step>
            Move to the permutations/combinations box, change n and r, and press "Step through" to
            see the formula work on real numbers.
          </Step>
          <Step>
            In the pigeonhole box, set more pigeons than holes and press "Run it" to watch a
            collision get forced.
          </Step>
        </ol>
      </Section>

      {/* --- Product Rule --- */}
      <Section title="The product rule, live: choosing an outfit">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 16px 0' }}>
            You're picking one shirt AND one pair of pants. Each shirt can be paired with each pair
            of pants — that's the product rule in action.
          </p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                Shirts: {shirts}
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={shirts}
                onChange={(e) => {
                  setShirts(+e.target.value);
                  setRuleStep(0);
                }}
                style={{ width: 140 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                Pants: {pants}
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={pants}
                onChange={(e) => {
                  setPants(+e.target.value);
                  setRuleStep(0);
                }}
                style={{ width: 140 }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${pants}, 28px)`,
              gridTemplateRows: `repeat(${shirts}, 28px)`,
              gap: 6,
              marginBottom: 16,
            }}
          >
            {Array.from({ length: shirts * pants }).map((_, idx) => {
              const row = Math.floor(idx / pants);
              const col = idx % pants;
              const revealedCount =
                ruleStep === 3
                  ? shirts * pants
                  : ruleStep === 2
                    ? pants
                    : ruleStep === 1
                      ? 0
                      : shirts * pants;
              const visible =
                ruleStep === 0 || idx < revealedCount || (ruleStep === 2 && row === 0);
              return (
                <div
                  key={idx}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 5,
                    background: visible ? COLORS.teal : COLORS.panel,
                    transition: 'background 0.3s ease',
                  }}
                  title={`Shirt ${row + 1} + Pants ${col + 1}`}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn
              variant="primary"
              onClick={() => {
                setRuleStep(1);
                setTimeout(() => setRuleStep(2), 700);
                setTimeout(() => setRuleStep(3), 1400);
              }}
            >
              Walk through the product rule
            </Btn>
            <Btn variant="ghost" onClick={() => setRuleStep(0)}>
              Reset
            </Btn>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 13.5,
              fontFamily: 'ui-monospace, monospace',
              color: COLORS.ink,
              minHeight: 20,
            }}
          >
            {ruleStep === 0 && (
              <span style={{ color: COLORS.inkSoft }}>
                Total outfits = {shirts} shirts × {pants} pants = {shirts * pants}
              </span>
            )}
            {ruleStep >= 1 && <span>Step 1 — you have {shirts} shirt choices.</span>}
            {ruleStep >= 2 && <div>Step 2 — for EACH shirt, you have {pants} pants choices.</div>}
            {ruleStep >= 3 && (
              <div style={{ color: COLORS.teal, fontWeight: 600 }}>
                Step 3 — total = {shirts} × {pants} = {shirts * pants} outfits.
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* --- nPr / nCr --- */}
      <Section title="Permutations (nPr) vs combinations (nCr)">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 16px 0' }}>
            Say you have {n} people and want to pick {r} of them. If the order they're picked in
            matters (like 1st place, 2nd place), that's a permutation. If order doesn't matter (just
            "who's on the team"), that's a combination.
          </p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                n (total people): {n}
              </label>
              <input
                type="range"
                min={2}
                max={8}
                value={n}
                onChange={(e) => {
                  const v = +e.target.value;
                  setN(v);
                  if (r > v) setR(v);
                  setPermStep(0);
                }}
                style={{ width: 140 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                r (how many picked): {r}
              </label>
              <input
                type="range"
                min={0}
                max={n}
                value={r}
                onChange={(e) => {
                  setR(+e.target.value);
                  setPermStep(0);
                }}
                style={{ width: 140 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Btn
              variant={!showCombo ? 'primary' : 'default'}
              onClick={() => {
                setShowCombo(false);
                setPermStep(0);
              }}
            >
              Permutation (order matters)
            </Btn>
            <Btn
              variant={showCombo ? 'primary' : 'default'}
              onClick={() => {
                setShowCombo(true);
                setPermStep(0);
              }}
            >
              Combination (order doesn't matter)
            </Btn>
          </div>

          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13.5,
              lineHeight: 1.8,
              color: COLORS.ink,
            }}
          >
            {!showCombo ? (
              <>
                <div>nPr = n! / (n − r)!</div>
                {permStep >= 1 && (
                  <div>
                    = {n}! / ({n} − {r})!
                  </div>
                )}
                {permStep >= 2 && (
                  <div>
                    = {factorial(n)} / {factorial(n - r)}
                  </div>
                )}
                {permStep >= 3 && (
                  <div style={{ color: COLORS.teal, fontWeight: 600 }}>= {nPr(n, r)} ways</div>
                )}
              </>
            ) : (
              <>
                <div>nCr = n! / (r! × (n − r)!)</div>
                {permStep >= 1 && (
                  <div>
                    = {n}! / ({r}! × ({n} − {r})!)
                  </div>
                )}
                {permStep >= 2 && (
                  <div>
                    = {factorial(n)} / ({factorial(r)} × {factorial(n - r)})
                  </div>
                )}
                {permStep >= 3 && (
                  <div style={{ color: COLORS.teal, fontWeight: 600 }}>= {nCr(n, r)} ways</div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn onClick={() => setPermStep((s) => Math.min(3, s + 1))} disabled={permStep >= 3}>
              Step forward
            </Btn>
            <Btn variant="ghost" onClick={() => setPermStep(0)}>
              Reset
            </Btn>
          </div>
        </div>
      </Section>

      {/* --- Pigeonhole --- */}
      <Section title="Pigeonhole principle: a forced collision">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '0 0 16px 0' }}>
            If you have more pigeons than holes, at least one hole must get 2+ pigeons — no matter
            how you place them. Set pigeons {'>'} holes below and watch it happen automatically.
          </p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                Pigeons: {pigeons}
              </label>
              <input
                type="range"
                min={2}
                max={8}
                value={pigeons}
                onChange={(e) => {
                  setPigeons(+e.target.value);
                  resetPigeonhole();
                }}
                style={{ width: 140 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                Holes: {holes}
              </label>
              <input
                type="range"
                min={2}
                max={7}
                value={holes}
                onChange={(e) => {
                  setHoles(+e.target.value);
                  resetPigeonhole();
                }}
                style={{ width: 140 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {Array.from({ length: holes }).map((_, h) => (
              <div key={h} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '0 0 10px 10px',
                    border: `2px solid ${h === collisionHole && pigeonStep === 3 ? COLORS.red : COLORS.line}`,
                    background:
                      h === collisionHole && pigeonStep === 3 ? COLORS.redSoft : COLORS.panel,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {holeCounts[h] > 0 ? holeCounts[h] : ''}
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 4 }}>
                  Hole {h + 1}
                </div>
              </div>
            ))}
          </div>

          {pigeonStep === 3 && (
            <div
              style={{
                background: pigeons > holes ? COLORS.redSoft : COLORS.tealSoft,
                border: `1px solid ${pigeons > holes ? COLORS.red : COLORS.teal}`,
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13,
                color: COLORS.ink,
                marginBottom: 14,
              }}
            >
              {pigeons > holes
                ? `${pigeons} pigeons, only ${holes} holes → hole ${collisionHole + 1} was forced to take 2 pigeons. This always happens whenever pigeons > holes.`
                : `${pigeons} pigeons, ${holes} holes → no collision was forced this time, since pigeons ≤ holes.`}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={runPigeonhole} disabled={pigeonStep === 2}>
              Run it
            </Btn>
            <Btn variant="ghost" onClick={resetPigeonhole}>
              Reset
            </Btn>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: COLORS.amberSoft,
              borderRadius: 6,
              fontSize: 12.5,
              color: COLORS.ink,
            }}
          >
            <strong>Common mistake:</strong> people think pigeonhole tells you WHICH hole gets
            doubled up — it doesn't. It only guarantees SOME hole does, not which one.
          </div>
        </div>
      </Section>
    </div>
  );
}

// ============================= BAYES MODE =============================

function BayesMode() {
  const [prior, setPrior] = useState(1); // % chance of having condition
  const [sensitivity, setSensitivity] = useState(90); // P(positive | has condition)
  const [falsePositiveRate, setFalsePositiveRate] = useState(9); // P(positive | no condition)
  const [step, setStep] = useState(0);
  const population = 1000;

  const withCondition = Math.round(population * (prior / 100));
  const withoutCondition = population - withCondition;
  const truePositives = Math.round(withCondition * (sensitivity / 100));
  const falsePositives = Math.round(withoutCondition * (falsePositiveRate / 100));
  const totalPositives = truePositives + falsePositives;
  const pAgivenB = totalPositives > 0 ? (truePositives / totalPositives) * 100 : 0;

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          Bayes' theorem answers: "given some evidence, how likely is a particular cause?" It's easy
          to confuse <em>P(A given B)</em> with <em>P(B given A)</em> — they are usually very
          different numbers. The classic example: a medical test for a rare disease can be "90%
          accurate" and still mean that <strong>most positive results are false alarms</strong>,
          simply because the disease is rare to begin with. This is called the base-rate fallacy.
        </p>
      </Section>

      <Section title="Key terms">
        <KeyTerm
          term="Prior (base rate)"
          def="How common the condition is in the whole population, before any test is done."
        />
        <KeyTerm
          term="Sensitivity"
          def="P(test positive | you actually have the condition) — how often the test catches real cases."
        />
        <KeyTerm
          term="False positive rate"
          def="P(test positive | you do NOT have the condition) — how often the test wrongly flags a healthy person."
        />
        <KeyTerm
          term="P(A | B)"
          def="The probability of A, given that we already know B happened — read as 'probability of A given B'."
        />
      </Section>

      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>
            Drag the sliders to set how rare the condition is, and how accurate the test is.
          </Step>
          <Step>
            Watch the 1,000-person grid split into who actually has the condition and who tests
            positive.
          </Step>
          <Step>
            Press "Reveal the answer" to see P(has condition | tested positive) computed step by
            step.
          </Step>
          <Step>
            Try setting prior very low (1%) — notice how even a "90% accurate" test gives mostly
            false alarms.
          </Step>
        </ol>
      </Section>

      <Section title="The base-rate fallacy, worked out on 1,000 people">
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                How rare is the condition? {prior}% of people have it
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={prior}
                onChange={(e) => {
                  setPrior(+e.target.value);
                  setStep(0);
                }}
                style={{ width: 200 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                Test sensitivity: catches {sensitivity}% of real cases
              </label>
              <input
                type="range"
                min={50}
                max={100}
                value={sensitivity}
                onChange={(e) => {
                  setSensitivity(+e.target.value);
                  setStep(0);
                }}
                style={{ width: 200 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
              >
                False positive rate: wrongly flags {falsePositiveRate}% of healthy people
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={falsePositiveRate}
                onChange={(e) => {
                  setFalsePositiveRate(+e.target.value);
                  setStep(0);
                }}
                style={{ width: 200 }}
              />
            </div>
          </div>

          {/* population grid: 1000 people as 25x40 dots, colored by category */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(40, 1fr)',
              gap: 1.5,
              marginBottom: 16,
              padding: 10,
              background: COLORS.panel,
              borderRadius: 6,
            }}
          >
            {Array.from({ length: population }).map((_, i) => {
              let color = '#D9D2C3'; // healthy, tested negative (default, most common)
              if (i < truePositives)
                color = COLORS.teal; // has condition, correctly caught
              else if (i < withCondition)
                color = '#B8D9D4'; // has condition, missed (false negative)
              else if (i < withCondition + falsePositives) color = COLORS.red; // healthy, false alarm
              const show = step >= 1;
              return (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    paddingBottom: '100%',
                    borderRadius: 1,
                    background: show ? color : '#E4DFD3',
                    transition: 'background 0.4s ease',
                  }}
                />
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 16,
              fontSize: 11.5,
              color: COLORS.inkSoft,
            }}
          >
            <Legend color={COLORS.teal} label={`Has it, test caught it (${truePositives})`} />
            <Legend
              color="#B8D9D4"
              label={`Has it, test missed it (${withCondition - truePositives})`}
            />
            <Legend color={COLORS.red} label={`Healthy, false alarm (${falsePositives})`} />
            <Legend
              color="#D9D2C3"
              label={`Healthy, correctly cleared (${withoutCondition - falsePositives})`}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Btn variant="primary" onClick={() => setStep(1)} disabled={step >= 1}>
              Show the population
            </Btn>
            <Btn variant="primary" onClick={() => setStep(2)} disabled={step < 1 || step >= 2}>
              Reveal the answer
            </Btn>
            <Btn variant="ghost" onClick={() => setStep(0)}>
              Reset
            </Btn>
          </div>

          {step >= 2 && (
            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
                lineHeight: 1.9,
                color: COLORS.ink,
              }}
            >
              <div>
                Out of {population} people: {withCondition} actually have the condition,{' '}
                {withoutCondition} don't.
              </div>
              <div>
                Positive tests = true positives + false positives = {truePositives} +{' '}
                {falsePositives} = {totalPositives}
              </div>
              <div style={{ color: COLORS.teal, fontWeight: 600, marginTop: 6 }}>
                P(has condition | tested positive) = {truePositives} / {totalPositives} ={' '}
                {pAgivenB.toFixed(1)}%
              </div>
              <div style={{ color: COLORS.inkSoft, marginTop: 6, fontSize: 12.5 }}>
                Compare: P(tested positive | has condition) = sensitivity = {sensitivity}%.
                {pAgivenB < sensitivity - 15 &&
                  ' Notice how much smaller the real answer is — that gap IS the base-rate fallacy.'}
              </div>
            </div>
          )}

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
            <strong>Common mistake:</strong> assuming "90% accurate test, I tested positive, so I'm
            90% likely to have it." That confuses P(positive | has condition) with P(has condition |
            positive) — they're not the same number.
          </div>
        </div>
      </Section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <span>{label}</span>
    </div>
  );
}

// ============================= ROOT =============================

export default function BayesTheoremVisualizer() {
  const [mode, setMode] = useState('counting');

  return (
    <div
      style={{
        background: COLORS.parchment,
        minHeight: '100%',
        padding: '28px 24px 40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: COLORS.ink,
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div
          style={{
            marginBottom: 6,
            fontSize: 11.5,
            color: COLORS.inkSoft,
            letterSpacing: '0.02em',
          }}
        >
          Engineering Mathematics · D0
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
            color: COLORS.ink,
          }}
        >
          {mode === 'counting' ? 'Counting Principles & Combinatorics' : "Bayes' Theorem"}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'counting'
            ? 'Sum rule, product rule, permutations, combinations, and the pigeonhole principle.'
            : 'Updating beliefs with evidence — and why "accurate" tests can still mislead.'}
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
            variant={mode === 'counting' ? 'primary' : 'default'}
            onClick={() => setMode('counting')}
          >
            Counting mode
          </Btn>
          <Btn variant={mode === 'bayes' ? 'primary' : 'default'} onClick={() => setMode('bayes')}>
            Bayes mode
          </Btn>
        </div>

        {mode === 'counting' ? <CountingMode /> : <BayesMode />}
      </div>
    </div>
  );
}
