/**
 * Component: GroupByVisualizer
 * Serves: act6-d2-ch05-aggregate-functions-group-by ("Aggregate Functions & GROUP BY")
 *
 * What it demonstrates:
 *   Rows clustering into color-coded groups by a GROUP BY column, then each group
 *   visibly collapsing into a single output row via an aggregate function
 *   (COUNT/SUM/AVG); and HAVING filtering groups *after* that aggregation, directly
 *   contrasted against WHERE filtering individual rows *before* grouping happens.
 *
 * Design decisions:
 *   - Uses one small sales table (8 rows across 3 regions) so every row's group
 *     membership and every group's aggregate value can be verified by hand, not just
 *     trusted.
 *   - WHERE and HAVING are shown as two genuinely different filters over the same
 *     data rather than abstractly described, with WHERE's row-level cut applied
 *     first and visibly removing rows *before* grouping, and HAVING's group-level cut
 *     applied after aggregation — so "WHERE can't see the aggregate, HAVING can" is
 *     something demonstrated, not asserted.
 *   - Aggregate function is a live selector (COUNT/SUM/AVG) rather than fixed to one,
 *     so the "groups collapse into one row via SOME aggregate" idea generalizes
 *     instead of looking tied to a single function.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Sale {
  id: number;
  region: string;
  amount: number;
}

const SALES: Sale[] = [
  { id: 1, region: 'West', amount: 120 },
  { id: 2, region: 'West', amount: 340 },
  { id: 3, region: 'West', amount: 90 },
  { id: 4, region: 'East', amount: 500 },
  { id: 5, region: 'East', amount: 60 },
  { id: 6, region: 'North', amount: 210 },
  { id: 7, region: 'North', amount: 190 },
  { id: 8, region: 'North', amount: 40 },
];

const REGION_COLOR: Record<string, string> = {
  West: 'bg-sky-100 border-sky-300 text-sky-800',
  East: 'bg-rose-100 border-rose-300 text-rose-800',
  North: 'bg-amber-100 border-amber-300 text-amber-800',
};

type Agg = 'COUNT' | 'SUM' | 'AVG';
type Stage = 'raw' | 'where' | 'grouped' | 'aggregated' | 'having';

function aggregate(rows: Sale[], agg: Agg): number {
  if (agg === 'COUNT') return rows.length;
  const sum = rows.reduce((s, r) => s + r.amount, 0);
  return agg === 'SUM' ? sum : Math.round((sum / rows.length) * 10) / 10;
}

export default function GroupByVisualizer() {
  const [stage, setStage] = useState<Stage>('raw');
  const [agg, setAgg] = useState<Agg>('SUM');
  const [whereMin, setWhereMin] = useState(0); // WHERE amount > whereMin, 0 = no filter
  const [havingMin, setHavingMin] = useState(0); // HAVING agg(amount) > havingMin, 0 = no filter

  const afterWhere = SALES.filter((s) => s.amount > whereMin);
  const regions = [...new Set(afterWhere.map((s) => s.region))];
  const groups = regions.map((r) => ({
    region: r,
    rows: afterWhere.filter((s) => s.region === r),
  }));
  const withAgg = groups.map((g) => ({ ...g, value: aggregate(g.rows, agg) }));
  const afterHaving = withAgg.filter((g) => g.value > havingMin);

  const stages: { key: Stage; label: string }[] = [
    { key: 'raw', label: '1. Raw rows' },
    { key: 'where', label: '2. Apply WHERE' },
    { key: 'grouped', label: '3. GROUP BY region' },
    { key: 'aggregated', label: `4. Aggregate (${agg})` },
    { key: 'having', label: '5. Apply HAVING' },
  ];
  const stageIdx = stages.findIndex((s) => s.key === stage);
  const next = () => setStage(stages[Math.min(stages.length - 1, stageIdx + 1)].key);
  const reset = () => setStage('raw');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>GROUP BY</strong> clusters rows that share the same value in some column, then an{' '}
          <strong>aggregate function</strong> (like COUNT, SUM, or AVG) collapses each cluster down
          into a single summary row. <strong>WHERE</strong> and <strong>HAVING</strong> both filter,
          but at different points: WHERE removes individual rows before any grouping happens, while
          HAVING removes entire groups after aggregation — which means only HAVING can filter based
          on the aggregate value itself.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Aggregate function: </dt>
              <dd className="inline text-stone-600">
                a function that reduces many rows down to a single value, like COUNT, SUM, or AVG.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">WHERE: </dt>
              <dd className="inline text-stone-600">
                filters individual rows before grouping — it never sees the aggregated value.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">HAVING: </dt>
              <dd className="inline text-stone-600">
                filters entire groups after aggregation, based on the aggregate's result.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          trying to use WHERE to filter on an aggregate, like{' '}
          <span className="font-mono">WHERE SUM(amount) &gt; 300</span>. That fails — WHERE runs
          before grouping even happens, so there's no SUM yet for it to compare against. Filtering
          on an aggregated value always requires HAVING instead.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Optionally set a WHERE threshold and a HAVING threshold below, and pick an aggregate
            function.
          </li>
          <li>
            Click "Next stage" to walk through: raw rows → WHERE filter → grouping → aggregation →
            HAVING filter.
          </li>
          <li>
            Watch rows disappear at the WHERE stage (before grouping) vs. whole groups disappear at
            the HAVING stage (after aggregation).
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs text-stone-500">Aggregate function</label>
          <div className="mt-1 flex gap-1">
            {(['COUNT', 'SUM', 'AVG'] as Agg[]).map((a) => (
              <button
                key={a}
                onClick={() => setAgg(a)}
                className={`rounded border px-2 py-1 font-mono text-xs ${agg === a ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500">WHERE amount &gt; {whereMin}</label>
          <input
            type="range"
            min={0}
            max={200}
            step={10}
            value={whereMin}
            onChange={(e) => setWhereMin(Number(e.target.value))}
            className="block w-32"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">
            HAVING {agg}(amount) &gt; {havingMin}
          </label>
          <input
            type="range"
            min={0}
            max={600}
            step={20}
            value={havingMin}
            onChange={(e) => setHavingMin(Number(e.target.value))}
            className="block w-32"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={stage === 'having'}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next stage
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span className="ml-2 text-sm text-stone-500">{stages[stageIdx].label}</span>
      </div>

      {(stage === 'raw' || stage === 'where') && (
        <div className="flex flex-wrap gap-1">
          {SALES.map((s) => {
            const filtered = stage === 'where' && s.amount <= whereMin;
            return (
              <span
                key={s.id}
                className={`rounded border px-2 py-1 text-xs ${filtered ? 'line-through opacity-25' : REGION_COLOR[s.region]}`}
              >
                {s.region} ${s.amount}
              </span>
            );
          })}
        </div>
      )}

      {(stage === 'grouped' || stage === 'aggregated' || stage === 'having') && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {withAgg.map((g) => {
            const excluded = stage === 'having' && g.value <= havingMin;
            return (
              <div
                key={g.region}
                className={`rounded-md border p-2 ${excluded ? 'opacity-30' : REGION_COLOR[g.region]}`}
              >
                <p className="mb-1 text-xs font-semibold">{g.region}</p>
                {stage === 'grouped' ? (
                  <div className="flex flex-wrap gap-1">
                    {g.rows.map((r) => (
                      <span key={r.id} className="rounded bg-white/60 px-1 text-[10px]">
                        ${r.amount}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-sm font-semibold">
                    {agg}(amount) = {g.value}
                  </p>
                )}
                {excluded && <p className="mt-1 text-[10px] italic">excluded by HAVING</p>}
              </div>
            );
          })}
        </div>
      )}

      {stage === 'having' && (
        <p className="text-sm text-stone-600">
          Final result: {afterHaving.length} of {withAgg.length} group(s) remain.
        </p>
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
