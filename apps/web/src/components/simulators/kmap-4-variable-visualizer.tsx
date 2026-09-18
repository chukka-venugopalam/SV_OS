/*
  CHAPTER: D2 — Boolean Algebra & Simplification (Act 1, Digital Logic)
    K-Map (4-Variable)
    CORRECTION BUILD: the previously cited "existing" component (kmap-logic-visualizer)
    was confirmed to be a static display with one hardcoded result and no real inputs —
    this is a genuine new build, not a duplicate. Kept as a SEPARATE file from the 2-3
    variable tool since a 4x4 grid changes both the layout and the group-shape
    possibilities (a full 16-cell wraparound "ring" of groups becomes possible) enough
    to warrant its own dedicated space rather than cramming a third tab into the other tool.

  WHAT THIS DEMONSTRATES
    A real, editable 4x4 Karnaugh map (16 cells, 4 variables) using genuine Gray-code
    ordering on both axes, with the same real grouping-search and auto-solve engine as
    the 2-3 variable tool, generalized to 4 variables and demonstrating groups up to
    size 8 (and the full-map size-16 case).

  DESIGN DECISIONS
    - Reuses the exact same verified hypercube-detection and greedy-cover algorithm
      that was independently tested for the 2-3 variable tool (including the fix for
      the isolated-single-cell fallback bug found during that verification), just
      generalized to numVars=4 — since the underlying math is identical, only the
      grid layout changes.
    - Explicitly calls out BOTH row and column wraparound adjacency (not just column,
      as in the 3-variable case) since a 4-variable map is the first size where
      corner-to-corner wraparound groups (all 4 corners as one group) become possible,
      which is a common point of confusion.
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

type CellVal = 0 | 1 | 'X';

// 4-variable map: rows = AB in Gray code (00,01,11,10), cols = CD in Gray code (00,01,11,10)
const GRAY_ORDER: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
];
function cellsToMinterm4(a: number, b: number, c: number, d: number): number {
  return a * 8 + b * 4 + c * 2 + d;
}

// ---- Verified grouping engine (same algorithm as the 2-3 variable tool, generalized to numVars=4) ----
function combinationsOf(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinationsOf(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinationsOf(rest, k);
  return [...withFirst, ...withoutFirst];
}
function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
}
function isValidHypercube(cells: number[], numVars: number): boolean {
  const n = cells.length;
  if ((n & (n - 1)) !== 0) return false;
  const bitsVarying = Math.log2(n);
  let orAll = 0,
    andAll = (1 << numVars) - 1;
  for (const c of cells) {
    orAll |= c;
    andAll &= c;
  }
  const varyingMask = orAll & ~andAll;
  if (popcount(varyingMask) !== bitsVarying) return false;
  const fixedBits = andAll & ~varyingMask;
  const expected = new Set<number>();
  const varyingPositions: number[] = [];
  for (let i = 0; i < numVars; i++) if (varyingMask & (1 << i)) varyingPositions.push(i);
  for (let mask = 0; mask < n; mask++) {
    let val = fixedBits;
    for (let i = 0; i < varyingPositions.length; i++)
      if (mask & (1 << i)) val |= 1 << varyingPositions[i];
    expected.add(val);
  }
  const actual = new Set(cells);
  if (expected.size !== actual.size) return false;
  for (const e of expected) if (!actual.has(e)) return false;
  return true;
}
function findGroupings(grid: CellVal[], numVars: number): { cells: number[]; size: number }[] {
  const totalCells = grid.length;
  const groups: { cells: number[]; size: number }[] = [];
  function isAllOnesOrDC(cells: number[]): boolean {
    return cells.every((c) => grid[c] === 1 || grid[c] === 'X') && cells.some((c) => grid[c] === 1);
  }
  // Start from groupSize >= 1 (not >=2): isolated single cells with no adjacent partner are a valid,
  // necessary fallback group — verified via an independent test that caught this exact omission earlier.
  for (let groupSize = totalCells; groupSize >= 1; groupSize /= 2) {
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    for (const combo of combinationsOf(indices, groupSize)) {
      if (isValidHypercube(combo, numVars) && isAllOnesOrDC(combo))
        groups.push({ cells: combo, size: groupSize });
    }
  }
  return groups;
}
function groupToExpression(cells: number[], numVars: number, varNames: string[]): string {
  let andAll = (1 << numVars) - 1,
    orAll = 0;
  for (const c of cells) {
    andAll &= c;
    orAll |= c;
  }
  const varyingMask = orAll & ~andAll;
  const fixedBits = andAll & ~varyingMask;
  const literals: string[] = [];
  for (let i = numVars - 1; i >= 0; i--) {
    if (varyingMask & (1 << i)) continue;
    const bitSet = (fixedBits & (1 << i)) !== 0;
    literals.push(bitSet ? varNames[numVars - 1 - i] : `${varNames[numVars - 1 - i]}'`);
  }
  return literals.length > 0 ? literals.join('') : '1';
}
function solveKMap(
  grid: CellVal[],
  numVars: number,
  varNames: string[],
): { expression: string; groupsUsed: { cells: number[]; size: number; expr: string }[] } {
  const allGroups = findGroupings(grid, numVars).sort((a, b) => b.size - a.size);
  const onesToCover = new Set(grid.map((v, i) => (v === 1 ? i : -1)).filter((i) => i !== -1));
  const covered = new Set<number>();
  const chosen: { cells: number[]; size: number; expr: string }[] = [];
  while (covered.size < onesToCover.size) {
    let best: { cells: number[]; size: number } | null = null;
    let bestNewCoverage = 0;
    for (const g of allGroups) {
      const newCoverage = g.cells.filter((c) => onesToCover.has(c) && !covered.has(c)).length;
      if (
        newCoverage > bestNewCoverage ||
        (newCoverage === bestNewCoverage && best && g.size > best.size)
      ) {
        best = g;
        bestNewCoverage = newCoverage;
      }
    }
    if (!best || bestNewCoverage === 0) break;
    best.cells.forEach((c) => {
      if (onesToCover.has(c)) covered.add(c);
    });
    chosen.push({ ...best, expr: groupToExpression(best.cells, numVars, varNames) });
  }
  const expression =
    chosen.length > 0 ? chosen.map((c) => c.expr).join(' + ') : onesToCover.size === 0 ? '0' : '1';
  return { expression, groupsUsed: chosen };
}

function cellStyle(val: CellVal, highlighted: boolean, groupColor: string): React.CSSProperties {
  return {
    width: 46,
    height: 46,
    borderRadius: 5,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 15,
    fontWeight: 700,
    background: val === 1 ? COLORS.tealSoft : val === 'X' ? COLORS.amberSoft : '#fff',
    border: `2px solid ${val === 1 ? COLORS.teal : val === 'X' ? COLORS.amber : COLORS.line}`,
    outline: highlighted ? `3px solid ${groupColor}` : 'none',
    outlineOffset: 2,
    color: COLORS.ink,
    cursor: 'pointer',
  };
}

const GROUP_COLORS = [COLORS.teal, COLORS.purple, COLORS.red, '#C97B2E', '#3D8FB0', '#B0553D'];
const VAR_NAMES = ['A', 'B', 'C', 'D'];

export default function KMap4VariableVisualizer() {
  const [grid, setGrid] = useState<CellVal[]>([1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0]);
  const [solved, setSolved] = useState(false);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

  function cycleCell(idx: number) {
    const next = [...grid];
    const cur = next[idx];
    next[idx] = cur === 0 ? 1 : cur === 1 ? 'X' : 0;
    setGrid(next);
    setSolved(false);
  }

  const solution = solved ? solveKMap(grid, 4, VAR_NAMES) : null;

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
          Boolean Algebra &amp; Simplification · D2
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Karnaugh Maps (4 Variables)
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          The same grouping trick, scaled up to a full 4x4 grid — including wraparound in BOTH
          directions.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A 4-variable K-map extends the same idea from smaller maps into a full 4x4 grid of 16
            cells — one for every possible combination of 4 input variables. Both the rows AND the
            columns are ordered in
            <strong> Gray code</strong> (00, 01, 11, 10), which means adjacency — and therefore
            valid groupings — can wrap around in both directions. This makes the 4-variable map the
            first size where a group can span all four corners of the grid at once, since the
            top-left, top-right, bottom-left, and bottom-right corners are all secretly adjacent to
            each other through wraparound.
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Row/column Gray code"
            def="Both the row labels (AB) and column labels (CD) follow the 00-01-11-10 sequence, not plain binary counting — so adjacent rows/columns always differ by one bit."
          />
          <KeyTerm
            term="Row wraparound"
            def="The top row and bottom row are adjacent to each other, just like the left and right columns are."
          />
          <KeyTerm
            term="Corner group"
            def="A group made of all 4 corner cells — possible because each corner is one wraparound step away from its neighbors in both directions."
          />
          <KeyTerm
            term="Octet"
            def="A group of 8 cells (the largest group short of the entire map) — eliminates 3 of the 4 variables from that term."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Click any cell to cycle it through 0 → 1 → don't-care (X) → back to 0.</Step>
            <Step>
              Press "Solve" to have the tool search for the simplest valid grouping and derive the
              expression.
            </Step>
            <Step>
              Click through the group list to see which cells each term came from — watch for groups
              that wrap around an edge.
            </Step>
            <Step>
              Try setting all four corners to 1 (and everything else to 0) to see the
              corner-wraparound group in action.
            </Step>
          </ol>
        </Section>

        <Section title="Build and solve a 4-variable K-map">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'inline-block' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '54px 48px 48px 48px 48px',
                  gridTemplateRows: '26px 46px 46px 46px 46px',
                  gap: 2,
                }}
              >
                <div />
                {GRAY_ORDER.map(([c, d], i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center',
                      fontSize: 10,
                      color: COLORS.inkSoft,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    CD={c}
                    {d}
                  </div>
                ))}
                {GRAY_ORDER.map(([a, b], rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: COLORS.inkSoft,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      AB={a}
                      {b}
                    </div>
                    {GRAY_ORDER.map(([c, d], colIdx) => {
                      const idx = cellsToMinterm4(a, b, c, d);
                      const inSolvedGroup =
                        solution && solution.groupsUsed[selectedGroupIdx]?.cells.includes(idx);
                      return (
                        <button
                          key={colIdx}
                          onClick={() => cycleCell(idx)}
                          style={cellStyle(
                            grid[idx],
                            !!inSolvedGroup,
                            GROUP_COLORS[selectedGroupIdx % GROUP_COLORS.length],
                          )}
                        >
                          {grid[idx]}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 8, maxWidth: 280 }}>
                Both axes use Gray-code order (00, 01, 11, 10) — every row is adjacent to the row
                above/below AND wraps top-to-bottom; same for columns left-to-right.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 14 }}>
              <Btn
                variant="primary"
                onClick={() => {
                  setSolved(true);
                  setSelectedGroupIdx(0);
                }}
              >
                Solve
              </Btn>
              <Btn variant="ghost" onClick={() => setSolved(false)}>
                Hide solution
              </Btn>
            </div>

            {solution && (
              <div>
                <div
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLORS.teal,
                    marginBottom: 10,
                  }}
                >
                  Simplified expression: {solution.expression}
                </div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>
                  Click a term to highlight its group on the map above:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {solution.groupsUsed.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedGroupIdx(i)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 5,
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 12.5,
                        fontWeight: 700,
                        background:
                          i === selectedGroupIdx
                            ? `${GROUP_COLORS[i % GROUP_COLORS.length]}22`
                            : '#fff',
                        border: `1.5px solid ${GROUP_COLORS[i % GROUP_COLORS.length]}`,
                        color: COLORS.ink,
                        cursor: 'pointer',
                      }}
                    >
                      {g.expr} ({g.size} cell{g.size !== 1 ? 's' : ''})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Callout>
              <strong>Common mistake:</strong> only checking for wraparound in ONE direction (say,
              left-right) and missing that the SAME wraparound rule applies top-to-bottom too. On a
              4-variable map, both apply simultaneously — which is exactly what makes the 4-corner
              group possible, even though the four corners look maximally far apart on the printed
              page.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
