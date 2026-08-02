'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Cpu } from 'lucide-react';
import { useState } from 'react';

export function AluBitwiseVisualizer() {
  const [opA, setOpA] = useState<number>(5); // 0101
  const [opB, setOpB] = useState<number>(3); // 0011
  const [operation, setOperation] = useState<string>('ADD');

  const compute = () => {
    switch (operation) {
      case 'ADD':
        return opA + opB;
      case 'AND':
        return opA & opB;
      case 'OR':
        return opA | opB;
      case 'XOR':
        return opA ^ opB;
      default:
        return opA + opB;
    }
  };

  const result = compute();

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">ALU Bitwise & Adders Simulator</h3>
            <p className="text-xs text-neutral-400">
              Digital Logic — 4-Bit Arithmetic Logic Unit Operations
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {['ADD', 'AND', 'OR', 'XOR'].map((o) => (
              <Button
                key={o}
                size="sm"
                variant={operation === o ? 'default' : 'outline'}
                onClick={() => setOperation(o)}
                className="text-xs"
              >
                {o}
              </Button>
            ))}
          </div>
        </div>

        {/* Binary Register Display */}
        <div className="grid grid-cols-1 gap-4 text-center font-mono md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-xs text-neutral-400">Input A: {opA}</div>
            <div className="text-primary-300 mt-1 text-lg font-bold">
              {opA.toString(2).padStart(4, '0')}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-xs text-neutral-400">Input B: {opB}</div>
            <div className="mt-1 text-lg font-bold text-amber-300">
              {opB.toString(2).padStart(4, '0')}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
            <div className="text-xs text-emerald-400">ALU Output: {result}</div>
            <div className="mt-1 text-lg font-bold text-emerald-300">
              {result.toString(2).padStart(4, '0')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
