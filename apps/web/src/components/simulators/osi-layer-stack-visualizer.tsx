/**
 * Component: OSILayerStackVisualizer
 * Serves:
 *   - act5-d1-ch01-osi-model            ("OSI Model")            — Overview mode
 *   - act5-d1-ch03-encapsulation-decapsulation ("Encapsulation & Decapsulation") — Header Detail mode
 *
 * What it demonstrates:
 *   Overview mode:      a message dropping down through all 7 OSI layers on the sender
 *                        side (each layer wrapping it in a header) and climbing back up
 *                        through all 7 layers on the receiver side (each layer stripping
 *                        its own header off), with the packet visibly growing then
 *                        shrinking.
 *   Header Detail mode: the same flow, but clicking a layer while its header is attached
 *                        zooms into that header's actual fields (e.g. TCP: source/dest
 *                        port, sequence number; IP: source/dest address, TTL) instead of
 *                        a generic box.
 *
 * Design decisions:
 *   - ch03 ("extend OSI Layer Stack Visualizer with a byte-level header view") is built
 *     as a second mode of this same component rather than a separate file, per the build
 *     spec. Overview and Header Detail each get their own WHAT IS THIS / KEY TERMS /
 *     HOW TO USE block since "encapsulation happens" (ch01) and "here's what's actually
 *     inside a header" (ch03) are different ideas for a beginner, even though they
 *     share one animated mechanism.
 *   - Header field values shown are illustrative example data for one worked packet
 *     (an HTTP GET), not live/random — concrete numbers over abstract placeholders.
 *   - No external animation library assumed available in the host repo; all motion is
 *     done with CSS transitions driven by React state, so this file has zero
 *     dependencies beyond React.
 *   - ASSUMPTION: host repo uses Tailwind utility classes (inferred from the
 *     apps/web/src/components/simulators path convention). If Tailwind isn't
 *     configured, the utility classes will no-op and only the (functional) structure
 *     will remain — flag this back if that's the case.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type LayerId = 7 | 6 | 5 | 4 | 3 | 2 | 1;

interface HeaderField {
  name: string;
  value: string;
  note: string;
}

interface Layer {
  id: LayerId;
  name: string;
  short: string;
  plain: string;
  headerLabel: string;
  fields: HeaderField[];
  color: string; // tailwind bg class
}

const LAYERS: Layer[] = [
  {
    id: 7,
    name: 'Application',
    short: 'L7',
    plain: 'Where the actual program lives — a browser building an HTTP request.',
    headerLabel: 'HTTP header',
    fields: [
      { name: 'Method', value: 'GET', note: 'what action to perform' },
      { name: 'Path', value: '/index.html', note: 'which resource' },
      { name: 'Host', value: 'example.com', note: 'which website' },
    ],
    color: 'bg-violet-500',
  },
  {
    id: 6,
    name: 'Presentation',
    short: 'L6',
    plain: 'Translates data into a common format — e.g. encrypting it with TLS.',
    headerLabel: 'TLS record header',
    fields: [
      { name: 'Content Type', value: '23 (App Data)', note: 'what kind of TLS record this is' },
      { name: 'Version', value: 'TLS 1.3', note: 'protocol version in use' },
    ],
    color: 'bg-fuchsia-500',
  },
  {
    id: 5,
    name: 'Session',
    short: 'L5',
    plain: 'Keeps track of the ongoing conversation between the two computers.',
    headerLabel: 'Session token',
    fields: [{ name: 'Session ID', value: '0x9F21', note: 'identifies this conversation' }],
    color: 'bg-pink-500',
  },
  {
    id: 4,
    name: 'Transport',
    short: 'L4',
    plain: 'Splits data into segments and makes sure they all arrive, in order.',
    headerLabel: 'TCP header',
    fields: [
      { name: 'Src Port', value: '51422', note: 'port the request came from' },
      { name: 'Dst Port', value: '443', note: "port it's going to (HTTPS)" },
      { name: 'Seq #', value: '1000', note: 'position of this segment in the stream' },
      { name: 'Ack #', value: '1', note: 'next byte this side expects back' },
    ],
    color: 'bg-rose-500',
  },
  {
    id: 3,
    name: 'Network',
    short: 'L3',
    plain: 'Figures out which path across the internet the data should take.',
    headerLabel: 'IP header',
    fields: [
      { name: 'Src IP', value: '192.168.1.42', note: "sender's address" },
      { name: 'Dst IP', value: '93.184.216.34', note: 'destination address' },
      { name: 'TTL', value: '64', note: "max hops before it's discarded" },
    ],
    color: 'bg-orange-500',
  },
  {
    id: 2,
    name: 'Data Link',
    short: 'L2',
    plain: 'Moves data across one physical link — e.g. your laptop to your router.',
    headerLabel: 'Ethernet frame header',
    fields: [
      { name: 'Src MAC', value: '3C:22:FB:...', note: "sender's network card address" },
      { name: 'Dst MAC', value: 'B8:27:EB:...', note: "next device's card address" },
    ],
    color: 'bg-amber-500',
  },
  {
    id: 1,
    name: 'Physical',
    short: 'L1',
    plain: 'Turns everything into actual electrical/light/radio signals on the wire.',
    headerLabel: '(no header — raw bits)',
    fields: [{ name: 'Bits', value: '0101...', note: 'the literal signal on the wire' }],
    color: 'bg-stone-500',
  },
];

type Phase = 'idle' | 'sender' | 'flight' | 'receiver' | 'done';
type Mode = 'overview' | 'detail';

const STEP_MS = 900;

export default function OSILayerStackVisualizer() {
  const [mode, setMode] = useState<Mode>('overview');
  const [phase, setPhase] = useState<Phase>('idle');
  // wrappedCount: how many headers are currently wrapped around the payload (0-7)
  const [wrappedCount, setWrappedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [inspecting, setInspecting] = useState<LayerId | null>(null);
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
    setInspecting(null);
  };

  const stepOnce = () => {
    clearTimer();
    if (phase === 'idle') {
      setPhase('sender');
      setWrappedCount(1);
      return;
    }
    if (phase === 'sender') {
      if (wrappedCount < 7) {
        setWrappedCount((c) => c + 1);
      } else {
        setPhase('flight');
      }
      return;
    }
    if (phase === 'flight') {
      setPhase('receiver');
      return;
    }
    if (phase === 'receiver') {
      if (wrappedCount > 0) {
        setWrappedCount((c) => c - 1);
      } else {
        setPhase('done');
      }
      return;
    }
  };

  useEffect(() => {
    if (!running) return;
    if (phase === 'done') {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(() => {
      stepOnce();
    }, STEP_MS);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, wrappedCount]);

  const runAll = () => {
    reset();
    setTimeout(() => setRunning(true), 50);
  };

  // Which layers currently have a header wrapped on (sender: outer-in as it descends;
  // receiver: strips outer-in too, same order, just count going down instead of up)
  const activeHeaderIds: LayerId[] = LAYERS.slice(0, wrappedCount).map((l) => l.id);
  const currentLayerIndex =
    phase === 'sender' ? wrappedCount - 1 : phase === 'receiver' ? wrappedCount : -1;
  const currentLayer = currentLayerIndex >= 0 ? LAYERS[currentLayerIndex] : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      {/* Mode switch */}
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => {
            setMode('overview');
            reset();
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === 'overview' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
          }`}
        >
          Overview: watch a packet travel
        </button>
        <button
          onClick={() => {
            setMode('detail');
            reset();
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === 'detail' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
          }`}
        >
          Header detail: see what's inside
        </button>
      </div>

      {mode === 'overview' ? <OverviewIntro /> : <DetailIntro />}

      {/* HOW TO USE */}
      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Run all" to watch the whole trip automatically, or "Step" to go one layer at a
            time.
          </li>
          <li>
            Watch the box on the left grow a new colored ring each time it passes a sender-side
            layer.
          </li>
          <li>
            Once it "crosses the wire," watch it shrink a ring at a time as the receiver strips each
            header off.
          </li>
          {mode === 'detail' && (
            <li>
              While a layer's header is attached (its ring is visible), click that ring to open its
              actual fields instead of just a colored box.
            </li>
          )}
          <li>Click "Reset" at any point to start over.</li>
        </ol>
      </div>

      {/* Controls */}
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
          {phase === 'idle' && 'Ready — payload not yet wrapped.'}
          {phase === 'sender' &&
            `Sender: layer ${LAYERS[wrappedCount - 1]?.short} just added its header.`}
          {phase === 'flight' && 'In flight — fully wrapped packet crossing the network.'}
          {phase === 'receiver' &&
            `Receiver: layer ${LAYERS[wrappedCount]?.short} is stripping its header off.`}
          {phase === 'done' && 'Delivered — payload fully unwrapped, same as it started.'}
        </span>
      </div>

      {/* Visualization */}
      <div className="flex items-center justify-center gap-10 py-8">
        {/* Sender stack */}
        <MiniStack
          side="Sender"
          activeIds={activeHeaderIds}
          highlight={phase === 'sender' ? (currentLayer?.id ?? null) : null}
        />

        {/* The packet itself */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-stone-400">the packet</span>
          <PacketStack
            wrappedCount={wrappedCount}
            mode={mode}
            inspecting={inspecting}
            setInspecting={setInspecting}
            flying={phase === 'flight'}
          />
        </div>

        {/* Receiver stack */}
        <MiniStack
          side="Receiver"
          activeIds={activeHeaderIds}
          highlight={phase === 'receiver' ? (currentLayer?.id ?? null) : null}
        />
      </div>

      {mode === 'detail' && inspecting && (
        <HeaderFieldPanel
          layer={LAYERS.find((l) => l.id === inspecting)!}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  );
}

function OverviewIntro() {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
      <p className="text-sm leading-relaxed text-stone-700">
        When your laptop sends a web request, the message doesn't travel as-is. It passes through 7
        stages called layers, and each one wraps the message in its own extra label — like putting a
        letter inside an envelope, then that envelope inside a shipping box, then that box inside a
        courier bag. This is called the <strong>OSI model</strong>: a 7-stage map of everything that
        happens to data on its way across a network. On the way out, each layer adds its wrapper
        (called <strong>encapsulation</strong>). On the way in, the receiving computer removes those
        wrappers one by one, in the opposite order (called <strong>decapsulation</strong>), until
        the original message is left.
      </p>
      <KeyTerms
        terms={[
          [
            'Layer',
            'One stage in the 7-stage OSI model, each handling a different job (e.g. addressing, error-checking).',
          ],
          [
            'Encapsulation',
            'Wrapping a message in a new header as it moves down through the layers on the sending side.',
          ],
          [
            'Decapsulation',
            'Removing a header as the message moves up through the layers on the receiving side.',
          ],
          [
            'Header',
            'A small chunk of extra information a layer attaches, describing how to handle the message.',
          ],
        ]}
      />
      <CommonMistake>
        thinking each layer makes a whole new copy of the data. It doesn't — the original payload
        stays exactly the same size the entire time; each layer just wraps one more header around
        the outside of what's already there, like nesting envelopes, not photocopying the letter.
      </CommonMistake>
    </div>
  );
}

