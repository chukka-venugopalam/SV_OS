/**
 * Component: TCPIPLayerMapper
 * Serves: act5-d1-ch02-tcp-ip-model ("TCP/IP Model")
 *
 * What it demonstrates:
 *   The same sender-encapsulate / receiver-decapsulate packet flow as the OSI
 *   simulator, but shown on the 4-layer TCP/IP model actually used in practice, with a
 *   side-by-side bracket mapping showing which OSI layers collapse into which TCP/IP
 *   layer (Application+Presentation+Session -> Application; Transport -> Transport;
 *   Network -> Internet; Data Link+Physical -> Network Access).
 *
 * Design decisions:
 *   - Deliberately a separate, standalone component from OSILayerStackVisualizer
 *     (not a mode of it) because the build spec treats it as its own chapter with its
 *     own "Must demonstrate" (the mapping itself is the point, not just re-running the
 *     same 7-layer animation).
 *   - Kept the packet-growth animation simple (4 rings, not 7) so the visual weight
 *     matches "4 layers" rather than reusing 7 rings and just relabeling them.
 *   - ASSUMPTION: Tailwind utility classes available in host repo (same assumption as
 *     the OSI component, for visual consistency between the two).
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface OSIRow {
  id: number;
  name: string;
}
interface TcpIpLayer {
  id: number;
  name: string;
  plain: string;
  osiRows: OSIRow[];
  color: string;
}

const TCPIP: TcpIpLayer[] = [
  {
    id: 4,
    name: 'Application',
    plain: "Your program's own data and protocol — e.g. an HTTP request, an email.",
    osiRows: [
      { id: 7, name: 'Application' },
      { id: 6, name: 'Presentation' },
      { id: 5, name: 'Session' },
    ],
    color: 'bg-violet-500',
  },
  {
    id: 3,
    name: 'Transport',
    plain: 'Splits data into segments and makes sure they all arrive, in order.',
    osiRows: [{ id: 4, name: 'Transport' }],
    color: 'bg-rose-500',
  },
  {
    id: 2,
    name: 'Internet',
    plain: 'Figures out which path across the internet the data should take.',
    osiRows: [{ id: 3, name: 'Network' }],
    color: 'bg-orange-500',
  },
  {
    id: 1,
    name: 'Network Access',
    plain: 'Moves data across one physical link, and turns it into real signals.',
    osiRows: [
      { id: 2, name: 'Data Link' },
      { id: 1, name: 'Physical' },
    ],
    color: 'bg-amber-500',
  },
];

// Render order top -> bottom should be Application first (4,3,2,1)
const ORDERED = [...TCPIP];

type Phase = 'idle' | 'sender' | 'flight' | 'receiver' | 'done';
const STEP_MS = 900;

export default function TCPIPLayerMapper() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [wrappedCount, setWrappedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const reset = () => {
    clearTimer();
    setPhase('idle');
    setWrappedCount(0);
    setRunning(false);
  };
  const stepOnce = () => {
    clearTimer();
    if (phase === 'idle') {
      setPhase('sender');
      setWrappedCount(1);
      return;
    }
    if (phase === 'sender') {
      if (wrappedCount < 4) setWrappedCount((c) => c + 1);
      else setPhase('flight');
      return;
    }
    if (phase === 'flight') {
      setPhase('receiver');
      return;
    }
    if (phase === 'receiver') {
      if (wrappedCount > 0) setWrappedCount((c) => c - 1);
      else setPhase('done');
      return;
    }
  };
  useEffect(() => {
    if (!running) return;
    if (phase === 'done') {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, STEP_MS);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, wrappedCount]);
  const runAll = () => {
    reset();
    setTimeout(() => setRunning(true), 50);
  };

  const activeIds = ORDERED.slice(0, wrappedCount).map((l) => l.id);
  const currentIdx =
    phase === 'sender' ? wrappedCount - 1 : phase === 'receiver' ? wrappedCount : -1;
  const current = currentIdx >= 0 ? ORDERED[currentIdx] : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          The 7-layer OSI model is a teaching map — real software doesn't actually split things into
          7 neat boxes. In practice, the internet runs on a simpler 4-layer model called the{' '}
          <strong>TCP/IP model</strong> (named after its two most important protocols). Several OSI
          layers get merged into one practical layer here. This simulator shows the same message
          traveling down and back up through these 4 real-world layers, and lines up each one
          against the OSI layers it stands in for.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">TCP/IP model: </dt>
              <dd className="inline text-stone-600">
                the practical 4-layer stack real networks are built on, named after TCP and IP.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Network Access layer: </dt>
              <dd className="inline text-stone-600">
                the combined bottom layer that handles both the physical wire and the local link.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Internet layer: </dt>
              <dd className="inline text-stone-600">
                the TCP/IP name for what OSI calls the Network layer — addressing and routing.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming OSI's 7 layers and TCP/IP's 4 layers are just two different names for the same
          thing, with TCP/IP as a "simplified list" of the same boundaries. They're not — TCP/IP
          genuinely merges several OSI layers' responsibilities into one layer (e.g. session
          management isn't a separate layer in TCP/IP at all, it's just something the application
          handles), so the two models don't map 1-to-1.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Run all" or "Step forward" to send a message down through the 4 TCP/IP layers.
          </li>
          <li>Notice each TCP/IP layer's bracket showing which OSI layers it's standing in for.</li>
          <li>
            Watch it cross the wire, then get unwrapped one layer at a time on the receiver side.
          </li>
          <li>Click "Reset" to try again.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={runAll}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Run all
        </button>
        <button
          onClick={() => {
            clearTimer();
            setRunning(false);
            stepOnce();
          }}
          disabled={phase === 'done'}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Step forward one layer
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span className="ml-2 text-sm text-stone-500">
          {phase === 'idle' && 'Ready.'}
          {phase === 'sender' && `Sender: ${current?.name} layer wrapping its header on.`}
          {phase === 'flight' && 'In flight.'}
          {phase === 'receiver' && `Receiver: ${current?.name} layer stripping its header off.`}
          {phase === 'done' && 'Delivered.'}
        </span>
      </div>

      {/* Side-by-side mapping */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs uppercase tracking-wide text-stone-400">
            TCP/IP (4 layers)
          </p>
          {ORDERED.map((l) => {
            const active = activeIds.includes(l.id);
            const highlighted = current?.id === l.id;
            return (
              <div
                key={l.id}
                className={`rounded-md border px-3 py-2 text-sm transition-all duration-300 ${
                  highlighted
                    ? `${l.color} border-transparent text-white shadow`
                    : active
                      ? 'border-stone-300 bg-stone-100 text-stone-800'
                      : 'border-stone-200 bg-white text-stone-500'
                }`}
                style={{ minHeight: l.osiRows.length * 34 }}
              >
                <div className="font-medium">{l.name}</div>
                <div className="text-xs opacity-80">{l.plain}</div>
              </div>
            );
          })}
        </div>

        <div className="flex select-none flex-col justify-around text-lg text-stone-300">
          {ORDERED.map((l) => (
            <span key={l.id}>↔</span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-center text-xs uppercase tracking-wide text-stone-400">
            OSI (7 layers)
          </p>
          {ORDERED.map((l) => (
            <div
              key={l.id}
              className="flex flex-col justify-center gap-1 rounded-md border border-stone-200 bg-white px-3 py-2"
            >
              {l.osiRows.map((r) => (
                <div key={r.id} className="text-xs text-stone-600">
                  L{r.id} {r.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Packet animation */}
      <div className="flex justify-center py-4">
        <PacketRings wrappedCount={wrappedCount} flying={phase === 'flight'} />
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

function PacketRings({ wrappedCount, flying }: { wrappedCount: number; flying: boolean }) {
  const wrapped = ORDERED.slice(0, wrappedCount);
  const size = 64 + wrappedCount * 26;
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-500 ${flying ? 'translate-x-3' : ''}`}
      style={{ width: size, height: size }}
    >
      {[...wrapped].reverse().map((l, i) => {
        const ringSize = 64 + (i + 1) * 26;
        return (
          <div
            key={l.id}
            className={`absolute rounded-full border-2 border-white/70 ${l.color}`}
            style={{ width: ringSize, height: ringSize, opacity: 0.55 + i * 0.08 }}
          />
        );
      })}
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 px-1 text-center text-[10px] text-white">
        payload
      </div>
    </div>
  );
}
