/**
 * Component: HashIndexMode
 *
 * INTEGRATION NOTE: the build spec calls for this to be added as a new
 * "DB-indexing mode" on the existing `hash-table-visualizer` component (built
 * earlier for a data-structures chapter), rather than a fully separate file — but
 * that existing component's source isn't available in this environment to open and
 * extend directly (no repo access in this session, same situation as ch04's
 * wait-for-graph mode). This file is a complete, self-contained mode that works
 * standalone right now; whoever has repo access should fold it into
 * hash-table-visualizer as an additional mode (reusing its bucket-array
 * shell/controls) rather than shipping this as a permanently separate file.
 *
 * Serves: act6-d5-ch03-hashing ("Hashing for Indexing")
 *
 * What it demonstrates:
 *   A hash-based index answering an equality lookup in O(1) — jump straight to the
 *   right bucket — contrasted directly against the same index being unable to answer
 *   a range query without scanning every single bucket, since hashing deliberately
 *   scatters values and destroys any sense of order. The same dataset and the same
 *   two query types are the ones btree-visualizer (already built) uses to show a
 *   B+Tree handling both cases well, so a student can compare the two structures'
 *   tradeoffs directly.
 *
 * Design decisions:
 *   - Uses a small (8-bucket) hash table with a simple mod-8 hash function so bucket
 *     placement is fully visible and predictable by hand, rather than a realistic
 *     hash function whose scatter pattern would look arbitrary to a beginner.
 *   - Both query types run against literally the same loaded dataset in the same
 *     table state, so the O(1) vs. full-scan contrast isn't an artifact of different
 *     data — same structure, same data, two different query shapes.
 *   - The range query is animated actually checking every bucket (not just claiming
 *     it would have to) so "no shortcut exists" is demonstrated, not asserted.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const NUM_BUCKETS = 8;
const RECORDS = [
  { id: 3, name: 'Ada' },
  { id: 11, name: 'Alan' },
  { id: 19, name: 'Grace' },
  { id: 22, name: 'Hedy' },
  { id: 7, name: 'Katherine' },
];
const hash = (id: number) => id % NUM_BUCKETS;

type QueryMode = 'equality' | 'range';

export default function HashIndexMode() {
  const [query, setQuery] = useState<QueryMode>('equality');
  const [target, setTarget] = useState(19);
  const [rangeChecked, setRangeChecked] = useState(0);
  const [equalityDone, setEqualityDone] = useState(false);

  const buckets: Record<number, typeof RECORDS> = {};
  for (let i = 0; i < NUM_BUCKETS; i++) buckets[i] = [];
  RECORDS.forEach((r) => buckets[hash(r.id)].push(r));

  const equalityBucket = hash(target);
  const equalityResult = buckets[equalityBucket].find((r) => r.id === target);

  const rangeResults = RECORDS.filter((r) => r.id >= 10 && r.id <= 20);
  const runRange = () => {
    setRangeChecked(0);
    let i = 0;
    const tick = () => {
      i++;
      setRangeChecked(i);
      if (i < NUM_BUCKETS) setTimeout(tick, 250);
    };
    tick();
  };
  const runEquality = () => setEqualityDone(true);
  const reset = () => {
    setRangeChecked(0);
    setEqualityDone(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => {
            setQuery('equality');
            reset();
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${query === 'equality' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Equality lookup
        </button>
        <button
          onClick={() => {
            setQuery('range');
            reset();
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${query === 'range' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Range query
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>hash index</strong> speeds up lookups by running a search key through a{' '}
          <strong>hash function</strong> that computes exactly which bucket it belongs in — so an
          equality lookup ("find id = 19") jumps straight there in one step, <strong>O(1)</strong>,
          no matter how big the table gets. But hashing deliberately scatters values around — id 19
          might land in a completely different bucket than id 20 — so there's no way to ask "give me
          everything between 10 and 20" without checking every single bucket.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Hash function: </dt>
              <dd className="inline text-stone-600">
                a calculation that turns a key into a bucket number — here, id mod 8.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">O(1) lookup: </dt>
              <dd className="inline text-stone-600">
                constant time — the number of steps doesn't grow as the table grows, because the
                hash function jumps straight to the right bucket.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Range query: </dt>
              <dd className="inline text-stone-600">
                a query asking for every value within some range, e.g. id BETWEEN 10 AND 20.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming a hash index is just a strictly better version of a B+Tree index since it's O(1)
          instead of O(log n). Speed on equality lookups isn't the whole story — a hash index can't
          do range queries at all without a full scan, while a B+Tree (see the B+Tree simulator,
          same dataset) keeps keys sorted and can walk a range directly. Which index is "better"
          depends entirely on what kind of queries the table actually needs to answer.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        {query === 'equality' ? (
          <ol className="list-inside list-decimal space-y-0.5">
            <li>Pick a target id below, then click "Run lookup."</li>
            <li>Watch it jump directly to one bucket — no other buckets get touched.</li>
          </ol>
        ) : (
          <ol className="list-inside list-decimal space-y-0.5">
            <li>Click "Run range query" to search for every id between 10 and 20.</li>
            <li>
              Watch it check every single bucket in turn — there's no shortcut, even though only 2
              records actually match.
            </li>
          </ol>
        )}
      </div>

      {query === 'equality' ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={target}
            onChange={(e) => {
              setTarget(Number(e.target.value));
              setEqualityDone(false);
            }}
            className="rounded-md border border-stone-300 px-2 py-2 font-mono text-sm"
          >
            {RECORDS.map((r) => (
              <option key={r.id} value={r.id}>
                id = {r.id} ({r.name})
              </option>
            ))}
          </select>
          <button
            onClick={runEquality}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Run lookup
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-stone-600">WHERE id BETWEEN 10 AND 20</span>
          <button
            onClick={runRange}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Run range query
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
          >
            Reset
          </button>
        </div>
      )}

      {/* Bucket array */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {Array.from({ length: NUM_BUCKETS }).map((_, i) => {
          const touchedEquality = query === 'equality' && equalityDone && i === equalityBucket;
          const touchedRange = query === 'range' && i < rangeChecked;
          const hasMatchInRange =
            query === 'range' && buckets[i].some((r) => r.id >= 10 && r.id <= 20);
          return (
            <div
              key={i}
              className={`min-h-[70px] rounded-md border p-2 text-xs transition-all duration-200 ${
                touchedEquality
                  ? 'border-emerald-400 bg-emerald-100'
                  : touchedRange
                    ? hasMatchInRange
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-amber-200 bg-amber-50'
                    : 'border-stone-200 bg-stone-50'
              }`}
            >
              <p className="font-mono text-stone-400">bucket {i}</p>
              {buckets[i].map((r) => (
                <p key={r.id} className="font-mono text-stone-700">
                  id {r.id}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      {query === 'equality' && equalityDone && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            1 bucket checked (bucket {equalityBucket}) — found{' '}
            {equalityResult ? `${equalityResult.name} (id ${equalityResult.id})` : 'no match'}.
            That's O(1): the hash function computed the bucket directly.
          </p>
        </div>
      )}
      {query === 'range' && rangeChecked >= NUM_BUCKETS && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            All {NUM_BUCKETS} buckets checked to find {rangeResults.length} matching record(s) —
            there was no way to know in advance which buckets might contain a value in range, so
            every bucket had to be scanned.
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
