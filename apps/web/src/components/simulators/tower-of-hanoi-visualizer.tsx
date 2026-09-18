/*
  CHAPTER: D6 — Sorting, Searching & Algorithm Design
    Recursion & the Master Theorem (d6-06-recursion-master-theorem)
    This simulator absorbs the retired recursion-and-divide-and-conquer and
    functions-scope-and-recursion-basics node content per the build spec.

  WHAT THIS DEMONSTRATES
    - Animate Tower of Hanoi recursive calls and disk moves.
    - A second mode showing MergeSort/QuickSort recursion trees splitting/combining.

  DESIGN DECISIONS
    - Tower of Hanoi uses 3 disks (small enough that all 7 moves are individually
      watchable and countable, matching 2^n - 1).
    - MergeSort/QuickSort mode shows the recursion tree structure with the
      split-then-combine shape explicit, since that shape (not the sort itself) is
      the actual "divide and conquer" concept being taught here.
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

// ============================= HANOI MODE =============================

interface HanoiMove {
  disk: number;
  from: number;
  to: number;
}

function generateHanoiMoves(
  n: number,
  from: number,
  to: number,
  via: number,
  moves: HanoiMove[] = [],
): HanoiMove[] {
  if (n === 0) return moves;
  generateHanoiMoves(n - 1, from, via, to, moves);
  moves.push({ disk: n, from, to });
  generateHanoiMoves(n - 1, via, to, from, moves);
  return moves;
}

const N_DISKS = 3;
const HANOI_MOVES = generateHanoiMoves(N_DISKS, 0, 2, 1);

function pegsAfterMoves(moves: HanoiMove[], count: number): number[][] {
  const pegs: number[][] = [[3, 2, 1], [], []];
  for (let i = 0; i < count; i++) {
    const m = moves[i];
    const disk = pegs[m.from].pop();
    if (disk !== undefined) pegs[m.to].push(disk);
  }
  return pegs;
}

function DiskStack({ disks, highlightTop }: { disks: number[]; highlightTop?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: 3,
        height: 90,
        justifyContent: 'flex-start',
      }}
    >
      {disks.map((d, i) => (
        <div
          key={i}
          style={{
            width: 24 + d * 18,
            height: 18,
            borderRadius: 4,
            background: i === disks.length - 1 && highlightTop ? COLORS.amberSoft : COLORS.tealSoft,
            border: `1.5px solid ${i === disks.length - 1 && highlightTop ? COLORS.amber : COLORS.teal}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.ink,
          }}
        >
          {d}
        </div>
      ))}
    </div>
  );
}

function HanoiMode() {
  const [moveIdx, setMoveIdx] = useState(0);
  const pegs = pegsAfterMoves(HANOI_MOVES, moveIdx);
  const isDone = moveIdx >= HANOI_MOVES.length;

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          Tower of Hanoi is a puzzle: move a stack of disks from one peg to another, one disk at a
          time, never placing a bigger disk on top of a smaller one. The elegant solution is
          recursive: to move n disks from peg A to peg C, first move the top n−1 disks out of the
          way to peg B, then move the single biggest disk to C, then move those n−1 disks from B
          onto C. This is a classic example of a <strong>divide and conquer</strong> strategy —
          breaking a big problem into smaller versions of itself.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Recursion"
          def="A function that solves a problem by calling itself on a smaller version of the same problem."
        />
        <KeyTerm
          term="Base case"
          def="The smallest version of the problem, simple enough to solve directly without further recursion (here, moving 0 disks — do nothing)."
        />
        <KeyTerm
          term="Divide and conquer"
          def="A strategy of breaking a problem into smaller subproblems, solving those, then combining the results."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>
            Press "Next move" to watch the {N_DISKS}-disk puzzle solve itself, one move at a time.
          </Step>
          <Step>
            Notice the total move count: it always takes exactly 2ⁿ − 1 moves for n disks.
          </Step>
          <Step>
            Watch how the smaller disks shuffle back and forth WHILE waiting for the big disk to be
            free to move.
          </Step>
        </ol>
      </Section>
      <Section title={`Solve ${N_DISKS} disks: peg 0 → peg 2`}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
            {pegs.map((peg, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <DiskStack
                  disks={peg}
                  highlightTop={
                    moveIdx > 0 &&
                    moveIdx <= HANOI_MOVES.length &&
                    HANOI_MOVES[moveIdx - 1].to === i
                  }
                />
                <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 6 }}>Peg {i}</div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginBottom: 14 }}>
            Move {moveIdx} of {HANOI_MOVES.length} (minimum possible: 2^{N_DISKS} − 1 ={' '}
            {HANOI_MOVES.length})
            {moveIdx > 0 && moveIdx <= HANOI_MOVES.length && (
              <div style={{ marginTop: 4, color: COLORS.teal }}>
                Last move: disk {HANOI_MOVES[moveIdx - 1].disk} from peg{' '}
                {HANOI_MOVES[moveIdx - 1].from} → peg {HANOI_MOVES[moveIdx - 1].to}
              </div>
            )}
          </div>

          {isDone && (
            <div
              style={{
                background: COLORS.tealSoft,
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              Solved! All {N_DISKS} disks moved to peg 2 in {HANOI_MOVES.length} moves.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setMoveIdx((i) => Math.max(0, i - 1))} disabled={moveIdx === 0}>
              Previous move
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setMoveIdx((i) => Math.min(HANOI_MOVES.length, i + 1))}
              disabled={isDone}
            >
              Next move
            </Btn>
            <Btn variant="ghost" onClick={() => setMoveIdx(0)}>
              Reset
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> thinking the recursion "moves n−1 disks" as if that's a
            single action. It's actually a whole recursive call that itself breaks down into moving
            n−2 disks, then n−3, and so on, all the way down to the base case of 0 disks. The single
            big disk move is really the ONLY direct action at each level.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= DIVIDE & CONQUER MODE =============================

interface DCFrame {
  array: number[];
  splits: number[][];
  caption: string;
}

function mergeSortFrames(arr: number[]): DCFrame[] {
  const frames: DCFrame[] = [
    { array: arr, splits: [arr], caption: `Start with the unsorted array: [${arr.join(', ')}]` },
  ];
  function split(a: number[]): number[][] {
    if (a.length <= 1) return [a];
    const mid = Math.floor(a.length / 2);
    return [...split(a.slice(0, mid)), ...split(a.slice(mid))];
  }
  const allSplits = split(arr);
  frames.push({
    array: arr,
    splits: allSplits,
    caption: `Divide: keep splitting in half until every piece has just 1 element — these are the base cases.`,
  });

  function merge(a: number[], b: number[]): number[] {
    const result: number[] = [];
    let i = 0,
      j = 0;
    while (i < a.length && j < b.length) result.push(a[i] <= b[j] ? a[i++] : b[j++]);
    return [...result, ...a.slice(i), ...b.slice(j)];
  }
  let level = allSplits;
  while (level.length > 1) {
    const next: number[][] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) next.push(merge(level[i], level[i + 1]));
      else next.push(level[i]);
    }
    level = next;
    frames.push({
      array: arr,
      splits: level,
      caption: `Conquer/combine: merge sorted pairs back together, comparing front elements to interleave them in order.`,
    });
  }
  frames.push({
    array: arr,
    splits: level,
    caption: `Fully merged: [${level[0].join(', ')}] — the whole array is now sorted.`,
  });
  return frames;
}

const DC_INPUT = [8, 3, 5, 1, 9, 2];
const DC_FRAMES = mergeSortFrames(DC_INPUT);

function DivideConquerMode() {
  const [frameIdx, setFrameIdx] = useState(0);
  const frame = DC_FRAMES[frameIdx];

  return (
    <div>
      <Section title="What is this?">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.ink, margin: 0 }}>
          Merge sort is a textbook divide-and-conquer algorithm: it repeatedly splits the array in
          half (<strong>divide</strong>) until each piece has just one element (trivially "sorted"
          on its own), then merges pairs of sorted pieces back together in order (
          <strong>combine</strong>). The recursion tree shape — split apart at the top, come back
          together at the bottom — is the visual signature of divide and conquer, and the same shape
          shows up in quicksort, binary search, and many other algorithms.
        </p>
      </Section>
      <Section title="Key terms">
        <KeyTerm
          term="Divide"
          def="Breaking the current problem into smaller, independent subproblems (here, splitting the array in half)."
        />
        <KeyTerm
          term="Conquer"
          def="Solving each subproblem, usually by recursing until reaching a trivial base case."
        />
        <KeyTerm
          term="Combine"
          def="Merging the solved subproblems back into a solution for the original, larger problem."
        />
      </Section>
      <Section title="How to use this">
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <Step>Press "Step forward" to watch the array split apart into smaller pieces.</Step>
          <Step>Keep stepping to watch the pieces merge back together, now sorted.</Step>
          <Step>
            Notice the shape: splitting apart, then combining — that's the divide-and-conquer
            signature.
          </Step>
        </ol>
      </Section>
      <Section title={`Merge sort: [${DC_INPUT.join(', ')}]`}>
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
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 16,
              justifyContent: 'center',
            }}
          >
            {frame.splits.map((group, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 3,
                  padding: '6px 8px',
                  background: COLORS.panel,
                  borderRadius: 6,
                }}
              >
                {group.map((v, j) => (
                  <div
                    key={j}
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      background: COLORS.tealSoft,
                      border: `1.5px solid ${COLORS.teal}`,
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: '0 0 14px' }}>
            {frame.caption}
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setFrameIdx((f) => Math.max(0, f - 1))} disabled={frameIdx === 0}>
              Step back
            </Btn>
            <Btn
              variant="primary"
              onClick={() => setFrameIdx((f) => Math.min(DC_FRAMES.length - 1, f + 1))}
              disabled={frameIdx >= DC_FRAMES.length - 1}
            >
              Step forward
            </Btn>
            <Btn variant="ghost" onClick={() => setFrameIdx(0)}>
              Reset
            </Btn>
          </div>

          <Callout>
            <strong>Common mistake:</strong> thinking the "hard work" happens during the splitting
            phase. It doesn't — splitting is trivial (just cutting in half). All the actual
            comparison and ordering work happens during the MERGE step, comparing elements from two
            already-sorted halves.
          </Callout>
        </div>
      </Section>
    </div>
  );
}

// ============================= ROOT =============================

export default function TowerOfHanoiVisualizer() {
  const [mode, setMode] = useState<'hanoi' | 'dc'>('hanoi');

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
          {mode === 'hanoi' ? 'Tower of Hanoi' : 'Divide &amp; Conquer: Merge Sort'}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          {mode === 'hanoi'
            ? 'A classic puzzle that only makes sense once you see it recursively.'
            : 'The split-then-combine shape behind many of the fastest algorithms.'}
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
          <Btn variant={mode === 'hanoi' ? 'primary' : 'default'} onClick={() => setMode('hanoi')}>
            Tower of Hanoi
          </Btn>
          <Btn variant={mode === 'dc' ? 'primary' : 'default'} onClick={() => setMode('dc')}>
            Divide &amp; conquer (merge sort)
          </Btn>
        </div>

        {mode === 'hanoi' ? <HanoiMode /> : <DivideConquerMode />}
      </div>
    </div>
  );
}
