import type { NodeTypes, EdgeTypes } from 'reactflow';
import { CUSTOM_NODE_TYPES, CUSTOM_EDGE_TYPES } from './flow-config';

/**
 * Central registry for all custom node and edge types used in the graph.
 *
 * Register new node/edge components here as they are implemented.
 */
export const nodeTypes: NodeTypes = {
  ...CUSTOM_NODE_TYPES,
};

export const edgeTypes: EdgeTypes = {
  ...CUSTOM_EDGE_TYPES,
};
