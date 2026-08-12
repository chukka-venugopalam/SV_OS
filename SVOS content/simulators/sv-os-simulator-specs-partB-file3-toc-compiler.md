# SV-OS New Simulator Specs — Part B, File 3 of 6

Covers: Theory of Computation (2) + Compiler Design (3) — 5 uncovered nodes. Finite Automata,
Regular Languages, Turing Machines, Lexical Analysis, Parsing excluded (covered).

---

## 1. pda-cfg-visualizer

**Node:** Context-Free Grammars & Pushdown Automata
**Mechanism:** Recognizes a context-free language using a PDA's explicit stack (push/pop per transition), run alongside a CFG leftmost derivation for the same string, showing the structural correspondence between derivation steps and stack operations.
**Step sequence:**

1. Load a CFG (e.g., S→aSb | ε) and its equivalent PDA transition table.
2. For each input symbol: consult the PDA transition function based on current state, input symbol, and stack top.
3. Execute the indicated push or pop on the stack.
4. In parallel, expand one non-terminal in the CFG's leftmost derivation to match progress.
5. Accept if input is consumed and stack is empty (empty-stack acceptance) or PDA is in a final state.
   **Per-step highlight + explanation:**

- Highlight the stack's top element and the CFG symbol being expanded, side by side.
- "L={aⁿbⁿ}, PDA pushes A per 'a', pops per 'b'. Input 'aabb': push A (stack:A), push A (stack:AA), read 'b'→pop (stack:A), read 'b'→pop (stack: empty) → accept, matching derivation S⇒aSb⇒aaSbb⇒aabb (S→ε at the last step)."

---

## 2. np-reduction-visualizer

**Node:** Complexity Theory (P vs NP)
**Mechanism:** Classifies a given decision problem into P / NP / NP-Complete / NP-Hard via a guided flowchart (is a solution verifiable in polynomial time? is it also solvable in polynomial time? can a known NP-Complete problem reduce to it?), then walks through one concrete polynomial-time reduction end to end.
**Step sequence:**

1. Present the problem; ask whether a candidate solution can be verified in polynomial time (NP membership check).
2. If yes, ask whether it can also be solved (not just verified) in polynomial time (P membership check).
3. If not known to be in P: demonstrate reducing a known NP-Complete problem to it (or from it) via a specific polynomial-time transformation.
4. Confirm the reduction preserves yes/no answers in both directions.
   **Per-step highlight + explanation:**

- Highlight the specific structural mapping the reduction uses, on both problem instances simultaneously.
- "Independent Set ≤p Vertex Cover: for graph G=(V,E), S is an independent set of size k iff V∖S is a vertex cover of size |V|−k. Example: 4-cycle {1,2,3,4}, edges {12,23,34,41}; IS={1,3} (size 2, no edge between them) ⇒ VC=V∖{1,3}={2,4} (size 2) — check: edge 12 covered by 2, 23 by 2, 34 by 4, 41 by 4, all covered."

---

## 3. type-checker-visualizer

**Node:** Semantic Analysis & Type Checking
**Mechanism:** Walks an abstract syntax tree bottom-up (postorder), building and querying a symbol table for each identifier's declared type, and applying type-compatibility/coercion rules at each operator node to determine the resulting expression type or flag a type error.
**Step sequence:**

1. Display the AST for a given expression/statement.
2. Visit each leaf identifier; look up its declared type in the symbol table.
3. At each operator node, check operand type compatibility per the language's coercion rules.
4. If types match a promotion rule, annotate the node with the resulting (possibly widened) type; if incompatible, flag a type error at that node.
   **Per-step highlight + explanation:**

- Highlight the AST node currently being type-checked and its resolved type.
- "x:int + y:float → int operand is promoted to float per standard numeric promotion → '+' node resolves to type float. x:int + z:boolean (no valid coercion) → type error flagged at the '+' node."

---

## 4. three-address-code-visualizer

**Node:** Intermediate Code & Optimization
**Mechanism:** Generates three-address code (TAC) from an expression's AST via postorder traversal (each operator produces one TAC instruction referencing at most two operands and one result temp), then applies optimization passes — constant folding, common subexpression elimination, dead code elimination — showing before/after TAC.
**Step sequence:**

1. Traverse the AST in postorder; at each operator node, emit a TAC instruction using child results (temps or operands).
2. Assign a new temporary variable to each instruction's result.
3. Scan generated TAC for optimization opportunities: identical operand+operator pairs (CSE), operations on two constants (constant folding), assignments never subsequently read (dead code).
4. Rewrite TAC applying each applicable optimization; display the reduced instruction count.
   **Per-step highlight + explanation:**

- Highlight the AST subtree feeding each TAC line as it's emitted; highlight removed/merged lines in the optimization pass.
- "x=(a+b)*(c-d): t1=a+b; t2=c-d; t3=t1*t2; x=t3 — 4 instructions, no redundancy to fold here since a,b,c,d are non-constant; a later x=(a+b)*(a+b) would let CSE reuse t1 instead of recomputing."

---

## 5. codegen-linking-visualizer

**Node:** Code Generation & Linking
**Mechanism:** Maps each TAC instruction to target machine instructions via a simple register-allocation strategy (assign operands to available registers, spill to memory when registers run out), then separately simulates linking: resolving an unresolved external symbol reference to its defined address in another object module and patching the referencing instruction.
**Step sequence:**

1. Take TAC input; for each instruction, allocate registers to operands (reuse a register if its prior value is no longer needed).
2. Emit the equivalent target instruction (load/arithmetic/store) using allocated registers.
3. (Linking phase) Scan the object file's relocation table for unresolved symbols.
4. For each, look up the symbol's defined address in the linked module(s) and patch the instruction's address field.
   **Per-step highlight + explanation:**

- Highlight the register being allocated/reused; highlight the patched address field before/after linking.
- "t1=a+b → LOAD R1,a / ADD R1,b (2-address target). Linking: a CALL foo instruction at offset 0x40 has an unresolved reference; foo is defined at 0x1000 in module B → linker patches the instruction's operand from a placeholder to 0x1000."

---

_File 3 of 6. Next: File 4 (Operating Systems + Databases)._
