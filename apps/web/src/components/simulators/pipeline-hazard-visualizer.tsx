'use client';

import { Card, CardContent } from '@sv-os/ui';

export function PipelineHazardVisualizer() {
  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-primary-400 text-lg font-bold">
            MIPS 5-Stage Pipeline Hazard Visualizer
          </h3>
          <p className="text-xs text-neutral-400">
            Computer Architecture — IF / ID / EX / MEM / WB Data & Control Hazards
          </p>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
          <div className="text-primary-300 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            IF (Fetch)
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-amber-300">
            ID (Decode)
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-emerald-300">
            EX (Execute)
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-cyan-300">
            MEM (Memory)
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-indigo-300">
            WB (Writeback)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
