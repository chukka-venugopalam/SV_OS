/**
 * Component: SqlDmlPlayground
 * Serves: act6-d2-ch02-dml-insert-update-delete ("DML — INSERT, UPDATE, DELETE")
 *
 * What it demonstrates:
 *   A live table view that updates row by row as INSERT/UPDATE/DELETE statements run
 *   against an in-browser mock table, with WHERE-clause filtering visibly narrowing
 *   exactly which rows are affected before the change is applied.
 *
 * Design decisions:
 *   - Small pattern-matching interpreter (same tradeoff as the DDL Playground) —
 *     recognizes INSERT INTO t VALUES (...), UPDATE t SET col=val WHERE ..., and
 *     DELETE FROM t WHERE ... shapes, with a plain-English error for anything else,
 *     rather than attempting a general SQL parser.
 *   - WHERE-clause matching is evaluated per row and the *matched* rows are
 *     highlighted amber for a beat before the change actually applies, so
 *     "WHERE narrows down which rows this touches" is something the student watches
 *     happen rather than something stated in prose.
 *   - Running UPDATE/DELETE with no WHERE clause is allowed (it's valid SQL) but
 *     flagged with an explicit warning highlighting every row, since forgetting a
 *     WHERE clause is one of the most common real-world DML mistakes.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Row {
  id: number;
  name: string;
  dept: string;
  salary: number;
}

const INITIAL_ROWS: Row[] = [
  { id: 1, name: 'Ada', dept: 'Engineering', salary: 95000 },
  { id: 2, name: 'Grace', dept: 'Engineering', salary: 98000 },
  { id: 3, name: 'Alan', dept: 'Research', salary: 87000 },
  { id: 4, name: 'Katherine', dept: 'Research', salary: 91000 },
];

const PRESETS = [
  "INSERT INTO employees VALUES (5, 'Hedy', 'Research', 89000)",
  "UPDATE employees SET salary = 100000 WHERE dept = 'Engineering'",
  "DELETE FROM employees WHERE dept = 'Research'",
  'UPDATE employees SET salary = 90000',
];

function parseValue(v: string): string | number {
  const trimmed = v.trim();
  if (/^'.*'$/.test(trimmed)) return trimmed.slice(1, -1);
  const n = Number(trimmed);
  return isNaN(n) ? trimmed : n;
}

function rowMatchesWhere(row: Row, where: string | null): boolean {
  if (!where) return true;
  const m = where.match(/(\w+)\s*=\s*('[^']*'|\S+)/);
  if (!m) return true;
  const [, col, rawVal] = m;
  const val = parseValue(rawVal);
  return (row as unknown as Record<string, string | number>)[col] === val;
}

type Result = {
  rows: Row[];
  message: string;
  ok: boolean;
  matchedIds: number[];
  noWhereWarning: boolean;
};

function runStatement(rows: Row[], sql: string): Result {
  const s = sql.trim().replace(/;$/, '');

  let m = s.match(/^INSERT INTO\s+employees\s+VALUES\s*\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(',').map(parseValue);
    const [id, name, dept, salary] = parts;
    if (rows.some((r) => r.id === id))
      return {
        rows,
        message: `Error: id ${id} already exists.`,
        ok: false,
        matchedIds: [],
        noWhereWarning: false,
      };
    const newRow: Row = {
      id: Number(id),
      name: String(name),
      dept: String(dept),
      salary: Number(salary),
    };
    return {
      rows: [...rows, newRow],
      message: `Inserted 1 row (id=${id}).`,
      ok: true,
      matchedIds: [newRow.id],
      noWhereWarning: false,
    };
  }

  m = s.match(/^UPDATE\s+employees\s+SET\s+(\w+)\s*=\s*('[^']*'|\S+)(?:\s+WHERE\s+(.+))?$/i);
  if (m) {
    const [, col, rawVal, where] = m;
    const val = parseValue(rawVal);
    const matched = rows.filter((r) => rowMatchesWhere(r, where ?? null));
    const updated = rows.map((r) => (rowMatchesWhere(r, where ?? null) ? { ...r, [col]: val } : r));
    return {
      rows: updated,
      message: `Updated ${matched.length} row(s).`,
      ok: true,
      matchedIds: matched.map((r) => r.id),
      noWhereWarning: !where,
    };
  }

  m = s.match(/^DELETE FROM\s+employees(?:\s+WHERE\s+(.+))?$/i);
  if (m) {
    const [, where] = m;
    const matched = rows.filter((r) => rowMatchesWhere(r, where ?? null));
    const remaining = rows.filter((r) => !rowMatchesWhere(r, where ?? null));
    return {
      rows: remaining,
      message: `Deleted ${matched.length} row(s).`,
      ok: true,
      matchedIds: matched.map((r) => r.id),
      noWhereWarning: !where,
    };
  }

  return {
    rows,
    message: 'Not recognized. Try INSERT INTO / UPDATE ... SET ... WHERE / DELETE FROM ... WHERE.',
    ok: false,
    matchedIds: [],
    noWhereWarning: false,
  };
}

export default function SqlDmlPlayground() {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [input, setInput] = useState(PRESETS[0]);
  const [preview, setPreview] = useState<Result | null>(null);
  const [message, setMessage] = useState('');

  const preview1 = () => {
    const result = runStatement(rows, input);
    setPreview(result);
    setMessage('');
  };
  const apply = () => {
    if (!preview) return;
    setRows(preview.rows);
    setMessage(preview.message);
    setPreview(null);
  };
  const reset = () => {
    setRows(INITIAL_ROWS);
    setPreview(null);
    setMessage('');
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>DML</strong> (Data Manipulation Language) is the part of SQL that changes the
          actual data rows in a table, not its structure. <span className="font-mono">INSERT</span>{' '}
          adds a new row, <span className="font-mono">UPDATE</span> changes values in existing rows,
          and <span className="font-mono">DELETE</span> removes rows. A{' '}
          <span className="font-mono">WHERE</span> clause is how you tell UPDATE and DELETE exactly
          which rows to touch — without one, they apply to every row in the table.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">WHERE clause: </dt>
              <dd className="inline text-stone-600">
                a condition narrowing which rows an UPDATE or DELETE affects.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Affected rows: </dt>
              <dd className="inline text-stone-600">
                the specific rows that actually matched the WHERE condition and got changed.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          running UPDATE or DELETE without a WHERE clause by accident. Both are completely valid SQL
          without one — but that means "every row in the table," not "no rows." Try the last preset
          below (no WHERE) to see every row get flagged before you'd apply it.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click a preset statement below, or type your own.</li>
          <li>
            Click "Preview" — rows that would be affected are highlighted amber, before anything
            actually changes.
          </li>
          <li>
            Click "Apply" to actually run the change, or edit your statement and preview again.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setInput(p);
              setPreview(null);
            }}
            className="rounded border border-stone-300 px-2 py-1 font-mono text-xs text-stone-700 hover:bg-stone-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setPreview(null);
          }}
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
        />
        <button
          onClick={preview1}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Preview
        </button>
        <button
          onClick={apply}
          disabled={!preview || !preview.ok}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Apply
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {preview && !preview.ok && <p className="text-sm text-rose-600">{preview.message}</p>}
      {preview?.noWhereWarning && (
        <CommonMistake>
          this statement has no WHERE clause — every row shown below will be affected.
        </CommonMistake>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase text-stone-400">
            <th className="py-1 text-left font-normal">id</th>
            <th className="py-1 text-left font-normal">name</th>
            <th className="py-1 text-left font-normal">dept</th>
            <th className="py-1 text-left font-normal">salary</th>
          </tr>
        </thead>
        <tbody>
          {(preview
            ? preview.rows.filter(
                (r) => rows.some((orig) => orig.id === r.id) || preview.matchedIds.includes(r.id),
              )
            : rows
          ).map((r) => {
            const isMatched = preview?.matchedIds.includes(r.id);
            const willBeInserted = preview && !rows.some((orig) => orig.id === r.id);
            return (
              <tr
                key={r.id}
                className={`border-t border-stone-100 transition-all ${isMatched ? 'bg-amber-50' : ''}`}
              >
                <td className="py-1.5 font-mono">{r.id}</td>
                <td className="py-1.5">{r.name}</td>
                <td className="py-1.5">{r.dept}</td>
                <td className="py-1.5 font-mono">${r.salary.toLocaleString()}</td>
                {isMatched && (
                  <td className="py-1.5 text-xs text-amber-700">
                    {willBeInserted ? 'will be inserted' : 'would be affected'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
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
