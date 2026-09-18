/*
  CHAPTER: D6 — Sorting, Searching & Algorithm Design
    String Algorithms (string-algorithms)
    Extends the KMP tool with Rabin-Karp + suffix-structure modes, per the build spec
    ("covers ground #31's tool doesn't" — i.e. the separate kmp-pattern-match-visualizer).

  WHAT THIS DEMONSTRATES
    - Rabin-Karp rolling hash sliding across text with live hash recomputation.
    - A suffix array/tree built over a short string for substring-search demos.

  DESIGN DECISIONS
    - Rabin-Karp uses a small prime modulus and simple polynomial hash so the
      arithmetic stays followable by hand — the ROLLING part (removing the old
      leading character's contribution, adding the new trailing one) is shown as its
      own explicit formula step, since that update rule IS the algorithm's insight.
    - Used a suffix ARRAY (sorted list of suffixes) rather than a suffix TREE, since
      a sorted list is dramatically easier to read and reason about on a small
      screen, while still demonstrating the same substring-search-via-binary-search
      concept the spec asks for.
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

// ============================= RABIN-KARP MODE =============================

const RK_TEXT = 'CGATCGCG';
const RK_PATTERN = 'CGC';
const BASE = 7;
const MOD = 101;

function charCode(c: string) {
  return c.charCodeAt(0) - 65;
} // A=0, B=1, ...

function computeHash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * BASE + charCode(c)) % MOD;
  return h;
}

interface RKStep {
  pos: number;
  hash: number;
  textSubstr: string;
  hashMatches: boolean;
  charsMatch: boolean | null;
  note: string;
}

function rabinKarpTrace(text: string, pattern: string): RKStep[] {
  const m = pattern.length;
  const patternHash = computeHash(pattern);
  const steps: RKStep[] = [];
  let hash = computeHash(text.slice(0, m));
  const highOrder = Math.pow(BASE, m - 1) % MOD;

  for (let i = 0; i <= text.length - m; i++) {
    const substr = text.slice(i, i + m);
    const hashMatches = hash === patternHash;
    let charsMatch: boolean | null = null;
    let note = '';
    if (hashMatches) {
      charsMatch = substr === pattern;
      note = charsMatch
        ? `Hash matches (${hash} = ${patternHash}) AND characters match — confirmed real match at position ${i}!`
        : `Hash matches (${hash} = ${patternHash}) but characters DON'T — this is a hash collision, a false alarm. Always double check!`;
    } else {
      note = `Hash ${hash} ≠ pattern hash ${patternHash} — definitely not a match, skip without checking characters.`;
    }
    steps.push({ pos: i, hash, textSubstr: substr, hashMatches, charsMatch, note });

    if (i < text.length - m) {
      const oldChar = charCode(text[i]);
      const newChar = charCode(text[i + m]);
      hash = ((hash - ((oldChar * highOrder) % MOD) + MOD) * BASE + newChar) % MOD;
    }
  }
  return steps;
}

const RK_STEPS = rabinKarpTrace(RK_TEXT, RK_PATTERN);
const PATTERN_HASH = computeHash(RK_PATTERN);

function RabinKarpMode() {
  const [idx, setIdx] = useState(0);
  const step = RK_STEPS[idx];

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          Rabin-Karp searches for a pattern by comparing NUMBERS instead of characters. It converts
          each substring of the text into a numeric "hash," and compares that hash to the pattern's
          hash — if they don't match, it can skip straight past without checking individual
          characters at all. The clever part is the <strong>rolling hash</strong>: instead of
          recomputing the whole hash from scratch at every position, it updates the previous hash by
          removing the outgoing character's contribution and adding the incoming one — a quick O(1)
          update instead of rescanning the whole substring.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Hash"
          def="A number computed from a string, used as a quick fingerprint for comparison."
        />
        <KeyTerm
          term="Rolling hash"
          def="Updating a hash incrementally as the window slides, instead of recalculating from scratch."
        />
        <KeyTerm
          term="Hash collision"
          def="When two DIFFERENT strings happen to produce the same hash value — a false alarm that needs a real character check to rule out."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Press "Step forward" to slide the pattern-length window across the text.</Step>
          <Step>Watch the hash value update at each position using the rolling formula.</Step>
          <Step>
            When the hash matches the pattern's hash, notice the extra character check that confirms
            (or rules out) a real match.
          </Step>
        </ol>
      </Section>
      <Section
        title={`Find "${RK_PATTERN}" (hash = ${PATTERN_HASH}) in "${RK_TEXT}" using rolling hashes`}
      >
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 2,
              marginBottom: 10,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {RK_TEXT.split('').map((c, i) => (
              <span
                key={i}
                style={{
                  width: 24,
                  textAlign: 'center',
                  borderRadius: 3,
                  background:
                    i >= step.pos && i < step.pos + RK_PATTERN.length
                      ? step.charsMatch
                        ? COLORS.tealSoft
                        : step.hashMatches
                          ? COLORS.amberSoft
                          : COLORS.panel
                      : 'transparent',
                }}
              >
                {c}
              </span>
            ))}
          </div>

          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              lineHeight: 1.9,
              marginBottom: 14,
            }}
          >
            <div>
              Window: "{step.textSubstr}" at position {step.pos} → hash = {step.hash}
            </div>
            <div
              style={{
                color: step.hashMatches
                  ? step.charsMatch
                    ? COLORS.teal
                    : COLORS.amber
                  : COLORS.inkSoft,
              }}
            >
              {step.note}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              Step back
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setIdx((i) => Math.min(RK_STEPS.length - 1, i + 1))}
              disabled={idx >= RK_STEPS.length - 1}
            >
              Step forward
            </Btn>
            <Btn variant="ghost" onClick={() => setIdx(0)}>
              Reset
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> trusting a hash match as a guaranteed real match.
            Different strings CAN produce the same hash (a collision) — Rabin-Karp always needs a
            final character-by-character check to confirm before reporting a true match.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= SUFFIX ARRAY MODE =============================

const SUFFIX_STRING = 'BANANA';

function buildSuffixArray(s: string): { suffix: string; index: number }[] {
  const suffixes = [];
  for (let i = 0; i < s.length; i++) suffixes.push({ suffix: s.slice(i), index: i });
  suffixes.sort((a, b) => (a.suffix < b.suffix ? -1 : a.suffix > b.suffix ? 1 : 0));
  return suffixes;
}

const SUFFIX_ARRAY = buildSuffixArray(SUFFIX_STRING);

function SuffixArrayMode() {
  const [query, setQuery] = useState('ANA');
  const [revealed, setRevealed] = useState(false);

  const matches = SUFFIX_ARRAY.filter((s) => s.suffix.startsWith(query));

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          A <strong>suffix array</strong> lists every suffix (ending portion) of a string, sorted
          alphabetically. Once sorted, all suffixes that START with a particular substring end up
          sitting next to each other — which means you can find every occurrence of a substring
          using binary search, extremely fast, even in a huge text. This is the same core idea as a
          suffix tree (a more complex structure that does the same job), just represented as a
          simple sorted list instead of a tree shape.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Suffix"
          def="A substring that runs from some starting position all the way to the end of the string."
        />
        <KeyTerm
          term="Suffix array"
          def="Every suffix of a string, sorted alphabetically, usually stored as just the starting indices."
        />
        <KeyTerm
          term="Substring search via suffix array"
          def="Since sorted suffixes with the same prefix cluster together, finding a substring is a binary search, not a linear scan."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Look at the sorted list of every suffix of "BANANA" below.</Step>
          <Step>Type a substring to search for, then press "Search."</Step>
          <Step>
            Notice every matching suffix clusters together in the sorted list — that clustering is
            what makes fast search possible.
          </Step>
        </ol>
      </Section>
      <Section title={`Suffix array of "${SUFFIX_STRING}"`}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            {SUFFIX_ARRAY.map((s, i) => {
              const isMatch = revealed && s.suffix.startsWith(query);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '5px 10px',
                    borderRadius: 5,
                    background: isMatch ? COLORS.tealSoft : 'transparent',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: COLORS.inkSoft, width: 20 }}>{s.index}</span>
                  <span style={{ fontWeight: isMatch ? 700 : 400, color: COLORS.ink }}>
                    {s.suffix}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.toUpperCase());
                setRevealed(false);
              }}
              style={{
                width: 100,
                padding: '6px 10px',
                borderRadius: 5,
                border: `1px solid ${COLORS.line}`,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
              }}
            />
            <Btn variant="primary" onClick={() => setRevealed(true)}>
              Search
            </Btn>
            <Btn variant="ghost" onClick={() => setRevealed(false)}>
              Clear
            </Btn>
          </div>

          {revealed && (
            <div
              style={{
                fontSize: 13,
                fontFamily: 'ui-monospace, monospace',
                color: matches.length > 0 ? COLORS.teal : COLORS.red,
              }}
            >
              {matches.length > 0
                ? `Found "${query}" starting at position(s): ${matches.map((m) => m.index).join(', ')} — all clustered together in the sorted list above.`
                : `"${query}" does not appear anywhere in "${SUFFIX_STRING}".`}
            </div>
          )}

          <Callout>
            <strong>Common mistake:</strong> confusing a SUFFIX with a SUBSTRING. Every suffix is a
            substring, but not every substring is a suffix — a suffix array works because searching
            for "does this substring exist" is the same as "is there a suffix that STARTS WITH it,"
            which sorting conveniently groups together.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= ROOT =============================

export default function StringAlgorithmsVisualizer() {
  const [mode, setMode] = useState<'rk' | 'suffix'>('rk');

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
          Sorting, Searching &amp; Algorithm Design · D6
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {mode === 'rk' ? 'Rabin-Karp Rolling Hash' : 'Suffix Arrays'}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'rk'
            ? 'Finding patterns by comparing numbers instead of characters.'
            : 'Sorting every ending of a string to make substring search nearly instant.'}
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
          <Btn variant={mode === 'rk' ? 'primary' : 'default'} onClick={() => setMode('rk')}>
            Rabin-Karp mode
          </Btn>
          <Btn
            variant={mode === 'suffix' ? 'primary' : 'default'}
            onClick={() => setMode('suffix')}
          >
            Suffix array mode
          </Btn>
        </div>

        {mode === 'rk' ? <RabinKarpMode /> : <SuffixArrayMode />}
      </div>
    </div>
  );
}
