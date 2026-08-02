'use client';

import { Card, Badge, Button } from '@sv-os/ui';
import {
  Play,
  Cpu,
  Database,
  Network,
  CircuitBoard,
  Code,
  Binary,
  Layers,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Shell } from '@/components/shared/shell';

interface SimulatorData {
  id: string;
  title: string;
  domain: string;
  target_node_slug: string;
  description: string;
  component_name: string;
  badge: string;
}

const FALLBACK_SIMULATORS: SimulatorData[] = [
  {
    id: 'logic-gates-sim',
    title: 'Logic Circuit Simulator',
    domain: 'Digital Logic',
    target_node_slug: 'logic-gates',
    description: 'Simulate boolean AND, OR, XOR, NOT logic gate operations step-by-step.',
    component_name: 'LogicCircuitSimulator',
    badge: 'Digital Logic',
  },
  {
    id: 'sorting-sim',
    title: 'Sorting Algorithm Visualizer',
    domain: 'Algorithms',
    target_node_slug: 'recursion-and-divide-and-conquer',
    description: 'Step through Bubble Sort and Quick Sort comparisons, swaps, and partitioning.',
    component_name: 'SortingVisualizer',
    badge: 'Algorithms',
  },
  {
    id: 'graph-traversal-sim',
    title: 'Graph Traversal Visualizer',
    domain: 'Data Structures',
    target_node_slug: 'intro-to-ai-and-search-algorithms',
    description:
      'Visualize Breadth-First Search (BFS) and Depth-First Search (DFS) state frontiers.',
    component_name: 'GraphTraversalVisualizer',
    badge: 'Data Structures',
  },
  {
    id: 'cpu-scheduler-sim',
    title: 'CPU Process Scheduler',
    domain: 'Operating Systems',
    target_node_slug: 'cpu-scheduling',
    description:
      'Simulate FCFS and Round Robin process queue execution and Gantt chart scheduling.',
    component_name: 'CpuSchedulerVisualizer',
    badge: 'Operating Systems',
  },
  {
    id: 'tcp-packet-flow-sim',
    title: 'TCP 3-Way Handshake Flow',
    domain: 'Computer Networks',
    target_node_slug: 'tcp-and-congestion-control',
    description: 'Step through SYN, SYN-ACK, and ACK packet exchange between Client and Server.',
    component_name: 'TcpPacketFlowVisualizer',
    badge: 'Computer Networks',
  },
  {
    id: 'btree-index-sim',
    title: 'B+ Tree Index Search',
    domain: 'Databases',
    target_node_slug: 'indexing-b-tree-hash',
    description:
      'Simulate disk page B+ Tree index pointer navigation from Root to Leaf Data Blocks.',
    component_name: 'BTreeVisualizer',
    badge: 'Databases',
  },
  {
    id: 'finite-automata-sim',
    title: 'Deterministic Finite Automaton (DFA)',
    domain: 'Theory of Computation',
    target_node_slug: 'finite-automata',
    description: 'Step through state transitions of a DFA on binary input strings.',
    component_name: 'FiniteAutomataVisualizer',
    badge: 'Theory of Computation',
  },
  {
    id: 'cpu-register-sim',
    title: 'CPU Register Instruction Cycle',
    domain: 'Computer Architecture',
    target_node_slug: 'cpu-architecture-and-instruction-cycle',
    description:
      'Visualize Program Counter (PC), Instruction Register (IR), and Accumulator (ACC) Fetch-Decode-Execute.',
    component_name: 'CpuRegisterVisualizer',
    badge: 'Architecture',
  },
  {
    id: 'lexer-sim',
    title: 'Compiler Lexical Analyzer (Lexer)',
    domain: 'Compiler Design',
    target_node_slug: 'lexical-analysis',
    description:
      'Tokenize raw source code into KEYWORD, IDENTIFIER, OPERATOR, and LITERAL token streams.',
    component_name: 'LexerVisualizer',
    badge: 'Compilers',
  },
  {
    id: 'truth-table-sim',
    title: 'Propositional Logic Truth Table',
    domain: 'Mathematics',
    target_node_slug: 'set-theory-and-mathematical-logic',
    description:
      'Evaluate truth tables for $P \\land Q$, $P \\lor Q$, and $P \\implies Q$ logic propositions.',
    component_name: 'TruthTableVisualizer',
    badge: 'Mathematics',
  },
  {
    id: 'hash-table-sim',
    title: 'Hash Table Collision Visualizer',
    domain: 'Data Structures',
    target_node_slug: 'dsa-hash-tables',
    description: 'Visualize Separate Chaining vs Open Addressing collision resolution.',
    component_name: 'HashTableVisualizer',
    badge: 'Data Structures',
  },
  {
    id: 'page-replacement-sim',
    title: 'OS Page Replacement Visualizer',
    domain: 'Operating Systems',
    target_node_slug: 'virtual-memory',
    description: 'Step through FIFO, LRU, and Optimal page replacement algorithms.',
    component_name: 'MemoryPageReplacementVisualizer',
    badge: 'Operating Systems',
  },
  {
    id: 'call-stack-sim',
    title: 'Recursion Call Stack Visualizer',
    domain: 'Data Structures',
    target_node_slug: 'stacks-and-queues',
    description: 'Visualize push and pop operations on stack frames during recursive execution.',
    component_name: 'CallStackVisualizer',
    badge: 'Data Structures',
  },
  {
    id: 'dijkstra-graph-sim',
    title: "Dijkstra's Shortest Path Visualizer",
    domain: 'Algorithms',
    target_node_slug: 'algo-graph-algorithms',
    description: "Visualize greedy priority queue graph exploration for Dijkstra's algorithm.",
    component_name: 'DijkstraGraphVisualizer',
    badge: 'Algorithms',
  },
  {
    id: 'bst-avl-sim',
    title: 'BST & AVL Tree Balancer',
    domain: 'Data Structures',
    target_node_slug: 'dsa-trees',
    description: 'Interactive BST insertion and AVL single/double rotation balancing.',
    component_name: 'BstAvlVisualizer',
    badge: 'Data Structures',
  },
  {
    id: 'turing-machine-sim',
    title: 'Turing Machine Tape Simulator',
    domain: 'Theory of Computation',
    target_node_slug: 'turing-machines-and-computability',
    description: 'Step through infinite tape head reads, writes, and state transitions.',
    component_name: 'TuringMachineVisualizer',
    badge: 'Theory of Computation',
  },
  {
    id: 'ast-parser-sim',
    title: 'Recursive Descent AST Parser',
    domain: 'Compiler Design',
    target_node_slug: 'parsing-syntax-analysis',
    description: 'Parse arithmetic expressions into Abstract Syntax Tree nodes.',
    component_name: 'AstParserVisualizer',
    badge: 'Compilers',
  },
  {
    id: 'deadlock-banker-sim',
    title: "Banker's Deadlock Avoidance Simulator",
    domain: 'Operating Systems',
    target_node_slug: 'synchronization-and-deadlocks',
    description: 'Evaluate resource allocation matrices and safe sequence execution paths.',
    component_name: 'DeadlockBankerVisualizer',
    badge: 'Operating Systems',
  },
  {
    id: 'heap-ops-sim',
    title: 'Min/Max Heap Operations',
    domain: 'Data Structures',
    target_node_slug: 'heaps-and-priority-queues',
    description:
      'Visualize array-backed binary min/max heap insertions and sift-up/down extractions.',
    component_name: 'HeapOperationsVisualizer',
    badge: 'Data Structures',
  },
  {
    id: 'cache-mapping-sim',
    title: 'Cache Memory Mapping Simulator',
    domain: 'Computer Architecture',
    target_node_slug: 'memory-hierarchy-and-caching',
    description:
      'Decompose addresses into Tag, Set, and Offset for L1/L2 cache hit/miss evaluation.',
    component_name: 'CacheMappingVisualizer',
    badge: 'Architecture',
  },
  {
    id: 'sliding-window-sim',
    title: 'Sliding Window Flow Control',
    domain: 'Computer Networks',
    target_node_slug: 'application-layer-protocols-http-dns',
    description:
      'Simulate Go-Back-N sliding window packet transmissions and ACK window advancements.',
    component_name: 'SlidingWindowVisualizer',
    badge: 'Computer Networks',
  },
  {
    id: 'relational-algebra-sim',
    title: 'Relational Algebra Evaluator',
    domain: 'Databases',
    target_node_slug: 'relational-model-and-sql',
    description:
      'Execute projection, selection, and natural join operations over relational tuples.',
    component_name: 'RelationalAlgebraVisualizer',
    badge: 'Databases',
  },
  {
    id: 'dp-matrix-sim',
    title: 'Dynamic Programming Grid Simulator',
    domain: 'Algorithms',
    target_node_slug: 'algo-dp',
    description: 'Step through 0/1 Knapsack memoization table cell updates and backtracks.',
    component_name: 'DpMatrixVisualizer',
    badge: 'Algorithms',
  },
  {
    id: 'alu-bitwise-sim',
    title: 'ALU Bitwise & Adder Simulator',
    domain: 'Digital Logic',
    target_node_slug: 'digital-logic',
    description: 'Simulate 4-bit ALU binary addition, bitwise AND, OR, and XOR operations.',
    component_name: 'AluBitwiseVisualizer',
    badge: 'Digital Logic',
  },
  {
    id: 'rsa-crypto-sim',
    title: 'RSA Cryptography Key Generator',
    domain: 'Cybersecurity',
    target_node_slug: 'asymmetric-cryptography-and-pki',
    description:
      'Compute prime factors, modulus n, public e, and private d keys for RSA encryption.',
    component_name: 'RsaCryptoVisualizer',
    badge: 'Cybersecurity',
  },
  {
    id: 'mmu-translation-sim',
    title: 'MMU Page Address Translation',
    domain: 'Operating Systems',
    target_node_slug: 'virtual-memory',
    description: 'Translate virtual addresses to physical RAM frames via MMU Page Table offsets.',
    component_name: 'MmuAddressTranslationVisualizer',
    badge: 'Operating Systems',
  },
  {
    id: 'regex-nfa-sim',
    title: 'Regex Thompson NFA Builder',
    domain: 'Theory of Computation',
    target_node_slug: 'regular-languages-and-regular-expressions',
    description: 'Transform regular expressions into Thompson epsilon-NFA state transition graphs.',
    component_name: 'RegexNfaVisualizer',
    badge: 'Theory of Computation',
  },
  {
    id: 'pipeline-hazard-sim',
    title: 'MIPS Pipeline Hazard Detector',
    domain: 'Computer Architecture',
    target_node_slug: 'cpu-architecture-and-instruction-cycle',
    description:
      'Detect data and control hazards across 5-stage MIPS IF/ID/EX/MEM/WB pipeline registers.',
    component_name: 'PipelineHazardVisualizer',
    badge: 'Architecture',
  },
  {
    id: 'subnet-calc-sim',
    title: 'CIDR Subnet Calculator',
    domain: 'Computer Networks',
    target_node_slug: 'ip-addressing-and-routing',
    description:
      'Calculate netmask, network address, broadcast address, and host ranges for IPv4 subnets.',
    component_name: 'SubnetCalculatorVisualizer',
    badge: 'Computer Networks',
  },
  {
    id: 'lru-cache-sim',
    title: 'LRU/LFU Cache Eviction Policy',
    domain: 'Data Engineering',
    target_node_slug: 'caching-strategies',
    description:
      'Simulate Least Recently Used (LRU) cache eviction using hash map + doubly linked list.',
    component_name: 'LruCacheVisualizer',
    badge: 'Data Engineering',
  },
  {
    id: 'matrix-transform-sim',
    title: '2D Matrix Linear Transformation',
    domain: 'Mathematics',
    target_node_slug: 'linear-algebra',
    description: 'Apply 2x2 rotation, scaling, and shear matrices to 2D vector coordinate spaces.',
    component_name: 'MatrixTransformVisualizer',
    badge: 'Mathematics',
  },
  {
    id: 'kmap-logic-sim',
    title: 'Karnaugh Map Logic Minimizer',
    domain: 'Digital Logic',
    target_node_slug: 'boolean-algebra',
    description: 'Group 4-variable Gray code Karnaugh map cells into minimal SOP expressions.',
    component_name: 'KmapLogicVisualizer',
    badge: 'Digital Logic',
  },
];

