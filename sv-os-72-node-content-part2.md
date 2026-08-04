# SV-OS — 72-Node Content, Part 2 of 2

Import each block by exact `slug`. Do not regenerate, mix, or reorder.

## THEORY OF COMPUTATION

```json
{
  "slug": "finite-automata",
  "summary": "Abstract state machines (DFA/NFA) recognizing regular languages.",
  "learning_outcomes": [
    "Design a DFA for a given regular language.",
    "Convert NFA to DFA via subset construction.",
    "Explain DFA/NFA equivalence."
  ],
  "common_mistakes": ["Assuming NFA is more powerful than DFA.", "Incomplete transition function."],
  "cross_domain_connections": [
    {
      "target_slug": "regular-languages-and-regular-expressions",
      "reason": "Equivalent formalisms for the same language class."
    }
  ],
  "resources": [
    { "title": "Introduction to the Theory of Computation — Sipser", "resource_type": "book" }
  ],
  "interview_questions": [
    "Why are DFA/NFA equivalent in power?",
    "Design a DFA accepting binary strings divisible by 3."
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "regular-languages-and-regular-expressions",
  "summary": "Languages recognizable by finite automata and their regex notation.",
  "learning_outcomes": [
    "Convert regex to NFA (Thompson's).",
    "Apply pumping lemma.",
    "Identify closure properties."
  ],
  "common_mistakes": [
    "Assuming regex can express any pattern.",
    "Misapplying pumping lemma quantifiers."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "lexical-analysis",
      "reason": "Lexers are regex-driven automata applied to source code."
    }
  ],
  "resources": [{ "title": "Sipser, Theory of Computation", "resource_type": "book" }],
  "interview_questions": ["Prove {0^n1^n} is not regular.", "Convert (a|b)*abb to an NFA."],
  "coding_challenges": []
}
```

```json
{
  "slug": "context-free-grammars-and-pushdown-automata",
  "summary": "CFGs and PDAs recognizing context-free languages, the basis of programming syntax.",
  "learning_outcomes": [
    "Write a CFG for a language.",
    "Convert to Chomsky Normal Form.",
    "Design an equivalent PDA."
  ],
  "common_mistakes": [
    "Writing an ambiguous grammar unknowingly.",
    "Confusing PDA stack with Turing tape."
  ],
  "cross_domain_connections": [
    { "target_slug": "parsing-syntax-analysis", "reason": "Parsers directly implement CFGs." }
  ],
  "resources": [{ "title": "Sipser, Theory of Computation", "resource_type": "book" }],
  "interview_questions": [
    "Write a CFG for balanced parentheses.",
    "Why can't a DFA recognize arbitrary-depth balanced parens?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "turing-machines-and-computability",
  "summary": "The universal computation model defining limits of algorithmic solvability.",
  "learning_outcomes": [
    "Design a simple Turing machine.",
    "Explain Church-Turing thesis.",
    "Prove Halting Problem undecidable."
  ],
  "common_mistakes": [
    "Confusing decidable with recognizable.",
    "Assuming NP-complete implies undecidable."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "complexity-theory-p-vs-np",
      "reason": "P/NP/PSPACE defined via Turing machine resource bounds."
    }
  ],
  "resources": [{ "title": "Sipser, Theory of Computation", "resource_type": "book" }],
  "interview_questions": [
    "State Church-Turing thesis.",
    "Sketch the Halting Problem undecidability proof."
  ],
  "coding_challenges": [
    {
      "title": "Turing Machine Simulator",
      "description": "Simulate a TM's tape and transitions.",
      "difficulty": "medium"
    }
  ]
}
```

```json
{
  "slug": "complexity-theory-p-vs-np",
  "summary": "Classifying problems by resource bounds: P, NP, NP-complete, and the open P vs NP question.",
  "learning_outcomes": [
    "Differentiate P/NP/NP-complete/NP-hard.",
    "Construct a polynomial reduction.",
    "Explain Cook-Levin's theorem."
  ],
  "common_mistakes": [
    "Confusing NP-hard with NP-complete.",
    "Assuming no poly algorithm exists rather than none known."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "dynamic-programming",
      "reason": "DP gives pseudo-polynomial solutions to some NP-hard problems."
    }
  ],
  "resources": [
    { "title": "Garey & Johnson, Computers and Intractability", "resource_type": "book" }
  ],
  "interview_questions": [
    "Difference between NP-hard and NP-complete?",
    "How do you prove a problem NP-complete?"
  ],
  "coding_challenges": []
}
```

## COMPILER DESIGN

```json
{
  "slug": "lexical-analysis",
  "summary": "First compiler phase: converting characters into tokens via regex-driven automata.",
  "learning_outcomes": [
    "Design a lexer for keywords/identifiers.",
    "Explain DFA-based tokenization.",
    "Handle lexical errors."
  ],
  "common_mistakes": ["Missing maximal munch.", "Not distinguishing keywords from identifiers."],
  "cross_domain_connections": [
    {
      "target_slug": "regular-languages-and-regular-expressions",
      "reason": "A lexer is a regex-driven finite automaton over source code."
    }
  ],
  "resources": [{ "title": "Dragon Book — Aho, Lam, Sethi, Ullman", "resource_type": "book" }],
  "interview_questions": ["What is maximal munch?", "Tokenize '12 + 3 * x'."],
  "coding_challenges": [
    {
      "title": "Simple Lexer",
      "description": "Tokenize numbers, identifiers, operators.",
      "difficulty": "medium"
    }
  ]
}
```

