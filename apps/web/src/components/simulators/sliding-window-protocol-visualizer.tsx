/**
 * Component: SlidingWindowProtocolVisualizer
 * Serves: act5-d2-ch04-flow-control-stop-and-wait-sliding-window
 *         ("Flow Control — Stop-and-Wait & Sliding Window") — Stop-and-Wait / Sliding
 *         Window modes
 *         act5-d4-ch02-tcp-flow-control ("TCP Flow Control — Sliding Window") —
 *         TCP Flow Control mode (added in this revision)
 *
 * What it demonstrates:
 *   Stop-and-Wait: sender transmits exactly one frame, then sits idle until its ACK
 *   arrives before sending the next — the idle time is directly visible on a timeline.
 *   Sliding Window: sender may have up to `window size` frames in flight at once; as
 *   ACKs arrive the window slides forward, allowing the next frame to go out
 *   immediately instead of waiting — contrasted directly against Stop-and-Wait's
 *   throughput on an identical timeline.
 *   TCP Flow Control: the receiver's own advertised window shrinking as its buffer
 *   fills with data the application hasn't read yet, actively throttling how much
 *   more the sender is allowed to send — and growing back once the application drains
 *   the buffer.
 *
 * Design decisions:
 *   - Both link-layer modes share one fixed simulated link (propagation delay per
 *     frame = 3 ticks) so the throughput difference is a fair, apples-to-apples
 *     comparison rather than differing because the modes used different network
 *     conditions.
 *   - Stop-and-Wait is modeled as sliding window with window size fixed at 1, made
 *     explicit in the UI, so the student sees it's a special case rather than an
 *     unrelated protocol.
 *   - The window size is adjustable (2-6) in Sliding Window mode specifically so the
 *     student can watch total completion time shrink as the window grows, making the
 *     throughput benefit something they discover rather than something just stated.
 *   - TCP Flow Control mode is a per-spec extension (act5-d4-ch02) of this same
 *     component rather than a new file, added here as a third mode with its own
 *     complete WHAT-IS-THIS/KEY-TERMS/HOW-TO-USE/Common-Mistake block, since a
 *     *receiver's buffer* shrinking the window is a genuinely different idea for a
 *     beginner than the *link-layer's* fixed window size in the other two modes, even
 *     though both are called "sliding window."
 *   - TCP Flow Control uses direct click-driven actions (Send / App reads) instead of
 *     an automatic clock, because the whole point is cause-and-effect: the student
 *     should feel *why* the window shrank after clicking Send, not watch it happen on
 *     a timer.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Mode = 'stopwait' | 'sliding' | 'tcpflow';

const TOTAL_FRAMES = 8;
const PROP_TICKS = 3; // ticks for a frame (or its ACK) to cross the link one-way
const TICK_MS = 220;

interface FrameEvent {
  id: number;
  sentAt: number;
  ackedAt: number | null;
}

/** Simulate stop-and-wait or sliding-window and return the tick each frame is sent/acked at. */
function simulate(windowSize: number): FrameEvent[] {
  const events: FrameEvent[] = Array.from({ length: TOTAL_FRAMES }, (_, i) => ({
    id: i,
    sentAt: -1,
    ackedAt: null,
  }));
  let clock = 0;
  let nextToSend = 0;
  let inFlight = 0;
  while (nextToSend < TOTAL_FRAMES || inFlight > 0) {
    // send as many as window allows
    while (nextToSend < TOTAL_FRAMES && inFlight < windowSize) {
      events[nextToSend].sentAt = clock;
      nextToSend++;
      inFlight++;
    }
    // advance clock to the earliest still-pending ACK
    let earliest = Infinity;
    let earliestIdx = -1;
    events.forEach((e, idx) => {
      if (e.sentAt !== -1 && e.ackedAt === null) {
        const a = e.sentAt + PROP_TICKS * 2;
        if (a < earliest) {
          earliest = a;
          earliestIdx = idx;
        }
      }
    });
    if (earliestIdx === -1) break;
    clock = earliest;
    events[earliestIdx].ackedAt = clock;
    inFlight--;
  }
  return events;
}

