'use client';

import { Card, Badge } from '@sv-os/ui';
import { Database } from 'lucide-react';
import React from 'react';

import { SimulationControls } from '@/components/simulators/simulation-controls';
import { useSimulationEngine } from '@/hooks/use-simulation-engine';

const KEYS_TO_INSERT = [
  { key: 'Alice', val: 92, bucket: 1 },
  { key: 'Bob', val: 87, bucket: 3 },
  { key: 'Charlie', val: 95, bucket: 1 }, // Collision with Alice in Bucket 1
  { key: 'Dave', val: 78, bucket: 3 }, // Collision with Bob in Bucket 3
  { key: 'Eve', val: 99, bucket: 0 },
];

export function HashTableVisualizer() {
  const engine = useSimulationEngine({
    totalSteps: KEYS_TO_INSERT.length,
    initialSpeed: 600,
  });

  const inserted = KEYS_TO_INSERT.slice(0, engine.currentStep);

  // Group inserted keys by bucket 0..3
  const buckets: { [key: number]: typeof KEYS_TO_INSERT } = { 0: [], 1: [], 2: [], 3: [] };
  inserted.forEach((item) => {
    buckets[item.bucket]?.push(item);
  });

  const curr = engine.currentStep > 0 ? KEYS_TO_INSERT[engine.currentStep - 1] : null;

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-neutral-100">Hash Table Collision Visualizer</h3>
          <Badge variant="outline" className="border-amber-500/50 text-amber-400">
            Data Structures
          </Badge>
        </div>
      </div>

      {/* Engine Controls */}
      <div className="mb-6">
        <SimulationControls
          currentStep={engine.currentStep}
          totalSteps={KEYS_TO_INSERT.length}
          isPlaying={engine.isPlaying}
          speed={engine.speed}
          onTogglePlay={engine.togglePlay}
          onStepForward={engine.stepForward}
          onReset={engine.reset}
          onSpeedChange={engine.setSpeed}
        />
      </div>

      {/* Bucket Array Grid */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((bIdx) => {
          const chain = buckets[bIdx] || [];
          const hasCollision = chain.length > 1;

          return (
            <div
              key={bIdx}
              className={`rounded-lg border p-3 transition-all ${
                curr && curr.bucket === bIdx
                  ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/50'
                  : 'border-neutral-800 bg-neutral-950'
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-neutral-400">Bucket [{bIdx}]</span>
                {hasCollision && (
                  <Badge variant="outline" className="border-rose-500/50 text-[10px] text-rose-400">
                    Collision
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {chain.length === 0 ? (
                  <div className="py-4 text-center text-xs text-neutral-600">Empty</div>
                ) : (
                  chain.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs"
                    >
                      <span className="font-bold text-amber-300">{item.key}</span>
                      <span className="text-neutral-400">{item.val}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Info */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
        {curr ? (
          <div>
            <span className="font-bold text-amber-400">Step {engine.currentStep}:</span> Hashing key{' '}
            <strong className="text-neutral-100">"{curr.key}"</strong> → Index = hash("{curr.key}")
            % 4 = <strong className="text-amber-300">Bucket {curr.bucket}</strong>.
            {buckets[curr.bucket]!.length > 1 ? (
              <span className="ml-2 font-bold text-rose-400">Collision resolved via Chaining!</span>
            ) : (
              <span className="ml-2 text-emerald-400">Inserted into empty bucket slot.</span>
            )}
          </div>
        ) : (
          <span className="text-neutral-400">
            Click Run Simulation to insert keys into the Hash Table.
          </span>
        )}
      </div>
    </Card>
  );
}
