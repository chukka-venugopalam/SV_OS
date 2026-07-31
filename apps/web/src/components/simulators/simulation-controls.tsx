'use client';

import { Button } from '@sv-os/ui';
import { Play, Pause, RotateCcw, SkipForward, FastForward } from 'lucide-react';
import React from 'react';

interface SimulationControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function SimulationControls({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onTogglePlay,
  onStepForward,
  onReset,
  onSpeedChange,
}: SimulationControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      {/* Playback Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onTogglePlay}
          className={`gap-2 ${isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Run Simulation
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={isPlaying || currentStep >= totalSteps}
          onClick={onStepForward}
          className="gap-2 border-neutral-700 text-neutral-300"
        >
          <SkipForward className="h-4 w-4" /> Step ({currentStep}/{totalSteps})
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="gap-2 border-neutral-700 text-neutral-300"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <FastForward className="h-4 w-4 text-neutral-400" />
        <span>Speed:</span>
        {[
          { label: '0.5x', value: 800 },
          { label: '1x', value: 500 },
          { label: '2x', value: 200 },
        ].map((spd) => (
          <Button
            key={spd.label}
            size="sm"
            variant={speed === spd.value ? 'default' : 'ghost'}
            onClick={() => onSpeedChange(spd.value)}
            className="h-7 px-2 text-xs"
          >
            {spd.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
