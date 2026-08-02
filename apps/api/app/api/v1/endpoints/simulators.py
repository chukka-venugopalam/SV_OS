"""Simulators API endpoint — dynamic registry of interactive learning simulators."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix='/simulators', tags=['simulators'])


class SimulatorItem(BaseModel):
    id: str = Field(..., description='Unique simulator identifier')
    title: str = Field(..., description='Display title of simulator')
    domain: str = Field(..., description='CS subject domain')
    target_node_slug: str = Field(..., description='Target knowledge node slug')
    description: str = Field(..., description='Mechanism explanation')
    component_name: str = Field(..., description='Frontend React component name')
    badge: str = Field(default='Interactive', description='UI badge text')


REGISTERED_SIMULATORS: list[dict[str, Any]] = [
    {
        'id': 'logic-gates-sim',
        'title': 'Logic Circuit Simulator',
        'domain': 'Digital Logic',
        'target_node_slug': 'logic-gates',
        'description': 'Simulate boolean AND, OR, XOR, NOT logic gate operations step-by-step.',
        'component_name': 'LogicCircuitSimulator',
        'badge': 'Digital Logic',
    },
    {
        'id': 'sorting-sim',
        'title': 'Sorting Algorithm Visualizer',
        'domain': 'Algorithms',
        'target_node_slug': 'recursion-and-divide-and-conquer',
        'description': (
            'Step through Bubble Sort and Quick Sort comparisons, swaps, and partitioning.'
        ),
        'component_name': 'SortingVisualizer',
        'badge': 'Algorithms',
    },
    {
        'id': 'graph-traversal-sim',
        'title': 'Graph Traversal Visualizer',
        'domain': 'Data Structures',
        'target_node_slug': 'intro-to-ai-and-search-algorithms',
        'description': (
            'Visualize Breadth-First Search (BFS) and Depth-First Search (DFS) frontiers.'
        ),
        'component_name': 'GraphTraversalVisualizer',
        'badge': 'Data Structures',
    },
    {
        'id': 'cpu-scheduler-sim',
        'title': 'CPU Process Scheduler',
        'domain': 'Operating Systems',
        'target_node_slug': 'cpu-scheduling',
        'description': ('Simulate FCFS and Round Robin process queue execution and Gantt charts.'),
        'component_name': 'CpuSchedulerVisualizer',
        'badge': 'Operating Systems',
    },
    {
        'id': 'tcp-packet-flow-sim',
        'title': 'TCP 3-Way Handshake Flow',
        'domain': 'Computer Networks',
        'target_node_slug': 'tcp-and-congestion-control',
        'description': (
            'Step through SYN, SYN-ACK, and ACK packet exchange between Client & Server.'
        ),
        'component_name': 'TcpPacketFlowVisualizer',
        'badge': 'Computer Networks',
    },
    {
        'id': 'btree-index-sim',
        'title': 'B+ Tree Index Search',
        'domain': 'Databases',
        'target_node_slug': 'indexing-b-tree-hash',
        'description': (
            'Simulate disk page B+ Tree index pointer navigation from Root to Leaf Data Blocks.'
        ),
        'component_name': 'BTreeVisualizer',
        'badge': 'Databases',
    },
    {
        'id': 'finite-automata-sim',
        'title': 'Deterministic Finite Automaton (DFA)',
        'domain': 'Theory of Computation',
        'target_node_slug': 'finite-automata',
        'description': 'Step through state transitions of a DFA on binary input strings.',
        'component_name': 'FiniteAutomataVisualizer',
        'badge': 'Theory of Computation',
    },
    {
        'id': 'cpu-register-sim',
        'title': 'CPU Register Instruction Cycle',
        'domain': 'Computer Architecture',
        'target_node_slug': 'cpu-architecture-and-instruction-cycle',
        'description': (
            'Visualize Program Counter (PC), Instruction Register (IR), and ACC Fetch-Decode.'
        ),
        'component_name': 'CpuRegisterVisualizer',
        'badge': 'Architecture',
    },
    {
        'id': 'lexer-sim',
        'title': 'Compiler Lexical Analyzer (Lexer)',
        'domain': 'Compiler Design',
        'target_node_slug': 'lexical-analysis',
        'description': (
            'Tokenize raw source code into KEYWORD, IDENTIFIER, OPERATOR, and LITERAL tokens.'
        ),
        'component_name': 'LexerVisualizer',
        'badge': 'Compilers',
    },
    {
        'id': 'truth-table-sim',
        'title': 'Propositional Logic Truth Table',
        'domain': 'Mathematics',
        'target_node_slug': 'set-theory-and-mathematical-logic',
        'description': 'Evaluate AND, OR, and Implication truth tables for logical statements.',
        'component_name': 'TruthTableVisualizer',
        'badge': 'Mathematics',
    },
    {
        'id': 'hash-table-sim',
        'title': 'Hash Table Collision Visualizer',
        'domain': 'Data Structures',
        'target_node_slug': 'dsa-hash-tables',
        'description': (
            'Visualize key hashing, bucket indexing, and collision resolution via chaining.'
        ),
        'component_name': 'HashTableVisualizer',
        'badge': 'Data Structures',
    },
    {
        'id': 'memory-page-sim',
        'title': 'OS Page Replacement Visualizer',
        'domain': 'Operating Systems',
        'target_node_slug': 'virtual-memory',
        'description': ('Simulate FIFO and LRU page table frame eviction on page faults.'),
        'component_name': 'MemoryPageReplacementVisualizer',
        'badge': 'Operating Systems',
    },
    {
        'id': 'call-stack-sim',
        'title': 'Recursion Call Stack Visualizer',
        'domain': 'Data Structures',
        'target_node_slug': 'stacks-and-queues',
        'description': (
            'Step through stack frame pushing, popping, and activation records in recursion.'
        ),
        'component_name': 'CallStackVisualizer',
        'badge': 'Data Structures',
    },
    {
        'id': 'dijkstra-graph-sim',
        'title': "Dijkstra's Shortest Path Visualizer",
        'domain': 'Algorithms',
        'target_node_slug': 'algo-graph-algorithms',
        'description': (
            "Visualize greedy priority queue graph exploration for Dijkstra's algorithm."
        ),
        'component_name': 'DijkstraGraphVisualizer',
        'badge': 'Algorithms',
    },
    {
        'id': 'bst-avl-sim',
        'title': 'BST & AVL Tree Balancer',
        'domain': 'Data Structures',
        'target_node_slug': 'dsa-trees',
        'description': 'Interactive BST insertion and AVL single/double rotation balancing.',
        'component_name': 'BstAvlVisualizer',
        'badge': 'Data Structures',
    },
    {
        'id': 'turing-machine-sim',
        'title': 'Turing Machine Tape Simulator',
        'domain': 'Theory of Computation',
        'target_node_slug': 'turing-machines-and-computability',
        'description': 'Step through infinite tape head reads, writes, and state transitions.',
        'component_name': 'TuringMachineVisualizer',
        'badge': 'Theory of Computation',
    },
    {
        'id': 'ast-parser-sim',
        'title': 'Recursive Descent AST Parser',
        'domain': 'Compiler Design',
        'target_node_slug': 'parsing-syntax-analysis',
        'description': 'Parse arithmetic expressions into Abstract Syntax Tree nodes.',
        'component_name': 'AstParserVisualizer',
        'badge': 'Compilers',
    },
    {
        'id': 'deadlock-banker-sim',
        'title': "Banker's Deadlock Avoidance Simulator",
        'domain': 'Operating Systems',
        'target_node_slug': 'synchronization-and-deadlocks',
        'description': 'Evaluate resource allocation matrices and safe sequence execution paths.',
        'component_name': 'DeadlockBankerVisualizer',
        'badge': 'Operating Systems',
    },
    {
        'id': 'heap-ops-sim',
        'title': 'Min/Max Heap Operations',
        'domain': 'Data Structures',
        'target_node_slug': 'heaps-and-priority-queues',
        'description': (
            'Visualize array-backed binary min/max heap insertions and sift-up/down extractions.'
        ),
        'component_name': 'HeapOperationsVisualizer',
        'badge': 'Data Structures',
    },
    {
        'id': 'cache-mapping-sim',
        'title': 'Cache Memory Mapping Simulator',
        'domain': 'Computer Architecture',
        'target_node_slug': 'memory-hierarchy-and-caching',
        'description': (
            'Decompose addresses into Tag, Set, and Offset for L1/L2 cache hit/miss evaluation.'
        ),
        'component_name': 'CacheMappingVisualizer',
        'badge': 'Architecture',
    },
    {
        'id': 'sliding-window-sim',
        'title': 'Sliding Window Flow Control',
        'domain': 'Computer Networks',
        'target_node_slug': 'application-layer-protocols-http-dns',
        'description': (
            'Simulate Go-Back-N sliding window packet transmissions and ACK advancements.'
        ),
        'component_name': 'SlidingWindowVisualizer',
        'badge': 'Computer Networks',
    },
    {
        'id': 'relational-algebra-sim',
        'title': 'Relational Algebra Evaluator',
        'domain': 'Databases',
        'target_node_slug': 'relational-model-and-sql',
        'description': 'Execute projection, selection, and natural join operations.',
        'component_name': 'RelationalAlgebraVisualizer',
        'badge': 'Databases',
    },
    {
        'id': 'dp-matrix-sim',
        'title': 'Dynamic Programming Grid Simulator',
        'domain': 'Algorithms',
        'target_node_slug': 'algo-dp',
        'description': 'Step through 0/1 Knapsack memoization table cell updates and backtracks.',
        'component_name': 'DpMatrixVisualizer',
        'badge': 'Algorithms',
    },
    {
        'id': 'alu-bitwise-sim',
        'title': 'ALU Bitwise & Adder Simulator',
        'domain': 'Digital Logic',
        'target_node_slug': 'digital-logic',
        'description': 'Simulate 4-bit ALU binary addition, bitwise AND, OR, and XOR operations.',
        'component_name': 'AluBitwiseVisualizer',
        'badge': 'Digital Logic',
    },
    {
        'id': 'rsa-crypto-sim',
        'title': 'RSA Cryptography Key Generator',
        'domain': 'Cybersecurity',
        'target_node_slug': 'asymmetric-cryptography-and-pki',
        'description': (
            'Compute prime factors, modulus n, public e, and private d keys for RSA encryption.'
        ),
        'component_name': 'RsaCryptoVisualizer',
        'badge': 'Cybersecurity',
    },
    {
        'id': 'mmu-translation-sim',
        'title': 'MMU Page Address Translation',
        'domain': 'Operating Systems',
        'target_node_slug': 'virtual-memory',
        'description': (
            'Translate virtual addresses to physical RAM frames via MMU Page Table offsets.'
        ),
        'component_name': 'MmuAddressTranslationVisualizer',
        'badge': 'Operating Systems',
    },
    {
        'id': 'regex-nfa-sim',
        'title': 'Regex Thompson NFA Builder',
        'domain': 'Theory of Computation',
        'target_node_slug': 'regular-languages-and-regular-expressions',
        'description': (
            'Transform regular expressions into Thompson epsilon-NFA state transition graphs.'
        ),
        'component_name': 'RegexNfaVisualizer',
        'badge': 'Theory of Computation',
    },
    {
        'id': 'pipeline-hazard-sim',
        'title': 'MIPS Pipeline Hazard Detector',
        'domain': 'Computer Architecture',
        'target_node_slug': 'pipelining-and-instruction-level-parallelism',
        'description': (
            'Detect data and control hazards across 5-stage MIPS IF/ID/EX/MEM/WB registers.'
        ),
        'component_name': 'PipelineHazardVisualizer',
        'badge': 'Architecture',
    },
    {
        'id': 'subnet-calc-sim',
        'title': 'CIDR Subnet Calculator',
        'domain': 'Computer Networks',
        'target_node_slug': 'ip-addressing-and-routing',
        'description': (
            'Calculate netmask, network address, broadcast address, and host ranges for subnets.'
        ),
        'component_name': 'SubnetCalculatorVisualizer',
        'badge': 'Computer Networks',
    },
    {
        'id': 'lru-cache-sim',
        'title': 'LRU/LFU Cache Eviction Policy',
        'domain': 'Data Engineering',
        'target_node_slug': 'caching-strategies',
        'description': (
            'Simulate Least Recently Used (LRU) cache eviction using hash map + linked list.'
        ),
        'component_name': 'LruCacheVisualizer',
        'badge': 'Data Engineering',
    },
    {
        'id': 'matrix-transform-sim',
        'title': '2D Matrix Linear Transformation',
        'domain': 'Mathematics',
        'target_node_slug': 'linear-algebra',
        'description': (
            'Apply 2x2 rotation, scaling, and shear matrices to 2D vector coordinate spaces.'
        ),
        'component_name': 'MatrixTransformVisualizer',
        'badge': 'Mathematics',
    },
    {
        'id': 'kmap-logic-sim',
        'title': 'Karnaugh Map Logic Minimizer',
        'domain': 'Digital Logic',
        'target_node_slug': 'boolean-algebra',
        'description': (
            'Group 4-variable Gray code Karnaugh map cells into minimal SOP expressions.'
        ),
        'component_name': 'KmapLogicVisualizer',
        'badge': 'Digital Logic',
    },
]


@router.get('', summary='List all interactive simulators')
async def list_simulators() -> dict:
    """Return the dynamic catalog of interactive learning simulators."""
    return {
        'success': True,
        'message': 'Simulators fetched successfully',
        'data': REGISTERED_SIMULATORS,
        'errors': None,
    }
