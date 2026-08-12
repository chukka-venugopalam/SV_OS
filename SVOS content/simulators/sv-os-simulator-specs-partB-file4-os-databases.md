# SV-OS New Simulator Specs — Part B, File 4 of 6

Covers: Operating Systems (4) + Databases (4) — 8 uncovered nodes. CPU Scheduling,
Synchronization & Deadlocks, Virtual Memory, Relational Model & SQL, Indexing excluded (covered).

---

## 1. process-state-visualizer

**Node:** Processes & Process Management
**Mechanism:** Drives the standard 5-state process model (New→Ready→Running→Waiting→Terminated, plus Ready↔Running↔Waiting cycling) through a sequence of triggering events (admit, dispatch, timer interrupt, I/O request, I/O completion, exit), updating the process's PCB fields at each transition.
**Step sequence:**

1. Display the state diagram and a process's current state + PCB (PID, state, program counter, registers, priority).
2. Feed one event at a time (e.g., "I/O request").
3. Look up the valid transition for (current state, event); if invalid, flag it.
4. Move the process to the new state; update relevant PCB fields (e.g., saved PC/registers on a context switch out).
5. Repeat for the event sequence; log the full state-transition history.
   **Per-step highlight + explanation:**

- Highlight the active state node and the edge just traversed.
- "Running →(I/O request)→ Waiting: PCB's program counter and registers are saved before the switch; Waiting →(I/O completion)→ Ready, not directly to Running — it must wait for the scheduler to dispatch it again."

---

## 2. race-condition-visualizer

**Node:** Threads & Concurrency
**Mechanism:** Interleaves two threads' instructions on a shared variable at the read/modify/write granularity to show how an unsynchronized interleaving loses an update, then re-runs the same interleaving with a mutex lock to show correct serialization.
**Step sequence:**

1. Display shared variable (e.g., counter=5) and two threads each executing read→increment→write.
2. Step through an interleaving: T1 reads counter (5); T2 reads counter (5, before T1 writes back).
3. T1 computes 6, writes counter=6. T2 (still holding its stale read of 5) computes 6, writes counter=6.
4. Show final counter=6 instead of the expected 7 — one increment was lost.
5. Re-run with a lock: T2's read is blocked until T1 releases the lock after its write, forcing T2 to read the updated value (6) → correct final result 7.
   **Per-step highlight + explanation:**

- Highlight each thread's read/write operations on a shared timeline, color-coding the "stale read" that causes the bug.
- "Without lock: interleaved reads both see 5 → final value 6 (lost update). With mutex around read-modify-write: T2 blocks until T1's critical section completes → final value 7 (correct)."

---

## 3. inode-allocation-visualizer

**Node:** File Systems
**Mechanism:** Resolves a file byte offset to a physical block using a classic Unix-style inode (12 direct pointers + 1 single-indirect + 1 double-indirect block), and computes maximum file size from block size and pointer size.
**Step sequence:**

1. Display the inode structure: 12 direct pointers, 1 single-indirect pointer, 1 double-indirect pointer.
2. Given a target block number (offset ÷ block size), check if it falls within the first 12 (direct — read pointer directly).
3. If not, check if it falls within the single-indirect range (read the indirect block, then the target pointer within it).
4. If not, resolve via the double-indirect block (two pointer lookups: outer index, then inner index).
5. Compute max file size = (12 + ptrs_per_block + ptrs_per_block²) × block_size.
   **Per-step highlight + explanation:**

- Highlight the pointer chain actually traversed (direct vs. one/two indirect hops) for the requested block.
- "Block size 4KB, pointer size 4B → 1024 pointers per indirect block. Max size = (12 + 1024 + 1024²) × 4096 = 1,049,612 blocks × 4096B ≈ 4.1 GB. Block #1500 falls outside the 12 direct + 1024 single-indirect (1036 total) → resolved via double-indirect, 2 extra disk reads versus a direct-pointer access."

---

## 4. io-technique-visualizer

**Node:** I/O & Device Management
**Mechanism:** Mode-selectable simulation of one data transfer under three I/O techniques — programmed I/O (polling), interrupt-driven I/O, and DMA — showing CPU involvement (or lack of it) at each step of the transfer.
**Step sequence (per mode):**

1. Polling: CPU issues read command, then busy-loops checking the device status register every cycle until "ready" is set, then reads the data register itself, word by word.
2. Interrupt-driven: CPU issues read command, then executes unrelated instructions; device raises an interrupt when data is ready; CPU's ISR reads the data register.
3. DMA: CPU issues a transfer command to the DMA controller (with memory address + word count) and continues other work; the DMA controller transfers data directly between device and memory; CPU is interrupted only once, at full-transfer completion.
   **Per-step highlight + explanation:**