```json
{
  "slug": "parsing-syntax-analysis",
  "summary": "Converting tokens into a syntax tree via LL or LR parsing algorithms.",
  "learning_outcomes": [
    "Compute FIRST/FOLLOW sets.",
    "Build an LL(1) table.",
    "Distinguish parse tree from AST."
  ],
  "common_mistakes": [
    "LL(1) on left-recursive grammar.",
    "Confusing shift-reduce with reduce-reduce conflicts."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "context-free-grammars-and-pushdown-automata",
      "reason": "A parser implements CFG derivation directly."
    }
  ],
  "resources": [{ "title": "Dragon Book", "resource_type": "book" }],
  "interview_questions": ["Why can't LL(1) handle left recursion?", "Parse tree vs AST?"],
  "coding_challenges": [
    {
      "title": "Recursive-Descent Parser",
      "description": "Parse arithmetic expressions with precedence.",
      "difficulty": "hard"
    }
  ]
}
```

```json
{
  "slug": "semantic-analysis-and-type-checking",
  "summary": "Verifying program meaning: type checking, scope resolution, symbol tables.",
  "learning_outcomes": [
    "Build a symbol table.",
    "Implement type-checking rules.",
    "Explain static vs dynamic typing."
  ],
  "common_mistakes": ["Mishandling nested scopes.", "Allowing unintended implicit coercion."],
  "cross_domain_connections": [
    {
      "target_slug": "classes-and-objects",
      "reason": "OO type checking verifies access against a class hierarchy."
    }
  ],
  "resources": [{ "title": "Dragon Book", "resource_type": "book" }],
  "interview_questions": [
    "How is a type mismatch detected?",
    "Implement nested scope symbol tables."
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "intermediate-code-and-optimization",
  "summary": "Machine-independent code (e.g. three-address code) enabling optimization passes.",
  "learning_outcomes": [
    "Translate expressions to three-address code.",
    "Explain common subexpression elimination.",
    "Describe constant folding."
  ],
  "common_mistakes": [
    "Optimizations changing semantics (side effects).",
    "Missing a proper control-flow graph."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "pipelining-and-instruction-level-parallelism",
      "reason": "Compilers reorder code to avoid pipeline stalls."
    }
  ],
  "resources": [{ "title": "Dragon Book", "resource_type": "book" }],
  "interview_questions": [
    "What is CSE and why does it matter?",
    "Translate x=(a+b)*(a+b) with CSE."
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "code-generation-and-linking",
  "summary": "Translating intermediate code to machine code, then linking modules into an executable.",
  "learning_outcomes": [
    "Explain register allocation.",
    "Distinguish static vs dynamic linking.",
    "Describe symbol resolution."
  ],
  "common_mistakes": [
    "Assuming register allocation is trivial.",
    "Confusing compile-time vs link-time errors."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "assembly-language",
      "reason": "Code generation's output is assembly/machine instructions."
    }
  ],
  "resources": [{ "title": "Dragon Book", "resource_type": "book" }],
  "interview_questions": [
    "Static vs dynamic linking tradeoffs?",
    "Why is register allocation NP-hard graph coloring?"
  ],
  "coding_challenges": []
}
```

## OPERATING SYSTEMS

```json
{
  "slug": "processes-and-process-management",
  "summary": "The OS abstraction for a running program: memory, state, and lifecycle.",
  "learning_outcomes": [
    "Explain process states/transitions.",
    "Describe a PCB's contents.",
    "Distinguish process from thread."
  ],
  "common_mistakes": ["Confusing virtual and physical memory.", "Assuming fork is always cheap."],
  "cross_domain_connections": [
    {
      "target_slug": "virtual-memory",
      "reason": "Process isolation is implemented via virtual memory."
    }
  ],
  "resources": [{ "title": "OSTEP — Arpaci-Dusseau", "resource_type": "book" }],
  "interview_questions": ["What's stored in a PCB?", "Process vs thread?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "threads-and-concurrency",
  "summary": "Lightweight execution units sharing an address space, enabling concurrency.",
  "learning_outcomes": [
    "Explain thread/process memory tradeoffs.",
    "Identify a race condition.",
    "Distinguish concurrency from parallelism."
  ],
  "common_mistakes": [
    "Assuming deterministic thread order.",
    "Confusing concurrency with parallelism."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "synchronization-and-deadlocks",
      "reason": "Shared memory requires synchronization to avoid races."
    }
  ],
  "resources": [{ "title": "OSTEP", "resource_type": "book" }],
  "interview_questions": [
    "What's a race condition, and how do you fix one?",
    "Concurrency vs parallelism?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "cpu-scheduling",
  "summary": "OS policies (FCFS, SJF, Round Robin, Priority) choosing which process runs next.",
  "learning_outcomes": [
    "Compute average wait time under FCFS/SJF.",
    "Explain quantum size tradeoffs in RR.",
    "Identify starvation and aging."
  ],
  "common_mistakes": ["Assuming SJF avoids starvation.", "Too-small RR quantum causing overhead."],
  "cross_domain_connections": [
    {
      "target_slug": "synchronization-and-deadlocks",
      "reason": "Scheduling interacts with lock-holding and priority inversion."
    }
  ],
  "resources": [{ "title": "OSTEP", "resource_type": "book" }],
  "interview_questions": ["Compare FCFS, SJF, RR.", "What is priority inversion?"],
  "coding_challenges": [
    {
      "title": "Scheduler Simulator",
      "description": "Simulate FCFS/RR and compute wait times.",
      "difficulty": "medium"
    }
  ]
}
```

