'use client';

import { Card, CardContent } from '@sv-os/ui';

export function KmapLogicVisualizer() {
  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-primary-400 text-lg font-bold">
            4-Variable Karnaugh Map Logic Minimizer
          </h3>
          <p className="text-xs text-neutral-400">
            Digital Logic — Gray Code Grid & Prime Implicant Grouping
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-400">
          K-Map Grid (AB / CD): Group 4-cells found -&gt; Minimized Expression: F(A,B,C,D) = A'B +
          CD
        </div>
      </CardContent>
    </Card>
  );
}
