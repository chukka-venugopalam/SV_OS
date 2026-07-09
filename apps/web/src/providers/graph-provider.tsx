'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface GraphContextValue {
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}

interface GraphProviderProps {
  children: ReactNode;
}

export function GraphProvider({ children }: GraphProviderProps) {
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ viewport, setViewport, selectedNodeId, setSelectedNodeId }),
    [viewport, selectedNodeId],
  );

  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}