export default function SlidingWindowProtocolVisualizer() {
  const [mode, setMode] = useState<Mode>('stopwait');
  const [windowSize, setWindowSize] = useState(3);
  const effectiveWindow = mode === 'sliding' ? windowSize : 1;
  const events = simulate(effectiveWindow);
  const totalTicks = Math.max(...events.map((e) => e.ackedAt ?? 0)) + 1;

  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const reset = () => {
    clearTimer();
    setTick(0);
    setRunning(false);
  };
  const stepOnce = () => setTick((t) => Math.min(totalTicks, t + 1));

  useEffect(() => {
    if (!running || mode === 'tcpflow') return;
    if (tick >= totalTicks) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, TICK_MS);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, tick, totalTicks, mode]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, windowSize]);

  const done = tick >= totalTicks;

  // --- TCP Flow Control mode state ---
  const CAPACITY = 8;
  const [bufferUsed, setBufferUsed] = useState(0);
  const [sentLog, setSentLog] = useState<{ seq: number; windowAtSend: number }[]>([]);
  const advertisedWindow = CAPACITY - bufferUsed;
  const sendFrame = () => {
    if (advertisedWindow <= 0) return;
    setSentLog((log) => [...log, { seq: log.length + 1, windowAtSend: advertisedWindow }]);
    setBufferUsed((b) => Math.min(CAPACITY, b + 1));
  };
  const appReads = (n: number) => setBufferUsed((b) => Math.max(0, b - n));
  const resetTcpFlow = () => {
    setBufferUsed(0);
    setSentLog([]);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('stopwait')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'stopwait' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Stop-and-Wait
        </button>
        <button
          onClick={() => setMode('sliding')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'sliding' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Sliding Window
        </button>
        <button
          onClick={() => setMode('tcpflow')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'tcpflow' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          TCP Flow Control
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          {mode === 'stopwait' && (
            <>
              <strong>Flow control</strong> is how a sender avoids overwhelming a receiver (or the
              network) by pacing how much it sends. The simplest approach,{' '}
              <strong>Stop-and-Wait</strong>, sends one frame and then does nothing until it gets an
              acknowledgment (<strong>ACK</strong>) back — only then does it send the next frame.
              It's simple and safe, but the sender spends a lot of time just waiting.
            </>
          )}
          {mode === 'sliding' && (
            <>
              <strong>Sliding Window</strong> flow control fixes Stop-and-Wait's idle time by
              letting the sender have several frames <strong>in flight</strong> at once — up to a
              limit called the <strong>window size</strong> — instead of sending one and freezing.
              As each ACK comes back, the window "slides forward," freeing up room to send the next
              frame immediately.
            </>
          )}
          {mode === 'tcpflow' && (
            <>
              In real TCP, the window size isn't a fixed number chosen ahead of time — it's set by
              the <strong>receiver</strong>, based on how much room is actually left in its own
              buffer, and it can change every single round trip. If the receiving application is
              slow to read incoming data, that buffer fills up, the receiver{' '}
              <strong>advertises a smaller window</strong> in its next ACK, and the sender must slow
              down — even if the network link itself has plenty of capacity to spare.
            </>
          )}
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            {mode !== 'tcpflow' ? (
              <>
                <div>
                  <dt className="inline font-medium text-stone-900">ACK: </dt>
                  <dd className="inline text-stone-600">
                    a short acknowledgment message the receiver sends back confirming a frame
                    arrived.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">In flight: </dt>
                  <dd className="inline text-stone-600">
                    a frame that's been sent but not yet acknowledged.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Window size: </dt>
                  <dd className="inline text-stone-600">
                    the maximum number of frames allowed to be in flight at the same time.
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="inline font-medium text-stone-900">Receive buffer: </dt>
                  <dd className="inline text-stone-600">
                    memory on the receiver holding data that has arrived but that the application
                    hasn't read yet.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Advertised window: </dt>
                  <dd className="inline text-stone-600">
                    the amount of free space currently left in that buffer, reported back to the
                    sender in every ACK.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Throttling: </dt>
                  <dd className="inline text-stone-600">
                    the sender being forced to slow down because the advertised window has shrunk,
                    regardless of how fast the link itself could go.
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
        <CommonMistake>
          {mode === 'stopwait' &&
            'thinking Stop-and-Wait and Sliding Window are two unrelated protocols. Stop-and-Wait is really just Sliding Window with the window size locked at 1 — switch to the Sliding Window tab and set the size to 1 to see it produce the exact same timeline.'}
          {mode === 'sliding' &&
            'assuming a bigger window is always strictly better with no downside. A larger window does raise throughput, but it also means more unacknowledged data the sender must be willing to buffer and potentially resend — window size is a genuine tradeoff, not a free upgrade.'}
          {mode === 'tcpflow' &&
            'confusing this with the link-layer sliding window in the other two tabs. That window is a fixed size chosen ahead of time to manage a shared link; this window is announced fresh by the receiver in every single ACK and can shrink to zero if its application stalls — two different mechanisms that happen to share the word "window."'}
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        {mode !== 'tcpflow' ? (
          <ol className="list-inside list-decimal space-y-0.5">
            <li>
              {mode === 'sliding' && 'Adjust the window size slider, then '}Click "Run all" or
              "Step" to advance the simulated clock tick by tick.
            </li>
            <li>
              Each row is one frame — a bar appears while it's in flight, and turns green once its
              ACK arrives.
            </li>
            <li>
              Compare how many ticks it takes to get all {TOTAL_FRAMES} frames through in each mode.
            </li>
          </ol>
        ) : (
          <ol className="list-inside list-decimal space-y-0.5">
            <li>
              Click "Send frame" repeatedly and watch the receiver's buffer fill up and its
              advertised window shrink.
            </li>
            <li>Once the window hits 0, sending is blocked — the sender is now fully throttled.</li>
            <li>
              Click "App reads 2 units" to simulate the receiving application draining its buffer,
              and watch the window grow back.
            </li>
            <li>Click "Reset" to empty the buffer and start over.</li>
          </ol>
        )}
      </div>

      {mode === 'sliding' && (
        <div>
          <label className="text-sm font-medium text-stone-800">Window size: {windowSize}</label>
          <input
            type="range"
            min={2}
            max={6}
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {mode !== 'tcpflow' ? (
        <>
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
              disabled={done}
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
            <span className="ml-2 text-sm text-stone-500">
              Tick {Math.min(tick, totalTicks)} / {totalTicks}{' '}
              {done && `— all ${TOTAL_FRAMES} frames delivered`}
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-1.5">
            {events.map((e) => {
              const started = e.sentAt !== -1 && e.sentAt <= tick;
              const acked = e.ackedAt !== null && e.ackedAt <= tick;
              const widthTicks = e.ackedAt !== null ? e.ackedAt - e.sentAt + 1 : 0;
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-14 font-mono text-xs text-stone-400">Frame {e.id + 1}</span>
                  <div
                    className="relative h-6 flex-1 overflow-hidden rounded bg-stone-50"
                    style={{ minWidth: 220 }}
                  >
                    {started && (
                      <div
                        className={`absolute top-0 h-full rounded transition-all duration-300 ${acked ? 'bg-emerald-400' : 'bg-amber-300'}`}
                        style={{
                          left: `${(e.sentAt / totalTicks) * 100}%`,
                          width: `${(Math.min(widthTicks || tick - e.sentAt + 1, totalTicks) / totalTicks) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="w-16 text-xs text-stone-400">
                    {acked ? 'ACKed' : started ? 'in flight' : 'waiting'}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={sendFrame}
              disabled={advertisedWindow <= 0}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send frame
            </button>
            <button
              onClick={() => appReads(2)}
              disabled={bufferUsed === 0}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              App reads 2 units
            </button>
            <button
              onClick={resetTcpFlow}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-stone-400">
              Receiver buffer ({bufferUsed} / {CAPACITY} used)
            </p>
            <div className="h-8 w-full overflow-hidden rounded-full border border-stone-200 bg-stone-100">
              <div
                className={`h-full transition-all duration-300 ${advertisedWindow === 0 ? 'bg-rose-400' : advertisedWindow <= 3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${(bufferUsed / CAPACITY) * 100}%` }}
              />
            </div>
            <p
              className={`text-sm font-medium ${advertisedWindow === 0 ? 'text-rose-600' : 'text-stone-700'}`}
            >
              Advertised window: {advertisedWindow} unit{advertisedWindow === 1 ? '' : 's'}{' '}
              {advertisedWindow === 0 && '— sender is fully throttled until the app reads more.'}
            </p>
          </div>

          {sentLog.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
                Frames sent, and the window advertised at the time
              </p>
              <div className="flex flex-wrap gap-1">
                {sentLog.map((s) => (
                  <span
                    key={s.seq}
                    className="rounded border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-xs"
                  >
                    #{s.seq} (win={s.windowAtSend})
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
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
