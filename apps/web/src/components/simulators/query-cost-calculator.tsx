/**
 * Component: QueryCostCalculator
 * Serves: act6-d5-ch04-query-cost-estimation ("Query Cost Estimation")
 *
 * What it demonstrates:
 *   The same query costed two ways — a full table scan versus an index seek —
 *   computing estimated I/O (disk block read) counts for each, so the student can see
 *   concretely why a query optimizer prefers one plan over the other, and why that
 *   preference can flip depending on how selective the query is.
 *
 * Design decisions:
 *   - Cost is computed from adjustable, named parameters (table rows, rows per disk
 *     block, and query selectivity) via the standard textbook formulas, rather than a
 *     single fixed example, so the student can find the crossover point themselves —
 *     the moment a full scan actually becomes cheaper than an index seek — instead of
 *     being told it exists.
 *   - Index seek cost uses a simple, explicit model (a small fixed cost to walk the
 *     index structure, plus one I/O per matching row) rather than a more precise but
 *     opaque formula, so every number in the final total can be traced back to a
 *     labeled term in the breakdown.
 *   - The crossover point is surfaced explicitly as its own callout once the
 *     selectivity slider crosses it, directly addressing the common misconception
 *     that an index is always the faster choice.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export default function QueryCostCalculator() {
  const [totalRows, setTotalRows] = useState(100000);
  const [rowsPerBlock, setRowsPerBlock] = useState(100);
  const [selectivityPct, setSelectivityPct] = useState(0.1); // % of rows matching the query

  const totalBlocks = Math.ceil(totalRows / rowsPerBlock);
  const matchingRows = Math.round(totalRows * (selectivityPct / 100));

  const fullScanCost = totalBlocks; // must read every block, regardless of how many rows match

  const indexTraversalCost = Math.max(1, Math.ceil(Math.log2(totalRows))); // walking the index structure itself
  const indexSeekCost = indexTraversalCost + matchingRows; // + 1 I/O per matching row (worst case, unclustered)

  const indexWins = indexSeekCost < fullScanCost;
  const crossoverPct = Math.max(
    0.01,
    Math.min(100, ((fullScanCost - indexTraversalCost) / totalRows) * 100),
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A query optimizer picks a plan by estimating its <strong>cost</strong> — usually
          approximated as the number of disk block reads (<strong>I/O operations</strong>) it will
          take. A <strong>full table scan</strong> reads every block in the table, no matter how few
          rows actually match. An <strong>index seek</strong> uses an index to jump straight to
          matching rows, but each matching row typically still costs its own I/O to fetch. Whichever
          plan has the lower estimated cost is the one the optimizer picks.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">I/O operation: </dt>
              <dd className="inline text-stone-600">
                one disk block read — the standard unit query cost is measured in, since disk access
                is usually the slowest part.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Selectivity: </dt>
              <dd className="inline text-stone-600">
                what fraction of the table's rows actually match the query's condition.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Full table scan: </dt>
              <dd className="inline text-stone-600">
                reading every block of the table in order, checking each row against the condition.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming an index is always faster than a full scan. Watch what happens as you raise the
          selectivity slider below — once a large enough fraction of the table matches, an index
          seek ends up doing almost as many I/Os as just reading everything sequentially would, plus
          the overhead of the index structure itself, so a full scan can genuinely win. This is
          exactly why optimizers estimate costs instead of always trusting whichever index exists.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Adjust table size, rows per block, and query selectivity below.</li>
          <li>Compare the two computed costs — the cheaper plan is highlighted.</li>
          <li>Slide selectivity up until the winner flips, and read the crossover explanation.</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs text-stone-500">Table rows: {totalRows.toLocaleString()}</label>
          <input
            type="range"
            min={1000}
            max={1000000}
            step={1000}
            value={totalRows}
            onChange={(e) => setTotalRows(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">Rows per disk block: {rowsPerBlock}</label>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={rowsPerBlock}
            onChange={(e) => setRowsPerBlock(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">
            Query selectivity: {selectivityPct}% of rows match
          </label>
          <input
            type="range"
            min={0.1}
            max={100}
            step={0.1}
            value={selectivityPct}
            onChange={(e) => setSelectivityPct(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className={`rounded-md border p-4 ${!indexWins ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200'}`}
        >
          <p className="mb-1 text-sm font-semibold text-stone-900">Full table scan</p>
          <p className="text-xs text-stone-600">
            Reads all {totalBlocks.toLocaleString()} blocks, regardless of matches.
          </p>
          <p className="mt-2 font-mono text-lg font-semibold">
            {fullScanCost.toLocaleString()} I/Os
          </p>
        </div>
        <div
          className={`rounded-md border p-4 ${indexWins ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200'}`}
        >
          <p className="mb-1 text-sm font-semibold text-stone-900">Index seek</p>
          <p className="text-xs text-stone-600">
            ~{indexTraversalCost} I/Os to traverse the index + {matchingRows.toLocaleString()} I/Os,
            one per matching row.
          </p>
          <p className="mt-2 font-mono text-lg font-semibold">
            {indexSeekCost.toLocaleString()} I/Os
          </p>
        </div>
      </div>

      <div
        className={`rounded-lg p-4 text-sm ${indexWins ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
      >
        <p className="font-semibold">
          {indexWins
            ? `Index seek wins here — the query is selective enough (only ${matchingRows.toLocaleString()} of ${totalRows.toLocaleString()} rows match) that jumping straight to matches beats reading every block.`
            : `Full scan wins here — at ${selectivityPct}% selectivity, the index seek's per-row I/O cost adds up to more than just reading every block sequentially. The optimizer would pick the full scan.`}
        </p>
        <p className="mt-1 text-xs opacity-80">
          Rough crossover for this table size: around {crossoverPct.toFixed(2)}% selectivity.
        </p>
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
