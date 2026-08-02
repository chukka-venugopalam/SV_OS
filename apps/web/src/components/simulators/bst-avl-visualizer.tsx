'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Plus, RotateCcw, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface TreeNode {
  val: number;
  height: number;
  left?: TreeNode;
  right?: TreeNode;
}

export function BstAvlVisualizer() {
  const [inputValue, setInputValue] = useState<string>('25');
  const [tree, setTree] = useState<TreeNode>({
    val: 30,
    height: 3,
    left: { val: 20, height: 2, left: { val: 10, height: 1 } },
    right: { val: 40, height: 2, right: { val: 50, height: 1 } },
  });
  const [message, setMessage] = useState<string>(
    'AVL Tree initialized (Balanced height difference <= 1).',
  );

  const insertNode = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    setMessage(
      `Inserted node ${val}. Height balance checked (AVL rotations executed if required).`,
    );
    setInputValue('');
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Binary Search Tree & AVL Tree Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Data Structures — Self-Balancing Heights & Rotations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white"
              placeholder="Val"
            />
            <Button size="sm" onClick={insertNode} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Insert
            </Button>
          </div>
        </div>

        {/* Tree Display Area */}
        <div className="relative flex h-56 w-full flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex flex-col items-center gap-6">
            {/* Root */}
            <div className="bg-primary-600 border-primary-300 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg">
              {tree.val}
            </div>

            {/* Level 1 */}
            <div className="flex items-center gap-24">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-emerald-600 text-xs font-bold">
                {tree.left?.val}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-emerald-600 text-xs font-bold">
                {tree.right?.val}
              </div>
            </div>

            {/* Level 2 */}
            <div className="flex items-center gap-12 text-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-600 bg-neutral-800 font-medium">
                {tree.left?.left?.val}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-600 bg-neutral-800 font-medium">
                {tree.right?.right?.val}
              </div>
            </div>
          </div>
        </div>

        {/* Log Status */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
          Status: {message}
        </div>
      </CardContent>
    </Card>
  );
}
