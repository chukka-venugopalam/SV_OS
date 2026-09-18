/**
 * Component: WalRecoverySim
 * Serves: act6-d4-ch05-recovery-wal-checkpoints ("Recovery — WAL, Checkpoints")
 *
 * What it demonstrates:
 *   A write-ahead log with a student-chosen crash point, then a replay that applies
 *   REDO to every transaction that had already committed before the crash and UNDO to
 *   every transaction that hadn't — with a checkpoint marker shown shortening how far
 *   back recovery actually needs to replay from.
 *
 * Design decisions:
 *   - The log contains three transactions with deliberately different fates relative
 *     to the crash point (one fully committed, one still active when the crash
 *     happens, one that started after the checkpoint) so REDO and UNDO both have a
 *     genuine example to act on, not just one or the other.
 *   - The crash point is chosen by clicking directly on a log entry, and recovery
 *     scope is computed generically from the actual log content (which transactions
 *     have a COMMIT record before the crash vs. not) rather than being hardcoded to
 *     one specific crash point, so the demonstration holds regardless of where the
 *     student clicks.
 *   - The checkpoint's effect is shown as a concrete "here's exactly how many log
 *     entries recovery can skip" comparison (from the checkpoint vs. from the very
 *     start of the log) rather than an abstract "checkpoints help" statement.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface LogEntry {
  idx: number;
  tx: string;
  kind: 'START' | 'WRITE' | 'COMMIT' | 'CHECKPOINT';
  detail: string;
}

const LOG: LogEntry[] = [
  { idx: 0, tx: 'T1', kind: 'START', detail: '' },
  { idx: 1, tx: 'T1', kind: 'WRITE', detail: 'A = 10' },
  { idx: 2, tx: 'T1', kind: 'COMMIT', detail: '' },
  { idx: 3, tx: '-', kind: 'CHECKPOINT', detail: '' },
  { idx: 4, tx: 'T2', kind: 'START', detail: '' },
  { idx: 5, tx: 'T2', kind: 'WRITE', detail: 'B = 20' },
  { idx: 6, tx: 'T3', kind: 'START', detail: '' },
  { idx: 7, tx: 'T3', kind: 'WRITE', detail: 'C = 30' },
  { idx: 8, tx: 'T2', kind: 'COMMIT', detail: '' },
  { idx: 9, tx: 'T3', kind: 'WRITE', detail: 'C = 35' },
  // crash happens somewhere after this point, chosen by the student
];

export default function WalRecoverySim() {
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [recovered, setRecovered] = useState(false);

  const checkpointIdx = LOG.findIndex((e) => e.kind === 'CHECKPOINT');
  const visibleLog = crashAt === null ? LOG : LOG.slice(0, crashAt + 1);

  const committedTx = new Set(visibleLog.filter((e) => e.kind === 'COMMIT').map((e) => e.tx));
  const startedTx = new Set(visibleLog.filter((e) => e.kind === 'START').map((e) => e.tx));
  const uncommittedTx = [...startedTx].filter((tx) => !committedTx.has(tx));

  const scanFrom =
    checkpointIdx >= 0 && checkpointIdx <= (crashAt ?? LOG.length) ? checkpointIdx : 0;
  const entriesSkipped = scanFrom; // entries before checkpoint that don't need scanning
  const entriesScanned = (crashAt ?? LOG.length - 1) - scanFrom + 1;

  const reset = () => {
    setCrashAt(null);
    setRecovered(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A <strong>write-ahead log (WAL)</strong> records every transaction's actions before
          they're applied to the actual database, so the system can recover correctly after a crash.
          On restart, recovery scans the log and applies <strong>REDO</strong> to any transaction
          that had already committed (making sure its changes really did make it to disk) and{' '}
          <strong>UNDO</strong> to any transaction that hadn't (rolling back its partial changes,
          since it never finished). A <strong>checkpoint</strong> is a marker saying "everything
          before this point is already safely on disk," so recovery never needs to scan further back
          than the most recent one.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">REDO: </dt>
              <dd className="inline text-stone-600">
                re-apply a committed transaction's changes, in case they hadn't made it to disk
                before the crash.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">UNDO: </dt>
              <dd className="inline text-stone-600">
                roll back an uncommitted transaction's changes, since it never finished.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Checkpoint: </dt>
              <dd className="inline text-stone-600">
                a log marker confirming everything before it is durably saved, letting recovery skip
                scanning that far back.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming recovery always has to replay the entire log from the very beginning. It doesn't
          — recovery only needs to start scanning from the most recent checkpoint, since anything
          before that is already guaranteed durable. A long-running database with no checkpoints
          would mean an ever-growing recovery scan; checkpoints keep it bounded.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click any log entry below to simulate a crash happening right after it.</li>
          <li>
            Click "Run recovery" to see which transactions get REDO'd, which get UNDO'd, and why.
          </li>
          <li>
            Compare "entries scanned from checkpoint" vs. "entries that would've been scanned from
            the very start."
          </li>
        </ol>
      </div>

      <div className="space-y-1">
        {LOG.map((e) => {
          const isCrashPoint = crashAt === e.idx;
          const isPastCrash = crashAt !== null && e.idx > crashAt;
          return (
            <button
              key={e.idx}
              onClick={() => {
                setCrashAt(e.idx);
                setRecovered(false);
              }}
              className={`w-full rounded border px-3 py-1.5 text-left font-mono text-xs transition-all ${
                isPastCrash
                  ? 'border-stone-100 opacity-20'
                  : isCrashPoint
                    ? 'border-rose-400 bg-rose-100'
                    : e.kind === 'CHECKPOINT'
                      ? 'border-violet-300 bg-violet-100'
                      : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              [{e.idx}]{' '}
              {e.kind === 'CHECKPOINT'
                ? 'CHECKPOINT'
                : `${e.tx}: ${e.kind}${e.detail ? ' ' + e.detail : ''}`}
              {isCrashPoint && ' ← CRASH HERE'}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRecovered(true)}
          disabled={crashAt === null}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Run recovery
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {recovered && crashAt !== null && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm">
              <p className="mb-1 font-semibold text-emerald-900">REDO</p>
              {[...committedTx].length === 0 && (
                <p className="text-xs text-emerald-800">No committed transactions to redo.</p>
              )}
              {[...committedTx].map((tx) => (
                <p key={tx} className="text-xs text-emerald-800">
                  {tx}: re-apply its writes (was committed before the crash).
                </p>
              ))}
            </div>
            <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm">
              <p className="mb-1 font-semibold text-rose-900">UNDO</p>
              {uncommittedTx.length === 0 && (
                <p className="text-xs text-rose-800">No uncommitted transactions to undo.</p>
              )}
              {uncommittedTx.map((tx) => (
                <p key={tx} className="text-xs text-rose-800">
                  {tx}: roll back its writes (never committed before the crash).
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-stone-200 p-3 text-sm text-stone-700">
            <p>
              Recovery scans from the checkpoint (entry {scanFrom}) instead of entry 0 — that's{' '}
              <span className="font-semibold">{entriesScanned}</span> entries scanned, versus{' '}
              <span className="font-semibold">{(crashAt ?? 0) + 1}</span> if there had been no
              checkpoint at all ({entriesSkipped} entries skipped).
            </p>
          </div>
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
