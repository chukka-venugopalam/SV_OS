/**
 * Graph layout algorithms for React Flow.
 * Supports force-directed, hierarchical, radial, and dependency-tree layouts.
 */
import type { Node as FlowNode, Edge as FlowEdge, XYPosition } from 'reactflow';

export type GraphLayout = 'force' | 'hierarchical' | 'radial' | 'dependency-tree';

/**
 * Compute node positions based on the selected layout algorithm.
 * Returns updated nodes with position properties set.
 */
export function computeLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  layout: GraphLayout,
): FlowNode[] {
  switch (layout) {
    case 'force':
      return computeForceLayout(nodes, edges);
    case 'hierarchical':
      return computeHierarchicalLayout(nodes, edges);
    case 'radial':
      return computeRadialLayout(nodes, edges);
    case 'dependency-tree':
      return computeDependencyTreeLayout(nodes, edges);
    default:
      return nodes;
  }
}

/**
 * Force-directed layout — simple spring-based simulation.
 * Nodes repel each other, edges attract connected nodes.
 */
function computeForceLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const positions: Record<string, XYPosition> = {};
  const velocities: Record<string, XYPosition> = {};
  const nodeIds = nodes.map((n) => n.id);
  const getPos = (id: string) => positions[id] ?? { x: 0, y: 0 };
  const getVel = (id: string) => velocities[id] ?? { x: 0, y: 0 };

  // Initialize positions in a circle
  const radius = Math.min(nodeIds.length * 80, 500);
  nodeIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / nodeIds.length;
    positions[id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    velocities[id] = { x: 0, y: 0 };
  });

  // Build adjacency list
  const adjacency: Record<string, Set<string>> = {};
  nodeIds.forEach((id) => {
    adjacency[id] = new Set();
  });
  edges.forEach((e) => {
    adjacency[e.source]?.add(e.target);
    adjacency[e.target]?.add(e.source);
  });

  // Run simulation iterations
  const iterations = 50;
  const repulsionStrength = 5000;
  const attractionStrength = 0.005;
  const damping = 0.85;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const a: string = nodeIds[i]!;
        const b: string = nodeIds[j]!;
        let dx = getPos(a).x - getPos(b).x;
        let dy = getPos(a).y - getPos(b).y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsionStrength / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        velocities[a] = { x: getVel(a).x + dx, y: getVel(a).y + dy };
        velocities[b] = { x: getVel(b).x - dx, y: getVel(b).y - dy };
      }
    }

    // Attraction along edges
    edges.forEach((e) => {
      const source = e.source;
      const target = e.target;
      if (!positions[source] || !positions[target]) return;
      const dx = getPos(target).x - getPos(source).x;
      const dy = getPos(target).y - getPos(source).y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = dist * attractionStrength;
      velocities[source] = {
        x: getVel(source).x + (dx / dist) * force,
        y: getVel(source).y + (dy / dist) * force,
      };
      velocities[target] = {
        x: getVel(target).x - (dx / dist) * force,
        y: getVel(target).y - (dy / dist) * force,
      };
    });

    // Apply velocities with damping
    nodeIds.forEach((id) => {
      velocities[id] = { x: getVel(id).x * damping, y: getVel(id).y * damping };
      positions[id] = { x: getPos(id).x + getVel(id).x, y: getPos(id).y + getVel(id).y };
    });
  }

  // Center the layout
  const center = getCenter(positions, nodeIds);
  return nodes.map((n) => ({
    ...n,
    position: {
      x: (positions[n.id]?.x ?? 0) - center.x,
      y: (positions[n.id]?.y ?? 0) - center.y,
    },
  }));
}

/**
 * Hierarchical layout — top-to-bottom tree.
 * Root nodes (no incoming edges) at top, leaves at bottom.
 */
function computeHierarchicalLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const positions: Record<string, XYPosition> = {};
  const levels: Record<string, number> = {};

  // Find root nodes (no incoming edges)
  const hasIncoming = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);
  // If no clear roots, use first nodes
  const queue: string[] = roots.length > 0 ? [...roots] : nodes[0]?.id ? [nodes[0].id] : [];

  // BFS to assign levels
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const level = levels[current] ?? 0;

    // Find children
    edges
      .filter((e) => e.source === current)
      .forEach((e) => {
        if (!visited.has(e.target)) {
          levels[e.target] = level + 1;
          queue.push(e.target);
        }
      });
    // Find parents
    edges
      .filter((e) => e.target === current)
      .forEach((e) => {
        if (!visited.has(e.source)) {
          levels[e.source] = Math.max(0, level - 1);
          queue.push(e.source);
        }
      });
  }

  // Assign positions by level
  const levelItems: Record<number, string[]> = {};
  nodes.forEach((n) => {
    const lvl = levels[n.id] ?? 0;
    if (!levelItems[lvl]) levelItems[lvl] = [];
    levelItems[lvl].push(n.id);
  });

  const vGap = 150;
  const hGap = 200;
  Object.entries(levelItems).forEach(([lvl, ids]) => {
    const y = parseInt(lvl) * vGap;
    const totalWidth = (ids.length - 1) * hGap;
    ids.forEach((id, i) => {
      positions[id] = {
        x: i * hGap - totalWidth / 2,
        y: y,
      };
    });
  });

  // Handle unassigned nodes (not connected)
  nodes.forEach((n) => {
    if (!positions[n.id]) {
      positions[n.id] = { x: 0, y: 0 };
    }
  });

  return nodes.map((n) => ({ ...n, position: positions[n.id] ?? { x: 0, y: 0 } }));
}

/**
 * Radial layout — nodes placed in concentric rings around a center.
 */
function computeRadialLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const ringGap = 150;
  const nodeIds = nodes.map((n) => n.id);

  // Find center: node with most connections
  const connections: Record<string, number> = {};
  nodeIds.forEach((id) => {
    connections[id] = 0;
  });
  edges.forEach((e) => {
    connections[e.source] = (connections[e.source] ?? 0) + 1;
    connections[e.target] = (connections[e.target] ?? 0) + 1;
  });

  const sorted = [...nodeIds].sort((a, b) => (connections[b] ?? 0) - (connections[a] ?? 0));
  const topId: string = sorted[0] ?? nodeIds[0]!;
  const positions: Record<string, XYPosition> = { [topId]: { x: 0, y: 0 } };
  const center = topId;

  // BFS to assign rings
  const visited = new Set([center]);
  const queue = [{ id: center, ring: 0 }];
  const rings: Record<number, string[]> = { 0: [center] };

  while (queue.length > 0) {
    const { id, ring } = queue.shift()!;
    const nextRing = ring + 1;

    edges
      .filter((e) => e.source === id || e.target === id)
      .forEach((e) => {
        const neighbor = e.source === id ? e.target : e.source;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, ring: nextRing });
          if (!rings[nextRing]) rings[nextRing] = [];
          rings[nextRing].push(neighbor);
        }
      });
  }

  // Position nodes on each ring
  Object.entries(rings).forEach(([r, ids]) => {
    const ring = parseInt(r);
    if (ring === 0) return;
    const radius = ring * ringGap;
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length;
      positions[id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  });

  return nodes.map((n) => ({ ...n, position: positions[n.id] ?? { x: 0, y: 0 } }));
}

/**
 * Dependency-tree layout — horizontal tree from left (prerequisites) to right (dependents).
 */
function computeDependencyTreeLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  // Reuse hierarchical but swap X and Y for horizontal tree
  const hierarchical = computeHierarchicalLayout(nodes, edges);
  return hierarchical.map((n) => ({
    ...n,
    position: { x: n.position.y, y: n.position.x },
  }));
}

function getCenter(positions: Record<string, XYPosition>, ids: string[]): XYPosition {
  let cx = 0,
    cy = 0,
    count = 0;
  ids.forEach((id) => {
    const p = positions[id];
    if (p) {
      cx += p.x;
      cy += p.y;
      count++;
    }
  });
  return { x: cx / count, y: cy / count };
}
