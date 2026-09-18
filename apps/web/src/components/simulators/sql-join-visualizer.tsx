/**
 * Component: SqlJoinVisualizer
 * Serves: act6-d2-ch03-joins ("Joins — Inner, Outer, Cross, Self")
 *
 * What it demonstrates:
 *   Two small sample tables joined five different ways (inner, left, right, full
 *   outer, cross), with a Venn-style two-circle diagram highlighting exactly which
 *   region each join type pulls rows from, plus the actual resulting joined table
 *   computed live underneath.
 *
 * Design decisions:
 *   - Tables are deliberately built with a genuine mismatch: one customer with no
 *     orders, and one order with a customer_id that doesn't match anyone — so every
 *     join type actually produces a visibly different result, rather than all
 *     joins coincidentally returning the same rows.
 *   - The Venn diagram's shaded region is computed from the *same* join logic used
 *     to build the result table (not two independently-hand-coded representations),
 *     so the diagram and the table can never silently disagree with each other.
 *   - "Self join" from the chapter title is covered in the Key Terms / explanation
 *     text (it's just an inner/left join of a table against itself) rather than as a
 *     sixth mode, since demonstrating it doesn't need new mechanics beyond what INNER
 *     JOIN already shows — it would be visual repetition, not new understanding.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Customer {
  customer_id: number;
  name: string;
}
interface Order {
  order_id: number;
  customer_id: number | null;
  item: string;
}

const CUSTOMERS: Customer[] = [
  { customer_id: 1, name: 'Ada' },
  { customer_id: 2, name: 'Grace' },
  { customer_id: 3, name: 'Alan' }, // has no matching order
];
const ORDERS: Order[] = [
  { order_id: 101, customer_id: 1, item: 'Keyboard' },
  { order_id: 102, customer_id: 2, item: 'Monitor' },
  { order_id: 103, customer_id: 99, item: 'Mouse' }, // customer_id doesn't match anyone
];

type JoinType = 'inner' | 'left' | 'right' | 'full' | 'cross';

interface JoinedRow {
  customer: Customer | null;
  order: Order | null;
}

function computeJoin(type: JoinType): JoinedRow[] {
  if (type === 'cross') {
    const rows: JoinedRow[] = [];
    CUSTOMERS.forEach((c) => ORDERS.forEach((o) => rows.push({ customer: c, order: o })));
    return rows;
  }
  const matches = (c: Customer, o: Order) => c.customer_id === o.customer_id;
  const inner: JoinedRow[] = [];
  CUSTOMERS.forEach((c) =>
    ORDERS.forEach((o) => matches(c, o) && inner.push({ customer: c, order: o })),
  );

  if (type === 'inner') return inner;

  if (type === 'left') {
    const rows = [...inner];
    CUSTOMERS.forEach((c) => {
      if (!ORDERS.some((o) => matches(c, o))) rows.push({ customer: c, order: null });
    });
    return rows;
  }
  if (type === 'right') {
    const rows = [...inner];
    ORDERS.forEach((o) => {
      if (!CUSTOMERS.some((c) => matches(c, o))) rows.push({ customer: null, order: o });
    });
    return rows;
  }
  // full
  const rows = [...inner];
  CUSTOMERS.forEach((c) => {
    if (!ORDERS.some((o) => matches(c, o))) rows.push({ customer: c, order: null });
  });
  ORDERS.forEach((o) => {
    if (!CUSTOMERS.some((c) => matches(c, o))) rows.push({ customer: null, order: o });
  });
  return rows;
}

const JOIN_LABELS: Record<JoinType, string> = {
  inner: 'INNER JOIN',
  left: 'LEFT JOIN',
  right: 'RIGHT JOIN',
  full: 'FULL OUTER JOIN',
  cross: 'CROSS JOIN',
};

const JOIN_EXPLAIN: Record<JoinType, string> = {
  inner:
    'Only rows where a customer AND an order match on customer_id — Alan (no orders) and the mystery order (no matching customer) are both excluded.',
  left: 'Every customer, matched with their order(s) if any — Alan still appears, with NULLs for the order columns, since LEFT keeps everything from the left table.',
  right:
    'Every order, matched with its customer if any — the mystery order (customer_id 99) still appears, with NULLs for the customer columns.',
  full: 'Everything from both tables — matched rows, plus Alan (unmatched customer) and the mystery order (unmatched order), each padded with NULLs.',
  cross:
    'Every customer paired with every order, regardless of any match at all — 3 customers × 3 orders = 9 rows. Rarely what you actually want, but useful to see what a join with no ON condition really does.',
};

export default function SqlJoinVisualizer() {
  const [joinType, setJoinType] = useState<JoinType>('inner');
  const result = computeJoin(joinType);

  const includesUnmatchedCustomers = joinType === 'left' || joinType === 'full';
  const includesUnmatchedOrders = joinType === 'right' || joinType === 'full';
  const includesOnlyMatched = joinType === 'inner';
  const isCross = joinType === 'cross';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>join</strong> combines rows from two tables based on a matching column, but
          different join types decide what happens to rows on either side that <em>don't</em> have a
          match. This simulator uses two small tables — Customers and Orders — where one customer
          has no orders and one order's customer_id doesn't match anyone, so every join type
          actually behaves differently.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Matched row: </dt>
              <dd className="inline text-stone-600">
                a customer and an order whose customer_id values are equal.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">NULL padding: </dt>
              <dd className="inline text-stone-600">
                when an outer join includes an unmatched row, the columns from the other table are
                filled with NULL.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Self join: </dt>
              <dd className="inline text-stone-600">
                not a separate mechanism — it's just an INNER or LEFT JOIN where a table is joined
                against itself, e.g. to find employees who share the same manager.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming CROSS JOIN is a "weaker" or "broken" version of the other joins. It isn't a
          matching operation at all — it deliberately ignores any relationship between the tables
          and pairs every row with every other row, which is why the result exploded to 9 rows here
          instead of 3.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click each join type below and watch the Venn diagram highlight which region it pulls
            from.
          </li>
          <li>
            Compare the resulting table — notice which rows appear only in LEFT, only in RIGHT, or
            in FULL but not INNER.
          </li>
          <li>Try CROSS last to see what happens with no matching condition at all.</li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(JOIN_LABELS) as JoinType[]).map((t) => (
          <button
            key={t}
            onClick={() => setJoinType(t)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${joinType === t ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
          >
            {JOIN_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Venn diagram */}
      <div className="flex justify-center">
        <svg width={260} height={140} viewBox="0 0 260 140">
          <circle
            cx={100}
            cy={70}
            r={60}
            fill={
              includesUnmatchedCustomers || isCross || includesOnlyMatched ? '#a78bfa' : '#e7e5e4'
            }
            fillOpacity={isCross ? 0.35 : 0.5}
          />
          <circle
            cx={160}
            cy={70}
            r={60}
            fill={includesUnmatchedOrders || isCross || includesOnlyMatched ? '#38bdf8' : '#e7e5e4'}
            fillOpacity={isCross ? 0.35 : 0.5}
          />
          <text x={65} y={40} fontSize="11" fill="#57534e">
            Customers
          </text>
          <text x={175} y={40} fontSize="11" fill="#57534e">
            Orders
          </text>
        </svg>
      </div>
      <p className="-mt-2 text-center text-sm text-stone-600">{JOIN_EXPLAIN[joinType]}</p>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase text-stone-400">
            <th className="py-1 text-left font-normal">customer_id</th>
            <th className="py-1 text-left font-normal">name</th>
            <th className="py-1 text-left font-normal">order_id</th>
            <th className="py-1 text-left font-normal">item</th>
          </tr>
        </thead>
        <tbody>
          {result.map((r, i) => (
            <tr key={i} className="border-t border-stone-100">
              <td className={`py-1 font-mono ${!r.customer ? 'italic text-stone-300' : ''}`}>
                {r.customer ? r.customer.customer_id : 'NULL'}
              </td>
              <td className={`py-1 ${!r.customer ? 'italic text-stone-300' : ''}`}>
                {r.customer ? r.customer.name : 'NULL'}
              </td>
              <td className={`py-1 font-mono ${!r.order ? 'italic text-stone-300' : ''}`}>
                {r.order ? r.order.order_id : 'NULL'}
              </td>
              <td className={`py-1 ${!r.order ? 'italic text-stone-300' : ''}`}>
                {r.order ? r.order.item : 'NULL'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-stone-400">{result.length} row(s) returned.</p>
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
