'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function DpMatrixVisualizer() {
  const [matrix, setMatrix] = useState<number[][]>([
    [0, 0, 0, 0, 0],
    [0, 2, 2, 2, 2],
    [0, 2, 3, 5, 5],
    [0, 2, 3, 5, 6],
  ]);

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Dynamic Programming Grid Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Algorithms — 0/1 Knapsack & Memoization Table Evaluation
            </p>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400">DP Table dp[item][capacity]:</div>
          <div className="grid grid-cols-5 gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-center font-mono">
            {matrix.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-lg border p-3 text-sm font-bold transition-all ${
                    r === 3 && c === 4
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                  }`}
                >
                  {val}
                </div>
              )),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
