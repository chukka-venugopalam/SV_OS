# SV-OS New Simulator Specs — Part B, File 6 of 6

Covers: Software Engineering (5) + OOP (4) + Distributed Systems (3) — 12 nodes, all newly built
(none of the 32 existing simulators touch this domain).

---

## 1. scrum-sprint-visualizer

**Node:** SDLC & Agile Methodologies
**Mechanism:** Cycles through a Scrum sprint's stages (Product Backlog → Sprint Planning → Daily Standup, repeating → Sprint Review → Retrospective → back to Backlog), contrasted against Waterfall's strictly sequential, non-repeating phase list for the same project.
**Step sequence:**

1. Show Product Backlog (prioritized items); Sprint Planning selects a subset into the Sprint Backlog.
2. Repeat Daily Standup for each day of the sprint (fixed length, e.g., 2 weeks) — no scope changes mid-sprint.
3. Sprint Review: demo completed increment to stakeholders.
4. Retrospective: team reviews process, not product.
5. Loop back to Backlog for the next sprint; compare total elapsed time against Waterfall's single linear pass through Requirements→Design→Implementation→Testing→Deployment.
   **Per-step highlight + explanation:**

- Highlight the active stage and whether feedback can loop back (Scrum) or only flow forward (Waterfall).
- "Waterfall: a requirements change discovered during Testing forces reopening the Requirements phase — costly. Scrum: the same discovery surfaces at the next Sprint Review, re-prioritized into the Backlog for the next sprint — contained to one iteration."

---

## 2. dfd-leveling-visualizer

**Node:** Requirements Engineering & Design Patterns
**Scoping note:** interpreted as requirements artifacts + structured design (Data Flow Diagram leveling) — not GoF patterns, which node "Design Patterns (Gang of Four)" already owns (spec 9 below). Flag this interpretation before building if the node's actual intent differs.
**Mechanism:** Decomposes a Level 0 context diagram (the whole system as one process, with external entities and data flows) into a Level 1 diagram (the process split into major sub-processes and data stores), preserving the balancing rule: net inputs/outputs across the decomposition must match the parent process's.
**Step sequence:**

1. Display Level 0: one process bubble, external entities, labeled data flows in/out.
2. Identify the major internal functions the single process actually performs.
3. Redraw as Level 1: one bubble per function, data stores added where data persists between functions, flows reconnected between sub-processes.
4. Check balancing: every external flow into/out of Level 0 must still appear, unchanged, crossing the Level 1 boundary.
   **Per-step highlight + explanation:**

- Highlight a flow crossing the system boundary at Level 0 and trace it to its corresponding flow at Level 1.
- "Level 0: 'Order System' takes Order-In from Customer, produces Invoice-Out. Level 1 splits this into 'Validate Order' → 'Process Payment' → 'Generate Invoice', with an Orders data store between the first two — Order-In and Invoice-Out still cross the outer boundary unchanged, satisfying balancing."

---

## 3. cyclomatic-complexity-visualizer

**Node:** Testing & Quality Assurance
**Mechanism:** Computes McCabe's cyclomatic complexity M = E − N + 2P from a function's control flow graph (edges, nodes, connected components), then derives a minimum set of independent paths for path coverage; separately covers black-box test design via equivalence partitioning and boundary value analysis.
**Step sequence:**

1. Build the control flow graph from source (one node per basic block, edges for control transfers).
2. Count edges E and nodes N; P=1 for a single connected program.
3. Compute M = E − N + 2.
4. Enumerate M independent paths (each introducing at least one new edge not in prior paths).
5. (Black-box branch) For an input range, mark valid/invalid equivalence classes and boundary values (min, min+1, max−1, max) as required test cases.
   **Per-step highlight + explanation:**

- Highlight the CFG edges being counted and each independent path as it's traced.
- "CFG with E=9, N=8, P=1 → M=9−8+2=3 → exactly 3 independent test paths needed for full path coverage — fewer than 3 leaves at least one decision outcome untested."
- "Input range 1–100: equivalence classes {<1 invalid}, {1–100 valid}, {>100 invalid}; boundary values to test: 0, 1, 100, 101."

---

## 4. git-merge-visualizer

**Node:** Version Control (Git)
**Mechanism:** Builds a commit DAG (each commit points to its parent(s)) across two diverging branches, then performs a three-way merge using the common ancestor plus both branch tips — fast-forwarding if one branch is a direct ancestor of the other, otherwise creating a merge commit with two parents, flagging conflicts where both branches changed the same lines.
**Step sequence:**

1. Show two branches diverging from a common ancestor commit, each with its own subsequent commits.
2. Identify the merge base (most recent common ancestor).
3. Diff each branch tip against the merge base independently.
4. If the changed regions don't overlap: auto-merge, create a merge commit with two parents.
5. If changed regions overlap: flag a conflict at that location, requiring manual resolution before the merge commit can be created.
   **Per-step highlight + explanation:**