```json
{
  "slug": "synchronization-and-deadlocks",
  "summary": "Mutual exclusion mechanisms and the conditions causing/preventing deadlock.",
  "learning_outcomes": [
    "Solve critical-section problems with semaphores.",
    "List the 4 Coffman conditions.",
    "Apply the Banker's algorithm."
  ],
  "common_mistakes": ["Swapping P/V calls.", "Confusing mutex vs counting semaphore semantics."],
  "cross_domain_connections": [
    {
      "target_slug": "transactions-and-acid",
      "reason": "DB two-phase locking uses the same mutual-exclusion principles."
    }
  ],
  "resources": [{ "title": "OSTEP Ch.31", "resource_type": "book" }],
  "interview_questions": [
    "List Coffman's 4 conditions.",
    "Solve producer-consumer with semaphores."
  ],
  "coding_challenges": [
    {
      "title": "Dining Philosophers",
      "description": "Deadlock-free solution via resource ordering.",
      "difficulty": "hard"
    }
  ]
}
```

```json
{
  "slug": "virtual-memory",
  "summary": "Giving each process an illusion of large private memory via paging and page replacement.",
  "learning_outcomes": [
    "Trace virtual-to-physical address translation.",
    "Compute faults under FIFO/LRU.",
    "Explain thrashing and the working set."
  ],
  "common_mistakes": [
    "Confusing paging with segmentation.",
    "Assuming LRU always beats FIFO (Belady's anomaly)."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "memory-hierarchy-and-caching",
      "reason": "Page replacement is caching one level down the hierarchy."
    }
  ],
  "resources": [{ "title": "OSTEP Ch.18-23", "resource_type": "book" }],
  "interview_questions": ["What happens on a page fault?", "FIFO vs LRU, and Belady's anomaly?"],
  "coding_challenges": [
    {
      "title": "Page Replacement Simulator",
      "description": "Compute faults under FIFO/LRU/Optimal.",
      "difficulty": "medium"
    }
  ]
}
```

```json
{
  "slug": "file-systems",
  "summary": "Structures organizing persistent storage into files/directories with allocation and metadata strategies.",
  "learning_outcomes": [
    "Compare contiguous/linked/indexed allocation.",
    "Explain inode contents.",
    "Describe journaling's crash-recovery role."
  ],
  "common_mistakes": [
    "Assuming deletion frees space immediately.",
    "Confusing hard vs symbolic links."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "linked-lists",
      "reason": "Linked allocation applies linked lists to disk blocks."
    }
  ],
  "resources": [{ "title": "OSTEP Ch.39-43", "resource_type": "book" }],
  "interview_questions": ["What does an inode store?", "How does journaling aid crash recovery?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "i-o-and-device-management",
  "summary": "OS mechanisms (polling, interrupts, DMA) for communicating with hardware devices.",
  "learning_outcomes": [
    "Compare polling vs interrupts.",
    "Explain DMA's role.",
    "Describe driver abstraction."
  ],
  "common_mistakes": ["Assuming polling is always worse.", "Confusing driver vs controller roles."],
  "cross_domain_connections": [
    {
      "target_slug": "cpu-scheduling",
      "reason": "I/O-bound vs CPU-bound classification informs scheduling."
    }
  ],
  "resources": [{ "title": "OSTEP Ch.36-37", "resource_type": "book" }],
  "interview_questions": ["Polling vs interrupt-driven I/O?", "What problem does DMA solve?"],
  "coding_challenges": []
}
```

## DATABASES

```json
{
  "slug": "relational-model-and-sql",
  "summary": "The tabular data model and SQL, the declarative language for relational data.",
  "learning_outcomes": [
    "Write JOIN/GROUP BY/subquery SQL.",
    "Explain primary vs foreign keys.",
    "Distinguish INNER vs OUTER joins."
  ],
  "common_mistakes": ["Unintentional Cartesian joins.", "Confusing WHERE vs HAVING."],
  "cross_domain_connections": [
    {
      "target_slug": "set-theory-and-mathematical-logic",
      "reason": "Relational algebra is built on set theory."
    }
  ],
  "resources": [{ "title": "Database System Concepts — Silberschatz", "resource_type": "book" }],
  "interview_questions": ["WHERE vs HAVING?", "Query employees above department average salary."],
  "coding_challenges": []
}
```