- Highlight CPU-busy vs. CPU-free time spans on a timeline for each mode, side by side.
- "For a 1000-word transfer: polling keeps the CPU in a check-loop for the entire transfer; interrupt-driven frees the CPU between words but still interrupts it 1000 times; DMA interrupts the CPU exactly once, after all 1000 words are moved."

---

## 5. normalization-visualizer

**Node:** Normalization & Schema Design
**Mechanism:** Given a relation schema and a set of functional dependencies, computes candidate keys via attribute closure, then checks each FD against 2NF (no partial dependency of a non-prime attribute on part of a composite key), 3NF (no transitive dependency of a non-prime attribute through a non-key determinant), and BCNF (every determinant must be a superkey).
**Step sequence:**

1. Display the relation's attributes and given FDs.
2. Compute the closure of each candidate attribute set; identify which reach all attributes (candidate keys).
3. For each FD X→Y: check if X is a superkey (BCNF test).
4. If X is not a superkey: check if Y is a prime attribute (part of some candidate key) — if so, 3NF still holds for this FD even though BCNF fails.
5. If the key is composite: additionally check no non-prime attribute depends on only part of the key (2NF test).
   **Per-step highlight + explanation:**

- Highlight the FD being tested and the closure computation that determines superkey status.
- "R(A,B,C,D), FDs A→B, A→C, C→D: closure {A}⁺={A,B,C,D} → A is the sole candidate key (single attribute, so 2NF holds automatically). But A→C→D is transitive — {C}⁺={C,D} only, C is not a superkey, and D is non-prime → 3NF is violated (relation is in 2NF but not 3NF)."

---

## 6. serializability-visualizer

**Node:** Transactions & ACID
**Mechanism:** Builds a precedence (conflict) graph from a schedule of interleaved transaction operations — an edge Ti→Tj is added whenever an operation of Ti precedes a conflicting operation of Tj (same data item, different transactions, at least one is a write) — and checks the graph for cycles to determine conflict-serializability.
**Step sequence:**

1. Display the interleaved schedule (operations in execution order).
2. Scan operation pairs on the same data item from different transactions; for each conflicting pair, note which precedes which.
3. Add a directed edge to the precedence graph for each conflict, in precedence order.
4. Check the resulting graph for cycles.
5. If acyclic: report an equivalent serial order (topological sort). If cyclic: report non-conflict-serializable and highlight the cycle.
   **Per-step highlight + explanation:**

- Highlight each conflicting operation pair as its edge is added to the graph.
- "Schedule R1(A) R2(A) W1(A) W2(A): R1<W2 gives edge T1→T2; R2<W1 gives edge T2→T1; W1<W2 gives edge T1→T2 — graph has both T1→T2 and T2→T1 → cycle → schedule is NOT conflict-serializable."

---

## 7. query-plan-optimizer-visualizer

**Node:** Query Optimization
**Mechanism:** Distinct from relational-algebra-visualizer (which evaluates one query tree correctly) — this compares multiple _equivalent_ query trees for the same query under heuristic rewrite rules (selection pushdown, projection pushdown, join reordering), using illustrative row-count estimates to show why one plan costs less.
**Step sequence:**

1. Display the naive query tree (e.g., σ then applied after a full join).
2. Apply a rewrite rule (push selection below the join) to produce an equivalent tree.
3. Estimate intermediate result sizes at each node under both trees using given/assumed selectivity and table sizes.
4. Compare total estimated rows processed between the two plans; select the lower-cost one.
   **Per-step highlight + explanation:**

- Highlight the node being rewritten and the row-count estimate at each intermediate result.
- "Employee (10,000 rows) ⋈ Department, then σ(dept='CS'): join produces ~10,000 intermediate rows before filtering. Pushing σ(dept='CS') below the join first filters Employee to ~200 rows, then joins only those — same final result, far less intermediate work."

---

## 8. consistent-hashing-visualizer

**Node:** NoSQL & Distributed Databases
**Mechanism:** Places both storage nodes and data keys onto a shared hash ring (via a common hash function); each key is owned by the first node encountered moving clockwise from the key's position — so adding or removing a node only remaps the keys between it and its predecessor, not the entire keyspace.
**Step sequence:**

1. Hash each node's identifier onto the ring (a fixed-size circular hash space).
2. Hash each incoming key onto the same ring.
3. For a key, walk clockwise to find the nearest node — that node owns the key.
4. Add a new node: recompute ownership only for keys between the new node and its clockwise predecessor.
5. Remove a node: its keys are reassigned to the next node clockwise; all other assignments are untouched.
   **Per-step highlight + explanation:**

- Highlight the ring position of the node/key being placed, and the arc of keys affected by an add/remove.
- "4 nodes on the ring, key K hashes between Node B and Node C → owned by Node C (next clockwise). Removing Node C reassigns only K (and other keys in that arc) to Node D — the other 3 nodes' key sets are unaffected, unlike mod-N hashing where removing one node reshuffles nearly everything."

---

_File 4 of 6. Next: File 5 (Computer Networks)._
