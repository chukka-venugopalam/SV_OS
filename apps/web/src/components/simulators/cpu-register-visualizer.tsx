'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Play, RotateCcw, Cpu } from 'lucide-react';
import React, { useState } from 'react';

export function CpuRegisterVisualizer() {
  const [phase, setPhase] = useState<number>(0);

  const phases = [
    {
      title: 'FETCH',
      text: 'Fetch instruction at Program Counter (PC=0x04) into Instruction Register (IR).',
      pc: '0x04',
      ir: 'ADD R1, R2',
      acc: '0',
    },
    {
      title: 'DECODE',
      text: 'Control Unit decodes IR opcode: ADD operation on registers R1 (12) and R2 (8).',
      pc: '0x05',
      ir: 'ADD R1, R2',
      acc: '0',
    },
    {
      title: 'EXECUTE',
      text: 'ALU performs 12 + 8. Result 20 stored in Accumulator (ACC).',
      pc: '0x05',
      ir: 'ADD R1, R2',
      acc: '20',
    },
  ];

  const curr = phases[phase % phases.length]!;

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-rose-400" />
          <h3 className="text-lg font-bold text-neutral-100">
            CPU Fetch-Decode-Execute Register Cycle
          </h3>
          <Badge variant="outline" className="border-rose-500/50 text-rose-400">
            Architecture
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPhase(0)}
          className="gap-2 border-neutral-700"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Control Step */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => setPhase((p) => (p + 1) % 3)}
          className="gap-2 bg-rose-600 hover:bg-rose-500"
        >
          <Play className="h-4 w-4" /> Step Phase:{' '}
          <strong className="uppercase">{curr.title}</strong>
        </Button>
        <span className="text-xs text-neutral-400">Cycle Phase: {phase + 1} / 3</span>
      </div>

      {/* Registers Grid */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[10px] text-neutral-400">Program Counter (PC)</div>
          <div className="font-mono text-sm font-bold text-rose-300">{curr.pc}</div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[10px] text-neutral-400">Instruction Register (IR)</div>
          <div className="font-mono text-sm font-bold text-rose-300">{curr.ir}</div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[10px] text-neutral-400">Accumulator (ACC)</div>
          <div className="font-mono text-sm font-bold text-emerald-400">{curr.acc}</div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
        <div className="font-bold text-rose-400">{curr.title} Phase</div>
        <div className="mt-1 text-neutral-300">{curr.text}</div>
      </div>
    </Card>
  );
}
