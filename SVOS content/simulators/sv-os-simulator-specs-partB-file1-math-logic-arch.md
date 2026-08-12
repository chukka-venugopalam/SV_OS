# SV-OS New Simulator Specs — Part B, File 1 of 6

Covers: Mathematics (5) + Digital Logic (3) + Computer Architecture (1) — the 9 genuinely
uncovered nodes in these domains. Boolean Algebra, Logic Gates, Karnaugh Maps, CPU Architecture,
Assembly Language, Memory Hierarchy, and Pipelining are excluded — already covered.

---

## 1. relation-properties-visualizer

**Node:** Discrete Math Foundations
**Mechanism:** Given a relation R as a set of ordered pairs on a finite set A, tests each defining property (reflexive, symmetric, antisymmetric, transitive) by checking the required pairs exist/don't exist in R, then — if R qualifies as an equivalence relation — partitions A into equivalence classes by grouping elements connected through R.

**Step sequence:**

1. Display set A as nodes and R as directed edges (a digraph), plus R as an explicit pair-list.
2. Reflexive check: for every a in A, verify (a,a) ∈ R; flag any missing self-loop.
3. Symmetric check: for every (a,b) ∈ R, verify (b,a) ∈ R; flag any one-directional edge.
4. Transitive check: for every (a,b),(b,c) ∈ R, verify (a,c) ∈ R; flag any missing "shortcut" edge.
5. If reflexive + symmetric + transitive all hold: group elements into equivalence classes (connected components of the digraph) and display the resulting partition of A.

**Per-step highlight + explanation:**

- Highlight the specific pair being tested in the pair-list and the corresponding edge(s) on the digraph.
- Explanation: "R = {(1,1),(2,2),(3,3),(1,2),(2,1),(2,3),(3,2),(1,3),(3,1)} on A={1,2,3} — transitive check on (1,2) and (2,3) requires (1,3): present, so this triple passes."
- Final: "R is reflexive, symmetric, and transitive → equivalence relation; equivalence classes: {1,2,3} (single class, since all elements are mutually related)."

---

## 2. bayes-theorem-visualizer

**Node:** Combinatorics & Probability
**Mechanism:** Covers two distinct sub-mechanisms selectable by the learner: (a) systematic counting via the multiplication principle / permutations-combinations formulas for a stated selection problem, and (b) conditional probability computation via Bayes' Theorem, P(A|B) = P(B|A)P(A) / [P(B|A)P(A) + P(B|¬A)P(¬A)], built term by term.

**Step sequence (Bayes branch):**

1. State the problem with given values: P(A) (prior), P(B|A) (sensitivity/true positive rate), P(B|¬A) (false positive rate).
2. Compute the numerator: P(B|A) × P(A).
3. Compute the second term of the denominator: P(B|¬A) × P(¬A), where P(¬A) = 1 − P(A).
4. Sum both terms to get P(B) (total probability of evidence B).
5. Divide numerator by P(B) to get the posterior P(A|B).

**Step sequence (Counting branch):**

1. Identify whether order matters (permutation) or not (combination), and whether repetition is allowed.
2. Apply the matching formula (nPr = n!/(n−r)!, nCr = n!/(r!(n−r)!)) with the problem's actual n and r substituted.
3. For multi-stage selections, apply the multiplication principle by multiplying the per-stage counts.

**Per-step highlight + explanation:**

- Bayes example: "Disease prevalence P(A)=0.01, test sensitivity P(B|A)=0.99, false positive rate P(B|¬A)=0.05 → numerator = 0.99×0.01 = 0.0099; P(B) = 0.0099 + 0.05×0.99 = 0.0594; P(A|B) = 0.0099/0.0594 = 1/6 ≈ 16.7% — far lower than the 99% sensitivity suggests, because the disease is rare."
- Counting example: "Forming 4-digit codes from digits 1–9 without repetition: 9×8×7×6 = 3024 possible codes — each factor shrinks by 1 because a digit already used can't be reused."

---

## 3. derivative-chain-rule-visualizer

**Node:** Calculus Basics
**Mechanism:** Decomposes a composite function into nested outer/inner functions, differentiates each layer via the chain rule (d/dx[f(g(x))] = f'(g(x))·g'(x)), and — separately — evaluates limits at a point via direct substitution or L'Hôpital's Rule when substitution yields an indeterminate form (0/0 or ∞/∞).

**Step sequence:**

1. Given a composite function, identify the outer function f(u) and inner function u = g(x).
2. Differentiate the outer function with respect to u, keeping u symbolic: f'(u).
3. Differentiate the inner function with respect to x: g'(x).
4. Substitute u = g(x) back into f'(u), then multiply by g'(x) to get the final derivative.
5. (Limit sub-mode) Attempt direct substitution; if it yields 0/0 or ∞/∞, apply L'Hôpital's Rule (differentiate numerator and denominator separately) and re-substitute.

