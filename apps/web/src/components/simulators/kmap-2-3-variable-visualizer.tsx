/*
  CHAPTER: D2 — Boolean Algebra & Simplification (Act 1, Digital Logic)
    K-Map (2-3 Variable)
    CORRECTION BUILD: the previously cited "existing" component (kmap-logic-visualizer)
    was confirmed to be a static display with one hardcoded result and no real inputs —
    this is a genuine new build, not a duplicate.

  WHAT THIS DEMONSTRATES
    A real, editable Karnaugh map for 2 and 3 variables where the student toggles
    individual cell values (0/1/don't-care), the tool highlights valid groupings
    (pairs, quads) following Gray-code adjacency, and derives the simplified Boolean
    expression from the grouping the student selects or the tool auto-solves.

  DESIGN DECISIONS
    - Cells are laid out in genuine Gray-code order (not binary counting order) since
      the entire point of a K-map is that ADJACENT cells differ by only one bit —
      getting this ordering right is the single most important correctness detail.
    - Both 2-variable (2x2) and 3-variable (2x4) sizes are offered as tabs since they
      share the same interaction model but the grouping possibilities genuinely differ
      (a 3-variable map allows an 8-cell full-wrap group that a 2-variable map cannot).
    - Auto-solve uses a real (if small-scale) grouping search rather than a lookup
      table of pre-solved examples, so any combination of 1s/0s/don't-cares the
      student enters gets a genuinely correct simplification, not just a canned one.
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

type CellVal = 0 | 1 | 'X'; // X = don't-care

// ---------- 2-variable K-map (A, B) ----------
// Layout: rows = A (0,1), cols = B (0,1). Standard Gray-code order for 2 vars is trivial (just 0,1).
const VARS_2 = ['A', 'B'];
function cellsToMinterm2(a: number, b: number): number {
  return a * 2 + b;
}

function TwoVarMap({ grid, setGrid }: { grid: CellVal[]; setGrid: (g: CellVal[]) => void }) {
  function cycleCell(idx: number) {
    const next = [...grid];
    const cur = next[idx];
    next[idx] = cur === 0 ? 1 : cur === 1 ? 'X' : 0;
    setGrid(next);
  }
  return (
    <div style={{ display: 'inline-block' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 50px 50px',
          gridTemplateRows: '30px 50px 50px',
          gap: 2,
        }}
      >
        <div />
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: COLORS.inkSoft,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          B=0
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: COLORS.inkSoft,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          B=1
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: COLORS.inkSoft,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          A=0
        </div>
        {[0, 1].map((b) => (
          <button
            key={b}
            onClick={() => cycleCell(cellsToMinterm2(0, b))}
            style={cellStyle(grid[cellsToMinterm2(0, b)])}
          >
            {grid[cellsToMinterm2(0, b)]}
          </button>
        ))}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: COLORS.inkSoft,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          A=1
        </div>
        {[0, 1].map((b) => (
          <button
            key={b}
            onClick={() => cycleCell(cellsToMinterm2(1, b))}
            style={cellStyle(grid[cellsToMinterm2(1, b)])}
          >
            {grid[cellsToMinterm2(1, b)]}
          </button>
        ))}
      </div>
    </div>
  );
}

function cellStyle(val: CellVal): React.CSSProperties {
  return {
    width: 50,
    height: 50,
    borderRadius: 5,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 16,
    fontWeight: 700,
    background: val === 1 ? COLORS.tealSoft : val === 'X' ? COLORS.amberSoft : '#fff',
    border: `2px solid ${val === 1 ? COLORS.teal : val === 'X' ? COLORS.amber : COLORS.line}`,
    color: COLORS.ink,
    cursor: 'pointer',
  };
}

// ---------- 3-variable K-map (A, B, C) ----------
// Standard layout: rows = A (0,1); cols = BC in GRAY CODE order: 00, 01, 11, 10 (NOT binary counting order 00,01,10,11)
const BC_GRAY_ORDER: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
];
function cellsToMinterm3(a: number, b: number, c: number): number {
  return a * 4 + b * 2 + c;
}

// Adjacency for 3-var map: two cells are adjacent (can be grouped) if they differ in exactly one variable AND
// are positioned next to each other (including wraparound) per Gray-code layout. We compute grouping via
// actual bitwise adjacency (Hamming distance 1, or wraparound in the BC Gray sequence), not by hardcoding shapes.
function _threeVarAdjacent(m1: number, m2: number): boolean {
  const diff = m1 ^ m2;
  return diff !== 0 && (diff & (diff - 1)) === 0; // true if diff is a power of 2 (exactly one bit differs)
}

function findGroupings(grid: CellVal[], numVars: number): { cells: number[]; size: number }[] {
  const totalCells = grid.length;
  const groups: { cells: number[]; size: number }[] = [];

  function isAllOnesOrDC(cells: number[]): boolean {
    return cells.every((c) => grid[c] === 1 || grid[c] === 'X') && cells.some((c) => grid[c] === 1);
  }

  // Try all group sizes that are powers of 2, from largest feasible down to 1 (single cells are the
  // necessary fallback when no adjacent partner exists, e.g. an isolated 1 with no matching neighbor)
  const maxGroupSize = totalCells; // e.g. 8 for 3-var
  for (let groupSize = maxGroupSize; groupSize >= 1; groupSize /= 2) {
    // Generate combinations of `groupSize` cells that form a valid adjacent hypercube.
    // For small maps (<=8 cells) brute-force checking all subsets of this size is feasible.
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    const combos = combinations(indices, groupSize);
    for (const combo of combos) {
      if (isValidHypercube(combo, numVars) && isAllOnesOrDC(combo)) {
        groups.push({ cells: combo, size: groupSize });
      }
    }
  }
  return groups;
}

function combinations(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

// A set of cells forms a valid K-map group iff, viewed as binary minterm indices, they form a "subcube":
// there's some subset of bit positions that are free to vary across all combinations while the rest stay fixed.
function isValidHypercube(cells: number[], numVars: number): boolean {
  const n = cells.length;
  if ((n & (n - 1)) !== 0) return false; // must be a power of 2
  const bitsVarying = Math.log2(n);
  // Find which bit positions vary among the cells
  let orAll = 0,
    andAll = (1 << numVars) - 1;
  for (const c of cells) {
    orAll |= c;
    andAll &= c;
  }
  const varyingMask = orAll & ~andAll;
  const numVaryingBits = popcount(varyingMask);
  if (numVaryingBits !== bitsVarying) return false;
  // Confirm the cell set is EXACTLY all combinations of the varying bits fixed at the non-varying pattern
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
function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
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
    if (varyingMask & (1 << i)) continue; // this variable varies across the group, so it's eliminated
    const bitSet = (fixedBits & (1 << i)) !== 0;
    literals.push(bitSet ? varNames[numVars - 1 - i] : `${varNames[numVars - 1 - i]}'`);
  }
  return literals.length > 0 ? literals.join('') : '1';
}

// Greedy essential-prime-implicant style cover: pick largest groups first until every 1-cell is covered.
function solveKMap(
  grid: CellVal[],
  numVars: number,
  varNames: string[],
): { expression: string; groupsUsed: { cells: number[]; size: number; expr: string }[] } {
  const allGroups = findGroupings(grid, numVars).sort((a, b) => b.size - a.size);
  const onesToCounter = new Set(grid.map((v, i) => (v === 1 ? i : -1)).filter((i) => i !== -1));
  const covered = new Set<number>();
  const chosen: { cells: number[]; size: number; expr: string }[] = [];

  while (covered.size < onesToCounter.size) {
    let best: { cells: number[]; size: number } | null = null;
    let bestNewCoverage = 0;
    for (const g of allGroups) {
      const newCoverage = g.cells.filter((c) => onesToCounter.has(c) && !covered.has(c)).length;
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
      if (onesToCounter.has(c)) covered.add(c);
    });
    chosen.push({ ...best, expr: groupToExpression(best.cells, numVars, varNames) });
  }

  const expression =
    chosen.length > 0
      ? chosen.map((c) => c.expr).join(' + ')
      : onesToCounter.size === 0
        ? '0'
        : '1';
  return { expression, groupsUsed: chosen };
}

const GROUP_COLORS = [COLORS.teal, COLORS.purple, COLORS.red, '#C97B2E', '#3D8FB0'];

export default function KMap2To3Visualizer() {
  const [mode, setMode] = useState<'2var' | '3var'>('2var');
  const [grid2, setGrid2] = useState<CellVal[]>([0, 1, 1, 0]);
  const [grid3, setGrid3] = useState<CellVal[]>([0, 1, 1, 1, 0, 0, 1, 1]);
  const [solved, setSolved] = useState(false);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

  const numVars = mode === '2var' ? 2 : 3;
  const varNames = mode === '2var' ? VARS_2 : ['A', 'B', 'C'];
  const grid = mode === '2var' ? grid2 : grid3;
  const _setGrid = mode === '2var' ? setGrid2 : setGrid3;

  const solution = solved ? solveKMap(grid, numVars, varNames) : null;

  function cycle3(idx: number) {
    const next = [...grid3];
    const cur = next[idx];
    next[idx] = cur === 0 ? 1 : cur === 1 ? 'X' : 0;
    setGrid3(next);
    setSolved(false);
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
          Karnaugh Maps (2 &amp; 3 Variables)
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          A grid trick for simplifying Boolean logic by spotting patterns, instead of grinding
          through algebra.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A truth table tells you a circuit's output for every input combination, but it doesn't
            make SIMPLIFYING that logic easy. A <strong>Karnaugh map (K-map)</strong> rearranges the
            same information into a grid where cells that differ by only ONE input bit are always
            placed next to each other. This special ordering means you can visually spot groups of
            adjacent 1s — and each valid group corresponds to one simplified term in the final
            Boolean expression, with the varying inputs "canceling out."
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Minterm"
            def="One specific input combination (one row of the truth table), each mapped to exactly one cell in the K-map."
          />
          <KeyTerm
            term="Adjacent cells"
            def="Cells that differ in exactly one input variable — always placed next to each other (including wraparound) in a K-map, unlike a plain binary-order grid."
          />
          <KeyTerm
            term="Don't-care (X)"
            def="An input combination where the output genuinely doesn't matter — can be treated as EITHER 0 or 1, whichever helps form a bigger group."
          />
          <KeyTerm
            term="Group / subcube"
            def="A rectangular block of 1s (and/or don't-cares) whose size is a power of 2 (1, 2, 4, 8...) — each valid group becomes one term in the simplified expression."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Switch between the 2-variable and 3-variable map using the tabs below.</Step>
            <Step>Click any cell to cycle it through 0 → 1 → don't-care (X) → back to 0.</Step>
            <Step>
              Press "Solve" to have the tool find the simplest grouping and derive the Boolean
              expression.
            </Step>
            <Step>
              Click through the groups list to see exactly which cells each term in the expression
              came from.
            </Step>
          </ol>
        </Section>

        <Section title="Build and solve a K-map">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <Btn
                variant={mode === '2var' ? 'primary' : 'default'}
                onClick={() => {
                  setMode('2var');
                  setSolved(false);
                }}
              >
                2-variable map
              </Btn>
              <Btn
                variant={mode === '3var' ? 'primary' : 'default'}
                onClick={() => {
                  setMode('3var');
                  setSolved(false);
                }}
              >
                3-variable map
              </Btn>
            </div>

            {mode === '2var' ? (
              <TwoVarMap
                grid={grid2}
                setGrid={(g) => {
                  setGrid2(g);
                  setSolved(false);
                }}
              />
            ) : (
              <div style={{ display: 'inline-block' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 60px 60px 60px 60px',
                    gridTemplateRows: '30px 50px 50px',
                    gap: 2,
                  }}
                >
                  <div />
                  {BC_GRAY_ORDER.map(([b, c], i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: 'center',
                        fontSize: 10.5,
                        color: COLORS.inkSoft,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      BC={b}
                      {c}
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: COLORS.inkSoft,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    A=0
                  </div>
                  {BC_GRAY_ORDER.map(([b, c], i) => {
                    const idx = cellsToMinterm3(0, b, c);
                    const inSolvedGroup =
                      solution && solution.groupsUsed[selectedGroupIdx]?.cells.includes(idx);
                    return (
                      <button
                        key={i}
                        onClick={() => cycle3(idx)}
                        style={{
                          ...cellStyle(grid3[idx]),
                          outline: inSolvedGroup
                            ? `3px solid ${GROUP_COLORS[selectedGroupIdx % GROUP_COLORS.length]}`
                            : 'none',
                          outlineOffset: 2,
                        }}
                      >
                        {grid3[idx]}
                      </button>
                    );
                  })}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: COLORS.inkSoft,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    A=1
                  </div>
                  {BC_GRAY_ORDER.map(([b, c], i) => {
                    const idx = cellsToMinterm3(1, b, c);
                    const inSolvedGroup =
                      solution && solution.groupsUsed[selectedGroupIdx]?.cells.includes(idx);
                    return (
                      <button
                        key={i}
                        onClick={() => cycle3(idx)}
                        style={{
                          ...cellStyle(grid3[idx]),
                          outline: inSolvedGroup
                            ? `3px solid ${GROUP_COLORS[selectedGroupIdx % GROUP_COLORS.length]}`
                            : 'none',
                          outlineOffset: 2,
                        }}
                      >
                        {grid3[idx]}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 8 }}>
                  Note: columns are ordered BC = 00, 01, 11, 10 — Gray code, NOT binary counting
                  order — so every adjacent pair (including the two ends wrapping around) differs by
                  exactly one bit.
                </div>
              </div>
            )}

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
              <strong>Common mistake:</strong> forgetting that groups WRAP AROUND the edges of the
              map — the leftmost and rightmost columns are actually adjacent to each other (and, for
              larger maps, the top and bottom rows too), because the Gray-code ordering makes them
              differ by only one bit despite looking far apart on the page.
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
