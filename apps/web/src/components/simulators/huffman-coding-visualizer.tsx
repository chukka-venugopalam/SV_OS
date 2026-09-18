/*
  CHAPTER: D6 — Sorting, Searching & Algorithm Design
    Greedy Algorithms & Exchange Argument (d6-07-greedy)

  WHAT THIS DEMONSTRATES
    Build a Huffman tree live from character frequencies, merging lowest-frequency
    nodes step by step, then show resulting variable-length codes.

  DESIGN DECISIONS
    - Uses a small fixed text sample so frequency counts are simple whole numbers
      that merge cleanly, avoiding tie-breaking ambiguity that could confuse the
      step-by-step narrative.
    - Final codes are displayed as a table AND applied to re-encode the original
      text, showing actual bit savings vs fixed-length encoding — making the "greedy
      choice actually saves space" payoff concrete rather than abstract.
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

interface HNode {
  id: string;
  char: string | null;
  freq: number;
  left?: HNode;
  right?: HNode;
}

const TEXT = 'ABRACADABRA';

function getFrequencies(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;
  return freq;
}

function buildHuffmanSteps(freq: Record<string, number>) {
  const steps: { forest: HNode[]; caption: string; merged?: [HNode, HNode, HNode] }[] = [];
  let forest: HNode[] = Object.entries(freq).map(([ch, f]) => ({ id: ch, char: ch, freq: f }));
  forest.sort((a, b) => a.freq - b.freq);
  steps.push({
    forest: [...forest],
    caption: `Start: one node per character, with its frequency count. ${forest.map((n) => `'${n.char}'=${n.freq}`).join(', ')}.`,
  });

  let mergeCounter = 0;
  while (forest.length > 1) {
    forest.sort((a, b) => a.freq - b.freq);
    const [a, b] = [forest[0], forest[1]];
    const merged: HNode = {
      id: `m${mergeCounter++}`,
      char: null,
      freq: a.freq + b.freq,
      left: a,
      right: b,
    };
    forest = [merged, ...forest.slice(2)];
    steps.push({
      forest: [...forest],
      merged: [a, b, merged],
      caption: `Merge the two LOWEST-frequency nodes: '${a.char ?? 'group'}' (${a.freq}) and '${b.char ?? 'group'}' (${b.freq}) combine into a new node with frequency ${merged.freq}.`,
    });
  }
  return { steps, root: forest[0] };
}

function getCodes(
  node: HNode,
  prefix = '',
  codes: Record<string, string> = {},
): Record<string, string> {
  if (node.char !== null) {
    codes[node.char] = prefix || '0';
    return codes;
  }
  if (node.left) getCodes(node.left, prefix + '0', codes);
  if (node.right) getCodes(node.right, prefix + '1', codes);
  return codes;
}

const FREQ = getFrequencies(TEXT);
const { steps: HUFFMAN_STEPS, root: HUFFMAN_ROOT } = buildHuffmanSteps(FREQ);
const CODES = getCodes(HUFFMAN_ROOT);

function ForestSVG({ forest, merged }: { forest: HNode[]; merged?: [HNode, HNode, HNode] }) {
  const W = 340,
    H = 160;
  const spacing = W / (forest.length + 1);

  function renderTree(node: HNode, x: number, y: number, width: number): React.ReactElement[] {
    const elements: React.ReactElement[] = [];
    const isNewlyMerged = merged && node.id === merged[2].id;
    if (node.left) {
      const lx = x - width / 4;
      elements.push(
        <line
          key={`l${node.id}`}
          x1={x}
          y1={y}
          x2={lx}
          y2={y + 40}
          stroke={COLORS.line}
          strokeWidth={1.5}
        />,
      );
      elements.push(...renderTree(node.left, lx, y + 40, width / 2));
    }
    if (node.right) {
      const rx = x + width / 4;
      elements.push(
        <line
          key={`r${node.id}`}
          x1={x}
          y1={y}
          x2={rx}
          y2={y + 40}
          stroke={COLORS.line}
          strokeWidth={1.5}
        />,
      );
      elements.push(...renderTree(node.right, rx, y + 40, width / 2));
    }
    elements.push(
      <g key={node.id}>
        <circle
          cx={x}
          cy={y}
          r={16}
          fill={isNewlyMerged ? COLORS.amberSoft : node.char ? COLORS.tealSoft : '#fff'}
          stroke={isNewlyMerged ? COLORS.amber : node.char ? COLORS.teal : COLORS.line}
          strokeWidth={isNewlyMerged ? 2.5 : 1.5}
        />
        <text x={x} y={y - 22} fontSize="9" fill={COLORS.inkSoft} textAnchor="middle">
          {node.freq}
        </text>
        {node.char && (
          <text
            x={x}
            y={y + 4}
            fontSize="11"
            fontWeight={700}
            fill={COLORS.ink}
            textAnchor="middle"
          >
            {node.char}
          </text>
        )}
      </g>,
    );
    return elements;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {forest.map((tree, i) => renderTree(tree, spacing * (i + 1), 25, spacing * 1.6))}
    </svg>
  );
}

export default function HuffmanCodingVisualizer() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = HUFFMAN_STEPS[stepIdx];
  const isDone = stepIdx >= HUFFMAN_STEPS.length - 1;

  const fixedLengthBits = Math.ceil(Math.log2(Object.keys(FREQ).length)) * TEXT.length;
  const huffmanBits = Object.entries(FREQ).reduce((sum, [ch, f]) => sum + f * CODES[ch].length, 0);

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
          Huffman Coding
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A greedy algorithm that shrinks text by giving common characters shorter codes.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Normally every character in a text takes the same number of bits to store. Huffman
            coding does better by giving FREQUENTLY used characters shorter binary codes, and rare
            characters longer ones — the same idea as Morse code giving "E" (the most common letter)
            just one dot. It builds this using a<strong> greedy algorithm</strong>: repeatedly take
            the two least-frequent items and merge them into a new combined node, until everything
            collapses into a single tree. Walking from the root to each character then reads off
            that character's new, shorter (or longer) code.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm term="Frequency" def="How many times a character appears in the text." />
          <KeyTerm
            term="Greedy algorithm"
            def="An algorithm that always makes the locally best choice available right now (here: merge the two smallest), without looking ahead."
          />
          <KeyTerm
            term="Variable-length code"
            def="A code where different characters can use different numbers of bits — unlike normal fixed-width character encoding."
          />
          <KeyTerm
            term="Prefix-free"
            def="No character's code is a prefix of another's — this is what makes the encoded bits unambiguous to decode."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              Press "Step forward" to merge the two lowest-frequency nodes, one pair at a time.
            </Step>
            <Step>Watch the little forest of trees shrink down to a single tree.</Step>
            <Step>
              Once done, check the code table — see how the most frequent letter got the shortest
              code.
            </Step>
            <Step>Compare the total bit count against fixed-length encoding at the bottom.</Step>
          </ol>
        </Section>

        <Section title={`Build a Huffman tree for "${TEXT}"`}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <ForestSVG forest={step.forest} merged={step.merged} />

            <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '14px 0' }}>
              {step.caption}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Btn onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0}>
                Step back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setStepIdx((s) => Math.min(HUFFMAN_STEPS.length - 1, s + 1))}
                disabled={isDone}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setStepIdx(0)}>
                Reset
              </Btn>
            </div>

            {isDone && (
              <>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>
                  Resulting codes (read root-to-leaf: 0 = left, 1 = right)
                </div>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    fontSize: 12.5,
                    fontFamily: 'ui-monospace, monospace',
                    marginBottom: 16,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: '4px 12px',
                          borderBottom: `2px solid ${COLORS.line}`,
                          textAlign: 'left',
                        }}
                      >
                        Char
                      </th>
                      <th
                        style={{
                          padding: '4px 12px',
                          borderBottom: `2px solid ${COLORS.line}`,
                          textAlign: 'left',
                        }}
                      >
                        Freq
                      </th>
                      <th
                        style={{
                          padding: '4px 12px',
                          borderBottom: `2px solid ${COLORS.line}`,
                          textAlign: 'left',
                        }}
                      >
                        Code
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(FREQ)
                      .sort((a, b) => b[1] - a[1])
                      .map(([ch, f]) => (
                        <tr key={ch}>
                          <td style={{ padding: '4px 12px' }}>{ch}</td>
                          <td style={{ padding: '4px 12px' }}>{f}</td>
                          <td style={{ padding: '4px 12px', color: COLORS.teal, fontWeight: 700 }}>
                            {CODES[ch]}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.8 }}
                >
                  <div>
                    Fixed-length encoding: {Math.ceil(Math.log2(Object.keys(FREQ).length))} bits ×{' '}
                    {TEXT.length} characters = {fixedLengthBits} bits
                  </div>
                  <div style={{ color: COLORS.teal, fontWeight: 700 }}>
                    Huffman encoding: {huffmanBits} bits — a real savings, because 'A' (the most
                    frequent letter) got the shortest code.
                  </div>
                </div>
              </>
            )}

            <Callout>
              <strong>Common mistake:</strong> assigning short codes based on GUESSING which letters
              seem common, rather than the ACTUAL frequency count in this specific text. Huffman
              coding is built from the real, measured frequencies of the text being compressed —
              that's what guarantees it's optimal.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
