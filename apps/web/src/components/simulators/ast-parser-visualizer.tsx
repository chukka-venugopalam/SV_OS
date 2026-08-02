'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Play, RotateCcw, Code } from 'lucide-react';
import { useState } from 'react';

export function AstParserVisualizer() {
  const [expr, setExpr] = useState<string>('a + b * c');
  const [tokens, setTokens] = useState<string[]>([
    'IDENT(a)',
    'PLUS',
    'IDENT(b)',
    'MUL',
    'IDENT(c)',
  ]);
  const [astTree, setAstTree] = useState<string>(`BinaryExpr (+)
├── Identifier (a)
└── BinaryExpr (*)
    ├── Identifier (b)
    └── Identifier (c)`);

  const handleParse = () => {
    setTokens(
      expr
        .split(/\s+/)
        .map((tok) => (tok === '+' ? 'PLUS' : tok === '*' ? 'MUL' : `IDENT(${tok})`)),
    );
    setAstTree(`BinaryExpr (${expr.includes('+') ? '+' : '*'})
├── Identifier (${expr.split(/\s+/)[0] || 'x'})
└── BinaryExpr (${expr.includes('*') ? '*' : '+'})
    ├── Identifier (${expr.split(/\s+/)[2] || 'y'})
    └── Identifier (${expr.split(/\s+/)[4] || 'z'})`);
  };

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">Recursive Descent AST Parser</h3>
            <p className="text-xs text-neutral-400">
              Compiler Design — Syntax Analysis & Abstract Syntax Tree
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              className="w-36 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white"
              placeholder="Expression"
            />
            <Button size="sm" onClick={handleParse} className="gap-1 text-xs">
              <Code className="h-3.5 w-3.5" /> Parse AST
            </Button>
          </div>
        </div>

        {/* Tokens & AST Display */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-400">Lexer Token Stream:</div>
            <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              {tokens.map((t, i) => (
                <span
                  key={i}
                  className="bg-primary-500/20 text-primary-300 border-primary-500/30 rounded border px-2 py-1 font-mono text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-400">
              Abstract Syntax Tree (AST):
            </div>
            <pre className="whitespace-pre rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-emerald-400">
              {astTree}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
