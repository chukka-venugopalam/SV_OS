'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Search, Zap } from 'lucide-react';
import { useState } from 'react';

export function CacheMappingVisualizer() {
  const [addr, setAddr] = useState<string>('0x1F4C');
  const [cacheResult, setCacheResult] = useState<{
    tag: string;
    set: number;
    offset: number;
    hit: boolean;
  }>({
    tag: '0x1F',
    set: 4,
    offset: 12,
    hit: true,
  });

  const handleLookup = () => {
    const isHit = Math.random() > 0.3;
    const setIdx = Math.floor(Math.random() * 8);
    setCacheResult({
      tag:
        '0x' +
        Math.floor(Math.random() * 256)
          .toString(16)
          .toUpperCase(),
      set: setIdx,
      offset: Math.floor(Math.random() * 16),
      hit: isHit,
    });
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Cache Memory Mapping & Hit/Miss Simulator
            </h3>
            <p className="text-xs text-neutral-400">
              Computer Architecture — Direct Mapped & Set-Associative Cache
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 font-mono text-xs text-white"
              placeholder="0xADDR"
            />
            <Button size="sm" onClick={handleLookup} className="gap-1 text-xs">
              <Search className="h-3.5 w-3.5" /> Lookup Address
            </Button>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="grid grid-cols-1 gap-3 text-center font-mono text-xs md:grid-cols-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Address Bits</div>
            <div className="mt-1 text-sm font-bold text-white">{addr}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Tag Field</div>
            <div className="text-primary-300 mt-1 text-sm font-bold">{cacheResult.tag}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Set Index</div>
            <div className="mt-1 text-sm font-bold text-amber-300">Set #{cacheResult.set}</div>
          </div>
          <div
            className={`flex items-center justify-center rounded-xl border p-3 text-sm font-bold ${
              cacheResult.hit
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                : 'border-rose-500/40 bg-rose-500/20 text-rose-400'
            }`}
          >
            {cacheResult.hit ? 'CACHE HIT (L1)' : 'CACHE MISS (RAM Fetch)'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