```json
{
  "slug": "normalization-and-schema-design",
  "summary": "Structuring schemas to eliminate redundancy, guided by normal forms.",
  "learning_outcomes": [
    "Identify functional dependencies.",
    "Normalize to 3NF.",
    "Explain normalization vs performance tradeoff."
  ],
  "common_mistakes": [
    "Over-normalizing, hurting query performance.",
    "Missing a transitive dependency."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "relational-model-and-sql",
      "reason": "Normalization is applied directly to schemas queried with SQL."
    }
  ],
  "resources": [{ "title": "Database System Concepts", "resource_type": "book" }],
  "interview_questions": [
    "What problem does normalization solve?",
    "Normalize a denormalized table to 3NF."
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "transactions-and-acid",
  "summary": "ACID guarantees ensuring predictable database behavior under concurrency and failure.",
  "learning_outcomes": [
    "Explain each ACID property.",
    "Compare isolation levels and anomalies.",
    "Describe two-phase locking."
  ],
  "common_mistakes": [
    "Assuming low isolation has no consequences.",
    "Confusing atomicity with isolation."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "synchronization-and-deadlocks",
      "reason": "DB locking mirrors OS mutual-exclusion principles."
    }
  ],
  "resources": [{ "title": "Database System Concepts", "resource_type": "book" }],
  "interview_questions": [
    "Explain each ACID property with a failure example.",
    "What is a phantom read?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "indexing-b-tree-hash",
  "summary": "Auxiliary structures (B-Tree, hash) accelerating lookups, at the cost of write overhead.",
  "learning_outcomes": [
    "Explain why B-Trees suit disk storage.",
    "Compare B-Tree vs hash index tradeoffs.",
    "Choose which columns to index."
  ],
  "common_mistakes": ["Indexing every column.", "Using hash index for range queries."],
  "cross_domain_connections": [
    {
      "target_slug": "advanced-trees-b-tree-trie-segment-tree",
      "reason": "DB B-Tree indexes are the same structure applied to disk pages."
    }
  ],
  "resources": [{ "title": "Database Internals — Petrov", "resource_type": "book" }],
  "interview_questions": ["Why B-Tree over BST for disk index?", "Hash vs B-Tree index — when?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "query-optimization",
  "summary": "The engine's process of choosing an efficient query execution plan.",
  "learning_outcomes": [
    "Read an EXPLAIN plan.",
    "Explain cost-based join ordering.",
    "Describe index impact on plan choice."
  ],
  "common_mistakes": [
    "Trusting stale statistics blindly.",
    "Wrapping a column in a function, blocking index use."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "indexing-b-tree-hash",
      "reason": "Available indexes directly shape optimizer decisions."
    }
  ],
  "resources": [{ "title": "Database System Concepts", "resource_type": "book" }],
  "interview_questions": [
    "Diagnose a slow query via EXPLAIN.",
    "Why does wrapping a column in a function block index use?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "nosql-and-distributed-databases",
  "summary": "Non-relational stores designed for horizontal scale, often trading consistency for availability.",
  "learning_outcomes": [
    "Compare key-value/document/column stores.",
    "Explain CAP tradeoff for a distributed DB.",
    "Identify when eventual consistency is acceptable."
  ],
  "common_mistakes": [
    "Assuming NoSQL is always faster.",
    "Ignoring stale-read implications of eventual consistency."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "cap-theorem-and-consistency-models",
      "reason": "NoSQL databases are architected around a CAP tradeoff point."
    }
  ],
  "resources": [
    { "title": "Kleppmann, Designing Data-Intensive Applications", "resource_type": "book" }
  ],
  "interview_questions": [
    "Explain CAP and a DB's tradeoff choice.",
    "When choose document store over relational?"
  ],
  "coding_challenges": []
}
```

## COMPUTER NETWORKS

```json
{
  "slug": "network-models-osi--tcp-ip",
  "summary": "Layered frameworks (OSI 7-layer, TCP/IP 4-layer) organizing protocols by responsibility.",
  "learning_outcomes": [
    "Map a protocol to its layer.",
    "Explain layering's independent-evolution benefit.",
    "Trace encapsulation on send."
  ],
  "common_mistakes": [
    "Assuming OSI is literally implemented.",
    "Confusing TCP/IP vs OSI boundaries."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "application-layer-protocols-http-dns",
      "reason": "HTTP/DNS sit at the top of this layered model."
    }
  ],
  "resources": [{ "title": "Kurose & Ross, Computer Networking", "resource_type": "book" }],
  "interview_questions": [
    "Which layer does a router operate at?",
    "Explain encapsulation down the stack."
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "physical-and-data-link-layer",
  "summary": "Lowest layers: raw bit transmission, framing, MAC addressing, single-link delivery.",
  "learning_outcomes": [
    "MAC vs IP address role.",
    "Explain CSMA/CD collision handling.",
    "Describe switch MAC-based forwarding."
  ],
  "common_mistakes": [
    "Confusing MAC (link) with IP (network) address.",
    "Assuming a switch behaves like a hub."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "ip-addressing-and-routing",
      "reason": "Data link's local delivery underlies network-layer routing."
    }
  ],
  "resources": [{ "title": "Kurose & Ross", "resource_type": "book" }],
  "interview_questions": ["Hub vs switch difference?", "How does CSMA/CD handle a collision?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "ip-addressing-and-routing",
  "summary": "Logical addressing (IPv4/IPv6) and routing algorithms determining paths across networks.",
  "learning_outcomes": [
    "Compute a subnet mask/range.",
    "Distance-vector vs link-state routing.",
    "Trace router forwarding via routing table."
  ],
  "common_mistakes": ["Miscalculating subnet boundaries.", "Confusing routing with switching."],
  "cross_domain_connections": [
    {
      "target_slug": "graph-algorithms",
      "reason": "Link-state routing computes shortest paths via Dijkstra's algorithm."
    }
  ],
  "resources": [{ "title": "Kurose & Ross", "resource_type": "book" }],
  "interview_questions": [
    "Compute network/broadcast address from IP+mask.",
    "Distance-vector vs link-state?"
  ],
  "coding_challenges": [
    {
      "title": "CIDR Subnet Calculator",
      "description": "Compute network/broadcast/host range from CIDR.",
      "difficulty": "easy"
    }
  ]
}
```