function DetailIntro() {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
      <p className="text-sm leading-relaxed text-stone-700">
        Each layer's "wrapper" isn't just an unlabeled box — it's a small structured chunk of data
        with named fields, called a <strong>header</strong>. For example, the header added by the
        Transport layer (using a protocol called <strong>TCP</strong>, short for Transmission
        Control Protocol) includes which port number the message came from and which port it's going
        to. This mode lets you open up any layer's header while it's attached and see its real
        fields, instead of a plain colored box — so you can see exactly what information gets added
        at each stage, not just that "something" gets added.
      </p>
      <KeyTerms
        terms={[
          [
            'Field',
            'One named piece of information inside a header, e.g. "Destination Port: 443".',
          ],
          [
            'TCP',
            'Transmission Control Protocol — the Transport-layer header that tracks ports and message order.',
          ],
          [
            'IP',
            "Internet Protocol — the Network-layer header that carries the sender's and destination's addresses.",
          ],
          [
            'TTL',
            'Time To Live — a countdown field in the IP header that discards a packet after too many hops, preventing infinite loops.',
          ],
        ]}
      />
      <CommonMistake>
        treating a header as one generic "metadata tag." Every layer's header is a different,
        protocol-specific structure with its own named fields — a TCP header has ports and sequence
        numbers, an IP header has addresses and a TTL, and they aren't interchangeable or
        generically the same shape.
      </CommonMistake>
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

function KeyTerms({ terms }: { terms: [string, string][] }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
      <dl className="space-y-1.5">
        {terms.map(([term, def]) => (
          <div key={term} className="text-sm">
            <dt className="inline font-medium text-stone-900">{term}: </dt>
            <dd className="inline text-stone-600">{def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MiniStack({
  side,
  activeIds,
  highlight,
}: {
  side: 'Sender' | 'Receiver';
  activeIds: LayerId[];
  highlight: LayerId | null;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="mb-1 text-xs uppercase tracking-wide text-stone-400">{side}</span>
      {LAYERS.map((l) => {
        const isActive = activeIds.includes(l.id);
        const isHighlight = highlight === l.id;
        return (
          <div
            key={l.id}
            className={`w-32 rounded-md border py-1.5 text-center text-[11px] transition-all duration-300 ${
              isHighlight
                ? `${l.color} scale-105 border-transparent text-white shadow`
                : isActive
                  ? 'border-stone-300 bg-stone-100 text-stone-700'
                  : 'border-stone-100 bg-white text-stone-300'
            }`}
          >
            L{l.id} {l.name}
          </div>
        );
      })}
    </div>
  );
}

function PacketStack({
  wrappedCount,
  mode,
  inspecting: _inspecting,
  setInspecting,
  flying,
}: {
  wrappedCount: number;
  mode: Mode;
  inspecting: LayerId | null;
  setInspecting: (id: LayerId | null) => void;
  flying: boolean;
}) {
  const wrapped = LAYERS.slice(0, wrappedCount); // outermost first (L7..down)
  const size = 64 + wrappedCount * 22;
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-500 ${
        flying ? 'translate-y-2' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {[...wrapped].reverse().map((l, i) => {
        const ringSize = 64 + (i + 1) * 22;
        return (
          <button
            key={l.id}
            onClick={() => mode === 'detail' && setInspecting(l.id)}
            title={mode === 'detail' ? `Inspect ${l.headerLabel}` : l.name}
            className={`absolute rounded-full border-2 border-white/70 ${l.color} flex items-center justify-center transition-all duration-500 ${
              mode === 'detail' ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
            }`}
            style={{ width: ringSize, height: ringSize, opacity: 0.55 + i * 0.06 }}
          />
        );
      })}
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 px-1 text-center text-[10px] text-white">
        payload
      </div>
    </div>
  );
}

function HeaderFieldPanel({ layer, onClose }: { layer: Layer; onClose: () => void }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-stone-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-900">
          L{layer.id} {layer.name} — {layer.headerLabel}
        </p>
        <button onClick={onClose} className="text-sm text-stone-400 hover:text-stone-700">
          Close ✕
        </button>
      </div>
      <p className="mb-3 text-xs text-stone-500">{layer.plain}</p>
      <table className="w-full text-sm">
        <tbody>
          {layer.fields.map((f) => (
            <tr key={f.name} className="border-t border-stone-200">
              <td className="whitespace-nowrap py-1.5 pr-3 font-medium text-stone-800">{f.name}</td>
              <td className="py-1.5 pr-3 font-mono text-stone-900">{f.value}</td>
              <td className="py-1.5 text-stone-500">{f.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
