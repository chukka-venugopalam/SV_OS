/**
 * Component: CidrAggregationVisualizer
 * Serves: act5-d3-ch02-cidr-supernetting ("CIDR & Supernetting")
 *
 * What it demonstrates:
 *   Several contiguous subnets merging into one larger CIDR block (route
 *   aggregation / supernetting), shown reducing the number of routing-table entries
 *   a router needs to advertise from many down to one.
 *
 * Design decisions:
 *   - Works with a concrete, realistic preset (four contiguous /24s inside
 *     192.168.0.0/22) rather than an abstract example, and shows every IP address in
 *     both dotted-decimal and binary so the "count matching leading bits" mechanism
 *     is visible, not just asserted.
 *   - Aggregation is computed generically (longest common binary prefix of all
 *     network addresses in the group, verified to exactly cover the group with no
 *     gaps or extra addresses) so picking 2, 4, or 8 contiguous blocks all work
 *     correctly through the same code path.
 *   - Deliberately includes a "these 3 don't aggregate cleanly" case (drop one block)
 *     to head off the misconception that CIDR aggregation always works if the
 *     addresses are just numerically close — contiguity AND alignment both matter.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => acc * 256 + Number(oct), 0);
}
function intToIp(n: number): string {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 0xff).join('.');
}
function toBinaryOctets(ip: string): string {
  return ip
    .split('.')
    .map((o) => Number(o).toString(2).padStart(8, '0'))
    .join(' ');
}

// Base: 192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24 -> aggregate to /22
const BASE = ipToInt('192.168.0.0');
const ALL_BLOCKS = [0, 1, 2, 3].map((i) => ({
  network: intToIp(BASE + i * 256),
  prefix: 24,
}));

function commonPrefixLength(networks: number[]): number {
  let len = 32;
  for (let bit = 31; bit >= 0; bit--) {
    const bits = networks.map((n) => (n >>> bit) & 1);
    if (new Set(bits).size > 1) {
      len = 31 - bit;
      break;
    }
  }
  return len;
}

function aggregate(selected: { network: string; prefix: number }[]) {
  const ints = selected.map((b) => ipToInt(b.network));
  const cpl = commonPrefixLength(ints);
  const mask = cpl === 0 ? 0 : (~0 << (32 - cpl)) >>> 0;
  const aggNetwork = ints[0] & mask;
  const blockSize = 2 ** (32 - cpl);
  const totalAddressesInSelected = selected.length * 2 ** (32 - selected[0].prefix);
  const cleanlyAggregates =
    blockSize === totalAddressesInSelected && aggNetwork >>> 0 === Math.min(...ints);
  return { prefix: cpl, network: intToIp(aggNetwork >>> 0), cleanlyAggregates };
}

export default function CidrAggregationVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState<number[]>([0, 1, 2, 3]);
  const [revealed, setRevealed] = useState(false);

  const selectedBlocks = selectedIdx
    .map((i) => ALL_BLOCKS[i])
    .sort((a, b) => ipToInt(a.network) - ipToInt(b.network));
  const result = useMemo(
    () => (selectedBlocks.length >= 2 ? aggregate(selectedBlocks) : null),
    [selectedBlocks],
  );

  const toggle = (i: number) => {
    setRevealed(false);
    setSelectedIdx((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort()));
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A router connected to many small networks would normally need one routing-table entry per
          network. But if those networks are numbered <strong>contiguously</strong> and line up
          correctly in binary, they can be described by a single, larger address block instead — a
          technique called <strong>CIDR</strong> (Classless Inter-Domain Routing){' '}
          <strong>supernetting</strong> or <strong>route aggregation</strong>. Instead of
          advertising four separate /24 networks, a router can advertise one /22 that covers exactly
          the same addresses.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">/24, /22 (prefix length): </dt>
              <dd className="inline text-stone-600">
                how many leading bits of the address are fixed as the "network" part — a smaller
                number means a bigger block of addresses.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Aggregation / supernetting: </dt>
              <dd className="inline text-stone-600">
                replacing several specific routes with one broader route that covers all of them.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Contiguous & aligned: </dt>
              <dd className="inline text-stone-600">
                the blocks must sit back-to-back with no gaps, starting at an address that's a clean
                multiple of the combined block's size.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming any group of "nearby" subnets can always be merged into one CIDR block. They can
          only merge cleanly if the group is both contiguous (no gaps) <em>and</em> properly aligned
          — try deselecting just the second block below and watch the aggregation stop being clean,
          even though the addresses are still close together.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Four /24 subnets are shown below, each a routing-table entry today.</li>
          <li>Click any block to include/exclude it from the group being aggregated.</li>
          <li>
            Click "Aggregate" to compute (and animate) the single CIDR block covering the selected
            group.
          </li>
          <li>Try deselecting one middle block to see aggregation fail cleanly, and read why.</li>
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALL_BLOCKS.map((b, i) => (
          <button
            key={b.network}
            onClick={() => toggle(i)}
            className={`rounded-md border p-3 text-left transition-all ${
              selectedIdx.includes(i)
                ? 'border-sky-300 bg-sky-50'
                : 'border-stone-200 bg-white opacity-50'
            }`}
          >
            <p className="font-mono text-sm text-stone-900">
              {b.network}/{b.prefix}
            </p>
            <p className="mt-1 break-all font-mono text-[10px] text-stone-400">
              {toBinaryOctets(b.network)}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRevealed(true)}
          disabled={selectedBlocks.length < 2}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Aggregate selected blocks
        </button>
        <button
          onClick={() => setRevealed(false)}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {revealed && result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 items-center gap-4">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
                Before: {selectedBlocks.length} routing-table entries
              </p>
              <ul className="space-y-1 font-mono text-sm">
                {selectedBlocks.map((b) => (
                  <li
                    key={b.network}
                    className="rounded border border-stone-200 bg-stone-50 px-2 py-1"
                  >
                    {b.network}/{b.prefix}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
                After: 1 entry {result.cleanlyAggregates ? '' : '(imperfect!)'}
              </p>
              <div
                className={`rounded border px-2 py-1 font-mono text-sm ${result.cleanlyAggregates ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}
              >
                {result.network}/{result.prefix}
              </div>
            </div>
          </div>
          <div
            className={`rounded-lg p-4 text-sm ${result.cleanlyAggregates ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
          >
            {result.cleanlyAggregates ? (
              <p className="font-semibold">
                Clean aggregation — the shared prefix of length /{result.prefix} covers exactly the{' '}
                {selectedBlocks.length} selected blocks, no more and no fewer addresses.
              </p>
            ) : (
              <p className="font-semibold">
                Not a clean aggregation — the smallest block that shares a common prefix (/
                {result.prefix}) covers more addresses than just your selected blocks. Because the
                group isn't contiguous and aligned, advertising /{result.prefix} would incorrectly
                claim addresses you didn't select.
              </p>
            )}
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
