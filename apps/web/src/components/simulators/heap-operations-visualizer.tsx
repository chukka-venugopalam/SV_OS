'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function HeapOperationsVisualizer() {
  const [heap, setHeap] = useState<number[]>([5, 12, 18, 24, 30, 42, 55]);
  const [inputVal, setInputVal] = useState<string>('8');
  const [log, setLog] = useState<string>('Min-Heap property satisfied: parent <= children.');

  const handleInsert = () => {
    const val = parseInt(inputVal);
    if (isNaN(val)) return;
    const newHeap = [...heap, val];
    // Simple sift-up simulation
    newHeap.sort((a, b) => a - b);
    setHeap(newHeap);
    setLog(`Inserted ${val}. Sifted up to restore Min-Heap invariant.`);
    setInputVal('');
  };

  const handleExtractMin = () => {
    if (heap.length === 0) return;
    const minVal = heap[0];
    const newHeap = heap.slice(1);
    setHeap(newHeap);
    setLog(`Extracted Min value ${minVal}. Sifted down root to restore Min-Heap invariant.`);
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Min/Max Heap Operations Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Data Structures — Array-Backed Complete Binary Tree Heap
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white"
              placeholder="Value"
            />
            <Button size="sm" onClick={handleInsert} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Insert
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExtractMin}
              className="gap-1 text-xs text-black dark:text-white"
            >
              <Minus className="h-3.5 w-3.5" /> Extract Min
            </Button>
          </div>
        </div>

        {/* Array View */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400">
            Underlying Array Representation:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            {heap.map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-neutral-500">[{i}]</span>
                <div className="bg-primary-600 border-primary-400 flex h-10 w-12 items-center justify-center rounded-lg border font-mono text-sm font-bold">
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Log */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
          {log}
        </div>
      </CardContent>
    </Card>
  );
}
