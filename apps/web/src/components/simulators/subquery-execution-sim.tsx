/**
 * Component: SubqueryExecutionSim
 * Serves: act6-d2-ch04-subqueries ("Subqueries")
 *
 * What it demonstrates:
 *   A correlated subquery being re-evaluated once per outer row (its result can be
 *   different each time, because it references a column from the current outer row),
 *   versus an uncorrelated subquery being evaluated exactly once total and reused
 *   for every outer row — with a running execution counter making the performance
 *   difference concrete rather than asserted.
 *
 * Design decisions:
 *   - Uses one small, concrete outer table (5 employees across 2 departments) so the
 *     "run once per row" claim can be verified by literally counting to 5, rather than
 *     trusting a large, unauditable example.
 *   - The correlated example ("employees earning more than their own department's
 *     average") and the uncorrelated example ("employees earning more than the
 *     company-wide average") are deliberately similar in wording so the *only*
 *     difference the student has to notice is whether the subquery references the
 *     outer row — not two unrelated queries that happen to differ in other ways too.
 *   - Stepping through outer rows one at a time (rather than running the whole query
 *     instantly) is what makes the re-execution visible; the execution counter only
 *     increments in the correlated case, which is the entire point being taught.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Employee {
  id: number;
  name: string;
  dept: string;
  salary: number;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: 'Ada', dept: 'Engineering', salary: 95000 },
  { id: 2, name: 'Grace', dept: 'Engineering', salary: 88000 },
  { id: 3, name: 'Alan', dept: 'Research', salary: 91000 },
  { id: 4, name: 'Katherine', dept: 'Research', salary: 84000 },
  { id: 5, name: 'Hedy', dept: 'Research', salary: 99000 },
];

const companyAvg = EMPLOYEES.reduce((s, e) => s + e.salary, 0) / EMPLOYEES.length;
function deptAvg(dept: string) {
  const inDept = EMPLOYEES.filter((e) => e.dept === dept);
  return inDept.reduce((s, e) => s + e.salary, 0) / inDept.length;
}

type Kind = 'correlated' | 'uncorrelated';

export default function SubqueryExecutionSim() {
  const [kind, setKind] = useState<Kind>('correlated');
  const [rowIdx, setRowIdx] = useState(-1); // -1 = not started
  const [subqueryRuns, setSubqueryRuns] = useState(0);
  const [uncorrelatedComputed, setUncorrelatedComputed] = useState(false);

  const step = () => {
    if (rowIdx >= EMPLOYEES.length - 1) return;
    const next = rowIdx + 1;
    setRowIdx(next);
    if (kind === 'correlated') {
      setSubqueryRuns((n) => n + 1); // re-evaluated for this outer row
    } else if (!uncorrelatedComputed) {
      setSubqueryRuns(1); // evaluated exactly once, ever
      setUncorrelatedComputed(true);
    }
  };
  const reset = () => {
    setRowIdx(-1);
    setSubqueryRuns(0);
    setUncorrelatedComputed(false);
  };
  const switchKind = (k: Kind) => {
    setKind(k);
    reset();
  };

  const currentEmp = rowIdx >= 0 ? EMPLOYEES[rowIdx] : null;
  const threshold =
    kind === 'correlated' ? (currentEmp ? deptAvg(currentEmp.dept) : null) : companyAvg;
  const _qualifies = currentEmp && threshold !== null && currentEmp.salary > threshold;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => switchKind('correlated')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${kind === 'correlated' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Correlated subquery
        </button>
        <button
          onClick={() => switchKind('uncorrelated')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${kind === 'uncorrelated' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Uncorrelated subquery
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>subquery</strong> is a query nested inside another query. What matters most
          about a subquery is whether it's <strong>correlated</strong> — whether it references a
          column from the outer query's current row.{' '}
          {kind === 'correlated' ? (
            <>
              Here, "employees earning more than their <em>own department's</em> average" needs to
              know each row's department, so the subquery must be re-run separately for every single
              outer row.
            </>
          ) : (
            <>
              Here, "employees earning more than the <em>company-wide</em> average" doesn't depend
              on anything about the current row at all — so the database only needs to compute that
              average once, then reuse it for every row.
            </>
          )}
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Correlated subquery: </dt>
              <dd className="inline text-stone-600">
                a subquery that references a column from the outer query, so its result can differ
                per outer row.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Uncorrelated subquery: </dt>
              <dd className="inline text-stone-600">
                a subquery with no reference to the outer row, so its result is the same no matter
                which outer row is being processed.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming subqueries are just "a query inside a query" with no performance difference
          between the two kinds. A correlated subquery run against a large outer table can mean
          thousands of repeated subquery executions — one per outer row — while an uncorrelated
          subquery, computed once, stays cheap no matter how large the outer table gets.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click "Process next row" to step through the 5 employees one at a time.</li>
          <li>
            Watch the execution counter — in correlated mode it climbs with every row; in
            uncorrelated mode it stops at 1.
          </li>
          <li>Switch tabs to compare the same 5 rows under the other kind of subquery.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={step}
          disabled={rowIdx >= EMPLOYEES.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Process next row
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span
          className={`ml-2 text-sm font-medium ${kind === 'correlated' && subqueryRuns >= 3 ? 'text-rose-600' : 'text-stone-600'}`}
        >
          Subquery executed: {subqueryRuns} time{subqueryRuns === 1 ? '' : 's'}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase text-stone-400">
            <th className="py-1 text-left font-normal">name</th>
            <th className="py-1 text-left font-normal">dept</th>
            <th className="py-1 text-left font-normal">salary</th>
            <th className="py-1 text-left font-normal">
              {kind === 'correlated' ? 'dept avg (subquery)' : 'company avg (subquery)'}
            </th>
            <th className="py-1 text-left font-normal">qualifies?</th>
          </tr>
        </thead>
        <tbody>
          {EMPLOYEES.map((e, i) => {
            const processed = i <= rowIdx;
            const t = kind === 'correlated' ? deptAvg(e.dept) : companyAvg;
            const q = processed && e.salary > t;
            return (
              <tr
                key={e.id}
                className={`border-t border-stone-100 ${i === rowIdx ? 'bg-violet-50' : ''}`}
              >
                <td className="py-1.5">{e.name}</td>
                <td className="py-1.5">{e.dept}</td>
                <td className="py-1.5 font-mono">${e.salary.toLocaleString()}</td>
                <td className="py-1.5 font-mono">
                  {processed ? `$${Math.round(t).toLocaleString()}` : '—'}
                </td>
                <td className="py-1.5">
                  {processed ? (
                    q ? (
                      <span className="font-medium text-emerald-600">yes</span>
                    ) : (
                      <span className="text-stone-400">no</span>
                    )
                  ) : (
                    '—'
                  )}
                </td>
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
