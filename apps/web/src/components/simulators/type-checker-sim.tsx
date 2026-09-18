/**
 * Component: TypeCheckerSim
 * Serves: cd-semantic-analysis-type-checking ("Semantic Analysis & Type Checking")
 *
 * What it demonstrates:
 *   Walking a small program's AST statement by statement, building a symbol table
 *   from declarations, and checking each assignment's right-hand-side expression
 *   type against the declared type of the variable being assigned — flagging a type
 *   mismatch as a compile error with the offending statement highlighted.
 *
 * Design decisions:
 *   - Uses a small fixed program (two declarations, two valid assignments, one
 *     invalid one) so every symbol-table entry and every check's pass/fail reasoning
 *     is fully auditable by the student, rather than a large program where the
 *     interesting error is hard to spot.
 *   - Type checking is genuinely computed from the running symbol table at each step
 *     (declared type looked up, RHS type inferred, compared) rather than the error
 *     being hardcoded onto one specific line, so the same walk-and-check logic would
 *     correctly flag a different mismatch if the program were edited.
 *   - The symbol table is shown building up live, left-to-right through the program,
 *     so "type checking needs to know about a variable's declared type before it can
 *     check an assignment to it" is something the student watches happen in order.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type Type = 'int' | 'string';
type Stmt =
  | { kind: 'decl'; type: Type; name: string }
  | { kind: 'assign'; name: string; exprText: string; exprType: Type };

const PROGRAM: Stmt[] = [
  { kind: 'decl', type: 'int', name: 'x' },
  { kind: 'decl', type: 'string', name: 's' },
  { kind: 'assign', name: 'x', exprText: '5', exprType: 'int' },
  { kind: 'assign', name: 's', exprText: '"hello"', exprType: 'string' },
  { kind: 'assign', name: 'x', exprText: 's', exprType: 'string' }, // mismatch: assigning string to int
];

function stmtText(s: Stmt): string {
  return s.kind === 'decl' ? `${s.type} ${s.name};` : `${s.name} = ${s.exprText};`;
}

export default function TypeCheckerSim() {
  const [step, setStep] = useState(0);
  const symbolTable: Record<string, Type> = {};
  const results: { stmt: Stmt; ok: boolean; note: string }[] = [];

  for (let i = 0; i < step; i++) {
    const s = PROGRAM[i];
    if (s.kind === 'decl') {
      symbolTable[s.name] = s.type;
      results.push({ stmt: s, ok: true, note: `Declared "${s.name}" as ${s.type}.` });
    } else {
      const declaredType = symbolTable[s.name];
      const ok = declaredType === s.exprType;
      results.push({
        stmt: s,
        ok,
        note: ok
          ? `"${s.name}" is ${declaredType}, expression "${s.exprText}" is ${s.exprType} — types match.`
          : `Type error: "${s.name}" is declared ${declaredType}, but "${s.exprText}" is ${s.exprType}.`,
      });
    }
  }

  const next = () => setStep((s) => Math.min(PROGRAM.length, s + 1));
  const reset = () => setStep(0);
  const hasError = results.some((r) => !r.ok);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          After a program is parsed into a syntax tree, the compiler still needs to check whether it
          actually <em>makes sense</em> — this is <strong>semantic analysis</strong>. One major part
          of it is <strong>type checking</strong>: walking through the program, keeping track of
          each variable's declared type in a <strong>symbol table</strong>, and verifying that every
          assignment's right-hand-side expression has a type compatible with the variable it's being
          assigned to.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Symbol table: </dt>
              <dd className="inline text-stone-600">
                a running record of every declared variable's name and type, built up as the program
                is scanned.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Type mismatch: </dt>
              <dd className="inline text-stone-600">
                an assignment (or expression) whose value's type doesn't match what's required at
                that point.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming type checking happens during parsing, since both look like they involve reading
          through code line by line. Parsing only checks that the code follows the grammar's{' '}
          <em>structure</em>
          (correct syntax) — it has no notion of "int" or "string" at all. Type checking is a
          separate pass afterward, walking the already-built syntax tree with a symbol table to
          check <em>meaning</em>.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click "Check next statement" to walk through the program one line at a time.</li>
          <li>Watch the symbol table fill in as declarations are processed.</li>
          <li>
            Watch each assignment get checked against the symbol table — until the last line fails.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={step >= PROGRAM.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Check next statement
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Program</p>
          <div className="space-y-1 font-mono text-sm">
            {PROGRAM.map((s, i) => {
              const result = results[i];
              return (
                <p
                  key={i}
                  className={`rounded px-2 py-1 ${
                    !result
                      ? 'text-stone-300'
                      : result.ok
                        ? 'text-stone-800'
                        : 'bg-rose-100 font-semibold text-rose-800'
                  }`}
                >
                  {stmtText(s)}
                </p>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Symbol table</p>
          <table className="w-full font-mono text-sm">
            <tbody>
              {Object.entries(symbolTable).map(([name, type]) => (
                <tr key={name} className="border-t border-stone-100">
                  <td className="py-1 pr-3">{name}</td>
                  <td className="py-1 text-stone-500">{type}</td>
                </tr>
              ))}
              {Object.keys(symbolTable).length === 0 && (
                <tr>
                  <td className="py-1 italic text-stone-300">empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r, i) => (
            <p
              key={i}
              className={`text-sm ${r.ok ? 'text-stone-600' : 'font-medium text-rose-700'}`}
            >
              {r.note}
            </p>
          ))}
        </div>
      )}

      {hasError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">
            Compile error: type mismatch flagged — the offending statement is highlighted above.
          </p>
        </div>
      )}
    </div>
  );
}

function CommonMistake({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p>
        <span className="font-semibold">Common mistake: </span>
        {children}
      </p>
    </div>
  );
}
