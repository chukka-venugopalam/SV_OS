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
        'domain': 'Algorithms',
        'target_node_slug': 'recursion-and-divide-and-conquer',
        'description': (
            'Step through stack frame pushing, popping, and activation records in recursion.'
        ),
        'component_name': 'CallStackVisualizer',
        'badge': 'Algorithms',
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
