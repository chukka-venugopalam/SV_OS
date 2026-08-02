'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Play, RotateCcw, SkipForward } from 'lucide-react';
import { useState } from 'react';

export function TuringMachineVisualizer() {
  const [tape, setTape] = useState<string[]>(['1', '1', '0', '1', 'B', 'B', 'B']);
  const [headPos, setHeadPos] = useState<number>(0);
  const [state, setState] = useState<string>('q0');
  const [log, setLog] = useState<string>('Turing machine initialized in state q0 at Tape[0].');

  const handleStep = () => {
    if (state === 'q0' && tape[headPos] === '1') {
      const nextTape = [...tape];
      nextTape[headPos] = '0';
      setTape(nextTape);
      setHeadPos(headPos + 1);
      setState('q1');
      setLog('State q0 -> q1: Read 1, wrote 0, moved Right.');
    } else if (state === 'q1' && tape[headPos] === '1') {
      setHeadPos(headPos + 1);
      setLog('State q1 -> q1: Read 1, wrote 1, moved Right.');
    } else if (state === 'q1' && tape[headPos] === '0') {
      setHeadPos(headPos + 1);
      setState('q2');
      setLog('State q1 -> q2: Read 0, wrote 0, moved Right.');
    } else {
      setState('qAccept');
      setLog('State q2 -> qAccept: Halt & Accept! Transition completed.');
    }
  };

  const handleReset = () => {
    setTape(['1', '1', '0', '1', 'B', 'B', 'B']);
    setHeadPos(0);
    setState('q0');
    setLog('Turing machine reset to initial state q0.');
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">Turing Machine Simulator</h3>
            <p className="text-xs text-neutral-400">
              Theory of Computation — Tape Transition & State Automaton
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="gap-1 text-xs text-black dark:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button
              size="sm"
              onClick={handleStep}
              disabled={state === 'qAccept'}
              className="gap-1 text-xs"
            >
              <SkipForward className="h-3.5 w-3.5" /> Step Tape
            </Button>
          </div>
        </div>

        {/* Tape Display */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400">
            Infinite Tape (Head at Index {headPos}):
          </div>
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-2">
            {tape.map((char, idx) => (
              <div
                key={idx}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-all ${
                  idx === headPos
                    ? 'border-primary-500 bg-primary-500/20 text-primary-300 scale-105 shadow-lg'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                }`}
              >
                {char}
              </div>
            ))}
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div>
            Current State:{' '}
            <span className="rounded border border-emerald-800 bg-emerald-950 px-2 py-1 font-bold text-emerald-400">
              {state}
            </span>
          </div>
          <div>
            Head Position: <span className="text-primary-400 font-bold">Index {headPos}</span>
          </div>
        </div>

        {/* Execution Log */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
          {log}
        </div>
      </CardContent>
    </Card>
  );
}
