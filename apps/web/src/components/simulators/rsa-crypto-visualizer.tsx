'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Key, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

export function RsaCryptoVisualizer() {
  const [p] = useState<number>(61);
  const [q] = useState<number>(53);
  const [plainMsg, setPlainMsg] = useState<number>(65); // ASCII 'A'
  const [cipherMsg, setCipherMsg] = useState<number>(2790);

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              RSA Cryptography & PKI Key Visualizer
            </h3>
            <p className="text-xs text-neutral-400">
              Cybersecurity — Asymmetric Key Generation & Modulo Exponentiation
            </p>
          </div>
        </div>

        {/* Keys Panel */}
        <div className="grid grid-cols-1 gap-3 font-mono text-xs md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Primes (p, q)</div>
            <div className="mt-1 text-sm font-bold text-white">
              p={p}, q={q}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Modulus n (p × q)</div>
            <div className="text-primary-300 mt-1 text-sm font-bold">n = 3233</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="text-neutral-500">Public Key (e, n)</div>
            <div className="mt-1 text-sm font-bold text-emerald-400">(17, 3233)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
