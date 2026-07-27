'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@sv-os/ui';
import { Zap, Power } from 'lucide-react';
import { useState } from 'react';

type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR';

export function LogicCircuitSimulator() {
  const [inputA, setInputA] = useState<boolean>(true);
  const [inputB, setInputB] = useState<boolean>(false);
  const [gate, setGate] = useState<GateType>('AND');

  const computeOutput = (a: boolean, b: boolean, g: GateType): boolean => {
    switch (g) {
      case 'AND':
        return a && b;
      case 'OR':
        return a || b;
      case 'NOT':
        return !a;
      case 'XOR':
        return a !== b;
      case 'NAND':
        return !(a && b);
      case 'NOR':
        return !(a || b);
      default:
        return false;
    }
  };

  const output = computeOutput(inputA, inputB, gate);

  const truthTableRows: Array<{ a: boolean; b: boolean; out: boolean }> = [
    { a: false, b: false, out: computeOutput(false, false, gate) },
    { a: false, b: true, out: computeOutput(false, true, gate) },
    { a: true, b: false, out: computeOutput(true, false, gate) },
    { a: true, b: true, out: computeOutput(true, true, gate) },
  ];

  return (
    <Card className="border-purple-200 bg-white/90 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              ⚡ Interactive Simulator: Logic Circuit Simulator
            </CardTitle>
            <Badge variant="secondary" size="sm">
              Digital Logic & Circuits
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {(['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'] as GateType[]).map((g) => (
              <Button
                key={g}
                variant={gate === g ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGate(g)}
                className="h-7 text-xs"
              >
                {g}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Circuit Interactive Diagram */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-50 p-6 dark:bg-neutral-950">
            <div className="flex items-center gap-6">
              {/* Inputs */}
              <div className="flex flex-col gap-4">
                <Button
                  variant={inputA ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputA(!inputA)}
                  className="gap-2 font-mono"
                >
                  <Power
                    className={`h-4 w-4 ${inputA ? 'text-success-400' : 'text-neutral-400'}`}
                  />
                  Input A: {inputA ? '1 (HIGH)' : '0 (LOW)'}
                </Button>
                {gate !== 'NOT' && (
                  <Button
                    variant={inputB ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputB(!inputB)}
                    className="gap-2 font-mono"
                  >
                    <Power
                      className={`h-4 w-4 ${inputB ? 'text-success-400' : 'text-neutral-400'}`}
                    />
                    Input B: {inputB ? '1 (HIGH)' : '0 (LOW)'}
                  </Button>
                )}
              </div>

              {/* Gate Node */}
              <div className="border-primary-500 flex h-16 w-20 items-center justify-center rounded-xl border-2 bg-white font-mono text-base font-bold shadow-md dark:bg-neutral-900">
                {gate}
              </div>

              {/* Output Light */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                    output
                      ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/50'
                      : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800'
                  }`}
                >
                  <Zap className={`h-7 w-7 ${output ? 'animate-pulse' : ''}`} />
                </div>
                <span className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {output ? 'OUTPUT: 1' : 'OUTPUT: 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Truth Table */}
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
              Live Truth Table — {gate} Gate
            </h4>
            <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-neutral-100 dark:bg-neutral-800">
                  <tr>
                    <th className="p-2">A</th>
                    {gate !== 'NOT' && <th className="p-2">B</th>}
                    <th className="p-2">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {truthTableRows
                    .filter((row, idx) => gate !== 'NOT' || idx % 2 === 0)
                    .map((row, idx) => {
                      const isActive = row.a === inputA && (gate === 'NOT' || row.b === inputB);
                      return (
                        <tr
                          key={idx}
                          className={`border-t border-neutral-100 transition-colors dark:border-neutral-800 ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 font-bold'
                              : ''
                          }`}
                        >
                          <td className="p-2">{row.a ? '1' : '0'}</td>
                          {gate !== 'NOT' && <td className="p-2">{row.b ? '1' : '0'}</td>}
                          <td className="p-2">{row.out ? '1' : '0'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
