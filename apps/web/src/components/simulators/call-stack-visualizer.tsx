'use client';

import { Card, Badge } from '@sv-os/ui';
import { Layers } from 'lucide-react';
import React from 'react';

import { SimulationControls } from '@/components/simulators/simulation-controls';
import { useSimulationEngine } from '@/hooks/use-simulation-engine';

const STACK_STEPS = [
  {
    action: 'PUSH',
    fn: 'factorial(4)',
    depth: 1,
    returnVal: null,
    desc: 'Call factorial(4) -> Needs 4 * factorial(3)',
  },
  {
    action: 'PUSH',
    fn: 'factorial(3)',
    depth: 2,
    returnVal: null,
    desc: 'Call factorial(3) -> Needs 3 * factorial(2)',
  },
  {
    action: 'PUSH',
    fn: 'factorial(2)',
    depth: 3,
    returnVal: null,
    desc: 'Call factorial(2) -> Needs 2 * factorial(1)',
  },
  {
    action: 'PUSH',
    fn: 'factorial(1)',
    depth: 4,
    returnVal: 1,
    desc: 'Base Case Reached! factorial(1) returns 1',
  },
  {
    action: 'POP',
    fn: 'factorial(2)',
    depth: 3,
    returnVal: 2,
    desc: 'Unwinding: 2 * 1 = 2 returned to caller',
  },
  {
    action: 'POP',
    fn: 'factorial(3)',
    depth: 2,
    returnVal: 6,
    desc: 'Unwinding: 3 * 2 = 6 returned to caller',
  },
  {
    action: 'POP',
    fn: 'factorial(4)',
    depth: 1,
    returnVal: 24,
    desc: 'Final Return: 4 * 6 = 24 returned!',
  },
];

export function CallStackVisualizer() {
  const engine = useSimulationEngine({
    totalSteps: STACK_STEPS.length,
    initialSpeed: 600,
  });

  // Calculate active stack frames
  const getActiveStack = () => {
    const stack: typeof STACK_STEPS = [];
    for (let i = 0; i < engine.currentStep; i++) {
      const step = STACK_STEPS[i]!;
      if (step.action === 'PUSH') {
        stack.push(step);
      } else {
        stack.pop();
      }
    }
    return stack;
  };

  const activeStack = getActiveStack();
  const curr = engine.currentStep > 0 ? STACK_STEPS[engine.currentStep - 1] : null;

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-bold text-neutral-100">Recursion Call Stack Visualizer</h3>
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            Algorithms
          </Badge>
        </div>
      </div>

      {/* Engine Controls */}
      <div className="mb-6">
        <SimulationControls
          currentStep={engine.currentStep}
          totalSteps={STACK_STEPS.length}
          isPlaying={engine.isPlaying}
          speed={engine.speed}
          onTogglePlay={engine.togglePlay}
          onStepForward={engine.stepForward}
          onReset={engine.reset}
          onSpeedChange={engine.setSpeed}
        />
      </div>

      {/* Call Stack Tower (LIFO) */}
      <div className="mb-6 flex flex-col-reverse items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
        {activeStack.length === 0 ? (
          <div className="py-8 text-xs text-neutral-500">Call Stack Empty (Top of Stack)</div>
        ) : (
          activeStack.map((frame, idx) => (
            <div
              key={idx}
              className={`w-72 rounded-lg border px-4 py-2.5 shadow transition-all ${
                idx === activeStack.length - 1
                  ? 'border-purple-500 bg-purple-950/60 ring-2 ring-purple-500/50'
                  : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-purple-300">{frame.fn}</span>
                <Badge variant="secondary" className="text-[10px]">
                  Frame {frame.depth}
                </Badge>
              </div>
              {frame.returnVal !== null && (
                <div className="mt-1 font-mono text-[11px] text-emerald-400">
                  Return Value = {frame.returnVal}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status Info */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
        {curr ? (
          <div>
            <span className="font-bold text-purple-400">
              Step {engine.currentStep} ({curr.action}):
            </span>{' '}
            <span className="text-neutral-200">{curr.desc}</span>
          </div>
        ) : (
          <span className="text-neutral-400">
            Click Run Simulation to push/pop recursion stack frames.
          </span>
        )}
      </div>
    </Card>
  );
}