- Highlight the merge base and the diff regions from each branch as they're compared.
- "Branch A changes line 10; Branch B changes line 40 — no overlap, auto-merges cleanly. If both branches instead changed line 10 differently, Git flags a conflict at line 10 and can't auto-resolve it."
- "If Branch B has no new commits since diverging (A is strictly ahead), Git fast-forwards B's pointer to A's tip instead of creating a merge commit — no new commit object needed."

---

## 5. architecture-request-trace-visualizer

**Node:** Software Architecture Patterns
**Mechanism:** Traces a single request through two contrasting architectural styles — layered/N-tier (Presentation → Business Logic → Data Access → Database, each layer calling only the one below) and microservices (API Gateway → Service A → network call to Service B → aggregated response) — exposing the structural and communication differences directly.
**Step sequence:**

1. Layered: request enters Presentation, calls Business Logic, which calls Data Access, which queries the Database; response flows back up the same chain.
2. Microservices: request enters an API Gateway, which routes to Service A; Service A needs data owned by Service B, so it makes a network call to Service B; Service B responds; Service A aggregates and returns to the Gateway.
3. Compare failure points: a layered app's Data Access failure surfaces as one exception up the call stack; a microservices call to Service B can fail independently (network timeout) even if Service A itself is healthy.
   **Per-step highlight + explanation:**

- Highlight the request's path as a traveling token, with a distinct marker for in-process calls vs. network calls.
- "Layered: 4 in-process calls, single point of failure per layer, deployed as one unit. Microservices: 1 in-process (Gateway→A) + 1 network (A→B) call — the network hop adds latency and a new failure mode (B's process can be down while A's is fine) that a layered architecture doesn't have."

---

## 6. object-instantiation-visualizer

**Node:** Classes & Objects
**Mechanism:** Instantiates multiple objects from one class definition, showing that each object gets its own independent copy of instance fields (separate memory) while sharing the same method code — and that calling a method on one object only reads/mutates that object's own state.
**Step sequence:**

1. Display a class definition (fields + methods).
2. Instantiate object A: allocate its own field storage, initialize via constructor.
3. Instantiate object B: separate field storage, independently initialized.
4. Call a mutating method on A; show only A's fields change — B's are untouched.
5. Call the same method on B; confirm it operates on B's own state, using the same method code both times.
   **Per-step highlight + explanation:**

- Highlight each object's field storage as a separate memory block, with the shared method code shown once, pointed to by both.
- "class Counter{count=0; increment(){count++}}. a=new Counter(); b=new Counter(); a.increment(); a.increment() → a.count=2, b.count=0 — same increment() code executed twice, but each call only touched the object it was invoked on."

---

## 7. vtable-dispatch-visualizer

**Node:** Inheritance & Polymorphism
**Mechanism:** Builds a small class hierarchy where a derived class overrides a base class's virtual method, then traces a call made through a base-class pointer/reference to a derived object — resolving at runtime via the object's vtable (dynamic dispatch) to the derived override, contrasted with static binding for non-virtual calls.
**Step sequence:**

1. Define Base with virtual method speak() and Derived (extends Base) overriding speak().
2. Instantiate a Derived object; show its vtable pointer referencing Derived's method table.
3. Assign it to a Base* / Base& reference.
4. Call ref.speak() through the base-typed reference.
5. Dispatch: follow the object's vtable pointer (not the reference's static type) to find speak() → resolves to Derived's version.
   **Per-step highlight + explanation:**

- Highlight the vtable pointer stored in the object, tracing it to the actual method invoked.
- "Base* b = new Derived(); b->speak() prints Derived's message, not Base's — the compile-time type of b is Base*, but the runtime type of the object is Derived, and virtual dispatch follows the object, not the pointer's declared type. Removing 'virtual' from Base::speak() would instead resolve at compile time to Base's version — a classic GATE 'predict the output' trap."

---

## 8. solid-principles-visualizer

**Node:** SOLID Principles
**Mechanism:** A design-review checklist rather than an execution trace — presents one small class design per principle, shows how it violates that principle, and shows the refactored version that satisfies it. Five independent principle-by-principle comparisons, not a single unified state machine.
**Step sequence:**

1. Single Responsibility: a ReportManager class both computes data AND formats output → split into Calculator + Formatter.
2. Open/Closed: an if-else chain over shape types that must be edited for each new shape → refactor to a Shape interface with polymorphic area().
3. Liskov Substitution: Square extends Rectangle but overrides setWidth() to also change height, breaking callers that expect independent width/height → redesign the hierarchy instead of forcing the subtype relationship.
4. Interface Segregation: a fat Worker interface forcing a robot class to implement eat()/sleep() it doesn't need → split into Workable, Feedable, Sleepable.
5. Dependency Inversion: a high-level OrderService directly instantiating a concrete MySQLDatabase → depend on a Database interface, inject the concrete implementation at runtime.
   **Per-step highlight + explanation:**

- Highlight the violating line/relationship in red on the "before" diagram, and the corrected structure in green on the "after."
- "LSP violation concretely breaks code: a function that does rect.setWidth(5); assert(rect.area()==5×originalHeight) fails when rect is actually a Square, since setWidth also changed height — the substitution isn't safe."

---

## 9. observer-pattern-visualizer

