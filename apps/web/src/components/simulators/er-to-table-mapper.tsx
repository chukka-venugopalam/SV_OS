/**
 * Component: ErToTableMapper
 * Serves: act6-d1-ch02-er-to-relational-mapping ("ER-to-Relational Mapping")
 *
 * What it demonstrates:
 *   Mechanically deriving relational tables from an ER diagram: each entity becomes
 *   a table, a 1:N relationship places a foreign key on the "many" side, and an M:N
 *   relationship requires an extra junction table holding both sides' foreign keys as
 *   a composite key.
 *
 * Design decisions:
 *   - Reuses the identical scenario from ErDiagramBuilder (ch18) — Customer –1:N–
 *     Order –M:N– Product — so a student moving from that chapter to this one sees
 *     their own diagram mechanically become real tables, rather than a disconnected
 *     new example.
 *   - The mapping is revealed as an explicit rule-by-rule derivation (one step per
 *     entity, one step per relationship) rather than showing the final schema all at
 *     once, since "mechanically derive" is the point — the student should see *why*
 *     each foreign key ends up where it does.
 *   - The M:N junction table step explicitly explains why a plain foreign key
 *     wouldn't work here (a single FK column can't hold multiple values), rather than
 *     just presenting the junction table as a rule to memorize.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Column {
  name: string;
  isPk?: boolean;
  isFk?: boolean;
}
interface TableDef {
  name: string;
  columns: Column[];
  note: string;
}

const STEPS: { title: string; tables: TableDef[]; explanation: string }[] = [
  {
    title: 'Step 1 — Customer entity becomes a table',
    tables: [
      {
        name: 'Customer',
        columns: [{ name: 'customer_id', isPk: true }, { name: 'name' }, { name: 'email' }],
        note: '',
      },
    ],
    explanation:
      "Every entity becomes its own table. The entity's identifying attribute becomes the table's primary key (PK).",
  },
  {
    title: 'Step 2 — Order entity becomes a table',
    tables: [
      {
        name: 'Order',
        columns: [{ name: 'order_id', isPk: true }, { name: 'order_date' }],
        note: '',
      },
    ],
    explanation: 'Same rule applied to the Order entity — not yet linked to Customer.',
  },
  {
    title: 'Step 3 — Product entity becomes a table',
    tables: [
      {
        name: 'Product',
        columns: [{ name: 'product_id', isPk: true }, { name: 'name' }, { name: 'price' }],
        note: '',
      },
    ],
    explanation:
      "And again for Product. So far we just have three independent tables — the relationships haven't been applied yet.",
  },
  {
    title: 'Step 4 — Apply the 1:N relationship (Customer places Order)',
    tables: [
      {
        name: 'Order',
        columns: [
          { name: 'order_id', isPk: true },
          { name: 'order_date' },
          { name: 'customer_id', isFk: true },
        ],
        note: '',
      },
    ],
    explanation:
      'For a 1:N relationship, the foreign key always goes on the "many" side. One customer can have many orders, so Order gets a customer_id column referencing Customer — never the other way around, since a single Customer row can\'t hold a list of many order IDs.',
  },
  {
    title: 'Step 5 — Apply the M:N relationship (Order contains Product)',
    tables: [
      {
        name: 'Order_Product',
        columns: [
          { name: 'order_id', isPk: true, isFk: true },
          { name: 'product_id', isPk: true, isFk: true },
        ],
        note: 'new junction table',
      },
    ],
    explanation:
      "An M:N relationship can't be represented with a single foreign key on either side — an Order can contain many Products, and a Product can appear on many Orders, so neither table has room for a single-value foreign key. Instead, a new junction table is created holding one row per (order, product) pairing, with both IDs together forming its composite primary key.",
  },
];

export default function ErToTableMapper() {
  const [stepIdx, setStepIdx] = useState(-1);
  const revealedTables = new Map<string, TableDef>();
  STEPS.slice(0, stepIdx + 1).forEach((s) =>
    s.tables.forEach((t) => revealedTables.set(t.name, t)),
  );

  const next = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const reset = () => setStepIdx(-1);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          Once you have an ER diagram, turning it into actual database tables follows a small set of
          mechanical rules, not creative judgment. Every entity becomes a table. Then, depending on
          each relationship's <strong>cardinality</strong>, a <strong>foreign key</strong> (a column
          referencing another table's primary key) gets placed in a specific spot — and for
          many-to-many relationships, an entirely new table has to be created just to hold the
          relationship itself.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Foreign key (FK): </dt>
              <dd className="inline text-stone-600">
                a column in one table that stores another table's primary key value, linking the two
                rows.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Junction table: </dt>
              <dd className="inline text-stone-600">
                an extra table created solely to represent an M:N relationship, holding one row per
                matched pair.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Composite key: </dt>
              <dd className="inline text-stone-600">
                a primary key made of more than one column together, as in a junction table's two
                foreign keys.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          trying to add a single "product_id" column directly to the Order table (or "order_id" to
          Product) to represent the M:N relationship. A single column can only hold one value, but
          an order can contain several products — there's no way to fit "many" into one column,
          which is exactly why a separate junction table is required instead.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Next step" to reveal each table one rule at a time, starting with the three
            entities.
          </li>
          <li>Watch step 4 add a foreign key to Order for the 1:N relationship with Customer.</li>
          <li>
            Watch step 5 create a brand-new junction table for the M:N relationship with Product.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={stepIdx >= STEPS.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next step
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {stepIdx >= 0 && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <p className="mb-1 font-semibold">{STEPS[stepIdx].title}</p>
          <p>{STEPS[stepIdx].explanation}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {['Customer', 'Order', 'Product', 'Order_Product'].map((name) => {
          const t = revealedTables.get(name);
          if (!t) return null;
          return (
            <div key={name} className="overflow-hidden rounded-md border border-stone-200">
              <div className="flex justify-between bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
                <span>{t.name}</span>
                {t.note && <span className="italic text-stone-300">{t.note}</span>}
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {t.columns.map((c) => (
                    <tr key={c.name} className="border-t border-stone-100">
                      <td
                        className={`px-3 py-1 font-mono ${c.isPk ? 'font-semibold text-stone-900 underline' : 'text-stone-700'}`}
                      >
                        {c.name}
                      </td>
                      <td className="px-3 py-1 text-right text-stone-400">
                        {c.isPk && c.isFk ? 'PK, FK' : c.isPk ? 'PK' : c.isFk ? 'FK' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
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
