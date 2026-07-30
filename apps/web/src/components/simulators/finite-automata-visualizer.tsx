'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Play, RotateCcw, CircuitBoard } from 'lucide-react';
import React, { useState } from 'react';

export function FiniteAutomataVisualizer() {
  const [inputStr, setInputStr] = useState('101');
  const [currentState, setCurrentState] = useState<'q0' | 'q1' | 'q2'>('q0');
  const [stepIndex, setStepIndex] = useState(0);

  const reset = () => {
    setCurrentState('q0');
    setStepIndex(0);
  };

  const stepDFA = () => {
    if (stepIndex >= inputStr.length) return;
    const symbol = inputStr[stepIndex];

    setCurrentState((prev) => {
      if (prev === 'q0') return symbol === '1' ? 'q1' : 'q0';
      if (prev === 'q1') return symbol === '0' ? 'q2' : 'q1';
      if (prev === 'q2') return symbol === '1' ? 'q1' : 'q0';
      return prev;
    });

    setStepIndex((i) => i + 1);
  };

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircuitBoard className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-neutral-100">
            Deterministic Finite Automaton (DFA)
          </h3>
          <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
            Theory of Computation
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={reset} className="gap-2 border-neutral-700">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Inputs */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400">Tape Input:</span>
        {['101', '110', '001'].map((str) => (
          <Button
            key={str}
            size="sm"
            variant={inputStr === str ? 'default' : 'outline'}
            onClick={() => {
              setInputStr(str);
              reset();
            }}
          >
            "{str}"
          </Button>
        ))}
        <Button
          size="sm"
          onClick={stepDFA}
          disabled={stepIndex >= inputStr.length}
          className="gap-2 bg-indigo-600 hover:bg-indigo-500"
        >
          <Play className="h-4 w-4" /> Step Transition ({stepIndex}/{inputStr.length})
        </Button>
      </div>

      {/* DFA States */}
      <div className="mb-6 flex justify-center gap-6 text-center">
        {[
          { id: 'q0', label: 'q0 (Start)', isAccept: false },
          { id: 'q1', label: 'q1 (Saw 1)', isAccept: false },
          { id: 'q2', label: 'q2 (Saw 10)', isAccept: true },
        ].map((st) => (
          <div
            key={st.id}
            className={`flex h-20 w-24 flex-col items-center justify-center rounded-full border-2 transition-all ${
              currentState === st.id
                ? 'border-indigo-400 bg-indigo-950/80 shadow-lg shadow-indigo-500/30'
                : 'border-neutral-800 bg-neutral-950'
            } ${st.isAccept ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-neutral-900' : ''}`}
          >
            <span className="text-xs font-bold text-neutral-200">{st.label}</span>
            {st.isAccept && <span className="text-[10px] text-indigo-400">Accept State</span>}
          </div>
        ))}
      </div>

      {/* Result Status */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-center text-xs">
        {stepIndex >= inputStr.length ? (
          currentState === 'q2' ? (
            <span className="font-bold text-emerald-400">String Accepted by DFA!</span>
          ) : (
            <span className="font-bold text-amber-400">
              String Finished in non-accept state ({currentState}).
            </span>
          )
        ) : (
          <span className="text-neutral-400">
            Current Tape Head: index {stepIndex} ('{inputStr[stepIndex]}')
          </span>
        )}
      </div>
    </Card>
  );
}
