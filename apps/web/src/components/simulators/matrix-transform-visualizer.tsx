'use client';

import { Card, CardContent } from '@sv-os/ui';

export function MatrixTransformVisualizer() {
  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-primary-400 text-lg font-bold">
            2D Matrix Linear Transformation Simulator
          </h3>
          <p className="text-xs text-neutral-400">
            Mathematics — Rotation, Scaling & Basis Vector Transformation
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-400">
          Transform Matrix: [[cos 45°, -sin 45°], [sin 45°, cos 45°]] | Vector (1, 0) -&gt; (0.707,
          0.707)
        </div>
      </CardContent>
    </Card>
  );
}
