/**
 * Component: LongestPrefixMatchVisualizer
 * Serves: act5-d3-ch05-ip-forwarding-routing-tables ("IP Forwarding & Routing Tables")
 *
 * What it demonstrates:
 *   An incoming packet's destination IP checked against several overlapping
 *   routing-table entries, animating the longest-prefix-match rule selecting the
 *   most specific matching route rather than the first or the broadest one.
 *
 * Design decisions:
 *   - Routing table is deliberately built with genuinely overlapping entries
 *     (a default route, an /8, a /16, and a /24 that all match the same destination)
 *     so the "why not just pick any matching route" question has a real, visible
 *     answer rather than a contrived one-match example.
 *   - Matching is computed generically from prefix length + network/mask arithmetic
 *     (not hardcoded per destination) so any destination IP the student types in is
 *     evaluated correctly, including ones that only match the default route.
 *   - Each candidate route's match/no-match verdict is shown with the actual
 *     bitwise reasoning (how many leading bits agree) rather than just a checkmark,
 *     so "longest prefix" is something the student can verify by eye.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return NaN;
  return parts.reduce((acc, o) => acc * 256 + o, 0) >>> 0;
}

interface Route {
  network: string;
  prefix: number;
  nextHop: string;
}

const ROUTING_TABLE: Route[] = [
  { network: '0.0.0.0', prefix: 0, nextHop: 'ISP uplink (default route)' },
  { network: '10.0.0.0', prefix: 8, nextHop: 'Router R1' },
  { network: '10.1.0.0', prefix: 16, nextHop: 'Router R2' },
  { network: '10.1.2.0', prefix: 24, nextHop: 'Router R3' },
];

const PRESET_DESTS = ['10.1.2.55', '10.1.9.10', '10.9.9.9', '192.168.1.1'];

function matches(dest: number, route: Route): boolean {
  if (isNaN(dest)) return false;
  const mask = route.prefix === 0 ? 0 : (~0 << (32 - route.prefix)) >>> 0;
  return (dest & mask) >>> 0 === (ipToInt(route.network) & mask) >>> 0;
}

function toBinary(ip: string): string {
  return ip
    .split('.')
    .map((o) => Number(o).toString(2).padStart(8, '0'))
    .join('');
}

export default function LongestPrefixMatchVisualizer() {
  const [dest, setDest] = useState('10.1.2.55');
  const [revealedCount, setRevealedCount] = useState(0);

  const destInt = ipToInt(dest);
  const evaluations = ROUTING_TABLE.map((r) => ({ route: r, isMatch: matches(destInt, r) }));
  const matchingRoutes = evaluations.filter((e) => e.isMatch);
  const winner = matchingRoutes.reduce<(typeof matchingRoutes)[number] | null>(
    (best, e) => (best === null || e.route.prefix > best.route.prefix ? e : best),
    null,
  );

  const reveal = () => setRevealedCount((c) => Math.min(ROUTING_TABLE.length, c + 1));
  const reset = () => setRevealedCount(0);
  const valid = !isNaN(destInt);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A router's routing table often has several entries that could all technically match a
          packet's destination — a broad default route, plus more specific routes for particular
          sub-ranges. When more than one entry matches, the router doesn't pick the first one it
          finds or the broadest one — it picks the entry with the{' '}
          <strong>longest matching prefix</strong>, meaning the one that agrees with the destination
          address for the most leading bits, because that's the most specific, most accurate route
          available.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Prefix length (/8, /16, /24): </dt>
              <dd className="inline text-stone-600">
                how many leading bits of an address a routing-table entry fixes — a bigger number
                means a more specific, narrower match.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Default route (0.0.0.0/0): </dt>
              <dd className="inline text-stone-600">
                the catch-all entry that matches every possible address, used only when nothing more
                specific matches.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Longest prefix match: </dt>
              <dd className="inline text-stone-600">
                the rule that, among all matching entries, the router always uses the one with the
                highest prefix length.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming the router picks whichever route it checks first, so ordering the table matters.
          It doesn't — a real router evaluates all matching entries and always chooses the longest
          prefix, regardless of what order the entries happen to be listed in.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Enter a destination IP, or pick a preset below.</li>
          <li>
            Click "Check next entry" to test the destination against each routing-table row one at a
            time.
          </li>
          <li>Watch which entries match — more than one usually will.</li>
          <li>Once all entries are checked, see which one wins by longest prefix, and why.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={dest}
          onChange={(e) => {
            setDest(e.target.value);
            reset();
          }}
          className="w-40 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
        />
        {PRESET_DESTS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setDest(p);
              reset();
            }}
            className={`rounded-md border px-3 py-1.5 font-mono text-sm ${dest === p ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
          >
            {p}
          </button>
        ))}
      </div>
      {!valid && (
        <p className="text-sm text-rose-600">Enter a valid IPv4 address (e.g. 10.1.2.55).</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={reveal}
          disabled={!valid || revealedCount >= ROUTING_TABLE.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Check next entry
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div className="space-y-2">
        {ROUTING_TABLE.map((r, i) => {
          if (i >= revealedCount) {
            return (
              <div
                key={r.network}
                className="rounded-md border border-stone-100 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-300"
              >
                {r.network}/{r.prefix} → {r.nextHop}
              </div>
            );
          }
          const ev = evaluations[i];
          const isWinner = winner && winner.route === r && revealedCount >= ROUTING_TABLE.length;
          return (
            <div
              key={r.network}
              className={`rounded-md border px-3 py-2 text-sm transition-all ${isWinner ? 'border-emerald-400 bg-emerald-50' : ev.isMatch ? 'border-sky-200 bg-sky-50' : 'border-stone-200 bg-stone-50 opacity-60'}`}
            >
              <div className="flex items-center justify-between font-mono">
                <span>
                  {r.network}/{r.prefix} → {r.nextHop}
                </span>
                <span className={ev.isMatch ? 'text-sky-700' : 'text-stone-400'}>
                  {ev.isMatch ? 'match' : 'no match'}
                </span>
              </div>
              {valid && (
                <p className="mt-1 break-all font-mono text-xs text-stone-400">
                  dest: {toBinary(dest)} vs net:{' '}
                  {toBinary(r.network).slice(0, r.prefix).padEnd(32, '·')}
                </p>
              )}
              {isWinner && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  Longest matching prefix — this route wins.
                </p>
              )}
            </div>
          );
        })}
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
