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
    description: 'Evaluate AND, OR, and Implication truth tables for propositional statements.',
    component_name: 'TruthTableVisualizer',
    badge: 'Mathematics',
  },
  {
    id: 'hash-table-sim',
    title: 'Hash Table Collision Visualizer',
    domain: 'Data Structures',
    target_node_slug: 'dsa-hash-tables',
    description:
      'Visualize key hashing, bucket indexing, and collision resolution via linked-list chaining.',
    component_name: 'HashTableVisualizer',
    badge: 'Data Structures',
  },
  {
    id: 'memory-page-sim',
    title: 'OS Page Replacement Visualizer',
    domain: 'Operating Systems',
    target_node_slug: 'virtual-memory',
    description: 'Simulate FIFO and LRU page table frame eviction on virtual memory page faults.',
    component_name: 'MemoryPageReplacementVisualizer',
    badge: 'Operating Systems',
  },
  {
    id: 'call-stack-sim',
    title: 'Recursion Call Stack Visualizer',
    domain: 'Algorithms',
    target_node_slug: 'recursion-and-divide-and-conquer',
    description:
      'Step through stack frame pushing, popping, and activation record returns in recursive calls.',
    component_name: 'CallStackVisualizer',
    badge: 'Algorithms',
  },
];

export default function SimulatorsCatalogPage() {
  const [simulators, setSimulators] = useState<SimulatorData[]>(FALLBACK_SIMULATORS);

  useEffect(() => {
    fetch('/api/v1/simulators')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          setSimulators(res.data);
        }
      })
      .catch(() => {
        // Fallback already loaded
      });
  }, []);

  return (
    <Shell>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-100">Interactive Simulators</h1>
              <p className="text-sm text-neutral-400">
                Explore mechanism-heavy computer science concepts through interactive state
                visualizers.
              </p>
            </div>
          </div>
        </div>

        {/* Simulators Card Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {simulators.map((sim) => (
            <Card
              key={sim.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="outline" className="border-purple-500/40 text-purple-400">
                    {sim.domain}
                  </Badge>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {sim.target_node_slug}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-bold text-neutral-100">{sim.title}</h3>
                <p className="mb-6 text-xs text-neutral-400">{sim.description}</p>
              </div>

              <Link href={`/explore/${sim.target_node_slug}`}>
                <Button className="w-full gap-2 bg-purple-600 text-white hover:bg-purple-500">
                  <Play className="h-4 w-4" /> Launch Simulator
                  <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
