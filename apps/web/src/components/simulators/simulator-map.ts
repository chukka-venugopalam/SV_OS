import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Canonical registry of all interactive simulators and visualizers in SV-OS.
 * Code-split with next/dynamic for optimal bundle size.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SIMULATOR_COMPONENT_MAP: Record<string, ComponentType<any>> = {
  'advanced-trees-visualizer': dynamic(
    () => import('@/components/simulators/advanced-trees-visualizer'),
  ),
  'alu-bitwise-visualizer': dynamic(() =>
    import('@/components/simulators/alu-bitwise-visualizer').then((m) => m.AluBitwiseVisualizer),
  ),
  'amortized-cost-visualizer': dynamic(
    () => import('@/components/simulators/amortized-cost-visualizer'),
  ),
  'array-address-visualizer': dynamic(
    () => import('@/components/simulators/array-address-visualizer'),
  ),
  'ast-parser-visualizer': dynamic(() =>
    import('@/components/simulators/ast-parser-visualizer').then((m) => m.AstParserVisualizer),
  ),
  'attribute-closure-calculator': dynamic(
    () => import('@/components/simulators/attribute-closure-calculator'),
  ),
  'avl-rotation-visualizer': dynamic(
    () => import('@/components/simulators/avl-rotation-visualizer'),
  ),
  'bandwidth-delay-product-visualizer': dynamic(
    () => import('@/components/simulators/bandwidth-delay-product-visualizer'),
  ),
  'bayes-theorem-visualizer': dynamic(
    () => import('@/components/simulators/bayes-theorem-visualizer'),
  ),
  'btree-visualizer': dynamic(() =>
    import('@/components/simulators/btree-visualizer').then((m) => m.BTreeVisualizer),
  ),
  'cache-mapping-visualizer': dynamic(() =>
    import('@/components/simulators/cache-mapping-visualizer').then(
      (m) => m.CacheMappingVisualizer,
    ),
  ),
  'call-stack-visualizer': dynamic(() =>
    import('@/components/simulators/call-stack-visualizer').then((m) => m.CallStackVisualizer),
  ),
  'cidr-aggregation-visualizer': dynamic(
    () => import('@/components/simulators/cidr-aggregation-visualizer'),
  ),
  'codegen-linking-sim': dynamic(() => import('@/components/simulators/codegen-linking-sim')),
  'compiler-pipeline-visualizer': dynamic(
    () => import('@/components/simulators/compiler-pipeline-visualizer'),
  ),
  'consistent-hashing-ring-sim': dynamic(
    () => import('@/components/simulators/consistent-hashing-ring-sim'),
  ),
  'context-switch-visualizer': dynamic(
    () => import('@/components/simulators/context-switch-visualizer'),
  ),
  'cpu-register-visualizer': dynamic(() =>
    import('@/components/simulators/cpu-register-visualizer').then((m) => m.CpuRegisterVisualizer),
  ),
  'cpu-scheduler-extension': dynamic(
    () => import('@/components/simulators/cpu-scheduler-visualizer'),
  ),
  'cpu-scheduler-visualizer': dynamic(
    () => import('@/components/simulators/cpu-scheduler-visualizer'),
  ),
  'crc-calculator-visualizer': dynamic(
    () => import('@/components/simulators/crc-calculator-visualizer'),
  ),
  'critical-point-visualizer': dynamic(
    () => import('@/components/simulators/critical-point-visualizer'),
  ),
  'csma-collision-sim': dynamic(() => import('@/components/simulators/csma-collision-sim')),
  'cyk-parser-sim': dynamic(() => import('@/components/simulators/cyk-parser-sim')),
  'deadlock-banker-visualizer': dynamic(() =>
    import('@/components/simulators/deadlock-banker-visualizer').then(
      (m) => m.DeadlockBankerVisualizer,
    ),
  ),
  'demand-paging-sim': dynamic(() => import('@/components/simulators/demand-paging-sim')),
  'dijkstra-graph-visualizer': dynamic(() =>
    import('@/components/simulators/dijkstra-graph-visualizer').then(
      (m) => m.DijkstraGraphVisualizer,
    ),
  ),
  'dining-philosophers-sim': dynamic(
    () => import('@/components/simulators/dining-philosophers-sim'),
  ),
  'disk-arm-scheduler': dynamic(() => import('@/components/simulators/disk-arm-scheduler')),
  'disk-bitmap-visualizer': dynamic(() => import('@/components/simulators/disk-bitmap-visualizer')),
  'distance-vector-routing-visualizer': dynamic(
    () => import('@/components/simulators/distance-vector-routing-visualizer'),
  ),
  'dns-resolution-visualizer': dynamic(
    () => import('@/components/simulators/dns-resolution-visualizer'),
  ),
  'dp-matrix-visualizer': dynamic(() => import('@/components/simulators/dp-matrix-visualizer')),
  'er-diagram-builder': dynamic(() => import('@/components/simulators/er-diagram-builder')),
  'er-to-table-mapper': dynamic(() => import('@/components/simulators/er-to-table-mapper')),
  'expression-evaluator': dynamic(() => import('@/components/simulators/expression-evaluator')),
  'file-allocation-sim': dynamic(() => import('@/components/simulators/file-allocation-sim')),
  'finite-automata-modes-visualizer': dynamic(
    () => import('@/components/simulators/finite-automata-modes-visualizer'),
  ),
  'finite-automata-visualizer': dynamic(() =>
    import('@/components/simulators/finite-automata-visualizer').then(
      (m) => m.FiniteAutomataVisualizer,
    ),
  ),
  'flipflop-fsm-visualizer': dynamic(
    () => import('@/components/simulators/flipflop-fsm-visualizer'),
  ),
  'fork-tree-visualizer': dynamic(() => import('@/components/simulators/fork-tree-visualizer')),
  'frame-delimiter-sim': dynamic(() => import('@/components/simulators/frame-delimiter-sim')),
  'gaussian-elimination-visualizer': dynamic(
    () => import('@/components/simulators/gaussian-elimination-visualizer'),
  ),
  'grammar-normal-form-converter': dynamic(
    () => import('@/components/simulators/grammar-normal-form-converter'),
  ),
  'graph-algorithms-extension': dynamic(
    () => import('@/components/simulators/graph-traversal-visualizer'),
  ),
  'graph-traversal-visualizer': dynamic(
    () => import('@/components/simulators/graph-traversal-visualizer'),
  ),
  'group-by-visualizer': dynamic(() => import('@/components/simulators/group-by-visualizer')),
  'growth-rate-grapher': dynamic(() => import('@/components/simulators/growth-rate-grapher')),
  'hamming-code-sim': dynamic(() => import('@/components/simulators/hamming-code-sim')),
  'hash-index-mode': dynamic(() => import('@/components/simulators/hash-index-mode')),
  'hash-table-visualizer': dynamic(() =>
    import('@/components/simulators/hash-table-visualizer').then((m) => m.HashTableVisualizer),
  ),
  'heap-operations-visualizer': dynamic(() =>
    import('@/components/simulators/heap-operations-visualizer').then(
      (m) => m.HeapOperationsVisualizer,
    ),
  ),
  'http-request-response-visualizer': dynamic(
    () => import('@/components/simulators/http-request-response-visualizer'),
  ),
  'huffman-coding-visualizer': dynamic(
    () => import('@/components/simulators/huffman-coding-visualizer'),
  ),
  'ieee754-representation-visualizer': dynamic(
    () => import('@/components/simulators/ieee754-representation-visualizer'),
  ),
  'inode-allocation-visualizer': dynamic(
    () => import('@/components/simulators/inode-allocation-visualizer'),
  ),
  'ipc-channel-sim': dynamic(() => import('@/components/simulators/ipc-channel-sim')),
  'ir-optimization-sim': dynamic(() => import('@/components/simulators/ir-optimization-sim')),
  'kmap-2-3-variable-visualizer': dynamic(
    () => import('@/components/simulators/kmap-2-3-variable-visualizer'),
  ),
  'kmap-4-variable-visualizer': dynamic(
    () => import('@/components/simulators/kmap-4-variable-visualizer'),
  ),
  'kmp-pattern-match-visualizer': dynamic(
    () => import('@/components/simulators/kmp-pattern-match-visualizer'),
  ),
  'lexer-visualizer': dynamic(() =>
    import('@/components/simulators/lexer-visualizer').then((m) => m.LexerVisualizer),
  ),
  'limits-continuity-visualizer': dynamic(
    () => import('@/components/simulators/limits-continuity-visualizer'),
  ),
  'linear-binary-search-visualizer': dynamic(
    () => import('@/components/simulators/linear-binary-search-visualizer'),
  ),
  'link-state-routing-sim': dynamic(() => import('@/components/simulators/link-state-routing-sim')),
  'linked-list-reversal-visualizer': dynamic(
    () => import('@/components/simulators/linked-list-reversal-visualizer'),
  ),
  'll1-parser-sim': dynamic(() => import('@/components/simulators/ll1-parser-sim')),
  'logic-circuit-simulator': dynamic(() =>
    import('@/components/simulators/logic-circuit-simulator').then((m) => m.LogicCircuitSimulator),
  ),
  'longest-prefix-match-visualizer': dynamic(
    () => import('@/components/simulators/longest-prefix-match-visualizer'),
  ),
  'loop-complexity-counter': dynamic(
    () => import('@/components/simulators/loop-complexity-counter'),
  ),
  'lr-parser-sim': dynamic(() => import('@/components/simulators/lr-parser-sim')),
  'master-theorem-visualizer': dynamic(
    () => import('@/components/simulators/master-theorem-visualizer'),
  ),
  'memory-allocation-sim': dynamic(() => import('@/components/simulators/memory-allocation-sim')),
  'memory-page-replacement-visualizer': dynamic(() =>
    import('@/components/simulators/memory-page-replacement-visualizer').then(
      (m) => m.MemoryPageReplacementVisualizer,
    ),
  ),
  'normalization-step-visualizer': dynamic(
    () => import('@/components/simulators/normalization-step-visualizer'),
  ),
  'osi-layer-stack-visualizer': dynamic(
    () => import('@/components/simulators/osi-layer-stack-visualizer'),
  ),
  'page-table-walker': dynamic(() => import('@/components/simulators/page-table-walker')),
  'parse-tree-ambiguity-demo': dynamic(
    () => import('@/components/simulators/parse-tree-ambiguity-demo'),
  ),
  'pda-cfg-visualizer': dynamic(() => import('@/components/simulators/pda-cfg-visualizer')),
  'pipeline-hazard-visualizer': dynamic(
    () => import('@/components/simulators/pipeline-hazard-visualizer'),
  ),
  'priority-queue-sim': dynamic(() => import('@/components/simulators/priority-queue-sim')),
  'process-state-visualizer': dynamic(
    () => import('@/components/simulators/process-state-visualizer'),
  ),
  'pvs-np-visualizer': dynamic(() => import('@/components/simulators/pvs-np-visualizer')),
  'query-cost-calculator': dynamic(() => import('@/components/simulators/query-cost-calculator')),
  'query-plan-visualizer': dynamic(() => import('@/components/simulators/query-plan-visualizer')),
  'queue-operations-sim': dynamic(() => import('@/components/simulators/queue-operations-sim')),
  'race-condition-demonstrator': dynamic(
    () => import('@/components/simulators/race-condition-demonstrator'),
  ),
  'rb-tree-insertion-sim': dynamic(() => import('@/components/simulators/rb-tree-insertion-sim')),
  'recurrence-solver': dynamic(() => import('@/components/simulators/recurrence-solver')),
  'regex-nfa-visualizer': dynamic(() => import('@/components/simulators/regex-nfa-visualizer')),
  'relation-properties-visualizer': dynamic(
    () => import('@/components/simulators/relation-properties-visualizer'),
  ),
  'relational-algebra-visualizer': dynamic(() =>
    import('@/components/simulators/relational-algebra-visualizer').then(
      (m) => m.RelationalAlgebraVisualizer,
    ),
  ),
  'ripple-carry-adder-visualizer': dynamic(
    () => import('@/components/simulators/ripple-carry-adder-visualizer'),
  ),
  'sdt-attribute-sim': dynamic(() => import('@/components/simulators/sdt-attribute-sim')),
  'segment-map-visualizer': dynamic(() => import('@/components/simulators/segment-map-visualizer')),
  'semaphore-signaling-sim': dynamic(
    () => import('@/components/simulators/semaphore-signaling-sim'),
  ),
  'serializability-checker': dynamic(
    () => import('@/components/simulators/serializability-checker'),
  ),
  'sliding-window-protocol-visualizer': dynamic(
    () => import('@/components/simulators/sliding-window-protocol-visualizer'),
  ),
  'sliding-window-visualizer': dynamic(() =>
    import('@/components/simulators/sliding-window-visualizer').then(
      (m) => m.SlidingWindowVisualizer,
    ),
  ),
  'sorting-visualizer': dynamic(() =>
    import('@/components/simulators/sorting-visualizer').then((m) => m.SortingVisualizer),
  ),
  'sql-ddl-playground': dynamic(() => import('@/components/simulators/sql-ddl-playground')),
  'sql-dml-playground': dynamic(() => import('@/components/simulators/sql-dml-playground')),
  'sql-join-visualizer': dynamic(() => import('@/components/simulators/sql-join-visualizer')),
  'stack-operations-sim': dynamic(() => import('@/components/simulators/stack-operations-sim')),
  'string-algorithms-visualizer': dynamic(
    () => import('@/components/simulators/string-algorithms-visualizer'),
  ),
  'subnet-calculator-visualizer': dynamic(
    () => import('@/components/simulators/subnet-calculator-visualizer'),
  ),
  'subquery-execution-sim': dynamic(() => import('@/components/simulators/subquery-execution-sim')),
  'tcp-congestion-reliability-sim': dynamic(
    () => import('@/components/simulators/tcp-congestion-reliability-sim'),
  ),
  'tcp-packet-flow-visualizer': dynamic(() =>
    import('@/components/simulators/tcp-packet-flow-visualizer').then(
      (m) => m.TcpPacketFlowVisualizer,
    ),
  ),
  'tcpip-layer-mapper': dynamic(() => import('@/components/simulators/tcpip-layer-mapper')),
  'thread-lifecycle-sim': dynamic(() => import('@/components/simulators/thread-lifecycle-sim')),
  'tlb-visualizer': dynamic(() => import('@/components/simulators/tlb-visualizer')),
  'tls-handshake-sim': dynamic(() => import('@/components/simulators/tls-handshake-sim')),
  'tower-of-hanoi-visualizer': dynamic(
    () => import('@/components/simulators/tower-of-hanoi-visualizer'),
  ),
  'transaction-state-sim': dynamic(() => import('@/components/simulators/transaction-state-sim')),
  'transaction-wait-for-graph-sim': dynamic(
    () => import('@/components/simulators/transaction-wait-for-graph-sim'),
  ),
  'tree-traversal-animator': dynamic(
    () => import('@/components/simulators/tree-traversal-animator'),
  ),
  'trie-insert-search-sim': dynamic(() => import('@/components/simulators/trie-insert-search-sim')),
  'truth-table-visualizer': dynamic(() =>
    import('@/components/simulators/truth-table-visualizer').then((m) => m.TruthTableVisualizer),
  ),
  'turing-machine-visualizer': dynamic(() =>
    import('@/components/simulators/turing-machine-visualizer').then(
      (m) => m.TuringMachineVisualizer,
    ),
  ),
  'two-phase-lock-sim': dynamic(() => import('@/components/simulators/two-phase-lock-sim')),
  'twos-complement-overflow-visualizer': dynamic(
    () => import('@/components/simulators/twos-complement-overflow-visualizer'),
  ),
  'type-checker-sim': dynamic(() => import('@/components/simulators/type-checker-sim')),
  'wal-recovery-sim': dynamic(() => import('@/components/simulators/wal-recovery-sim')),
};
