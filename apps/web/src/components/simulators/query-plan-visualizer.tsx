/**
 * Component: QueryPlanVisualizer
 * Serves: act6-d5-ch05-query-optimization ("Query Optimization")
 *
 * What it demonstrates:
 *   A query's naive logical plan transformed into an optimized physical plan, shown
 *   as two side-by-side trees: predicate pushdown moving a WHERE filter down below a
 *   join (so it runs on fewer rows, sooner), and join reordering putting the smaller,
 *   already-filtered input first — with the optimizer's chosen operators highlighted.
 *
 * Design decisions:
 *   - Uses one concrete query (customers joined to orders, filtered to one country)
 *     with real, different-sized example tables (5 customers, only 1 of which is
 *     from the filtered country; 20 orders) so "filter first" has a visible, sensible
 *     payoff — filtering 5 rows down to 1 before a join is obviously cheaper than
 *     joining all 20 orders against all 5 customers first and filtering after.
 *   - Both trees are rendered from the same small tree-drawing helper so the
 *     before/after comparison is visually apples-to-apples, with only the structure
 *     (not the styling) differing between them.
 *   - The optimized plan explicitly labels which node moved and why, rather than just
 *     showing a different final tree shape, since the *transformation* is the thing
 *     being taught, not just the end state.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface PlanNode {
  id: string;
  op: string;
  detail: string;
  children: PlanNode[];
  estRows?: number;
}

const LOGICAL_PLAN: PlanNode = {
  id: 'filter',
  op: 'Filter',
  detail: "country = 'USA'",
  estRows: 1,
  children: [
    {
      id: 'join',
      op: 'Join',
      detail: 'customers.id = orders.customer_id',
      estRows: 20,
      children: [
        { id: 'customers', op: 'Scan', detail: 'customers (5 rows)', estRows: 5, children: [] },
        { id: 'orders', op: 'Scan', detail: 'orders (20 rows)', estRows: 20, children: [] },
      ],
    },
  ],
};

const PHYSICAL_PLAN: PlanNode = {
  id: 'join2',
  op: 'Join',
  detail: 'customers.id = orders.customer_id',
  estRows: 4,
  children: [
    {
      id: 'filter2',
      op: 'Filter (pushed down)',
      detail: "country = 'USA'",
      estRows: 1,
      children: [
        { id: 'customers2', op: 'Scan', detail: 'customers (5 rows)', estRows: 5, children: [] },
      ],
    },
    { id: 'orders2', op: 'Scan', detail: 'orders (20 rows)', estRows: 20, children: [] },
  ],
};

function TreeView({ node, highlight }: { node: PlanNode; highlight?: string[] }) {
  const isHighlighted = highlight?.includes(node.id);
  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-md border px-3 py-1.5 text-center text-xs ${isHighlighted ? 'border-violet-600 bg-violet-500 text-white' : 'border-stone-300 bg-white text-stone-800'}`}
      >
        <p className="font-semibold">{node.op}</p>
        <p className="opacity-80">{node.detail}</p>
        {node.estRows !== undefined && <p className="opacity-60">~{node.estRows} rows</p>}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-3 w-px bg-stone-300" />
          <div className="flex gap-4">
            {node.children.map((c) => (
              <div key={c.id} className="flex flex-col items-center">
                <TreeView node={c} highlight={highlight} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function QueryPlanVisualizer() {
  const [optimized, setOptimized] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A SQL query first gets translated into a <strong>logical plan</strong> — a naive tree of
          operations that produces the correct answer, but not necessarily efficiently. The query{' '}
          <span className="font-mono">
            SELECT * FROM customers JOIN orders ... WHERE country = 'USA'
          </span>{' '}
          naively joins everything first, then filters. The optimizer instead produces a{' '}
          <strong>physical plan</strong>: the same logical result, but restructured for speed —
          here, using <strong>predicate pushdown</strong> to filter customers down to just USA ones{' '}
          <em>before</em> the join runs, so the join processes far fewer rows.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Logical plan: </dt>
              <dd className="inline text-stone-600">
                a correct but naive tree of operations describing what the query needs, with no
                regard for efficiency.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Physical plan: </dt>
              <dd className="inline text-stone-600">
                the actual execution strategy the optimizer picks, chosen to be equivalent but
                cheaper to run.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Predicate pushdown: </dt>
              <dd className="inline text-stone-600">
                moving a filter as early as possible, so later operations (like joins) process fewer
                rows.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming query optimization changes what a query returns. It never does — every rewrite
          the optimizer makes is guaranteed to produce exactly the same final result as the naive
          logical plan; only the amount of work needed to get there changes.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Compare the logical plan's shape: Join first (all 5 customers × 20 orders), Filter
            after.
          </li>
          <li>
            Click "Optimize" to see the physical plan: Filter pushed down below the join, now
            touching just 1 customer.
          </li>
          <li>
            Notice the join's estimated row count drop from 20 to 4 once it's only joining
            pre-filtered customers.
          </li>
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setOptimized(false)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${!optimized ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Logical plan
        </button>
        <button
          onClick={() => setOptimized(true)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${optimized ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Optimized physical plan
        </button>
      </div>

      <div className="overflow-x-auto py-4">
        {optimized ? (
          <TreeView node={PHYSICAL_PLAN} highlight={['filter2', 'join2']} />
        ) : (
          <TreeView node={LOGICAL_PLAN} />
        )}
      </div>

      {optimized && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <p className="font-semibold">What changed (highlighted nodes):</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>
              The Filter moved from above the Join to directly below the customers scan — predicate
              pushdown.
            </li>
            <li>
              The Join's estimated input from the customers side dropped from 5 rows to 1, so its
              own output estimate dropped from 20 to 4.
            </li>
          </ul>
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