```json
{
  "slug": "tcp-and-congestion-control",
  "summary": "Reliable transport via handshakes, sliding windows, and adaptive congestion control.",
  "learning_outcomes": [
    "Trace 3-way handshake/teardown.",
    "Distinguish flow vs congestion control.",
    "Explain slow start/avoidance/fast retransmit."
  ],
  "common_mistakes": [
    "Confusing flow with congestion control.",
    "Assuming TCP guarantees low latency."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "synchronization-and-deadlocks",
      "reason": "TCP's handshake is a networked coordination analog to OS synchronization."
    }
  ],
  "resources": [{ "title": "RFC 5681", "resource_type": "documentation" }],
  "interview_questions": [
    "Walk through the 3-way handshake.",
    "Why both flow and congestion control?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "application-layer-protocols-http-dns",
  "summary": "Top-of-stack protocols: HTTP for web, DNS for name resolution.",
  "learning_outcomes": [
    "Explain HTTP request-response cycle.",
    "Trace DNS resolution.",
    "Compare HTTP/1.1, 2, 3 conceptually."
  ],
  "common_mistakes": [
    "Ignoring DNS caching/recursive resolvers.",
    "Confusing HTTP status code categories."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "tcp-and-congestion-control",
      "reason": "HTTP relies on an underlying persistent TCP connection."
    }
  ],
  "resources": [{ "title": "Kurose & Ross", "resource_type": "book" }],
  "interview_questions": ["Trace what happens loading a URL.", "Recursive vs iterative DNS query?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "network-security-fundamentals",
  "summary": "Protecting network communication via encryption, authentication, and attack-vector awareness.",
  "learning_outcomes": [
    "Explain what TLS adds over TCP.",
    "Describe MITM attacks and certificate validation.",
    "Distinguish symmetric/asymmetric roles in TLS."
  ],
  "common_mistakes": [
    "Assuming HTTPS guarantees trustworthiness.",
    "Confusing authentication with authorization."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "tcp-and-congestion-control",
      "reason": "TLS operates as a layer on top of the TCP connection this node covers."
    }
  ],
  "resources": [{ "title": "Kurose & Ross Ch.8", "resource_type": "book" }],
  "interview_questions": ["What does TLS protect against?", "How does a CA prevent MITM?"],
  "coding_challenges": []
}
```

## SOFTWARE ENGINEERING

