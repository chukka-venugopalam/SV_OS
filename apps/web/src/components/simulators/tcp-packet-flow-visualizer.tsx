'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Network, Play, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';

export function TcpPacketFlowVisualizer() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '1. SYN (Client -> Server)',
      text: 'Client sends SYN packet with Initial Sequence Number (ISN=100) to initiate connection.',
      dir: 'right',
      state: 'SYN_SENT',
    },
    {
      title: '2. SYN-ACK (Server -> Client)',
      text: 'Server acknowledges SYN with ACK=101 and sends its own SYN (ISN=300).',
      dir: 'left',
      state: 'SYN_RECEIVED',
    },
    {
      title: '3. ACK (Client -> Server)',
      text: 'Client acknowledges Server SYN with ACK=301. Connection Established!',
      dir: 'right',
      state: 'ESTABLISHED',
    },
  ];

  const currentStepInfo = step > 0 && step <= steps.length ? steps[step - 1] : null;

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-sky-400" />
          <h3 className="text-lg font-bold text-neutral-100">TCP 3-Way Handshake Simulator</h3>
          <Badge variant="outline" className="border-sky-500/50 text-sky-400">
            Networks
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStep(0)}
          className="gap-2 border-neutral-700"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        {/* Client */}
        <div className="rounded-lg border border-sky-900/50 bg-sky-950/20 p-4">
          <div className="font-bold text-sky-400">Client Node</div>
          <div className="text-xs text-neutral-400">192.168.1.10</div>
          <Badge className="mt-2" variant={step === 3 ? 'default' : 'secondary'}>
            {step === 0 ? 'CLOSED' : step === 3 ? 'ESTABLISHED' : 'SYN_SENT'}
          </Badge>
        </div>

        {/* Network Channel */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-xs text-neutral-400">Network Transit</div>
          {currentStepInfo && (
            <div className="my-2 flex items-center gap-1 font-mono text-xs text-amber-400">
              {currentStepInfo.dir === 'right' ? (
                <ArrowRight className="h-4 w-4 animate-pulse" />
              ) : (
                <ArrowLeft className="h-4 w-4 animate-pulse" />
              )}
              <span>{currentStepInfo.title.split(' ')[1]}</span>
            </div>
          )}
        </div>

        {/* Server */}
        <div className="rounded-lg border border-purple-900/50 bg-purple-950/20 p-4">
          <div className="font-bold text-purple-400">Server Node</div>
          <div className="text-xs text-neutral-400">10.0.0.1:80</div>
          <Badge className="mt-2" variant={step === 3 ? 'default' : 'secondary'}>
            {step === 0 ? 'LISTEN' : step === 3 ? 'ESTABLISHED' : 'SYN_RECEIVED'}
          </Badge>
        </div>
      </div>

      {/* Step Description */}
      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        {!currentStepInfo ? (
          <div className="text-xs text-neutral-400">
            Click Next Step to begin the 3-Way Handshake simulation.
          </div>
        ) : (
          <div>
            <div className="font-bold text-sky-400">{currentStepInfo.title}</div>
            <div className="mt-1 text-xs text-neutral-300">{currentStepInfo.text}</div>
          </div>
        )}
      </div>

      <Button
        disabled={step >= 3}
        onClick={() => setStep((s) => s + 1)}
        className="w-full gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
      >
        <Play className="h-4 w-4" />{' '}
        {step >= 3 ? 'Handshake Complete' : `Next Step (${step + 1}/3)`}
      </Button>
    </Card>
  );
}