export default function SimulatorsPage() {
  const [simulators, setSimulators] = useState<SimulatorData[]>(FALLBACK_SIMULATORS);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  useEffect(() => {
    // Fetch live inventory from API, fallback to client inventory
    fetch('/api/v1/simulators')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          setSimulators(data.data);
        }
      })
      .catch(() => {
        // use fallback
      });
  }, []);

  const domains = Array.from(new Set(simulators.map((s) => s.domain)));

  const filtered =
    selectedDomain === 'all' ? simulators : simulators.filter((s) => s.domain === selectedDomain);

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary-500 h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Interactive Simulators & Visualizers Catalog
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
            Explore {simulators.length} interactive, step-by-step algorithms, memory systems,
            network protocols, and digital logic visualizers wired directly to SV-OS Knowledge Graph
            nodes.
          </p>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedDomain === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedDomain('all')}
            className="text-xs"
          >
            All Simulators ({simulators.length})
          </Button>
          {domains.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={selectedDomain === d ? 'default' : 'outline'}
              onClick={() => setSelectedDomain(d)}
              className="text-xs"
            >
              {d}
            </Button>
          ))}
        </div>

        {/* Simulators Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sim) => (
            <Card
              key={sim.id}
              className="hover:border-primary-500/50 flex flex-col justify-between border-neutral-200 bg-white transition-all duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-primary-600 dark:text-primary-400 text-[10px] font-semibold uppercase"
                  >
                    {sim.badge || sim.domain}
                  </Badge>
                  <Cpu className="h-4 w-4 text-neutral-400" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {sim.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {sim.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link href={`/explore/${sim.target_node_slug}`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2 text-xs font-semibold"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Launch Visualizer</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
