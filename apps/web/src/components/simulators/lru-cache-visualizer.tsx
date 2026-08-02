'use client';

import { Card, CardContent } from '@sv-os/ui';

export function LruCacheVisualizer() {
  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-primary-400 text-lg font-bold">LRU & LFU Cache Eviction Simulator</h3>
          <p className="text-xs text-neutral-400">
            Data Engineering / OS — Doubly Linked List & Hash Map Eviction Policy
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-400">
          Cache Capacity: 4 | Active Keys: [Key_C (MRU), Key_A, Key_B, Key_D (LRU)]
        </div>
      </CardContent>
    </Card>
  );
}
