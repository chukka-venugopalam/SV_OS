'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Binary, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

export function TruthTableVisualizer() {
  const [op, setOp] = useState<'AND' | 'OR' | 'IMPLIES'>('IMPLIES');

  const rows = [
    { p: true, q: true, AND: true, OR: true, IMPLIES: true },
    { p: true, q: false, AND: false, OR: true, IMPLIES: false },
    { p: false, q: true, AND: false, OR: true, IMPLIES: true },
    { p: false, q: false, AND: false, OR: false, IMPLIES: true },
  ];

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Binary className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-neutral-100">
            Propositional Logic Truth Table Simulator
          </h3>
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
            Mathematics
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOp('IMPLIES')}
          className="gap-2 border-neutral-700"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Operator Select */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400">Logical Operation:</span>
        {(['AND', 'OR', 'IMPLIES'] as const).map((o) => (
          <Button
            key={o}
            size="sm"
            variant={op === o ? 'default' : 'outline'}
            onClick={() => setOp(o)}
          >
            {o === 'IMPLIES' ? 'P → Q (Implies)' : o === 'AND' ? 'P ∧ Q (AND)' : 'P ∨ Q (OR)'}
          </Button>
        ))}
      </div>

      {/* Truth Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
        <table className="w-full text-center text-xs">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="py-2.5">P</th>
              <th className="py-2.5">Q</th>
              <th className="py-2.5 font-bold text-cyan-400">
                {op === 'IMPLIES' ? 'P → Q' : op === 'AND' ? 'P ∧ Q' : 'P ∨ Q'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 font-mono">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-900/50">
                <td className="py-2">{row.p ? 'T' : 'F'}</td>
                <td className="py-2">{row.q ? 'T' : 'F'}</td>
                <td className={`py-2 font-bold ${row[op] ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {row[op] ? 'T' : 'F'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