**Per-step highlight + explanation:**

- Highlight the current "layer" being peeled (outer vs. inner) with distinct colors on the original expression.
- Explanation: "y = sin(3x²+1) — outer f(u)=sin(u) → f'(u)=cos(u); inner u=3x²+1 → g'(x)=6x; chain rule gives dy/dx = cos(3x²+1)·6x."
- L'Hôpital explanation: "lim(x→0) sin(x)/x direct-substitutes to 0/0 — apply L'Hôpital: differentiate top and bottom → cos(x)/1 → substitute x=0 → 1."

---

## 4. critical-point-visualizer

**Node:** Calculus & Optimization Basics
**Mechanism:** Distinct from Calculus Basics (differentiation mechanics) — this simulator finds and classifies the extrema of a function: solves f'(x) = 0 for candidate critical points, then applies the second derivative test (f''(x) > 0 → local min, f''(x) < 0 → local max, f''(x) = 0 → test inconclusive, check further) to classify each.

**Step sequence:**

1. Compute f'(x) symbolically from the given f(x).
2. Solve f'(x) = 0 to find candidate critical point(s) x = c.
3. Compute f''(x) and evaluate it at each critical point.
4. Apply the sign of f''(c): positive → local minimum, negative → local maximum, zero → second derivative test inconclusive (fall back to first derivative sign change on either side of c).
5. Evaluate f(c) to report the actual extreme value at each classified point.

**Per-step highlight + explanation:**

- Highlight the candidate point on a plotted curve as it's tested; color it blue (testing), then green (min) or red (max) once classified.
- Explanation: "f(x) = x³ − 3x → f'(x) = 3x² − 3 = 0 → x = ±1; f''(x) = 6x → f''(1) = 6 > 0 (local min, f(1) = −2), f''(−1) = −6 < 0 (local max, f(−1) = 2)."

---

## 5. gaussian-elimination-visualizer

**Node:** Linear Algebra
**Mechanism:** Solves a system of linear equations by transforming the augmented matrix into row-echelon form via elementary row operations (row swap, scalar multiplication, row addition), then back-substitutes from the last equation upward; separately reports the matrix rank from the number of non-zero rows in the final echelon form.

**Step sequence:**

1. Build the augmented matrix [A | b] from the given system.
2. For each pivot column (left to right): select a pivot row (swap if needed to avoid a zero pivot), then eliminate all entries below the pivot using row addition/subtraction of scaled rows.
3. Repeat until the matrix is in upper row-echelon form.
4. Back-substitute starting from the last row: solve for the last variable, substitute into the row above, and repeat upward.
5. Report the rank (count of non-zero rows) and, if rank < number of unknowns, flag the system as having infinitely many solutions or none (check consistency).

**Per-step highlight + explanation:**

- Highlight the pivot element and the row-operation formula applied (e.g., "R2 ← R2 − (−1.5)R1") directly beside the matrix.
- Worked example: "2x+y−z=8, −3x−y+2z=−11, −2x+y+2z=−3 → after elimination: x=2, y=3, z=−1 (verified: 2(2)+3−(−1)=8 ✓)."

---

## 6. ripple-carry-adder-visualizer

**Node:** Combinational Circuits
**Mechanism:** Simulates an N-bit ripple carry adder built from N full adders chained via carry-out→carry-in, where each full adder computes Sum = A⊕B⊕Cin and Cout = AB + Cin(A⊕B), and the carry must physically propagate stage-by-stage before the final sum is stable — the mechanism this node teaches that a static truth table can't show.

**Step sequence:**

1. Load two N-bit operands and Cin=0; display each bit position as a full-adder block in a chain.
2. Evaluate stage 0 (LSB): compute Sum₀ and Cout₀ from A₀, B₀, Cin.
3. Propagate Cout₀ as Cin into stage 1; evaluate Sum₁, Cout₁.
4. Repeat propagation through each subsequent stage up to the MSB.
5. Concatenate all Sum bits (MSB to LSB) as the final result, with the last Cout as overall carry-out/overflow flag.

**Per-step highlight + explanation:**

- Highlight the active full-adder stage and animate the carry bit visibly traveling from Cout of stage i to Cin of stage i+1.
- Explanation: "4-bit add 0110(6)+0011(3): stage0: 0⊕1⊕0=1,cout=0; stage1: 1⊕1⊕0=0,cout=1; stage2: 1⊕0⊕1=0,cout=1; stage3: 0⊕0⊕1=1,cout=0 → result 1001(9), no overflow."
- Explanation on delay: "Each stage must wait for the previous stage's carry — this ripple delay is exactly why faster adders (carry-lookahead) exist, a natural segue if that topic is added later."

