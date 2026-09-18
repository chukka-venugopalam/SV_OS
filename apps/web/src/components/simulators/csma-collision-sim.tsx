/**
 * Component: CsmaCollisionSim
 * Serves: act5-d2-ch05-mac-protocols-csma-cd-csma-ca ("MAC Protocols — CSMA/CD & CSMA/CA")
 *
 * What it demonstrates:
 *   The same scenario — two devices (A and B) both want to transmit on a shared
 *   medium at nearly the same moment — played out two ways:
 *     CSMA/CD (Ethernet-style): both start transmitting, collide mid-transmission,
 *     detect the collision, send a jam signal, and back off for a random time before
 *     retrying.
 *     CSMA/CA (Wi-Fi-style): before transmitting, a sender reserves the medium with an
 *     RTS/CTS handshake; the other device sees the CTS, learns the medium is reserved
 *     (NAV), and waits — so the collision is avoided rather than detected after the
 *     fact.
 *
 * Design decisions:
 *   - Both modes replay the identical starting scenario (A and B both wanting to send
 *     at tick 0) so the contrast is about the strategy, not about different luck.
 *   - CSMA/CD's backoff is shown as a fixed, visibly-random-looking wait for the demo
 *     (not literally random each render) so replaying the animation is reproducible
 *     for a classroom demo, with a note that real backoff is randomized (binary
 *     exponential backoff).
 *   - CSMA/CA introduces RTS/CTS and NAV explicitly as named steps rather than
 *     compressing the handshake into "and then it just works," since the handshake
 *     itself is the mechanism being taught.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Mode = 'cd' | 'ca';

interface StepDef {
  label: string;
  aState:
    'idle' | 'sensing' | 'transmit' | 'collide' | 'jam' | 'backoff' | 'retry' | 'rts' | 'wait';
  bState:
    | 'idle'
    | 'sensing'
    | 'transmit'
    | 'collide'
    | 'jam'
    | 'backoff'
    | 'retry'
    | 'cts'
    | 'nav'
    | 'waiting-nav'
    | 'transmit-b';
  note: string;
}

const CD_STEPS: StepDef[] = [
  {
    label: 't0',
    aState: 'sensing',
    bState: 'sensing',
    note: 'Both A and B sense the medium is idle.',
  },
  {
    label: 't1',
    aState: 'transmit',
    bState: 'transmit',
    note: 'Both start transmitting almost simultaneously — neither could hear the other yet.',
  },
  {
    label: 't2',
    aState: 'collide',
    bState: 'collide',
    note: 'Their signals overlap on the wire — a collision.',
  },
  {
    label: 't3',
    aState: 'jam',
    bState: 'jam',
    note: 'Both detect the collision and send a jam signal so everyone knows to stop.',
  },
  {
    label: 't4',
    aState: 'backoff',
    bState: 'backoff',
    note: 'Both pick a random backoff time and wait before trying again.',
  },
  {
    label: 't5',
    aState: 'retry',
    bState: 'idle',
    note: "A's random backoff finishes first — A senses the medium is clear and retransmits successfully.",
  },
];

const CA_STEPS: StepDef[] = [
  {
    label: 't0',
    aState: 'sensing',
    bState: 'sensing',
    note: 'Both A and B sense the medium is idle.',
  },
  {
    label: 't1',
    aState: 'rts',
    bState: 'idle',
    note: 'A sends a short RTS (Request To Send) to reserve the medium first.',
  },
  {
    label: 't2',
    aState: 'wait',
    bState: 'cts',
    note: 'The receiver replies with CTS (Clear To Send), granting A the medium.',
  },
  {
    label: 't3',
    aState: 'wait',
    bState: 'nav',
    note: 'B overhears the CTS and sets its NAV (Network Allocation Vector) — a timer telling it how long to stay silent.',
  },
  {
    label: 't4',
    aState: 'transmit',
    bState: 'waiting-nav',
    note: 'A transmits its full frame with the medium reserved — no collision, because B is deliberately staying quiet.',
  },
];

const TICK_MS = 900;

export default function CsmaCollisionSim() {
  const [mode, setMode] = useState<Mode>('cd');
  const steps = mode === 'cd' ? CD_STEPS : CA_STEPS;
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const reset = () => {
    clearTimer();
    setIdx(0);
    setRunning(false);
  };
  const stepOnce = () => setIdx((i) => Math.min(steps.length - 1, i + 1));

  useEffect(() => {
    if (!running) return;
    if (idx >= steps.length - 1) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, TICK_MS);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, idx, steps.length]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const current = steps[idx];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('cd')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'cd' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          CSMA/CD (Ethernet-style)
        </button>
        <button
          onClick={() => setMode('ca')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'ca' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          CSMA/CA (Wi-Fi-style)
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          When multiple devices share one communication medium (like an old Ethernet cable, or the
          airwaves in Wi-Fi), two devices can accidentally try to talk at once, garbling both
          messages — a <strong>collision</strong>. <strong>CSMA</strong> (Carrier Sense Multiple
          Access) means every device listens before transmitting, but that alone doesn't fully
          prevent collisions if two devices both start listening and both hear silence at the same
          moment.{' '}
          {mode === 'cd' ? (
            <>
              <strong>CSMA/CD</strong> (Collision Detection) handles this by letting collisions
              happen occasionally, but detecting them immediately and recovering fast.
            </>
          ) : (
            <>
              <strong>CSMA/CA</strong> (Collision Avoidance) instead tries to prevent the collision
              from ever happening, using a short reservation handshake before the real data is sent.
            </>
          )}
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            {mode === 'cd' ? (
              <>
                <div>
                  <dt className="inline font-medium text-stone-900">Jam signal: </dt>
                  <dd className="inline text-stone-600">
                    a short burst both devices send the instant they detect a collision, making sure
                    every device on the wire knows to stop.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Backoff: </dt>
                  <dd className="inline text-stone-600">
                    a random wait time each colliding device picks before retrying, so they don't
                    just collide again immediately.
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="inline font-medium text-stone-900">RTS / CTS: </dt>
                  <dd className="inline text-stone-600">
                    Request To Send / Clear To Send — a short handshake that reserves the medium
                    before the real transmission starts.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">NAV: </dt>
                  <dd className="inline text-stone-600">
                    Network Allocation Vector — a countdown timer other devices set after
                    overhearing a CTS, telling them how long to stay silent.
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
        <CommonMistake>
          {mode === 'cd'
            ? "thinking CSMA/CD prevents collisions entirely. It doesn't — it lets collisions happen (they're basically unavoidable with two independent senders) and focuses on detecting them within microseconds and recovering fast, which is why it works fine on a wired, short-distance medium like Ethernet."
            : "assuming CSMA/CA's handshake means collisions are now impossible. RTS/CTS makes them far less likely, but the RTS message itself is still sent without a reservation and can theoretically collide with another device's RTS — CA avoids most collisions, it doesn't mathematically guarantee zero."}
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Run all" or "Step forward" to play through the same scenario: A and B both want
            to transmit.
          </li>
          <li>Watch each device's status change on its own track.</li>
          <li>Read the note under the timeline explaining what's happening at each step.</li>
          <li>Switch tabs to replay the identical starting scenario under the other strategy.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            reset();
            setTimeout(() => setRunning(true), 50);
          }}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Run all
        </button>
        <button
          onClick={stepOnce}
          disabled={idx >= steps.length - 1}
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
      </div>

      <div className="space-y-3">
        <DeviceTrack name="Device A" state={current.aState} />
        <DeviceTrack name="Device B" state={current.bState} />
      </div>

      <div className="rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <span className="mr-2 font-mono text-xs text-stone-400">{current.label}</span>
        {current.note}
      </div>
    </div>
  );
}

const STATE_STYLE: Record<string, { label: string; className: string }> = {
  idle: { label: 'idle', className: 'bg-stone-50 border-stone-200 text-stone-400' },
  sensing: { label: 'sensing medium', className: 'bg-sky-50 border-sky-200 text-sky-700' },
  transmit: {
    label: 'transmitting',
    className: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  },
  'transmit-b': {
    label: 'transmitting (reserved)',
    className: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  },
  collide: { label: 'COLLISION', className: 'bg-rose-500 border-rose-600 text-white' },
  jam: { label: 'sending jam signal', className: 'bg-rose-300 border-rose-400 text-rose-900' },
  backoff: {
    label: 'random backoff wait',
    className: 'bg-amber-100 border-amber-300 text-amber-800',
  },
  retry: {
    label: 'retransmitting',
    className: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  },
  rts: { label: 'sending RTS', className: 'bg-violet-100 border-violet-300 text-violet-800' },
  cts: { label: 'sending CTS', className: 'bg-violet-200 border-violet-400 text-violet-900' },
  nav: { label: 'sets NAV timer', className: 'bg-amber-100 border-amber-300 text-amber-800' },
  wait: { label: 'waiting for reply', className: 'bg-sky-50 border-sky-200 text-sky-700' },
  'waiting-nav': {
    label: 'silent (NAV active)',
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
};

function DeviceTrack({ name, state }: { name: string; state: string }) {
  const s = STATE_STYLE[state] ?? STATE_STYLE.idle;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm font-medium text-stone-700">{name}</span>
      <div
        className={`flex h-10 flex-1 items-center rounded-md border px-3 text-sm transition-all duration-300 ${s.className}`}
      >
        {s.label}
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