```json
{
  "slug": "sdlc-and-agile-methodologies",
  "summary": "Waterfall vs iterative Agile approaches to turning requirements into software.",
  "learning_outcomes": [
    "Compare waterfall/Agile change-handling.",
    "Explain sprint retrospectives.",
    "Identify when waterfall fits better."
  ],
  "common_mistakes": ["Assuming Agile means no planning.", "Treating standups as status reports."],
  "cross_domain_connections": [
    {
      "target_slug": "version-control-git",
      "reason": "Agile's frequent integration depends on Git workflows."
    }
  ],
  "resources": [{ "title": "The Agile Manifesto", "resource_type": "documentation" }],
  "interview_questions": [
    "When is waterfall better than Agile?",
    "Purpose of a sprint retrospective?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "requirements-engineering-and-design-patterns",
  "summary": "Eliciting system requirements, and reusable patterns solving recurring design problems.",
  "learning_outcomes": [
    "Distinguish functional/non-functional requirements.",
    "Apply a pattern like Observer or Factory.",
    "Explain a pattern's complexity tradeoff."
  ],
  "common_mistakes": [
    "Overusing patterns without a real recurring problem.",
    "Confusing non-functional with functional requirements."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "design-patterns-gang-of-four",
      "reason": "Extends directly into the full GoF pattern catalog."
    }
  ],
  "resources": [{ "title": "Gang of Four, Design Patterns", "resource_type": "book" }],
  "interview_questions": [
    "Functional vs non-functional requirement?",
    "When use Observer, and why?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "testing-and-quality-assurance",
  "summary": "Systematic correctness verification: unit, integration, end-to-end testing, TDD.",
  "learning_outcomes": [
    "Write arrange-act-assert unit tests.",
    "Distinguish unit/integration/e2e scope.",
    "Explain coverage's limits."
  ],
  "common_mistakes": [
    "Equating high coverage with high quality.",
    "Order-dependent or shared-state tests."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "ci-cd-pipelines",
      "reason": "Tests are the gate CI/CD pipelines run before deployment."
    }
  ],
  "resources": [{ "title": "Kent Beck, TDD by Example", "resource_type": "book" }],
  "interview_questions": ["Why can 100% coverage still miss bugs?", "Unit vs integration test?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "version-control-git",
  "summary": "Distributed version control tracking history, enabling branching and collaboration.",
  "learning_outcomes": [
    "Merge vs rebase.",
    "Resolve a merge conflict.",
    "Describe Git's object model."
  ],
  "common_mistakes": ["Force-pushing a shared branch.", "Committing secrets into history."],
  "cross_domain_connections": [
    {
      "target_slug": "ci-cd-pipelines",
      "reason": "Pipelines trigger directly off Git push/PR events."
    }
  ],
  "resources": [{ "title": "Pro Git — Chacon & Straub", "resource_type": "book" }],
  "interview_questions": ["merge vs rebase?", "Recover a commit after hard reset?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "software-architecture-patterns",
  "summary": "Structural approaches (layered, microservices, event-driven) with scalability/complexity tradeoffs.",
  "learning_outcomes": [
    "Compare monolith vs microservices.",
    "When event-driven beats request-response.",
    "Identify key architecture decisions."
  ],
  "common_mistakes": [
    "Premature microservices adoption.",
    "Ignoring distributed data-consistency challenges."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "microservices-architecture",
      "reason": "Microservices is a concrete pattern this node introduces conceptually."
    }
  ],
  "resources": [
    { "title": "Mark Richards, Software Architecture Patterns", "resource_type": "book" }
  ],
  "interview_questions": ["Monolith vs microservices, when?", "Event-driven tradeoffs?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "classes-and-objects",
  "summary": "OO building blocks: classes as blueprints, objects as instances encapsulating state/behavior.",
  "learning_outcomes": [
    "Design encapsulated classes.",
    "Class vs instance attribute.",
    "Composition vs inheritance."
  ],
  "common_mistakes": [
    "Exposing public fields instead of encapsulating.",
    "Confusing class vs instance method binding."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "inheritance-and-polymorphism",
      "reason": "Directly extended by inheritance/polymorphism."
    }
  ],
  "resources": [{ "title": "Bertrand Meyer, OO Software Construction", "resource_type": "book" }],
  "interview_questions": ["Composition vs inheritance, when?", "Why is encapsulation good design?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "inheritance-and-polymorphism",
  "summary": "Code reuse via inheritance and interchangeable behavior via polymorphism.",
  "learning_outcomes": [
    "Design a class hierarchy.",
    "Compile-time vs runtime polymorphism.",
    "When to prefer composition."
  ],
  "common_mistakes": ["Deep fragile inheritance hierarchies.", "Violating Liskov Substitution."],
  "cross_domain_connections": [
    {
      "target_slug": "solid-principles",
      "reason": "Liskov Substitution governs correct inheritance use."
    }
  ],
  "resources": [{ "title": "Gang of Four, Design Patterns", "resource_type": "book" }],
  "interview_questions": ["What is Liskov Substitution?", "Overriding vs overloading?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "solid-principles",
  "summary": "Five OO design guidelines for maintainable software.",
  "learning_outcomes": [
    "Spot an SRP violation.",
    "Apply Open-Closed to extend behavior.",
    "Explain Dependency Inversion's testability benefit."
  ],
  "common_mistakes": [
    "Treating SOLID as rigid rules everywhere.",
    "Confusing Interface Segregation with fewer interfaces."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "design-patterns-gang-of-four",
      "reason": "Many GoF patterns are concrete SOLID implementations."
    }
  ],
  "resources": [{ "title": "Robert C. Martin, Agile Principles", "resource_type": "book" }],
  "interview_questions": ["Example of an SRP violation and fix?", "How does DI aid testing?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "design-patterns-gang-of-four",
  "summary": "23 reusable OO design solutions (Factory, Observer, Strategy, Singleton, etc.).",
  "learning_outcomes": [
    "Apply Factory to decouple creation.",
    "When Observer beats a simple callback.",
    "Spot Strategy in a real codebase."
  ],
  "common_mistakes": [
    "Overusing Singleton (hidden global state).",
    "Applying a pattern without a real problem."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "solid-principles",
      "reason": "GoF patterns implement SOLID principles concretely."
    }
  ],
  "resources": [{ "title": "Gamma, Helm, Johnson, Vlissides", "resource_type": "book" }],
  "interview_questions": ["When use Strategy over if-else?", "What problem does Observer solve?"],
  "coding_challenges": []
}
```

## DISTRIBUTED SYSTEMS & CLOUD

