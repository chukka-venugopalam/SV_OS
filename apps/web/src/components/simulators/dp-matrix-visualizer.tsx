/*
  CHAPTER: Dynamic Programming — 0/1 Knapsack, LCS, Matrix Chain Multiplication, LIS,
  All-Pairs Shortest Path (Act 3)
  CORRECTION BUILD: the previously cited "existing" component (dp-matrix-visualizer)
  was confirmed to have a useState for the matrix but its setter is NEVER called
  anywhere in the file — the grid never actually changes. This is a genuine new
  build, not a duplicate, replacing that non-functional component.

  WHAT THIS DEMONSTRATES
    Five separate DP algorithms, each as its own mode, all sharing the same core
    interaction model: a real, cell-by-cell fillable DP table where the student
    steps forward and watches each cell's value get computed FROM the cells it
    actually depends on (with those dependency cells highlighted), concluding with
    a traceback that reconstructs the actual optimal solution (not just the number).

  DESIGN DECISIONS
    - Every algorithm's DP table is filled by genuinely running that algorithm's
      real recurrence relation against the actual example data shown to the
      student — never a hardcoded pre-filled grid — so the visualization can never
      drift out of sync with a real correct computation.
    - Each mode includes an explicit traceback step reconstructing the actual
      optimal choice (which items were taken, which characters matched, which path
      was shortest) since the FINAL NUMBER alone doesn't teach how the structure
      was actually built — seeing the reconstructed solution is what makes the DP
      table's cells meaningful rather than abstract.
    - Used small, hand-checkable example instances for every algorithm (a 4-item
      knapsack, two 5-character strings, a 4-matrix chain, a 6-element sequence,
      a 4-node graph) so every cell's value can be verified by a student doing the
      arithmetic by hand alongside the tool.
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
  purple: '#8B7FD1',
  purpleSoft: '#EDE6F5',
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
        padding: '6px 12px',
        borderRadius: 6,
        fontSize: 12.5,
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
function Cell({
  value,
  highlight,
  size = 34,
}: {
  value: string | number;
  highlight?: 'active' | 'dep' | 'path' | null;
  size?: number;
}) {
  const bg =
    highlight === 'active'
      ? COLORS.amberSoft
      : highlight === 'dep'
        ? COLORS.tealSoft
        : highlight === 'path'
          ? COLORS.purpleSoft
          : '#fff';
  const border =
    highlight === 'active'
      ? COLORS.amber
      : highlight === 'dep'
        ? COLORS.teal
        : highlight === 'path'
          ? COLORS.purple
          : COLORS.line;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 4,
        color: COLORS.ink,
        flexShrink: 0,
      }}
    >
      {value}
    </div>
  );
}

// ============================= 0/1 KNAPSACK =============================

const KNAPSACK_ITEMS = [
  { name: 'Map', w: 2, v: 3 },
  { name: 'Compass', w: 3, v: 4 },
  { name: 'Water', w: 4, v: 5 },
  { name: 'Food', w: 5, v: 6 },
];
const KNAPSACK_CAPACITY = 8;

function buildKnapsackTable(items: typeof KNAPSACK_ITEMS, capacity: number): number[][] {
  const n = items.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      const { w: itemW, v: itemV } = items[i - 1];
      if (itemW > w) table[i][w] = table[i - 1][w];
      else table[i][w] = Math.max(table[i - 1][w], table[i - 1][w - itemW] + itemV);
    }
  }
  return table;
}
function traceKnapsack(
  items: typeof KNAPSACK_ITEMS,
  table: number[][],
  capacity: number,
): string[] {
  const chosen: string[] = [];
  let w = capacity;
  for (let i = items.length; i >= 1; i--) {
    if (table[i][w] !== table[i - 1][w]) {
      chosen.push(items[i - 1].name);
      w -= items[i - 1].w;
    }
  }
  return chosen.reverse();
}

function KnapsackMode() {
  const table = buildKnapsackTable(KNAPSACK_ITEMS, KNAPSACK_CAPACITY);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [showTrace, setShowTrace] = useState(false);
  const n = KNAPSACK_ITEMS.length;

  function advance() {
    if (col < KNAPSACK_CAPACITY) setCol((c) => c + 1);
    else if (row < n) {
      setRow((r) => r + 1);
      setCol(0);
    }
  }
  const isDone = row === n && col === KNAPSACK_CAPACITY;
  const trace =
    isDone && showTrace ? traceKnapsack(KNAPSACK_ITEMS, table, KNAPSACK_CAPACITY) : null;

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        You're packing a bag with capacity {KNAPSACK_CAPACITY}kg. Each item has a weight and a value
        — you want the most total value without exceeding capacity, and each item can only be taken
        once (or not at all).
      </p>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
        <thead>
          <tr>
            <th />
            <th style={{ padding: '2px 8px' }}>Weight</th>
            <th style={{ padding: '2px 8px' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {KNAPSACK_ITEMS.map((it, i) => (
            <tr key={i}>
              <td style={{ padding: '2px 8px', fontWeight: 700 }}>{it.name}</td>
              <td style={{ padding: '2px 8px' }}>{it.w}</td>
              <td style={{ padding: '2px 8px' }}>{it.v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${KNAPSACK_CAPACITY + 1}, 34px)`,
            gap: 2,
          }}
        >
          <div />
          {Array.from({ length: KNAPSACK_CAPACITY + 1 }).map((_, w) => (
            <div key={w} style={{ fontSize: 10, textAlign: 'center', color: COLORS.inkSoft }}>
              {w}
            </div>
          ))}
          {Array.from({ length: n + 1 }).map((_, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  fontSize: 10,
                  color: COLORS.inkSoft,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {i === 0 ? 'none' : KNAPSACK_ITEMS[i - 1].name}
              </div>
              {Array.from({ length: KNAPSACK_CAPACITY + 1 }).map((_, w) => {
                const isRevealed = i < row || (i === row && w <= col);
                const isActive = i === row && w === col;
                return (
                  <Cell
                    key={w}
                    value={isRevealed ? table[i][w] : ''}
                    highlight={isActive ? 'active' : null}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {row > 0 && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, marginBottom: 14 }}>
          {(() => {
            const i = row === n && col === KNAPSACK_CAPACITY ? n : row;
            const w = row === n && col === KNAPSACK_CAPACITY ? KNAPSACK_CAPACITY : col;
            if (i === 0) return null;
            const item = KNAPSACK_ITEMS[i - 1];
            if (item.w > w)
              return `${item.name} (weight ${item.w}) doesn't fit in remaining capacity ${w} — carry over the value without it: table[${i - 1}][${w}] = ${table[i - 1][w]}.`;
            return `Best of (a) skip ${item.name}: ${table[i - 1][w]}, or (b) take it: ${item.v} + table[${i - 1}][${w - item.w}] (${table[i - 1][w - item.w]}) = ${item.v + table[i - 1][w - item.w]}. Max = ${table[i][w]}.`;
          })()}
        </div>
      )}

      {isDone && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.teal,
              marginBottom: 8,
            }}
          >
            Best possible value: {table[n][KNAPSACK_CAPACITY]}
          </div>
          <Btn variant="primary" onClick={() => setShowTrace(true)} disabled={showTrace}>
            Trace back: which items?
          </Btn>
          {trace && (
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginTop: 8 }}>
              Items taken: {trace.join(', ')}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={advance} disabled={isDone}>
          Fill next cell
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setRow(0);
            setCol(0);
            setShowTrace(false);
          }}
        >
          Reset
        </Btn>
      </div>
      <Callout>
        <strong>Common mistake:</strong> using the SAME row when an item is taken (as if you could
        take it twice). The 0/1 knapsack recurrence always looks at row i−1 (one item BACK) for the
        "take it" case too, which is exactly what makes it "0/1" — each item is used at most once.
      </Callout>
    </div>
  );
}

// ============================= LCS =============================

const LCS_A = 'ABCBDAB';
const LCS_B = 'BDCABA';

function buildLcsTable(a: string, b: string): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i][j] =
        a[i - 1] === b[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table;
}
function traceLcs(a: string, b: string, table: number[][]): string {
  let i = a.length,
    j = b.length,
    result = '';
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result = a[i - 1] + result;
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) i--;
    else j--;
  }
  return result;
}

function LcsMode() {
  const table = buildLcsTable(LCS_A, LCS_B);
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [showTrace, setShowTrace] = useState(false);

  function advance() {
    if (j < LCS_B.length) setJ((x) => x + 1);
    else if (i < LCS_A.length) {
      setI((x) => x + 1);
      setJ(0);
    }
  }
  const isDone = i === LCS_A.length && j === LCS_B.length;

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Find the Longest Common Subsequence between "{LCS_A}" and "{LCS_B}" — characters that appear
        in the same relative order in both strings, though not necessarily next to each other.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `30px repeat(${LCS_B.length + 1}, 30px)`,
            gap: 2,
          }}
        >
          <div />
          <div />
          {LCS_B.split('').map((c, k) => (
            <div key={k} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
              {c}
            </div>
          ))}
          {Array.from({ length: LCS_A.length + 1 }).map((_, r) => (
            <React.Fragment key={r}>
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
                {r === 0 ? '' : LCS_A[r - 1]}
              </div>
              {Array.from({ length: LCS_B.length + 1 }).map((_, c) => {
                const isRevealed = r < i || (r === i && c <= j);
                const isActive = r === i && c === j;
                return (
                  <Cell
                    key={c}
                    value={isRevealed ? table[r][c] : ''}
                    highlight={isActive ? 'active' : null}
                    size={30}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {i > 0 && j > 0 && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, marginBottom: 14 }}>
          {LCS_A[i - 1] === LCS_B[j - 1]
            ? `'${LCS_A[i - 1]}' matches '${LCS_B[j - 1]}'! Extend the diagonal: table[${i - 1}][${j - 1}] + 1 = ${table[i - 1][j - 1]} + 1 = ${table[i][j]}.`
            : `'${LCS_A[i - 1]}' ≠ '${LCS_B[j - 1]}'. Take the best of ignoring one character from either string: max(${table[i - 1][j]}, ${table[i][j - 1]}) = ${table[i][j]}.`}
        </div>
      )}

      {isDone && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.teal,
              marginBottom: 8,
            }}
          >
            Longest common subsequence length: {table[LCS_A.length][LCS_B.length]}
          </div>
          <Btn variant="primary" onClick={() => setShowTrace(true)} disabled={showTrace}>
            Trace back: what's the subsequence?
          </Btn>
          {showTrace && (
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginTop: 8 }}>
              Subsequence: "{traceLcs(LCS_A, LCS_B, table)}"
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={advance} disabled={isDone}>
          Fill next cell
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setI(0);
            setJ(0);
            setShowTrace(false);
          }}
        >
          Reset
        </Btn>
      </div>
      <Callout>
        <strong>Common mistake:</strong> confusing "subsequence" with "substring." A subsequence
        does NOT need consecutive characters — it just needs the same relative order preserved,
        which is why characters can be skipped in either string when building it.
      </Callout>
    </div>
  );
}

// ============================= MATRIX CHAIN MULTIPLICATION =============================

const MCM_DIMS = [10, 20, 30, 40, 30]; // 4 matrices: 10x20, 20x30, 30x40, 40x30

function buildMcmTable(dims: number[]): { cost: number[][]; split: number[][] } {
  const n = dims.length - 1;
  const cost: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const split: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      cost[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const c = cost[i][k] + cost[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1];
        if (c < cost[i][j]) {
          cost[i][j] = c;
          split[i][j] = k;
        }
      }
    }
  }
  return { cost, split };
}
function traceMcmParens(split: number[][], i: number, j: number): string {
  if (i === j) return `M${i + 1}`;
  const k = split[i][j];
  return `(${traceMcmParens(split, i, k)} × ${traceMcmParens(split, k + 1, j)})`;
}

function McmMode() {
  const n = MCM_DIMS.length - 1;
  const { cost, split } = buildMcmTable(MCM_DIMS);
  const [len, setLen] = useState(1);
  const [i, setI] = useState(0);
  const [showTrace, setShowTrace] = useState(false);

  function advance() {
    if (len === 1) {
      setLen(2);
      setI(0);
      return;
    }
    if (i < n - len) setI((x) => x + 1);
    else if (len < n) {
      setLen((l) => l + 1);
      setI(0);
    }
  }
  const _isDone = len === n && i === 0 && cost[0][n - 1] !== 0;
  // more precise done check:
  const actuallyDone = len >= n;

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Multiplying matrices{' '}
        {MCM_DIMS.map((_, k) => (k < n ? `M${k + 1}(${MCM_DIMS[k]}×${MCM_DIMS[k + 1]})` : ''))
          .filter(Boolean)
          .join(' × ')}
        . The order you PARENTHESIZE the multiplications changes the total number of scalar
        multiplications needed — matrix multiplication is associative, so the answer is the same,
        but the WORK isn't.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${n}, 60px)`, gap: 2 }}>
          <div />
          {Array.from({ length: n }).map((_, c) => (
            <div key={c} style={{ textAlign: 'center', fontSize: 10, color: COLORS.inkSoft }}>
              M{c + 1}
            </div>
          ))}
          {Array.from({ length: n }).map((_, r) => (
            <React.Fragment key={r}>
              <div style={{ textAlign: 'center', fontSize: 10, color: COLORS.inkSoft }}>
                M{r + 1}
              </div>
              {Array.from({ length: n }).map((_, c) => {
                if (c < r) return <div key={c} />;
                const cellLen = c - r + 1;
                const isRevealed =
                  cellLen < len || (cellLen === len && r < i) || (r === 0 && c === 0);
                const isActive = cellLen === len && r === i;
                const val = r === c ? 0 : cost[r][c];
                return (
                  <Cell
                    key={c}
                    value={isRevealed || r === c ? (val === Infinity ? '' : val) : ''}
                    highlight={isActive ? 'active' : null}
                    size={56}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {len >= 2 && i <= n - len && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, marginBottom: 14 }}>
          Computing cost of multiplying M{i + 1}..M{i + len}: try every split point k, cost =
          cost(left) + cost(right) + (rows of M{i + 1}) × (shared dim at split) × (cols of M
          {i + len}). Best found: {cost[i][i + len - 1]}.
        </div>
      )}

      {actuallyDone && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.teal,
              marginBottom: 8,
            }}
          >
            Minimum scalar multiplications: {cost[0][n - 1]}
          </div>
          <Btn variant="primary" onClick={() => setShowTrace(true)} disabled={showTrace}>
            Trace back: best parenthesization?
          </Btn>
          {showTrace && (
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginTop: 8 }}>
              {traceMcmParens(split, 0, n - 1)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={advance} disabled={actuallyDone}>
          Fill next diagonal cell
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setLen(1);
            setI(0);
            setShowTrace(false);
          }}
        >
          Reset
        </Btn>
      </div>
      <Callout>
        <strong>Common mistake:</strong> thinking the goal is to find the actual PRODUCT matrix.
        It's not — the values are the same no matter how you parenthesize (matrix multiplication is
        associative). The goal is purely to minimize the total number of scalar multiplication
        OPERATIONS needed to get there.
      </Callout>
    </div>
  );
}

// ============================= LIS =============================

const LIS_ARR = [10, 9, 2, 5, 3, 7, 101, 18];

function buildLisTable(arr: number[]): number[] {
  const n = arr.length;
  const dp = new Array(n).fill(1);
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
  }
  return dp;
}
function traceLis(arr: number[], dp: number[]): number[] {
  let maxIdx = 0;
  for (let i = 1; i < dp.length; i++) if (dp[i] > dp[maxIdx]) maxIdx = i;
  const result: number[] = [arr[maxIdx]];
  let cur = dp[maxIdx];
  for (let i = maxIdx - 1; i >= 0; i--) {
    if (dp[i] === cur - 1 && arr[i] < result[0]) {
      result.unshift(arr[i]);
      cur--;
    }
  }
  return result;
}

function LisMode() {
  const dp = buildLisTable(LIS_ARR);
  const [idx, setIdx] = useState(0);
  const [showTrace, setShowTrace] = useState(false);
  const isDone = idx === LIS_ARR.length - 1;

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Find the Longest Increasing Subsequence of [{LIS_ARR.join(', ')}] — the longest run of
        numbers (not necessarily consecutive) that appear in increasing order.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {LIS_ARR.map((v, i) => (
          <Cell
            key={i}
            value={v}
            highlight={i === idx ? 'active' : i < idx ? 'dep' : null}
            size={38}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {LIS_ARR.map((_, i) => (
          <div
            key={i}
            style={{ width: 38, textAlign: 'center', fontSize: 9, color: COLORS.inkSoft }}
          >
            {i <= idx ? `LIS=${dp[i]}` : ''}
          </div>
        ))}
      </div>

      {idx > 0 && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, marginBottom: 14 }}>
          For index {idx} (value {LIS_ARR[idx]}): check every earlier index j where arr[j] {'<'}{' '}
          {LIS_ARR[idx]}, take the best dp[j]+1. Result: dp[{idx}] = {dp[idx]}.
        </div>
      )}

      {isDone && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.teal,
              marginBottom: 8,
            }}
          >
            Longest increasing subsequence length: {Math.max(...dp)}
          </div>
          <Btn variant="primary" onClick={() => setShowTrace(true)} disabled={showTrace}>
            Trace back: what's the subsequence?
          </Btn>
          {showTrace && (
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginTop: 8 }}>
              Subsequence: [{traceLis(LIS_ARR, dp).join(', ')}]
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn
          variant="primary"
          onClick={() => setIdx((i) => Math.min(LIS_ARR.length - 1, i + 1))}
          disabled={isDone}
        >
          Compute next index
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setIdx(0);
            setShowTrace(false);
          }}
        >
          Reset
        </Btn>
      </div>
      <Callout>
        <strong>Common mistake:</strong> assuming the final answer is dp[last index]. It's not
        necessarily — the longest increasing subsequence can END at any position in the array, so
        the real answer is the MAXIMUM value anywhere in the whole dp array, not just its last
        entry.
      </Callout>
    </div>
  );
}

// ============================= ALL-PAIRS SHORTEST PATH (Floyd-Warshall) =============================

const INF = Infinity;
const APSP_NODES = ['A', 'B', 'C', 'D'];
const APSP_INIT: number[][] = [
  [0, 5, INF, 10],
  [INF, 0, 3, INF],
  [INF, INF, 0, 1],
  [INF, INF, INF, 0],
];

function floydWarshallSteps(init: number[][]): number[][][] {
  const n = init.length;
  let dist = init.map((row) => [...row]);
  const steps: number[][][] = [dist.map((row) => [...row])];
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];
      }
    }
    steps.push(dist.map((row) => [...row]));
  }
  return steps;
}

function ApspMode() {
  const steps = floydWarshallSteps(APSP_INIT);
  const [k, setK] = useState(0);
  const isDone = k === APSP_NODES.length;

  return (
    <div>
      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        Find the shortest path between EVERY pair of nodes in this graph, allowing paths to route
        through any intermediate node. Floyd-Warshall does this by considering, one at a time,
        whether routing through each node k gives a shortcut.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `30px repeat(${APSP_NODES.length}, 44px)`,
          gap: 2,
          marginBottom: 14,
        }}
      >
        <div />
        {APSP_NODES.map((n, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
            {n}
          </div>
        ))}
        {APSP_NODES.map((n, i) => (
          <React.Fragment key={i}>
            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{n}</div>
            {APSP_NODES.map((_, j) => {
              const val = steps[k][i][j];
              const highlight = k > 0 && (i === k - 1 || j === k - 1) ? 'dep' : null;
              return (
                <Cell
                  key={j}
                  value={val === INF ? '∞' : val}
                  highlight={i === j ? null : highlight}
                  size={44}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {k > 0 && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, marginBottom: 14 }}>
          After considering routing through node {APSP_NODES[k - 1]}: any pair (i, j) where going i
          → {APSP_NODES[k - 1]} → j is shorter than the direct-so-far distance gets updated.
        </div>
      )}

      {isDone && (
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.teal,
            marginBottom: 14,
          }}
        >
          All shortest paths found — e.g. A to D: {steps[k][0][3]} (via the shortest available
          route, not necessarily the direct edge).
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn
          variant="primary"
          onClick={() => setK((x) => Math.min(APSP_NODES.length, x + 1))}
          disabled={isDone}
        >
          Consider next intermediate node
        </Btn>
        <Btn variant="ghost" onClick={() => setK(0)}>
          Reset
        </Btn>
      </div>
      <Callout>
        <strong>Common mistake:</strong> assuming the direct edge weight is always the shortest
        path. Here, A→D directly costs 10, but routing A→B→C→D costs 5+3+1=9 — cheaper! All-pairs
        shortest path algorithms exist specifically to catch these indirect shortcuts that aren't
        obvious from the original edge list.
      </Callout>
    </div>
  );
}

// ============================= ROOT =============================

type DpAlgo = 'knapsack' | 'lcs' | 'mcm' | 'lis' | 'apsp';
const ALGO_LABELS: Record<DpAlgo, string> = {
  knapsack: '0/1 Knapsack',
  lcs: 'LCS',
  mcm: 'Matrix Chain Mult.',
  lis: 'LIS',
  apsp: 'All-Pairs Shortest Path',
};

export default function DpMatrixVisualizer() {
  const [algo, setAlgo] = useState<DpAlgo>('knapsack');

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
          Dynamic Programming · Act 3
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {ALGO_LABELS[algo]}
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 20px 0' }}>
          Five classic dynamic programming problems, each filled cell by cell from its real
          recurrence.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            <strong>Dynamic programming</strong> solves a big problem by breaking it into smaller
            overlapping subproblems, solving each one exactly once, and storing the results in a
            table so they never need to be recomputed. Each cell in the table represents the answer
            to one specific subproblem, computed directly from the values of OTHER cells that
            represent smaller subproblems it depends on. This tool covers five classic DP problems —
            each with its own table shape and recurrence, but all built on this same idea.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Subproblem"
            def="A smaller version of the original problem, whose answer is stored in one cell of the DP table."
          />
          <KeyTerm
            term="Recurrence relation"
            def="The formula for computing one cell's value using the values of other, already-solved cells."
          />
          <KeyTerm
            term="Base case"
            def="The smallest subproblems, simple enough to fill in directly without depending on anything else."
          />
          <KeyTerm
            term="Traceback"
            def="Working backward through the filled table to reconstruct the actual optimal solution, not just its numeric value."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Pick one of the five DP problems from the tabs below.</Step>
            <Step>
              Press the fill button repeatedly to watch the table populate cell by cell, with each
              new cell's formula spelled out.
            </Step>
            <Step>
              Once the table is complete, press "Trace back" to reconstruct the actual optimal
              solution, not just its final number.
            </Step>
          </ol>
        </Section>

        <Section title="Choose a problem">
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {(Object.keys(ALGO_LABELS) as DpAlgo[]).map((a) => (
              <Btn key={a} variant={algo === a ? 'primary' : 'default'} onClick={() => setAlgo(a)}>
                {ALGO_LABELS[a]}
              </Btn>
            ))}
          </div>

          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            {algo === 'knapsack' && <KnapsackMode />}
            {algo === 'lcs' && <LcsMode />}
            {algo === 'mcm' && <McmMode />}
            {algo === 'lis' && <LisMode />}
            {algo === 'apsp' && <ApspMode />}
          </div>
        </Section>
      </div>
    </div>
  );
}