---

## 7. flipflop-fsm-visualizer

**Node:** Sequential Circuits
**Mechanism:** Distinct from finite-automata-visualizer (which shows abstract language-acceptance FSMs) — this simulates a hardware sequential circuit built from clocked flip-flops: given a flip-flop type (D/JK/T) and its next-state excitation logic, computes each flip-flop's next state on every clock edge and shows the resulting output sequence.

**Step sequence:**

1. Display the circuit (flip-flops + combinational next-state logic) and the current state (Q values) of each flip-flop.
2. On each clock edge: evaluate the excitation inputs (D, or JK, or T) from the current state per the given logic equations.
3. Apply the flip-flop's characteristic equation to compute next-state Q for each bit (D flip-flop: Q_next = D; T flip-flop: Q_next = T⊕Q).
4. Update all flip-flops simultaneously (synchronous), advance the clock counter, and log the new state.
5. Repeat for the requested number of clock cycles; display the full state sequence as a timing diagram.

**Per-step highlight + explanation:**

- Highlight each flip-flop's D/J-K/T input value and its resulting Q transition on the timing diagram.
- Explanation, 3-bit synchronous binary counter with D flip-flops: "D₀ = Q₀' (toggle every cycle), D₁ = Q₁⊕Q₀, D₂ = Q₂⊕(Q₁·Q₀) — state sequence: 000→001→010→011→100→101→110→111→000, matching a standard binary count."

---

## 8. ieee754-representation-visualizer

**Node:** Number Systems & Data Representation
**Mechanism:** Converts a decimal number to IEEE-754 single-precision binary representation (1 sign bit, 8 exponent bits with bias 127, 23 mantissa bits) by normalizing to 1.xxxx × 2^e form, and separately performs 2's complement addition/subtraction on fixed-width integers with explicit overflow detection.

**Step sequence (IEEE-754 branch):**

1. Convert the decimal number's integer and fractional parts to binary separately, then combine.
2. Normalize to the form 1.mantissa × 2^exponent by shifting the binary point.
3. Compute the biased exponent: actual exponent + 127; convert to 8-bit binary.
4. Take the mantissa bits after the leading 1 (up to 23 bits, zero-padded).
5. Assemble sign (1 bit) + biased exponent (8 bits) + mantissa (23 bits) = 32-bit result.

**Per-step highlight + explanation:**

- Highlight each of the 3 fields (sign/exponent/mantissa) in a distinct color as it's derived.
- Explanation: "5.75 → binary 101.11 → normalized 1.0111 × 2² → sign=0, exponent=2+127=129=10000001, mantissa=01110000000000000000000 → full encoding 0 10000001 01110000000000000000000."
- 2's complement explanation: "8-bit −5 = 2's complement of 00000101 = 11111011; adding 11111011 + 00000011 (3) = 11111110 (−2), correctly matching −5+3=−2, no overflow (signs of operands differed, so overflow is impossible here)."

---

## 9. register-transfer-visualizer

**Node:** Registers & the ALU
**Mechanism:** Executes a register-transfer-level (RTL) micro-operation sequence over a simple single-bus datapath (registers, one shared bus, one ALU), showing which control signals are active each clock cycle to move data onto/off the bus and through the ALU — the sub-instruction-level detail that CPU Architecture & Instruction Cycle (already covered) doesn't visualize.

**Step sequence:**

1. Display the datapath: register file, single shared bus, ALU with two input latches (A, B), and control-signal lines.
2. State the target RTL operation (e.g., R3 ← R1 + R2) and decompose it into micro-operations.
3. Cycle 1: assert "R1-out" and "A-in" control signals — R1's value moves onto the bus into ALU input latch A.
4. Cycle 2: assert "R2-out" and "ALU: add" — R2's value moves onto the bus, ALU computes A + bus.
5. Cycle 3: assert "ALU-out" and "R3-in" — ALU result moves onto the bus into R3, completing the transfer.

**Per-step highlight + explanation:**

- Highlight the active signal lines and the data value currently sitting on the bus each cycle.
- Explanation: "Cycle 1: R1=00000101(5) asserted onto bus, latched into A. Cycle 2: R2=00000011(3) asserted onto bus; ALU computes A+bus=5+3=8. Cycle 3: ALU output 00001000(8) written into R3 — 3 clock cycles for one RTL statement, illustrating why single-bus datapaths are slower than multi-bus ones."

---

_File 1 of 6. Next: File 2 (Data Structures + Algorithms)._