```json
{
  "slug": "distributed-systems-fundamentals",
  "summary": "Multi-machine systems introducing partial failure, coordination, and consistency challenges.",
  "learning_outcomes": [
    "Explain partial failure vs single-machine failure.",
    "Role of timeouts/retries.",
    "Sync vs async system models."
  ],
  "common_mistakes": [
    "Treating a network call like a local call.",
    "Ignoring idempotency on retries."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "consensus-algorithms-paxos--raft",
      "reason": "Consensus is the core technique for agreeing on state despite failure."
    }
  ],
  "resources": [
    { "title": "Kleppmann, Designing Data-Intensive Applications", "resource_type": "book" }
  ],
  "interview_questions": [
    "Name a 'fallacy of distributed computing'.",
    "Why must a retried request be idempotent?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "consensus-algorithms-paxos--raft",
  "summary": "Algorithms letting distributed nodes agree on a value despite failures/partitions.",
  "learning_outcomes": [
    "Explain Raft leader election.",
    "Why consensus needs majority quorum.",
    "Compare Paxos vs Raft goals."
  ],
  "common_mistakes": [
    "Assuming consensus without majority quorum under partition.",
    "Confusing election with log replication phase."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "cap-theorem-and-consistency-models",
      "reason": "Consensus is the practical mechanism for CAP's consistency side."
    }
  ],
  "resources": [{ "title": "Ongaro & Ousterhout, Raft paper", "resource_type": "paper" }],
  "interview_questions": [
    "Why does Raft need a majority to commit?",
    "What happens when Raft's leader fails?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "cap-theorem-and-consistency-models",
  "summary": "At most two of Consistency, Availability, Partition tolerance hold during a partition.",
  "learning_outcomes": [
    "Explain why partition tolerance isn't optional.",
    "Classify a DB as CP or AP.",
    "Strong vs eventual consistency."
  ],
  "common_mistakes": [
    "Treating CAP as always 'pick any two'.",
    "Assuming eventual consistency means never consistent."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "nosql-and-distributed-databases",
      "reason": "NoSQL DBs are designed around a CAP tradeoff point."
    }
  ],
  "resources": [{ "title": "Eric Brewer, CAP Twelve Years Later", "resource_type": "paper" }],
  "interview_questions": [
    "What is CAP really a tradeoff between?",
    "Example of an availability-favoring system?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "microservices-architecture",
  "summary": "Decomposing an app into small independently-deployable services over the network.",
  "learning_outcomes": [
    "Identify service boundaries.",
    "Explain operational complexity added.",
    "Role of an API gateway."
  ],
  "common_mistakes": [
    "Splitting too finely (distributed monolith).",
    "Underestimating observability/tooling needs."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "message-queues-and-event-streaming",
      "reason": "Microservices commonly communicate via message queues."
    }
  ],
  "resources": [{ "title": "Sam Newman, Building Microservices", "resource_type": "book" }],
  "interview_questions": ["What's a distributed monolith?", "When NOT to use microservices?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "message-queues-and-event-streaming",
  "summary": "Async infra (queues, pub/sub, event logs) decoupling producers from consumers.",
  "learning_outcomes": [
    "Queue vs pub/sub difference.",
    "How queues provide backpressure.",
    "At-least-once vs exactly-once tradeoffs."
  ],
  "common_mistakes": [
    "Assuming exactly-once is trivial.",
    "Using a queue where broadcast was needed."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "distributed-systems-fundamentals",
      "reason": "Queues are a core decoupling building block for distributed systems."
    }
  ],
  "resources": [{ "title": "Kleppmann Ch.11", "resource_type": "book" }],
  "interview_questions": [
    "Queue vs pub/sub?",
    "Achieve effectively-exactly-once atop at-least-once?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "cloud-service-models-iaas-paas-saas",
  "summary": "Cloud abstraction layers trading control for reduced operational responsibility.",
  "learning_outcomes": [
    "Distinguish IaaS/PaaS/SaaS by managed responsibility.",
    "Match a use case to a service model.",
    "Explain shared responsibility for security."
  ],
  "common_mistakes": [
    "Assuming SaaS removes all customer responsibility.",
    "Confusing PaaS with IaaS."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "virtualization",
      "reason": "IaaS is built directly on virtualization technology."
    }
  ],
  "resources": [{ "title": "AWS Well-Architected Framework", "resource_type": "documentation" }],
  "interview_questions": ["IaaS vs PaaS, concretely?", "Explain shared responsibility model."],
  "coding_challenges": []
}
```

