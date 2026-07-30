'use client';

import { Card, Button, Badge } from '@sv-os/ui';
import { Play, RotateCcw, Code } from 'lucide-react';
import React, { useState } from 'react';

export function LexerVisualizer() {
  const [tokenIndex, setTokenIndex] = useState(0);

  const tokens = [
    { type: 'KEYWORD', val: 'let', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { type: 'IDENTIFIER', val: 'x', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { type: 'OPERATOR', val: '=', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    {
      type: 'INT_LITERAL',
      val: '42',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      type: 'SEMICOLON',
      val: ';',
      color: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40',
    },
  ];

  return (
    <Card className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-neutral-100 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-teal-400" />
          <h3 className="text-lg font-bold text-neutral-100">Compiler Lexical Analyzer (Lexer)</h3>
          <Badge variant="outline" className="border-teal-500/50 text-teal-400">
            Compilers
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTokenIndex(0)}
          className="gap-2 border-neutral-700"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Code Input String */}
      <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-sm">
        <span className="text-neutral-500">// Source Code String:</span>
        <div className="mt-1 font-bold text-teal-300">let x = 42;</div>
      </div>

      {/* Step Control */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          size="sm"
          disabled={tokenIndex >= tokens.length}
          onClick={() => setTokenIndex((i) => i + 1)}
          className="gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
        >
          <Play className="h-4 w-4" /> Scan Next Token ({tokenIndex}/{tokens.length})
        </Button>
      </div>

      {/* Output Tokens */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Token Stream Output
        </h4>
        <div className="flex flex-wrap gap-2">
          {tokenIndex === 0 ? (
            <span className="text-xs text-neutral-500">
              Click Scan Next Token to produce compiler tokens...
            </span>
          ) : (
            tokens.slice(0, tokenIndex).map((tok, idx) => (
              <div
                key={idx}
                className={`rounded border px-3 py-1 font-mono text-xs font-bold ${tok.color}`}
              >
                {tok.type}('{tok.val}')
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
