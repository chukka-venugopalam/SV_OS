'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Database, Search, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

export function BTreeVisualizer() {
  const [searchKey, setSearchKey] = useState<number>(45);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);

  const performSearch = () => {
    setCurrentLevel(1);
    setTimeout(() => setCurrentLevel(2), 600);
    setTimeout(() => setCurrentLevel(3), 1200);
  };

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-neutral-100">B+ Tree Index Search Simulator</h3>
          <Badge variant="outline" className="border-amber-500/50 text-amber-400">
            Databases
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentLevel(null)}
          className="gap-2 border-neutral-700"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Control Search Key */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400">Target Key:</span>
        {[15, 45, 70].map((k) => (
          <Button
            key={k}
            size="sm"
            variant={searchKey === k ? 'default' : 'outline'}
            onClick={() => {
              setSearchKey(k);
              setCurrentLevel(null);
            }}
          >
            Key {k}
          </Button>
        ))}
        <Button size="sm" onClick={performSearch} className="gap-2 bg-amber-600 hover:bg-amber-500">
          <Search className="h-4 w-4" /> Search Tree
        </Button>
      </div>

      {/* Tree Visualization */}
      <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-center">
        {/* Level 1: Root */}
        <div
          className={`mx-auto w-48 rounded-lg border p-3 transition-all ${currentLevel === 1 ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/50' : 'border-neutral-800 bg-neutral-900'}`}
        >
          <div className="text-[10px] font-bold text-neutral-400">Root Node</div>
          <div className="font-mono text-sm font-bold text-amber-300">[ 30 | 60 ]</div>
        </div>

        <div className="text-xs text-neutral-600">↓ Pointer Branching</div>

        {/* Level 2: Internal */}
        <div className="flex justify-center gap-4">
          {[
            { keys: '[ 10 | 20 ]', active: searchKey < 30 },
            { keys: '[ 40 | 50 ]', active: searchKey >= 30 && searchKey < 60 },
            { keys: '[ 70 | 80 ]', active: searchKey >= 60 },
          ].map((node, idx) => (
            <div
              key={idx}
              className={`w-36 rounded-lg border p-2.5 transition-all ${currentLevel === 2 && node.active ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/50' : 'border-neutral-800 bg-neutral-900'}`}
            >
              <div className="text-[10px] text-neutral-400">Internal {idx + 1}</div>
              <div className="font-mono text-xs font-bold text-amber-200">{node.keys}</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-neutral-600">↓ Block Disk I/O</div>

        {/* Level 3: Leaf Data Blocks */}
        <div
          className={`mx-auto rounded-lg border p-3 transition-all ${currentLevel === 3 ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/50' : 'border-neutral-800 bg-neutral-900'}`}
        >
          <div className="text-xs font-bold text-emerald-400">
            {currentLevel === 3
              ? `Found Key ${searchKey} in Data Page Block! O(log N) IOs = 3`
              : 'Leaf Data Block Page'}
          </div>
        </div>
      </div>
    </Card>
  );
}