**Node:** Design Patterns (Gang of Four)
**Mechanism:** Runs the Observer pattern's actual runtime behavior — a Subject maintains a list of registered Observers; on a state change, it calls notify(), which iterates the list invoking each Observer's update() in registration order. Secondary quick-hit modes cover Singleton (instance-existence check on getInstance()) and Factory Method (creation dispatch by type parameter).
**Step sequence:**

1. Register Observers with a Subject (append to its observer list).
2. Change the Subject's state (e.g., temperature).
3. Subject calls notify(), iterating its observer list in order.
4. Each Observer's update(newState) is called, using the same notify() loop regardless of how many observers are registered.
   **Per-step highlight + explanation:**

- Highlight the observer list and the currently-notified observer as the loop advances.
- "WeatherStation.setTemperature(25) → notify() iterates [PhoneDisplay, WebDashboard] in registration order → each receives update(25) — adding a third observer later requires zero changes to WeatherStation's code, just a new registration call."
- "Singleton mode: getInstance() checks if the static instance field is null; first call constructs and stores it, every subsequent call returns the same stored reference."

---

## 10. lamport-clock-visualizer

**Node:** Distributed Systems Fundamentals
**Mechanism:** Maintains a Lamport logical clock per process: increment the local counter on every local event; when sending a message, attach the current counter as a timestamp; when receiving a message with timestamp T, set the local counter to max(local, T) + 1 — establishing a "happens-before" partial order without synchronized physical clocks.
**Step sequence:**

1. Each process starts its counter at 0.
2. Local event on process P: increment P's counter by 1.
3. Send event: attach current counter value as the message's timestamp.
4. Receive event on process Q: set Q's counter = max(Q's current counter, message timestamp) + 1.
5. Repeat across a sequence of local/send/receive events; display each process's counter timeline.
   **Per-step highlight + explanation:**

- Highlight the counter value being compared and updated at each receive event.
- "P1: local event → C1=1; sends message timestamped 1 → C1=2 (send is itself an event). P2: local event → C2=1 first, then receives P1's message (timestamp 1) → C2=max(1,1)+1=2 — even though P2's event happened 'first' in real time, the clock only captures the logical ordering constraint the messages impose, not wall-clock time."

---

## 11. raft-election-visualizer

**Node:** Consensus Algorithms (Paxos/Raft)
**Mechanism:** Simulates Raft's leader election as an explicit 3-state FSM per node (Follower/Candidate/Leader) — a follower whose election timeout expires becomes a candidate, increments its term, votes for itself, and sends RequestVote RPCs; it becomes leader on receiving votes from a majority, or reverts to follower if it observes a higher term. Raft is used here (over Paxos) because its state machine is explicitly designed to be more directly visualizable.
**Step sequence:**

1. All nodes start as Followers with randomized election timeouts.
2. Node A's timeout expires first: A becomes Candidate, increments its term, votes for itself, sends RequestVote to all peers.
3. Peers still on the old term and who haven't voted this term grant their vote.
4. A receives votes from a majority (including itself) → becomes Leader; starts sending periodic heartbeats (empty AppendEntries) to reset peers' timeouts.
5. If a node later receives an RPC with a higher term than its own (e.g., a Leader that was partitioned rejoining), it immediately steps down to Follower.
   **Per-step highlight + explanation:**

- Highlight the current state (color per Follower/Candidate/Leader) and the term number on each node.
- "5-node cluster, A's timeout fires at term 1: A→Candidate, requests votes; B, C grant votes (3 total including A's self-vote) → majority of 5 reached → A→Leader. If a stale Leader D (still on term 0, was network-partitioned) rejoins and receives A's term-1 heartbeat, D steps down to Follower immediately — higher term always wins."

---

## 12. cap-partition-visualizer

**Node:** CAP Theorem & Consistency Models
**Mechanism:** Simulates a network partition splitting a replicated data store into two isolated groups, then lets the learner pick CP or AP behavior and observe the actual consequence — CP: the minority-side partition refuses writes (or all reads/writes) to avoid inconsistency; AP: both sides keep accepting writes independently, causing divergence that must be reconciled once the partition heals.
**Step sequence:**

1. Show a 5-node replicated store, fully connected, consistent.
2. Trigger a partition: 2 nodes isolated from the other 3.
3. CP mode: the minority (2-node) side rejects write requests (can't reach quorum); majority side continues normally.
4. AP mode: both sides keep accepting writes to the same key independently.
5. Heal the partition: CP mode had no divergence to fix; AP mode must reconcile conflicting versions of the key (e.g., last-write-wins or manual merge).
   **Per-step highlight + explanation:**

- Highlight which side of the partition accepts/rejects a given write, and any resulting version conflict.
- "Key X=5 before partition. AP mode: minority side writes X=7, majority side writes X=9 independently during the partition — on heal, both values exist and must be reconciled (e.g., by timestamp). CP mode: minority side simply refused the X=7 write during the partition, so only X=9 ever existed — consistent, but the minority side was unavailable for writes the whole time."

---

_File 6 of 6 — Part B complete. 45 specs across 6 files; discrepancies from the source lists are flagged inline where they affect a spec's scope._
