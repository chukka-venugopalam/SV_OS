'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Play, RotateCcw, Cpu } from 'lucide-react';
import React, { useState } from 'react';

interface Process {
  id: string;
  name: string;
  burstTime: number;
  remainingTime: number;
  color: string;
}

const INITIAL_PROCESSES: Process[] = [
  { id: 'p1', name: 'P1 (Kernel Task)', burstTime: 5, remainingTime: 5, color: 'bg-blue-500' },
  { id: 'p2', name: 'P2 (Web Server)', burstTime: 3, remainingTime: 3, color: 'bg-emerald-500' },
  { id: 'p3', name: 'P3 (DB Query)', burstTime: 4, remainingTime: 4, color: 'bg-purple-500' },
  { id: 'p4', name: 'P4 (UI Thread)', burstTime: 2, remainingTime: 2, color: 'bg-amber-500' },
];

export function CpuSchedulerVisualizer() {
  const [algorithm, setAlgorithm] = useState<'fcfs' | 'rr'>('fcfs');
  const [processes, setProcesses] = useState<Process[]>(INITIAL_PROCESSES);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<{ time: number; processName: string; color: string }[]>(
    [],
  );

  const reset = () => {
    setProcesses(INITIAL_PROCESSES.map((p) => ({ ...p })));
    setCurrentTime(0);
    setActiveProcess(null);
    setTimeline([]);
  };

  const stepSimulation = () => {
    setProcesses((prevProcesses) => {
      const active = prevProcesses.find((p) => p.remainingTime > 0);
      if (!active) {
        setActiveProcess(null);
        return prevProcesses;
      }

      setActiveProcess(active.name);
      setTimeline((prev) => [
        ...prev,
        { time: currentTime + 1, processName: active.name, color: active.color },
      ]);

      const updated = prevProcesses.map((p) =>
        p.id === active.id ? { ...p, remainingTime: p.remainingTime - 1 } : p,
      );

      setCurrentTime((t) => t + 1);
      return updated;
    });
  };

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-neutral-100">CPU Process Scheduler Simulator</h3>
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            OS Core
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={algorithm === 'fcfs' ? 'default' : 'outline'}
            onClick={() => {
              setAlgorithm('fcfs');
              reset();
            }}
          >
            FCFS
          </Button>
          <Button
            size="sm"
            variant={algorithm === 'rr' ? 'default' : 'outline'}
            onClick={() => {
              setAlgorithm('rr');
              reset();
            }}
          >
            Round Robin (Q=2)
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          size="sm"
          onClick={stepSimulation}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500"
        >
          <Play className="h-4 w-4" /> Step Cycle ({currentTime}ms)
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          className="gap-2 border-neutral-700 text-neutral-300"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
        {activeProcess && (
          <span className="text-sm font-medium text-emerald-400">
            Running: <strong className="text-white">{activeProcess}</strong>
          </span>
        )}
      </div>

      {/* Ready Queue & Processes */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {processes.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg border p-3 ${
              activeProcess === p.name
                ? 'border-emerald-500 bg-emerald-950/40'
                : 'border-neutral-800 bg-neutral-950/60'
            }`}
          >
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <span>{p.name}</span>
              <span className="text-neutral-400">
                {p.remainingTime}/{p.burstTime} ms
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full ${p.color} transition-all duration-300`}
                style={{ width: `${((p.burstTime - p.remainingTime) / p.burstTime) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gantt Chart Timeline */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          CPU Execution Timeline (Gantt Chart)
        </h4>
        <div className="flex h-10 w-full overflow-x-auto rounded border border-neutral-800 bg-neutral-900 p-1">
          {timeline.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
              Click Step Cycle to begin CPU execution
            </div>
          ) : (
            timeline.map((slot, idx) => (
              <div
                key={idx}
                className={`flex h-full min-w-[28px] items-center justify-center text-[10px] font-bold text-white ${slot.color} border-r border-neutral-950`}
                title={`${slot.processName} at ${slot.time}ms`}
              >
                {slot.time}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
