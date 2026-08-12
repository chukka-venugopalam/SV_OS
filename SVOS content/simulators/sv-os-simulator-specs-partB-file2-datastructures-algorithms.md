# SV-OS New Simulator Specs — Part B, File 2 of 6

Covers: Data Structures (2) + Algorithms (5) — 7 uncovered nodes. Stacks/Queues, Trees/BST,
Heaps, Hash Tables, Advanced Trees, Sorting, Dynamic Programming, Graph Algorithms excluded (covered).

---

## 1. array-address-visualizer

**Node:** Arrays & Strings
**Mechanism:** Computes the memory address of A[i][j] in a 2D array from base address, element size, and dimensions, under both row-major and column-major layouts: Addr = Base + [(i)×cols + j]×size (row-major) or Base + [(j)×rows + i]×size (column-major).
**Step sequence:**

1. Display array dimensions, base address, element size, and target index [i][j].
2. Row-major: compute linear offset = i×num_cols + j.
3. Column-major: compute linear offset = j×num_rows + i.
4. Multiply offset by element size, add to base address.
   **Per-step highlight + explanation:**

- Highlight the target cell in a grid view, with the linear-offset path traced (row-by-row or column-by-column).
- "Base=1000, A[5][10], 0-indexed, size=4B, target A[3][7]: row-major → 1000+(3×10+7)×4 = 1148; column-major → 1000+(7×5+3)×4 = 1152 — same cell, different physical address."

---

## 2. linked-list-reversal-visualizer

**Node:** Linked Lists
**Mechanism:** Reverses a singly linked list in-place using three tracking pointers (prev, curr, next), redirecting each node's next-pointer backward one node at a time.
**Step sequence:**

1. Init prev=NULL, curr=head.
2. Save next=curr.next before overwriting anything.
3. Redirect curr.next=prev.
4. Advance prev=curr, curr=next.
5. Repeat until curr=NULL; set head=prev.
   **Per-step highlight + explanation:**

- Highlight prev/curr/next as three colored markers moving across the node chain each iteration.
- "List A→B→C→NULL: iter1 (prev=NULL,curr=A,next=B) → A.next=NULL, prev=A,curr=B; iter2 (next=C) → B.next=A, prev=B,curr=C; iter3 (next=NULL) → C.next=B, prev=C,curr=NULL → head=C, list now C→B→A→NULL."

---

## 3. master-theorem-visualizer

**Node:** Complexity Analysis (Big-O)
**Mechanism:** Solves T(n)=aT(n/b)+f(n) by comparing f(n) against n^(log_b a) and applying the matching Master Theorem case (1: f(n) polynomially smaller → T(n)=Θ(n^(log_b a)); 2: same order → T(n)=Θ(n^(log_b a)·log n); 3: polynomially larger + regularity → T(n)=Θ(f(n))).
**Step sequence:**

1. Extract a, b, f(n) from the recurrence.
2. Compute n^(log_b a).
3. Compare f(n) to n^(log_b a) (asymptotically smaller/equal/larger).
4. Apply the matching case; state the closed-form Θ bound.
   **Per-step highlight + explanation:**

- Highlight a, b, f(n) in the recurrence and the computed n^(log_b a) side by side.
- "T(n)=2T(n/2)+n: a=2,b=2 → n^(log₂2)=n¹; f(n)=n matches order → Case 2 → T(n)=Θ(n log n)."
- "T(n)=T(n/2)+1: a=1,b=2 → n^(log₂1)=n⁰=1; f(n)=1 matches → Case 2 → T(n)=Θ(log n)."

---

## 4. binary-search-visualizer

**Node:** Searching Algorithms
**Mechanism:** Narrows a search window on a sorted array using low/high/mid pointers, halving the search space each comparison by discarding the half that can't contain the target.
**Step sequence:**

