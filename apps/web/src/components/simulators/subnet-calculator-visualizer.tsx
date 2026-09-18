/**
 * Component: SubnetCalculatorVisualizer
 * Serves: act5-d3-ch01-ipv4-addressing-subnetting ("IPv4 Addressing & Subnetting")
 *
 * REPLACEMENT NOTE: this chapter was originally marked "already covered" by an
 * existing `subnet-calculator-visualizer` component. A later audit (by the person
 * who owns this project, not this session) found that component is a static mockup
 * with one hardcoded example and no real calculation behind it. This file is a full
 * replacement with genuine bitwise arithmetic, built fresh rather than assuming the
 * old file's shape.
 *
 * What it demonstrates:
 *   Entering any IPv4 address and CIDR prefix length computes the real network
 *   address, broadcast address, subnet mask, and usable host range live via bitwise
 *   arithmetic — not a single canned example. A second mode splits a network into N
 *   equal-sized subnets, computing the new prefix length and listing every resulting
 *   subnet.
 *
 * Design decisions:
 *   - All arithmetic works on the actual 32-bit integer representation of the
 *     address (via >>> 0 unsigned bitwise ops), so any IP/prefix the student types
 *     in computes correctly — this is a real calculator, not a lookup table of
 *     precomputed answers.
 *   - /31 and /32 are handled as their real documented special cases (no usable host
 *     range in the normal sense) rather than being silently wrong or crashing, since
 *     they're a common source of off-by-one confusion.
 *   - The subnetting mode computes the required additional prefix bits as
 *     ceil(log2(N)) and shows every resulting subnet's boundaries, so "splitting into
 *     N pieces costs you log2(N) bits of host space" is a directly visible tradeoff.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo (confirmed correct
 *     for this repo).
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return (nums[0] * 2 ** 24 + nums[1] * 2 ** 16 + nums[2] * 2 ** 8 + nums[3]) >>> 0;
}
function intToIp(n: number): string {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 0xff).join('.');
}
function maskForPrefix(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

type Mode = 'calculator' | 'splitter';

export default function SubnetCalculatorVisualizer() {
  const [mode, setMode] = useState<Mode>('calculator');
  const [ipText, setIpText] = useState('192.168.1.50');
  const [prefix, setPrefix] = useState(26);
  const [splitCount, setSplitCount] = useState(4);

  const ipInt = ipToInt(ipText);
  const valid = ipInt !== null;
  const mask = maskForPrefix(prefix);
  const network = valid ? (ipInt! & mask) >>> 0 : 0;
  const broadcast = valid ? (network | (~mask >>> 0)) >>> 0 : 0;
  const totalAddresses = 2 ** (32 - prefix);
  const isSpecial = prefix >= 31;
  const firstUsable = isSpecial ? null : network + 1;
  const lastUsable = isSpecial ? null : broadcast - 1;
  const usableCount = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(0, totalAddresses - 2);

  // Subnetting: split the /prefix network above into splitCount equal subnets
  const extraBits = Math.ceil(Math.log2(Math.max(1, splitCount)));
  const newPrefix = Math.min(32, prefix + extraBits);
  const subnetSize = 2 ** (32 - newPrefix);
  const actualSubnetCount = 2 ** extraBits;
  const subnets = valid
    ? Array.from({ length: Math.min(actualSubnetCount, 16) }, (_, i) => {
        const subnetNetwork = (network + i * subnetSize) >>> 0;
        const subnetBroadcast = (subnetNetwork + subnetSize - 1) >>> 0;
        return {
          network: intToIp(subnetNetwork),
          broadcast: intToIp(subnetBroadcast),
          prefix: newPrefix,
        };
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('calculator')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'calculator' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Subnet calculator
        </button>
        <button
          onClick={() => setMode('splitter')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'splitter' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Split into subnets
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          An IPv4 address is really just a 32-bit number, usually written as 4 decimal numbers
          (0–255) separated by dots. A <strong>subnet mask</strong> (or the equivalent{' '}
          <strong>CIDR prefix</strong>, like /26) splits that 32-bit number into a "network" part
          and a "host" part — every device on the same network shares the same network part. From
          the address and prefix alone, you can calculate the <strong>network address</strong> (the
          network itself), the <strong>broadcast address</strong> (reaches every device on it), and
          the range of addresses actually usable by individual devices.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">CIDR prefix (/26): </dt>
              <dd className="inline text-stone-600">
                how many leading bits of the address are fixed as the network part.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Network address: </dt>
              <dd className="inline text-stone-600">
                the address with all host bits set to 0 — identifies the network itself, not a
                usable device address.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Broadcast address: </dt>
              <dd className="inline text-stone-600">
                the address with all host bits set to 1 — reaches every device on the network at
                once, also not usable by a single device.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming the network and broadcast addresses are usable device addresses just because they
          fall within the range. They're reserved — the network address means "the network itself,"
          and the broadcast address means "everyone on it," so a normal /24 or larger network's
          usable range is always 2 less than its total address count. (The two exceptions, /31 and
          /32, don't follow this rule — see them called out below.)
        </CommonMistake>
      </div>

      {mode === 'calculator' ? (
        <>
          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>Type any IPv4 address, and drag the prefix slider.</li>
              <li>
                Every value below recomputes live — try /24, /30, /31, and /32 to see the edge
                cases.
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs text-stone-500">IPv4 address</label>
              <input
                value={ipText}
                onChange={(e) => setIpText(e.target.value)}
                className="mt-1 block w-44 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="text-xs text-stone-500">Prefix: /{prefix}</label>
              <input
                type="range"
                min={0}
                max={32}
                value={prefix}
                onChange={(e) => setPrefix(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          {!valid && (
            <p className="text-sm text-rose-600">Enter a valid IPv4 address (e.g. 192.168.1.50).</p>
          )}

          {valid && (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Stat label="Subnet mask" value={intToIp(mask)} />
              <Stat label="Network address" value={`${intToIp(network)}/${prefix}`} />
              <Stat label="Broadcast address" value={intToIp(broadcast)} />
              <Stat label="Total addresses" value={totalAddresses.toLocaleString()} />
              <Stat
                label="Usable host range"
                value={
                  isSpecial
                    ? prefix === 32
                      ? 'n/a — single host, no range'
                      : 'n/a — point-to-point link, both addresses usable'
                    : `${intToIp(firstUsable!)} – ${intToIp(lastUsable!)}`
                }
              />
              <Stat label="Usable host count" value={usableCount.toLocaleString()} />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>
                Using the same address/prefix above as the base network, pick how many equal subnets
                to split it into.
              </li>
              <li>See the new prefix length and every resulting subnet's boundaries.</li>
            </ol>
          </div>
          <div>
            <label className="text-xs text-stone-500">
              Split /{prefix} into how many subnets: {splitCount}
            </label>
            <input
              type="range"
              min={2}
              max={16}
              value={splitCount}
              onChange={(e) => setSplitCount(Number(e.target.value))}
              className="w-full"
            />
          </div>
          {valid && (
            <>
              <p className="text-sm text-stone-700">
                Needs {extraBits} extra bit{extraBits === 1 ? '' : 's'} → new prefix{' '}
                <span className="font-mono font-semibold">/{newPrefix}</span>, producing{' '}
                <span className="font-mono font-semibold">{actualSubnetCount}</span> subnets of{' '}
                {subnetSize} addresses each
                {actualSubnetCount > splitCount &&
                  ` (you asked for ${splitCount}, but subnet counts must be a power of 2)`}
                .
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto font-mono text-sm">
                {subnets.map((s, i) => (
                  <div key={i} className="rounded border border-stone-200 bg-stone-50 px-2 py-1">
                    Subnet {i + 1}: {s.network}/{s.prefix} — broadcast {s.broadcast}
                  </div>
                ))}
                {actualSubnetCount > 16 && (
                  <p className="text-xs text-stone-400">
                    ...showing first 16 of {actualSubnetCount}.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="font-mono font-semibold text-stone-900">{value}</p>
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
