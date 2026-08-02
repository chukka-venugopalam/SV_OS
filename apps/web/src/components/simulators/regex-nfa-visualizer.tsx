'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { useState } from 'react';

export function RegexNfaVisualizer() {
  const [regex] = useState<string>('(a|b)*c');

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Regex to NFA Thompson Construction Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Theory of Computation — Regular Expressions & $\epsilon$-NFA Automata
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-400">
          Target Regex: <span className="font-bold text-white">{regex}</span> | NFA States
          Generated: [q0, q1, q2, q3 (Accept)]
        </div>
      </CardContent>
    </Card>
  );
}