1. Init low=0, high=n−1.
2. Compute mid=⌊(low+high)/2⌋; compare arr[mid] to target.
3. If equal: found, stop. If arr[mid] < target: low=mid+1. If arr[mid] > target: high=mid−1.
4. Repeat until found or low>high (not present).
   **Per-step highlight + explanation:**

- Highlight low/mid/high positions on the array strip each iteration, shading the eliminated half gray.
- "arr=[2,5,8,12,16,23,38,45,56,72,91], target=72: mid=5→23<72,low=6; mid=8→56<72,low=9; mid=9→72 found — 3 comparisons instead of scanning all 11 elements."

---

## 5. tower-of-hanoi-visualizer

**Node:** Recursion & Divide-and-Conquer
**Mechanism:** Solves the n-disk Tower of Hanoi via T(n)=2T(n−1)+1: recursively move n−1 disks to the spare peg, move the largest disk to the target, then move the n−1 disks from spare to target — visualizing the recursive call stack alongside the physical moves.
**Step sequence:**

1. Push initial call Hanoi(n, source, target, spare) onto a visualized call stack.
2. Recurse: Hanoi(n−1, source, spare, target) — stack grows.
3. Base case (n=1): move disk directly; stack unwinds one level, executing the "move largest disk" step.
4. Recurse: Hanoi(n−1, spare, target, source) — stack grows again, then unwinds.
5. Continue until the stack is empty; total moves = 2ⁿ−1.
   **Per-step highlight + explanation:**

- Highlight the active stack frame and the physical disk move it triggers, in lockstep.
- "n=3, A→C via B: move sequence A→C, A→B, C→B, A→C, B→A, B→C, A→C — exactly 2³−1=7 moves."

---

## 6. huffman-coding-visualizer

**Node:** Greedy Algorithms
**Mechanism:** Builds an optimal prefix code by repeatedly extracting the two lowest-frequency nodes from a min-heap, merging them into a parent node (frequency = sum), and reinserting — until one root remains; edge labels (0/1) on the final tree give each symbol's codeword.
**Step sequence:**

1. Insert all symbol frequencies into a min-heap.
2. Extract the two minimum-frequency nodes.
3. Create a parent node with their summed frequency; insert it back into the heap.
4. Repeat until one node (the root) remains.
5. Traverse root-to-leaf, appending 0/1 per left/right edge, to read off each symbol's codeword.
   **Per-step highlight + explanation:**

- Highlight the two nodes being merged and the new parent appearing in the heap each round.
- "Frequencies A5,B9,C12,D13,E16,F45: merge A+B=14 → merge C+D=25 → merge 14+E=30 → merge 25+30=55 → merge 55+F(45)=100 (root) — 5 merges for 6 symbols, as expected (n−1 merges)."

---

## 7. kmp-pattern-match-visualizer

**Node:** String Algorithms
**Mechanism:** Knuth-Morris-Pratt matching: precomputes an LPS (longest proper prefix that's also a suffix) array from the pattern, then scans the text using LPS to skip re-comparing characters already known to match on a mismatch, avoiding the O(nm) worst case of naive matching.
**Step sequence:**

1. Build the LPS array: for each pattern position, find the length of the longest proper prefix-suffix match ending there.
2. Scan text and pattern left to right, incrementing both pointers on match.
3. On mismatch: if pattern pointer > 0, jump it back to lps[pattern_pointer−1] (don't move text pointer); else advance text pointer.
4. Report match position when pattern pointer reaches pattern length.
   **Per-step highlight + explanation:**

- Highlight the LPS value being computed per position, and during matching, highlight the "jump" distance on mismatch instead of restarting from scratch.
- "Pattern ABABC → LPS=[0,0,1,2,0]: position 4 ('C') mismatches after matching 'ABAB' elsewhere, so on a later mismatch after matching 'AB', the pointer jumps using lps[1]=0 rather than re-scanning from the text position after the first 'A'."

---

_File 2 of 6. Next: File 3 (Theory of Computation + Compiler Design)._