```json
{
  "slug": "virtualization",
  "summary": "Isolated VMs on shared hardware via a hypervisor.",
  "learning_outcomes": [
    "Type 1 vs Type 2 hypervisor.",
    "How a hypervisor virtualizes CPU/memory/I-O.",
    "Virtualization vs container overhead."
  ],
  "common_mistakes": [
    "Assuming overhead is negligible for all workloads.",
    "Confusing hypervisor with container runtime role."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "docker-and-containerization",
      "reason": "Containers are a lighter OS-level alternative to full virtualization."
    }
  ],
  "resources": [
    { "title": "Patterson & Hennessy, Virtualization chapter", "resource_type": "book" }
  ],
  "interview_questions": [
    "Type 1 vs Type 2 hypervisor?",
    "Why do containers have lower overhead than VMs?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "serverless-computing",
  "summary": "Stateless, event-triggered cloud functions with no direct server management.",
  "learning_outcomes": [
    "Explain cold starts.",
    "Identify serverless-suited workloads.",
    "Contrast serverless vs always-on billing."
  ],
  "common_mistakes": [
    "Assuming reliable in-memory state between invocations.",
    "Using serverless for sustained high traffic."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "cloud-service-models-iaas-paas-saas",
      "reason": "Serverless is a further-abstracted layer beyond PaaS."
    }
  ],
  "resources": [{ "title": "AWS Lambda docs", "resource_type": "documentation" }],
  "interview_questions": ["What causes a cold start?", "When NOT to use serverless?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "cloud-storage-and-managed-databases",
  "summary": "Provider-managed storage/databases offloading backups, replication, patching.",
  "learning_outcomes": [
    "Object vs block vs file storage use cases.",
    "What a managed DB handles vs the customer.",
    "Object storage durability guarantees."
  ],
  "common_mistakes": [
    "Using object storage for low-latency random access.",
    "Assuming managed DB removes need for query tuning."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "relational-model-and-sql",
      "reason": "Managed relational services still need the same schema/query skills."
    }
  ],
  "resources": [{ "title": "AWS S3 & RDS docs", "resource_type": "documentation" }],
  "interview_questions": [
    "Object vs block storage, when?",
    "What stays your responsibility with a managed DB?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "ci-cd-pipelines",
  "summary": "Automated build-test-deploy pipelines for fast, repeatable delivery.",
  "learning_outcomes": [
    "Design a CI stage sequence.",
    "Continuous delivery vs deployment.",
    "What should block a pipeline."
  ],
  "common_mistakes": [
    "Deploying despite failing tests via misconfigured gate.",
    "Pipeline too slow, causing bypasses."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "testing-and-quality-assurance",
      "reason": "Pipelines run tests as an automated deployment gate."
    }
  ],
  "resources": [{ "title": "Humble & Farley, Continuous Delivery", "resource_type": "book" }],
  "interview_questions": ["Continuous delivery vs deployment?", "What should block a deploy?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "docker-and-containerization",
  "summary": "OS-level virtualization packaging apps with dependencies via namespaces/cgroups.",
  "learning_outcomes": [
    "Write a correct minimal Dockerfile.",
    "Explain namespaces/cgroups isolation.",
    "Image vs running container."
  ],
  "common_mistakes": [
    "Bloated images from poor build practices.",
    "Assuming container security equals VM security."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "virtualization",
      "reason": "Containers are a lighter OS-level alternative to hardware virtualization."
    }
  ],
  "resources": [{ "title": "Docker official docs", "resource_type": "documentation" }],
  "interview_questions": [
    "What kernel features does Docker rely on?",
    "Why weaker isolation than a VM?"
  ],
  "coding_challenges": []
}
```

```json
{
  "slug": "kubernetes-and-orchestration",
  "summary": "Orchestration platform automating containerized app deployment/scaling across a cluster.",
  "learning_outcomes": [
    "Explain a Pod as smallest deployable unit.",
    "How a Service provides stable networking.",
    "Deployment controller vs raw Pod."
  ],
  "common_mistakes": [
    "Deploying raw Pods, losing self-healing.",
    "Underestimating operational complexity for small workloads."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "docker-and-containerization",
      "reason": "Kubernetes orchestrates containers built with Docker."
    }
  ],
  "resources": [{ "title": "Kubernetes official docs", "resource_type": "documentation" }],
  "interview_questions": ["Pod vs Deployment?", "How does a Service track changing Pods?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "infrastructure-as-code",
  "summary": "Managing infrastructure via versioned declarative configuration instead of manual changes.",
  "learning_outcomes": [
    "Declarative vs imperative provisioning benefit.",
    "How Terraform tracks/reconciles state.",
    "Configuration drift risk."
  ],
  "common_mistakes": [
    "Manual changes outside the IaC tool causing drift.",
    "Storing secrets in version-controlled files."
  ],
  "cross_domain_connections": [
    {
      "target_slug": "version-control-git",
      "reason": "IaC is designed to be versioned/reviewed via Git workflows."
    }
  ],
  "resources": [{ "title": "Terraform official docs", "resource_type": "documentation" }],
  "interview_questions": ["What is configuration drift?", "Why prefer declarative IaC?"],
  "coding_challenges": []
}
```

```json
{
  "slug": "monitoring-and-observability",
  "summary": "Metrics, logs, and traces for understanding a running system's internal state.",
  "learning_outcomes": [
    "Distinguish metrics/logs/traces use.",
    "How tracing diagnoses microservices latency.",
    "Good alert thresholds vs alert fatigue."
  ],
  "common_mistakes": ["Alerting on every anomaly.", "Relying only on logs, no trend metrics."],
  "cross_domain_connections": [
    {
      "target_slug": "microservices-architecture",
      "reason": "Tracing exists to solve microservices' debugging difficulty."
    }
  ],
  "resources": [{ "title": "Google SRE Book (free online)", "resource_type": "book" }],
  "interview_questions": [
    "Metric vs log vs trace?",
    "Diagnose a slow request across 10 microservices?"
  ],
  "coding_challenges": []
}
```

_End of Part 2 — 42 nodes covering TOC, Compiler Design, OS, Databases, Networks, Software Engineering, Distributed Systems/Cloud. Combined with Part 1 (30 nodes) this is the full 72-node set. Report any slug mismatch rather than guessing._
