/**
 * Component: SqlDdlPlayground
 * Serves: act6-d2-ch01-ddl-create-alter-drop ("DDL — CREATE, ALTER, DROP")
 *
 * What it demonstrates:
 *   A live schema view that updates immediately as the student runs CREATE TABLE,
 *   ALTER TABLE (ADD/DROP COLUMN), and DROP TABLE statements against an in-browser
 *   mock database — no server, no real SQL engine, just enough parsing to recognize
 *   these specific statement shapes and update visible schema state.
 *
 * Design decisions:
 *   - This is intentionally a small pattern-matching interpreter, not a real SQL
 *     parser — it recognizes a handful of common statement shapes via regex and
 *     rejects anything else with a plain-English explanation of what it expected,
 *     rather than silently misinterpreting unusual SQL. That's an explicit scope
 *     tradeoff: full SQL grammar support would add a lot of complexity for a
 *     beginner exercise that only needs these three statement types to land the
 *     concept.
 *   - Ships with runnable presets so a student can succeed immediately by clicking,
 *     then is encouraged to edit or type their own statements once they see the
 *     pattern.
 *   - DDL statements are explicitly framed as changing *structure* (columns, tables)
 *     rather than *data*, directly setting up the contrast with the DML Playground
 *     (ch02) that follows.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ColumnDef {
  name: string;
  type: string;
}
type Schema = Record<string, ColumnDef[]>;

const INITIAL_SCHEMA: Schema = {
  students: [
    { name: 'id', type: 'INT' },
    { name: 'name', type: 'TEXT' },
  ],
};

const PRESETS = [
  'CREATE TABLE courses (id INT, title TEXT)',
  'ALTER TABLE students ADD COLUMN email TEXT',
  'ALTER TABLE students DROP COLUMN email',
  'DROP TABLE courses',
];

function runStatement(
  schema: Schema,
  sql: string,
): { schema: Schema; message: string; ok: boolean } {
  const s = sql.trim().replace(/;$/, '');

  let m = s.match(/^CREATE TABLE\s+(\w+)\s*\(([^)]+)\)$/i);
  if (m) {
    const [, table, colsRaw] = m;
    if (schema[table])
      return { schema, message: `Error: table "${table}" already exists.`, ok: false };
    const columns = colsRaw.split(',').map((c) => {
      const parts = c.trim().split(/\s+/);
      return { name: parts[0], type: (parts[1] || 'TEXT').toUpperCase() };
    });
    return {
      schema: { ...schema, [table]: columns },
      message: `Table "${table}" created with ${columns.length} column(s).`,
      ok: true,
    };
  }

  m = s.match(/^ALTER TABLE\s+(\w+)\s+ADD COLUMN\s+(\w+)\s+(\w+)$/i);
  if (m) {
    const [, table, col, type] = m;
    if (!schema[table])
      return { schema, message: `Error: table "${table}" does not exist.`, ok: false };
    if (schema[table].some((c) => c.name === col))
      return { schema, message: `Error: column "${col}" already exists on "${table}".`, ok: false };
    return {
      schema: { ...schema, [table]: [...schema[table], { name: col, type: type.toUpperCase() }] },
      message: `Column "${col}" added to "${table}".`,
      ok: true,
    };
  }

  m = s.match(/^ALTER TABLE\s+(\w+)\s+DROP COLUMN\s+(\w+)$/i);
  if (m) {
    const [, table, col] = m;
    if (!schema[table])
      return { schema, message: `Error: table "${table}" does not exist.`, ok: false };
    if (!schema[table].some((c) => c.name === col))
      return { schema, message: `Error: column "${col}" does not exist on "${table}".`, ok: false };
    return {
      schema: { ...schema, [table]: schema[table].filter((c) => c.name !== col) },
      message: `Column "${col}" dropped from "${table}".`,
      ok: true,
    };
  }

  m = s.match(/^DROP TABLE\s+(\w+)$/i);
  if (m) {
    const [, table] = m;
    if (!schema[table])
      return { schema, message: `Error: table "${table}" does not exist.`, ok: false };
    const { [table]: _, ...rest } = schema;
    return { schema: rest, message: `Table "${table}" dropped.`, ok: true };
  }

  return {
    schema,
    message: 'Not recognized. Try CREATE TABLE, ALTER TABLE ADD/DROP COLUMN, or DROP TABLE.',
    ok: false,
  };
}

export default function SqlDdlPlayground() {
  const [schema, setSchema] = useState<Schema>(INITIAL_SCHEMA);
  const [input, setInput] = useState(PRESETS[0]);
  const [log, setLog] = useState<{ sql: string; message: string; ok: boolean }[]>([]);

  const run = () => {
    const result = runStatement(schema, input);
    setSchema(result.schema);
    setLog((l) => [{ sql: input, message: result.message, ok: result.ok }, ...l]);
  };
  const reset = () => {
    setSchema(INITIAL_SCHEMA);
    setLog([]);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>DDL</strong> (Data Definition Language) is the part of SQL used to define and
          change a database's <em>structure</em> — what tables exist and what columns they have —
          rather than the data stored inside them. <span className="font-mono">CREATE TABLE</span>{' '}
          makes a new table, <span className="font-mono">ALTER TABLE</span> changes an existing
          one's columns, and <span className="font-mono">DROP TABLE</span> removes a table (and
          everything in it) entirely.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Schema: </dt>
              <dd className="inline text-stone-600">
                the structure of a database — which tables exist and what columns each one has.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Column type: </dt>
              <dd className="inline text-stone-600">
                what kind of value a column stores, e.g. INT for numbers, TEXT for strings.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          confusing DDL with actually storing or changing data. Running{' '}
          <span className="font-mono">ALTER TABLE students ADD COLUMN email TEXT</span> only changes
          the <em>shape</em> of the table — it doesn't put any actual email addresses in; every
          existing row just gets a new, empty "email" slot. Putting real values in is a job for DML
          (INSERT/UPDATE), covered next.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click a preset statement below, or type your own DDL statement.</li>
          <li>Click "Run" — watch the live schema view update immediately.</li>
          <li>
            Try the presets in order: create a table, add a column, drop it, then drop the whole
            table.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="rounded border border-stone-300 px-2 py-1 font-mono text-xs text-stone-700 hover:bg-stone-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
        />
        <button
          onClick={run}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Run
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
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Live schema</p>
          <div className="space-y-2">
            {Object.keys(schema).length === 0 && (
              <p className="text-sm italic text-stone-400">No tables.</p>
            )}
            {Object.entries(schema).map(([table, cols]) => (
              <div key={table} className="overflow-hidden rounded-md border border-stone-200">
                <div className="bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
                  {table}
                </div>
                <ul className="text-xs">
                  {cols.map((c) => (
                    <li
                      key={c.name}
                      className="flex justify-between border-t border-stone-100 px-3 py-1"
                    >
                      <span className="font-mono text-stone-800">{c.name}</span>
                      <span className="text-stone-400">{c.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Statement log</p>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {log.map((l, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 text-xs ${l.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}
              >
                <p className="font-mono">{l.sql}</p>
                <p>{l.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
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
