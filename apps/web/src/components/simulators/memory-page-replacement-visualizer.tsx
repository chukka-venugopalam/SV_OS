'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Cpu } from 'lucide-react';
import React, { useState } from 'react';

import { SimulationControls } from '@/components/simulators/simulation-controls';
import { useSimulationEngine } from '@/hooks/use-simulation-engine';

const PAGE_REFERENCE_STREAM = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3];

export function MemoryPageReplacementVisualizer() {
  const [algo, setAlgo] = useState<'fifo' | 'lru'>('fifo');

  const engine = useSimulationEngine({
    totalSteps: PAGE_REFERENCE_STREAM.length,
    initialSpeed: 600,
  });

  // Calculate page frames state up to currentStep
  const computeFrames = () => {
    const frames: (number | null)[] = [null, null, null];
    let pageFaults = 0;
    const history: { page: number; frames: (number | null)[]; fault: boolean }[] = [];
    const fifoQueue: number[] = [];
    const lruMap = new Map<number, number>();

    for (let i = 0; i < PAGE_REFERENCE_STREAM.length; i++) {
      const page = PAGE_REFERENCE_STREAM[i]!;
      let fault = false;

      if (!frames.includes(page)) {
        fault = true;
        pageFaults++;
        const emptyIdx = frames.indexOf(null);
        if (emptyIdx !== -1) {
          frames[emptyIdx] = page;
          fifoQueue.push(emptyIdx);
        } else {
          let replaceIdx = 0;
          if (algo === 'fifo') {
            replaceIdx = fifoQueue.shift()!;
            fifoQueue.push(replaceIdx);
          } else {
            // LRU: find least recently used page
            let minTime = Infinity;
            frames.forEach((p, fIdx) => {
              const lastUsed = lruMap.get(p!) ?? -1;
              if (lastUsed < minTime) {
                minTime = lastUsed;
                replaceIdx = fIdx;
              }
            });
          }
          frames[replaceIdx] = page;
        }
      }
      lruMap.set(page, i);

      history.push({ page, frames: [...frames], fault });
    }

    return { history, totalFaults: pageFaults };
  };

  const { history } = computeFrames();
  const currentStepData = engine.currentStep > 0 ? history[engine.currentStep - 1] : null;

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-sky-400" />
          <h3 className="text-lg font-bold text-neutral-100">OS Virtual Memory Page Replacement</h3>
          <Badge variant="outline" className="border-sky-500/50 text-sky-400">
            Operating Systems
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={algo === 'fifo' ? 'default' : 'outline'}
            onClick={() => {
              setAlgo('fifo');
              engine.reset();
            }}
          >
            FIFO Algorithm
          </Button>
          <Button
            size="sm"
            variant={algo === 'lru' ? 'default' : 'outline'}
            onClick={() => {
              setAlgo('lru');
              engine.reset();
            }}
          >
            LRU Algorithm
          </Button>
        </div>
      </div>

      {/* Engine Controls */}
      <div className="mb-6">
        <SimulationControls
          currentStep={engine.currentStep}
          totalSteps={PAGE_REFERENCE_STREAM.length}
          isPlaying={engine.isPlaying}
          speed={engine.speed}
          onTogglePlay={engine.togglePlay}
          onStepForward={engine.stepForward}
          onReset={engine.reset}
          onSpeedChange={engine.setSpeed}
        />
      </div>

      {/* Reference Stream Tape */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
        <span className="text-xs font-semibold text-neutral-400">Page Reference Sequence:</span>
        <div className="flex gap-1.5 font-mono">
          {PAGE_REFERENCE_STREAM.map((p, idx) => (
            <div
              key={idx}
              className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-bold ${
                idx === engine.currentStep - 1
                  ? 'border-sky-500 bg-sky-950 text-sky-300 ring-2 ring-sky-500/50'
                  : idx < engine.currentStep
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-300'
                    : 'border-neutral-800 text-neutral-600'
              }`}
            >
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* 3 Memory Frames */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        {[0, 1, 2].map((fIdx) => {
          const loadedPage = currentStepData ? currentStepData.frames[fIdx] : null;
          return (
            <div
              key={fIdx}
              className={`rounded-lg border p-4 transition-all ${
                currentStepData?.fault
                  ? 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/40'
                  : 'border-neutral-800 bg-neutral-950'
              }`}
            >
              <div className="text-xs font-semibold text-neutral-400">
                RAM Frame Slot {fIdx + 1}
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-sky-300">
                {loadedPage !== null && loadedPage !== undefined ? `Page ${loadedPage}` : 'EMPTY'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
        {currentStepData ? (
          <div>
            <span className="font-bold text-sky-400">Step {engine.currentStep}:</span> Referenced
            Page <strong className="text-neutral-100">{currentStepData.page}</strong>.
            {currentStepData.fault ? (
              <span className="ml-2 font-bold text-rose-400">
                PAGE FAULT! Evicted frame using {algo.toUpperCase()}.
              </span>
            ) : (
              <span className="ml-2 font-bold text-emerald-400">
                PAGE HIT! Page already resident in memory frame.
              </span>
            )}
          </div>
        ) : (
          <span className="text-neutral-400">
            Click Run Simulation to observe Page Fault Evictions.
          </span>
        )}
      </div>
    </Card>
  );
}
