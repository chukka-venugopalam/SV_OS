'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@sv-os/ui';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const INITIAL_ARRAY = [45, 12, 88, 32, 67, 21, 95, 54, 10, 76, 43, 60];

export function SortingVisualizer() {
  const [array, setArray] = useState<number[]>([...INITIAL_ARRAY]);
  const [comparing, setComparing] = useState<[number, number] | null>(null);
  const [swapping, setSwapping] = useState<[number, number] | null>(null);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(300);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateNewArray = () => {
    setIsRunning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newArr = Array.from({ length: 12 }, () => Math.floor(Math.random() * 85) + 15);
    setArray(newArr);
    setComparing(null);
    setSwapping(null);
    setSortedIndices([]);
  };

  const resetArray = () => {
    setIsRunning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setArray([...INITIAL_ARRAY]);
    setComparing(null);
    setSwapping(null);
    setSortedIndices([]);
  };

  // Simple step-by-step bubble sort runner
  useEffect(() => {
    if (!isRunning) return;

    let currentArr = [...array];
    let i = 0;
    let j = 0;
    let sorted: number[] = [];

    const step = () => {
      if (i >= currentArr.length - 1) {
        setSortedIndices(currentArr.map((_, idx) => idx));
        setComparing(null);
        setSwapping(null);
        setIsRunning(false);
        return;
      }

      if (j < currentArr.length - i - 1) {
        setComparing([j, j + 1]);
        const valA = currentArr[j];
        const valB = currentArr[j + 1];
        if (valA !== undefined && valB !== undefined && valA > valB) {
          setSwapping([j, j + 1]);
          currentArr[j] = valB;
          currentArr[j + 1] = valA;
          setArray([...currentArr]);
        } else {
          setSwapping(null);
        }
        j++;
      } else {
        sorted.push(currentArr.length - i - 1);
        setSortedIndices([...sorted]);
        j = 0;
        i++;
      }

      timeoutRef.current = setTimeout(step, speed);
    };

    step();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isRunning, speed]);

  return (
    <Card className="border-primary-200 bg-white/90 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              ⚡ Interactive Simulator: Sorting Visualizer
            </CardTitle>
            <Badge variant="secondary" size="sm">
              Recursion & Divide-and-Conquer
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {/* Bars Display */}
        <div className="mb-6 flex h-48 items-end justify-center gap-2 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
          {array.map((val, idx) => {
            const isComp = comparing?.includes(idx);
            const isSwap = swapping?.includes(idx);
            const isSorted = sortedIndices.includes(idx);

            let barColor = 'bg-primary-500';
            if (isSwap) barColor = 'bg-pink-500 animate-pulse';
            else if (isComp) barColor = 'bg-warning-500';
            else if (isSorted) barColor = 'bg-success-500';

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-neutral-500">{val}</span>
                <div
                  className={`w-full rounded-t-md transition-all duration-150 ${barColor}`}
                  style={{ height: `${val * 1.8}px` }}
                />
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isRunning ? 'secondary' : 'default'}
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
              className="gap-1.5"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Pause' : 'Start Sorting'}
            </Button>
            <Button variant="outline" size="sm" onClick={resetArray} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={generateNewArray} className="gap-1.5">
              <SkipForward className="h-4 w-4" /> Randomize
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">Speed:</span>
            <input
              type="range"
              min={100}
              max={600}
              step={50}
              value={700 - speed}
              onChange={(e) => setSpeed(700 - Number(e.target.value))}
              className="accent-primary-600 h-1.5 w-24 cursor-pointer"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
