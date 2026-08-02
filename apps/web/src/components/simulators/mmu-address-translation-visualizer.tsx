'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Cpu, Search } from 'lucide-react';
import { useState } from 'react';

export function MmuAddressTranslationVisualizer() {
  const [virtAddr] = useState<string>('0x1234');
  const [pageNum] = useState<number>(1);
  const [offset] = useState<number>(0x234);
  const [frameNum] = useState<number>(7);

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              MMU Page Table Address Translation Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Operating Systems — Logical Virtual Address to Physical RAM Mapping
            </p>
          </div>
        </div>

        {/* Translation Card */}
        <div className="grid grid-cols-1 gap-3 text-center font-mono text-xs md:grid-cols-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Virtual Address</div>
            <div className="mt-1 text-sm font-bold text-white">{virtAddr}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Page Number</div>
            <div className="text-primary-300 mt-1 text-sm font-bold">Page #{pageNum}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Offset</div>
            <div className="mt-1 text-sm font-bold text-amber-300">
              0x{offset.toString(16).toUpperCase()}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3 text-emerald-400">
            <div className="text-neutral-400">Physical Address</div>
            <div className="mt-1 text-sm font-bold text-emerald-300">
              Frame #{frameNum} + Offset
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
