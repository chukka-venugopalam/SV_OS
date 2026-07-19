'use client';

import { create } from 'zustand';

interface PlatformState {
  initialized: boolean;
  environment: string;
  features: Record<string, boolean>;
  engines: string[];
  capabilities: string[];
  plugins: string[];
  setPlatformState: (state: Partial<PlatformState>) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  initialized: false,
  environment: 'development',
  features: {},
  engines: [],
  capabilities: [],
  plugins: [],
  setPlatformState: (state) => set((current) => ({ ...current, ...state })),
}));
