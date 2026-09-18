/**
 * Component: TwoPhaseLockSim
 * Serves: act6-d4-ch03-locking-protocols-2pl ("Locking Protocols — 2PL")
 *
 * What it demonstrates:
 *   Two transactions acquiring shared (S) and exclusive (X) locks, with a clearly
 *   separated growing phase (only acquiring locks) and shrinking phase (only
 *   releasing them) per transaction, and a genuine lock-wait: T2 blocking until T1
 *   releases a lock T2 needs.
 *
 * Design decisions:
 *   - Uses a fixed, small operation script for T1 and T2 (rather than free-form lock
 *     requests) so the growing/shrinking boundary and the exact moment of blocking
 *     are guaranteed to occur and be visible, instead of depending on the student
 *     picking a scenario that happens to demonstrate them.
 *   - T2's script deliberately requests an X-lock on an item T1 is already holding
 *     exclusively, so the block is real and resolves only once T1's script reaches
 *     its release step — the wait is computed from actual lock-table state, not
 *     staged for effect.
 *   - Each transaction's timeline is visually split at its own growing→shrinking
 *     boundary (the first release), since 2PL's defining rule is that boundary must
 *     never be crossed back over — no acquisitions are allowed to happen once
 *     shrinking has started.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type LockType = 'S' | 'X';
interface Step {
  tx: 'T1' | 'T2';
  kind: 'acquire' | 'release';
  lockType?: LockType;
  item: string;
}

// T1: locks A (S), locks B (X), releases A, releases B
// T2: locks B (X) — will block until T1 releases B — then releases it
const STEPS: Step[] = [
  { tx: 'T1', kind: 'acquire', lockType: 'S', item: 'A' },
  { tx: 'T1', kind: 'acquire', lockType: 'X', item: 'B' },
  { tx: 'T2', kind: 'acquire', lockType: 'X', item: 'B' }, // will block
  { tx: 'T1', kind: 'release', item: 'A' },
  { tx: 'T1', kind: 'release', item: 'B' }, // unblocks T2
  { tx: 'T2', kind: 'acquire', lockType: 'X', item: 'B' }, // T2's blocked request actually granted here
  { tx: 'T2', kind: 'release', item: 'B' },
];

interface LockState {
  item: string;
  holder: 'T1' | 'T2' | null;
  type: LockType | null;
}

export default function TwoPhaseLockSim() {
  const [idx, setIdx] = useState(0);
  const [locks, setLocks] = useState<Record<string, LockState>>({
    A: { item: 'A', holder: null, type: null },
    B: { item: 'B', holder: null, type: null },
  });
  const [blockedIndices, setBlockedIndices] = useState<Set<number>>(new Set());
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Advances exactly one tick: attempts STEPS[idx]. A blocked acquire does NOT change
  // lock state, but the tick still advances (this models "T2's attempt fails and it
  // waits, while the schedule moves on to T1's next step") — a later retry step for
  // the same request (already present later in STEPS) succeeds once the lock frees.
  const stepOnce = () => {
    if (idx >= STEPS.length) return;
    const step = STEPS[idx];
    if (step.kind === 'acquire') {
      const current = locks[step.item];
      const conflict = current.holder && current.holder !== step.tx;
      if (conflict) {
        setBlockedIndices((b) => new Set(b).add(idx));
        setIdx((i) => i + 1);
        return;
      }
      setLocks((l) => ({
        ...l,
        [step.item]: { item: step.item, holder: step.tx, type: step.lockType! },
      }));
    } else {
      setLocks((l) => ({ ...l, [step.item]: { item: step.item, holder: null, type: null } }));
    }
    setIdx((i) => i + 1);
  };

  useEffect(() => {
    if (!running) return;
    if (idx >= STEPS.length) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, 800);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, idx]);

  const reset = () => {
    clearTimer();
    setIdx(0);
    setRunning(false);
    setBlockedIndices(new Set());
    setLocks({
      A: { item: 'A', holder: null, type: null },
      B: { item: 'B', holder: null, type: null },
    });
  };

  // "currently waiting" = most recent blocked index whose lock hasn't been granted by
  // a later successful step for the same (tx, item) pair yet.
  const currentlyBlocked = [...blockedIndices]
    .filter((i) => {
      const step = STEPS[i];
      const grantedLater = STEPS.some(
        (s, j) =>
          j > i && j < idx && s.tx === step.tx && s.item === step.item && s.kind === 'acquire',
      );
      return !grantedLater;
    })
    .map((i) => STEPS[i])
    .pop();

  // growing/shrinking boundary per transaction = index of its first release step
  const firstReleaseIdx = (tx: 'T1' | 'T2') =>
    STEPS.findIndex((s) => s.tx === tx && s.kind === 'release');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          <strong>Two-Phase Locking (2PL)</strong> is a rule that guarantees serializable schedules:
          every transaction is split into a <strong>growing phase</strong>, where it only ever{' '}
          <em>acquires</em> new locks, followed by a <strong>shrinking phase</strong>, where it only
          ever <em>releases</em> them — never both in the same transaction after the first release.
          If a transaction tries to acquire a lock another transaction already holds incompatibly,
          it has to <strong>wait</strong> until that lock is released.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Shared (S) lock: </dt>
              <dd className="inline text-stone-600">
                lets a transaction read an item; multiple transactions can hold a shared lock on the
                same item at once.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Exclusive (X) lock: </dt>
              <dd className="inline text-stone-600">
                lets a transaction write an item; no other transaction can hold any lock on that
                item at the same time.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Growing / shrinking phase: </dt>
              <dd className="inline text-stone-600">
                the two halves of a 2PL transaction — all acquisitions first, then all releases,
                with the boundary crossed exactly once.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming a transaction can release one lock early and then acquire a different one later,
          as long as it "seems fine." 2PL forbids this outright — the instant a transaction releases
          its first lock, it has entered the shrinking phase and is not allowed to acquire any new
          lock ever again, even one it never touched before.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click "Step forward" or "Run" to play through T1 and T2's lock requests in order.</li>
          <li>Watch T2 try to lock B while T1 still holds it — T2 blocks until T1 releases.</li>
          <li>
            Notice each transaction's timeline splits into a growing phase (acquires) then shrinking
            phase (releases), never back again.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRunning(true)}
          disabled={idx >= STEPS.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Run
        </button>
        <button
          onClick={stepOnce}
          disabled={idx >= STEPS.length}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Step forward
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        {currentlyBlocked && (
          <span className="text-sm font-medium text-rose-600">
            {currentlyBlocked.tx} is BLOCKED waiting for lock on {currentlyBlocked.item}
          </span>
        )}
      </div>

      {/* Lock table */}
      <div className="grid grid-cols-2 gap-3">
        {Object.values(locks).map((l) => (
          <div key={l.item} className="rounded-md border border-stone-200 p-3 text-sm">
            <p className="font-mono font-semibold text-stone-900">Item {l.item}</p>
            <p className="text-stone-600">
              {l.holder ? `Held by ${l.holder} (${l.type}-lock)` : 'Unlocked'}
            </p>
          </div>
        ))}
      </div>

      {/* Transaction timelines */}
      {(['T1', 'T2'] as const).map((tx) => {
        const txSteps = STEPS.map((s, i) => ({ ...s, i })).filter((s) => s.tx === tx);
        const boundary = firstReleaseIdx(tx);
        return (
          <div key={tx}>
            <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">{tx} timeline</p>
            <div className="flex flex-wrap gap-1">
              {txSteps.map((s) => {
                const done = s.i < idx;
                const wasBlocked = blockedIndices.has(s.i);
                const isGrowing = s.i < boundary || boundary === -1;
                return (
                  <span
                    key={s.i}
                    className={`rounded border px-2 py-1 font-mono text-xs ${
                      wasBlocked
                        ? 'border-rose-500 bg-rose-400 text-white'
                        : done
                          ? isGrowing
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                            : 'border-amber-300 bg-amber-100 text-amber-800'
                          : 'border-stone-200 bg-stone-50 text-stone-300'
                    }`}
                  >
                    {s.kind === 'acquire' ? `+${s.lockType}(${s.item})` : `-lock(${s.item})`}
                    {wasBlocked && ' ⏳ (blocked, retried later)'}
                  </span>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-stone-400">
              Green = growing phase (acquiring). Amber = shrinking phase (releasing).
            </p>
          </div>
        );
      })}
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
