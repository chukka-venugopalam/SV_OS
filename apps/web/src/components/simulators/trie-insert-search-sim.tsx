/*
  CHAPTER: D3 — Trees & Heaps
    Tries (d3-06-tries)

  WHAT THIS DEMONSTRATES
    Insert strings character by character showing shared-prefix paths forming;
    search/prefix-search highlighting the traversal, O(L) independent of trie size.

  DESIGN DECISIONS
    - Uses a small preset word list (cat, car, card, care, dog) chosen specifically
      because they share meaningful prefixes (cat/car/card/care all share "ca"),
      making the shared-path visual immediately obvious rather than needing a large
      random word list to accidentally demonstrate the same point.
    - Search and prefix-search are separate explicit modes (not inferred from input)
      since the O(L) independent-of-trie-size property is easiest to see when the
      student explicitly compares "is this a complete word" vs "does this prefix exist."
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

interface TrieNode {
  children: Record<string, TrieNode>;
  isEnd: boolean;
  id: string;
}

function buildTrie(words: string[]): TrieNode {
  const root: TrieNode = { children: {}, isEnd: false, id: 'root' };
  for (const word of words) {
    let node = root;
    let path = '';
    for (const ch of word) {
      path += ch;
      if (!node.children[ch]) node.children[ch] = { children: {}, isEnd: false, id: path };
      node = node.children[ch];
    }
    node.isEnd = true;
  }
  return root;
}

const WORDS = ['cat', 'car', 'card', 'care', 'dog'];
const TRIE = buildTrie(WORDS);

// layout: assign x,y to every node via DFS
interface LaidOutNode {
  id: string;
  char: string;
  x: number;
  y: number;
  isEnd: boolean;
  parentId: string | null;
}
function layoutTrie(root: TrieNode): LaidOutNode[] {
  const nodes: LaidOutNode[] = [];
  let nextX = 0;
  function visit(node: TrieNode, char: string, depth: number, parentId: string | null): number {
    if (Object.keys(node.children).length === 0) {
      const x = nextX++;
      nodes.push({ id: node.id, char, x, y: depth, isEnd: node.isEnd, parentId });
      return x;
    }
    const childXs: number[] = [];
    for (const [ch, child] of Object.entries(node.children)) {
      childXs.push(visit(child, ch, depth + 1, node.id));
    }
    const x = childXs.reduce((a, b) => a + b, 0) / childXs.length;
    nodes.push({ id: node.id, char, x, y: depth, isEnd: node.isEnd, parentId });
    return x;
  }
  visit(root, '', 0, null);
  return nodes;
}

const LAID_OUT = layoutTrie(TRIE);
const MAX_X = Math.max(...LAID_OUT.map((n) => n.x), 1);

function TrieSVG({
  highlightPath,
  foundEnd,
}: {
  highlightPath: Set<string>;
  foundEnd: string | null;
}) {
  const W = 340,
    H = 200,
    padX = 30,
    padY = 20;
  const scaleX = (x: number) => padX + (x / MAX_X) * (W - 2 * padX);
  const scaleY = (y: number) => padY + y * 42;

  const nodeMap = Object.fromEntries(LAID_OUT.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', background: COLORS.panel, borderRadius: 6 }}
    >
      {LAID_OUT.map((n) => {
        if (!n.parentId) return null;
        const parent = nodeMap[n.parentId];
        const isHighlighted = highlightPath.has(n.id) && highlightPath.has(n.parentId);
        return (
          <line
            key={n.id}
            x1={scaleX(parent.x)}
            y1={scaleY(parent.y)}
            x2={scaleX(n.x)}
            y2={scaleY(n.y)}
            stroke={isHighlighted ? COLORS.teal : COLORS.line}
            strokeWidth={isHighlighted ? 2.5 : 1.5}
          />
        );
      })}
      {LAID_OUT.map((n) => {
        const isRoot = n.id === 'root';
        const isHighlighted = highlightPath.has(n.id);
        const isFoundEnd = n.id === foundEnd;
        return (
          <g key={n.id}>
            <circle
              cx={scaleX(n.x)}
              cy={scaleY(n.y)}
              r={isRoot ? 10 : 14}
              fill={
                isFoundEnd
                  ? COLORS.amberSoft
                  : isHighlighted
                    ? COLORS.tealSoft
                    : n.isEnd
                      ? '#EDE6F5'
                      : '#fff'
              }
              stroke={
                isFoundEnd
                  ? COLORS.amber
                  : isHighlighted
                    ? COLORS.teal
                    : n.isEnd
                      ? '#8B7FD1'
                      : COLORS.line
              }
              strokeWidth={isHighlighted || isFoundEnd ? 2.5 : 1.5}
            />
            {!isRoot && (
              <text
                x={scaleX(n.x)}
                y={scaleY(n.y) + 4}
                fontSize="11"
                fontWeight={700}
                fill={COLORS.ink}
                textAnchor="middle"
              >
                {n.char}
              </text>
            )}
            {isRoot && (
              <text
                x={scaleX(n.x)}
                y={scaleY(n.y) + 3}
                fontSize="8"
                fill={COLORS.inkSoft}
                textAnchor="middle"
              >
                •
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function TrieInsertSearchSim() {
  const [query, setQuery] = useState('card');
  const [mode, setMode] = useState<'word' | 'prefix'>('word');
  const [charIdx, setCharIdx] = useState(0);

  // compute path of node ids as we type query
  let node = TRIE;
  let id = 'root';
  const pathIds: string[] = ['root'];
  let fellOff = false;
  for (const ch of query) {
    if (node.children[ch]) {
      node = node.children[ch];
      id += ch;
      pathIds.push(id);
    } else {
      fellOff = true;
      break;
    }
  }

  const visiblePathIds = pathIds.slice(0, charIdx + 1);
  const highlightSet = new Set(visiblePathIds);
  const reachedFullQuery = charIdx >= query.length - 1 && !fellOff;
  const finalNodeId = reachedFullQuery ? pathIds[pathIds.length - 1] : null;
  const finalNodeIsEnd = finalNodeId
    ? finalNodeId === 'root'
      ? false
      : getNodeById(TRIE, finalNodeId)?.isEnd
    : false;

  function getNodeById(root: TrieNode, targetId: string): TrieNode | null {
    if (targetId === 'root') return root;
    let cur = root;
    for (const ch of targetId) {
      if (!cur.children[ch]) return null;
      cur = cur.children[ch];
    }
    return cur;
  }

  const maxSteps = Math.min(query.length, pathIds.length - 1) - 1;
  const isDone = charIdx >= maxSteps;

  let resultMessage = '';
  if (isDone) {
    if (fellOff) resultMessage = `"${query}" is not in the trie — the path breaks partway through.`;
    else if (mode === 'word')
      resultMessage = finalNodeIsEnd
        ? `"${query}" IS a complete word in the trie.`
        : `"${query}" exists as a PATH, but is not marked as a complete word.`;
    else
      resultMessage = `"${query}" IS a valid prefix — at least one word in the trie starts with it.`;
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
          Trees &amp; Heaps · D3
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Tries: Prefix Trees
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A tree built for one job: finding words and prefixes fast, no matter how many words it
          holds.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A trie (pronounced "try") is a tree specialized for storing strings, where each edge
            represents one character. Words that share a common beginning — like "car," "card," and
            "care" — literally share the same path through the tree for their common prefix, and
            only branch apart once the letters differ. This means searching for a word takes time
            proportional only to the word's LENGTH, not to how many words are stored overall — a
            trie with 5 words and a trie with 5 million words both find "cat" in exactly 3 steps.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Prefix"
            def="The beginning portion of a string, shared by multiple words (e.g. 'ca' is a prefix of cat, car, card, care)."
          />
          <KeyTerm
            term="End-of-word marker"
            def="A flag on a node meaning 'a complete word ends exactly here' — without it, a path might just be a prefix, not a full word."
          />
          <KeyTerm
            term="O(L)"
            def="Time proportional to the length of the string being searched — completely independent of how many total words are stored."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>
              The trie below stores: cat, car, card, care, dog — notice how cat/car/card/care all
              share a path at the start.
            </Step>
            <Step>
              Type a word or prefix, choose "search word" or "search prefix" mode, and press "Step
              forward" to trace it character by character.
            </Step>
            <Step>
              Watch the path highlight teal as each character matches — if it can't continue, the
              trace stops there.
            </Step>
            <Step>
              Compare searching "car" in word mode (not marked complete... wait, try "care" vs "car"
              vs "ca") to see the end-of-word marker matter.
            </Step>
          </ol>
        </Section>

        <Section title="Trace a search through the trie">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 }}>
              Words stored: {WORDS.join(', ')}
            </div>

            <TrieSVG
              highlightPath={highlightSet}
              foundEnd={isDone && !fellOff ? finalNodeId : null}
            />

            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                marginTop: 16,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value.toLowerCase().replace(/[^a-z]/g, ''));
                  setCharIdx(0);
                }}
                style={{
                  width: 120,
                  padding: '6px 10px',
                  borderRadius: 5,
                  border: `1px solid ${COLORS.line}`,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 15,
                }}
              />
              <Btn
                variant={mode === 'word' ? 'primary' : 'default'}
                onClick={() => {
                  setMode('word');
                  setCharIdx(0);
                }}
              >
                Search word
              </Btn>
              <Btn
                variant={mode === 'prefix' ? 'primary' : 'default'}
                onClick={() => {
                  setMode('prefix');
                  setCharIdx(0);
                }}
              >
                Search prefix
              </Btn>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {query.split('').map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      i <= charIdx
                        ? i < pathIds.length - 1
                          ? COLORS.tealSoft
                          : COLORS.redSoft
                        : COLORS.panel,
                    border: `1.5px solid ${i <= charIdx ? (i < pathIds.length - 1 ? COLORS.teal : COLORS.red) : COLORS.line}`,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>

            {isDone && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    fellOff || (mode === 'word' && !finalNodeIsEnd)
                      ? COLORS.redSoft
                      : COLORS.tealSoft,
                  color: fellOff || (mode === 'word' && !finalNodeIsEnd) ? COLORS.red : COLORS.teal,
                }}
              >
                {resultMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => setCharIdx((i) => Math.min(maxSteps, i + 1))}
                disabled={isDone || query.length === 0}
              >
                Step forward
              </Btn>
              <Btn variant="ghost" onClick={() => setCharIdx(0)}>
                Reset
              </Btn>
            </div>

            <Callout>
              <strong>Common mistake:</strong> confusing "the path exists" with "this is a complete
              word." Searching "ca" will successfully trace a path (since it's a prefix of
              cat/car/card/care), but "ca" itself was never inserted as a word — so word-search
              should report false, while prefix-search reports true.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
