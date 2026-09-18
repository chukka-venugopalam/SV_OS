/**
 * Component: BandwidthDelayProductVisualizer
 * Serves: act5-d1-ch04-network-performance-latency-throughput
 *         ("Network Performance — Latency, Throughput, Bandwidth")
 *
 * What it demonstrates:
 *   Adjustable latency and bandwidth sliders showing how throughput is not the same
 *   thing as bandwidth when latency dominates, and visualizing the bandwidth-delay
 *   product as "bits in flight" filling a pipe.
 *
 * Design decisions:
 *   - Uses two concrete worked presets (office LAN vs. geostationary satellite link)
 *     as anchors, in addition to free sliders, so the "why does this matter" case is
 *     never purely abstract.
 *   - BDP is computed in bits, then converted to a human unit (bytes/KB) for the
 *     "how much data can be in flight" readout, since bits-in-flight as a raw bit count
 *     means little to a beginner.
 *   - Pipe-fill visualization: pipe length is fixed on screen; the "used" portion is
 *     bandwidth-delay-product relative to a fixed reference window size (64 KB, a
 *     realistic default TCP window), so the student can see when the pipe runs out of
 *     capacity to fill (bandwidth-delay product exceeds the window) versus when the
 *     window is the bottleneck instead of the link.
 *   - ASSUMPTION: Tailwind utility classes available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

const PRESETS = [
  { label: 'Office LAN', bandwidthMbps: 1000, latencyMs: 1 },
  { label: 'Home broadband', bandwidthMbps: 100, latencyMs: 20 },
  { label: 'Cross-continent fiber', bandwidthMbps: 100, latencyMs: 80 },
  { label: 'Geostationary satellite', bandwidthMbps: 25, latencyMs: 600 },
];

const WINDOW_BYTES = 64 * 1024; // typical default TCP receive window, used as a fixed reference

function formatBits(bits: number) {
  if (bits < 8000) return `${(bits / 8).toFixed(0)} bytes`;
  const kb = bits / 8 / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
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

export default function BandwidthDelayProductVisualizer() {
  const [bandwidth, setBandwidth] = useState(100); // Mbps
  const [latency, setLatency] = useState(20); // ms, one-way; RTT = 2x
  const [step, setStep] = useState(false); // whether we've "run" it once, purely for the reveal animation

  const rttMs = latency * 2;
  const bdpBits = useMemo(() => bandwidth * 1_000_000 * (rttMs / 1000), [bandwidth, rttMs]);
  const bdpBytes = bdpBits / 8;
  const windowLimited = bdpBytes > WINDOW_BYTES;
  // Effective throughput if a fixed window is the bottleneck: window / RTT
  const effectiveThroughputMbps = windowLimited
    ? (WINDOW_BYTES * 8) / (rttMs / 1000) / 1_000_000
    : bandwidth;

  const pipeFillPct = Math.min(100, (bdpBytes / WINDOW_BYTES) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A network link has two separate properties that people often confuse: how much data it can
          carry per second (its <strong>bandwidth</strong>, like the width of a pipe), and how long
          a single bit takes to travel from one end to the other (its <strong>latency</strong>, like
          the length of that pipe). <strong>Throughput</strong> — the data rate you actually
          experience — depends on both, because if a link takes a long time to acknowledge data, you
          can't keep the pipe full no matter how wide it is. This simulator lets you adjust
          bandwidth and latency independently and see how much data can be "in flight" (sent but not
          yet acknowledged) at once — a number called the <strong>bandwidth-delay product</strong>.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Bandwidth: </dt>
              <dd className="inline text-stone-600">
                the maximum data rate a link can carry, e.g. 100 Mbps.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Latency: </dt>
              <dd className="inline text-stone-600">
                one-way travel time for a single bit; round-trip time (RTT) is roughly double this.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Bandwidth-delay product (BDP): </dt>
              <dd className="inline text-stone-600">
                bandwidth × round-trip time — how much data could be "in the pipe" at once if it
                were kept completely full.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Window size: </dt>
              <dd className="inline text-stone-600">
                the most data a sender is allowed to have unacknowledged at once; if it's smaller
                than the BDP, the window — not the link — becomes the bottleneck.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming more bandwidth always means faster transfers. Once round-trip time is high
          enough, the window size — not the link's bandwidth — caps how much data can be in flight
          at once, so doubling bandwidth on a high-latency link (like satellite) often does nothing
          for real throughput until the window grows too.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Pick a preset link below, or drag the Bandwidth and Latency sliders yourself.</li>
          <li>
            Watch the pipe fill up — the filled portion is the bandwidth-delay product relative to a
            realistic 64 KB window.
          </li>
          <li>
            Read the callout: it tells you whether the link itself or the window size is limiting
            your real throughput.
          </li>
          <li>
            Try dragging latency way up with bandwidth left high (like the satellite preset) to see
            throughput collapse even though bandwidth didn't change.
          </li>
        </ol>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setBandwidth(p.bandwidthMbps);
              setLatency(p.latencyMs);
              setStep(true);
            }}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => {
            setBandwidth(100);
            setLatency(20);
            setStep(false);
          }}
          className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-400"
        >
          Reset
        </button>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-800">Bandwidth: {bandwidth} Mbps</label>
          <input
            type="range"
            min={1}
            max={1000}
            value={bandwidth}
            onChange={(e) => {
              setBandwidth(Number(e.target.value));
              setStep(true);
            }}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-800">
            One-way latency: {latency} ms (RTT ≈ {rttMs} ms)
          </label>
          <input
            type="range"
            min={1}
            max={600}
            value={latency}
            onChange={(e) => {
              setLatency(Number(e.target.value));
              setStep(true);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Pipe visualization */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-stone-400">
          Pipe fill — bits in flight vs. a 64 KB window
        </p>
        <div className="relative h-10 w-full overflow-hidden rounded-full border border-stone-200 bg-stone-100">
          <div
            className={`h-full transition-all duration-500 ${windowLimited ? 'bg-rose-400' : 'bg-emerald-400'}`}
            style={{ width: `${pipeFillPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-stone-700">
            {step
              ? `${formatBits(bdpBits)} in flight per RTT`
              : 'Adjust a slider or pick a preset to begin'}
          </div>
        </div>
      </div>

      {/* Readout */}
      {step && (
        <div
          className={`rounded-lg p-4 text-sm ${windowLimited ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}
        >
          <p className="mb-1 font-semibold">
            {windowLimited
              ? 'The window size is the bottleneck, not the link.'
              : "The link's bandwidth is the limiting factor."}
          </p>
          <p>
            Bandwidth-delay product ≈ <span className="font-mono">{formatBits(bdpBits)}</span> per
            round trip.{' '}
            {windowLimited
              ? `That's more than the 64 KB window, so the sender has to stop and wait for acknowledgments before the pipe is ever full — effective throughput caps around ${effectiveThroughputMbps.toFixed(
                  1,
                )} Mbps even though the link supports ${bandwidth} Mbps.`
              : `That fits comfortably inside a 64 KB window, so the link's own ${bandwidth} Mbps bandwidth is what limits throughput, not the window.`}
          </p>
        </div>
      )}
    </div>
  );
}
