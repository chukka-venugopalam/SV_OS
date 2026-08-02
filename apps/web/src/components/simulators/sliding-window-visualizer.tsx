'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function SlidingWindowVisualizer() {
  const [windowSize] = useState<number>(4);
  const [sendBase, setSendBase] = useState<number>(0);
  const [nextSeq, setNextSeq] = useState<number>(3);
  const [log, setLog] = useState<string>(
    'Go-Back-N Window size N=4. Sent frames 0, 1, 2. Awaiting ACK 0.',
  );

  const handleSend = () => {
    if (nextSeq < sendBase + windowSize) {
      setNextSeq(nextSeq + 1);
      setLog(`Sent Frame #${nextSeq}. Window span [${sendBase} .. ${sendBase + windowSize - 1}].`);
    }
  };

  const handleAck = () => {
    setSendBase(sendBase + 1);
    setLog(`Received ACK #${sendBase}. Sliding window base advanced to #${sendBase + 1}.`);
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Sliding Window Protocol Simulator
            </h3>
            <p className="text-xs text-neutral-400">
              Computer Networks — Go-Back-N / Selective Repeat Flow Control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSend} className="gap-1 text-xs">
              <ArrowRight className="h-3.5 w-3.5" /> Send Frame
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAck}
              className="gap-1 text-xs text-black dark:text-white"
            >
              Recv ACK
            </Button>
          </div>
        </div>

        {/* Frames Sequence */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400">
            Sender Sequence Space (Window N=4):
          </div>
          <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((seq) => {
              const inWindow = seq >= sendBase && seq < sendBase + windowSize;
              const isAcked = seq < sendBase;
              return (
                <div
                  key={seq}
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition-all ${
                    inWindow
                      ? 'border-primary-500 bg-primary-500/20 text-primary-300 shadow-md'
                      : isAcked
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500'
                  }`}
                >
                  #{seq}
                </div>
              );
            })}
          </div>
        </div>

        {/* Log */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
          {log}
        </div>
      </CardContent>
    </Card>
  );
}
