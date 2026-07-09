import type { Node, Edge } from 'reactflow';

/** Calculate a bounding box for a set of nodes */
export function getNodesBounds(nodes: Node[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const w = (node.width ?? 150) / 2;
    const h = (node.height ?? 50) / 2;

    minX = Math.min(minX, x - w);
    minY = Math.min(minY, y - h);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Get connected node IDs for a given node */
export function getConnectedNodeIds(nodeId: string, edges: Edge[]): string[] {
  const connected = new Set<string>();
  for (const edge of edges) {
    if (edge.source === nodeId) connected.add(edge.target);
    if (edge.target === nodeId) connected.add(edge.source);
  }
  return Array.from(connected);
}

/** Get edges connected to a specific node */
export function getNodeEdges(nodeId: string, edges: Edge[]): Edge[] {
  return edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
}

/** Filter out disconnected nodes (no edges) */
export function getConnectedNodes(nodes: Node[], edges: Edge[]): Node[] {
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }
  return nodes.filter((node) => connectedNodeIds.has(node.id));
}
