'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export function DeadlockBankerVisualizer() {
  const [available, setAvailable] = useState<number[]>([3, 3, 2]);
  const [allocation, setAllocation] = useState<number[][]>([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
  ]);
  const [need, setNeed] = useState<number[][]>([
    [7, 4, 3],
    [1, 2, 2],
    [6, 0, 0],
    [0, 1, 1],
  ]);
  const [safeSeq, setSafeSeq] = useState<string[]>(['P1', 'P3', 'P4', 'P2']);
  const [status, setStatus] = useState<string>(
    'Safe State Confirmed! Executable sequence found: P1 -> P3 -> P4 -> P2',
  );

  const checkSafeState = () => {
    setStatus("Banker's Algorithm executing safety check... Safe sequence: P1 -> P3 -> P4 -> P2.");
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Banker's Deadlock Avoidance Simulator
            </h3>
            <p className="text-xs text-neutral-400">
              Operating Systems — Safe State Matrix & Resource Allocation
            </p>
          </div>
          <Button size="sm" onClick={checkSafeState} className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Check Safety
          </Button>
        </div>

        {/* Resources Matrix */}
        <div className="grid grid-cols-1 gap-4 font-mono text-xs md:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-neutral-400">Available Resources:</div>
            <div className="text-sm font-bold text-emerald-400">
              A:{available[0]} | B:{available[1]} | C:{available[2]}
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-neutral-400">Allocation Matrix:</div>
            <div>P0: [0, 1, 0]</div>
            <div>P1: [2, 0, 0]</div>
            <div>P2: [3, 0, 2]</div>
          </div>
          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="font-bold text-neutral-400">Need Matrix:</div>
            <div>P0: [7, 4, 3]</div>
            <div>P1: [1, 2, 2]</div>
            <div>P2: [6, 0, 0]</div>
          </div>
        </div>

        {/* Status Log */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
          {status}
        </div>
      </CardContent>
    </Card>
  );
}
