/**
 * Component: HammingCodeSim
 * Serves: act5-d2-ch03-error-correction-hamming-code ("Error Correction — Hamming Code")
 *
 * What it demonstrates:
 *   Encoding a 4-bit data word into Hamming(7,4) by placing parity bits at
 *   power-of-two positions (1, 2, 4), flipping one bit of the transmitted 7-bit
 *   codeword, and computing the syndrome — a small calculation that points directly
 *   at which single bit is wrong, letting the receiver self-correct without asking
 *   the sender to resend anything.
 *
 * Design decisions:
 *   - Uses the standard Hamming(7,4) layout (positions 1-7, parity at 1/2/4, data at
 *     3/5/6/7) because it's the smallest, most commonly taught concrete case — every
 *     position fits on screen and every parity group is small enough to reason about
 *     by hand.
 *   - The syndrome is displayed both as three individual bit checks (P1, P2, P4) and
 *     as the binary number they form together, since the "the syndrome bits literally
 *     spell out the error position in binary" insight is the whole point of the
 *     exercise and easy to miss if only the final decimal number is shown.
 *   - Bit-flipping is a direct click on the transmitted codeword (not a random
 *     "corrupt" button) so the student always knows exactly what was changed before
 *     seeing the syndrome respond to it.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

// Position numbers 1-7. Data bits go at 3,5,6,7 (non-powers-of-2). Parity at 1,2,4.
const DATA_POSITIONS = [3, 5, 6, 7];
const PARITY_POSITIONS = [1, 2, 4];

function encode(data: string): string[] {
  // returns array indexed 0..6 representing positions 1..7
  const bits: string[] = new Array(7).fill('0');
  DATA_POSITIONS.forEach((pos, i) => {
    bits[pos - 1] = data[i];
  });
  PARITY_POSITIONS.forEach((p) => {
    // parity bit at position p covers all positions whose binary AND with p is nonzero
    let x = 0;
    for (let pos = 1; pos <= 7; pos++) {
      if (pos === p) continue;
      if ((pos & p) !== 0) {
        x ^= Number(bits[pos - 1] || '0');
      }
    }
    bits[p - 1] = String(x);
  });
  return bits;
}

function syndrome(bits: string[]): { value: number; checks: Record<number, boolean> } {
  const checks: Record<number, boolean> = {};
  let value = 0;
  PARITY_POSITIONS.forEach((p) => {
    let x = 0;
    for (let pos = 1; pos <= 7; pos++) {
      if ((pos & p) !== 0) x ^= Number(bits[pos - 1]);
    }
    checks[p] = x === 0; // true = check passes
    if (x !== 0) value += p;
  });
  return { value, checks };
}

const PRESETS = ['1011', '0110', '1111', '0001'];

export default function HammingCodeSim() {
  const [data, setData] = useState('1011');
  const [flipPos, setFlipPos] = useState<number | null>(null); // 1..7 or null
  const [revealSyndrome, setRevealSyndrome] = useState(false);

  const encoded = useMemo(() => encode(data), [data]);
  const transmitted = useMemo(() => {
    if (flipPos === null) return encoded;
    return encoded.map((b, i) => (i === flipPos - 1 ? (b === '1' ? '0' : '1') : b));
  }, [encoded, flipPos]);

  const { value: syndromeValue, checks } = syndrome(transmitted);
  const corrected = useMemo(() => {
    if (syndromeValue === 0) return transmitted;
    return transmitted.map((b, i) => (i === syndromeValue - 1 ? (b === '1' ? '0' : '1') : b));
  }, [transmitted, syndromeValue]);

  const recoveredData = DATA_POSITIONS.map((p) => corrected[p - 1]).join('');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          CRC and parity can tell you <em>that</em> an error happened, but not exactly where — the
          receiver can only ask the sender to resend. A <strong>Hamming code</strong> does better:
          it spreads a few extra <strong>parity bits</strong> through the message at carefully
          chosen positions (positions 1, 2, and 4 — each a power of two) so that if exactly one bit
          flips anywhere, a quick calculation called the <strong>syndrome</strong> points to the
          exact position of the broken bit, and the receiver can just flip it back — no resend
          needed.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Parity bit position: </dt>
              <dd className="inline text-stone-600">
                positions 1, 2, and 4 in the 7-bit codeword — each one checks a different
                overlapping group of the other bits.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Syndrome: </dt>
              <dd className="inline text-stone-600">
                the combination of which parity checks failed, added together — its value is
                literally the position number of the broken bit.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Self-correcting code: </dt>
              <dd className="inline text-stone-600">
                a code that lets the receiver fix a single-bit error itself, instead of just
                detecting it.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming each parity bit only checks "the bit right after it," the way you might check a
          small fixed group. Each parity bit actually checks a specific, overlapping set of
          positions determined by binary arithmetic (position <em>p</em> checks every position whose
          bitwise AND with <em>p</em> is nonzero) — that overlap is exactly what lets the three
          checks together pinpoint one exact position out of seven.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Pick a 4-bit data word below — it gets automatically encoded into a 7-bit Hamming
            codeword.
          </li>
          <li>
            Click any position in the transmitted codeword to flip that bit (simulating a
            transmission error).
          </li>
          <li>
            Click "Compute syndrome" to see each parity check run and the resulting error position.
          </li>
          <li>
            See the corrected codeword and confirm the original 4 data bits come back exactly.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600">Data word:</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setData(p);
              setFlipPos(null);
              setRevealSyndrome(false);
            }}
            className={`rounded-md border px-3 py-1 font-mono text-sm ${data === p ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Encoded codeword with position labels */}
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
          Transmitted 7-bit codeword — click a bit to flip it
        </p>
        <div className="flex gap-1">
          {transmitted.map((b, i) => {
            const pos = i + 1;
            const isParity = PARITY_POSITIONS.includes(pos);
            const isFlipped = flipPos === pos;
            return (
              <button
                key={pos}
                onClick={() => {
                  setFlipPos((f) => (f === pos ? null : pos));
                  setRevealSyndrome(false);
                }}
                className={`flex h-14 w-11 flex-col items-center justify-center rounded-md border font-mono text-sm transition-all ${
                  isFlipped
                    ? 'border-rose-500 bg-rose-400 text-white'
                    : isParity
                      ? 'border-violet-300 bg-violet-100 text-violet-700'
                      : 'border-stone-300 bg-white text-stone-800'
                }`}
              >
                <span className="text-[10px] opacity-60">pos {pos}</span>
                <span>{b}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-stone-400">
          Violet = parity bit position (1, 2, 4). White = data bit position.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRevealSyndrome(true)}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Compute syndrome
        </button>
        <button
          onClick={() => {
            setFlipPos(null);
            setRevealSyndrome(false);
          }}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      {revealSyndrome && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {PARITY_POSITIONS.map((p) => (
              <div
                key={p}
                className={`rounded-md border p-3 text-center text-sm ${checks[p] ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}
              >
                <p className="font-semibold">Check P{p}</p>
                <p className="text-xs">{checks[p] ? 'passes' : 'fails'}</p>
              </div>
            ))}
          </div>
          <div
            className={`rounded-lg p-4 text-sm ${syndromeValue === 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
          >
            <p className="font-semibold">
              Syndrome = {PARITY_POSITIONS.filter((p) => !checks[p]).join(' + ') || '0'} ={' '}
              {syndromeValue}.{' '}
              {syndromeValue === 0
                ? 'No error detected.'
                : `Bit at position ${syndromeValue} is wrong — flip it to correct the codeword.`}
            </p>
          </div>
          {syndromeValue !== 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
                Corrected codeword
              </p>
              <div className="flex gap-1">
                {corrected.map((b, i) => (
                  <span
                    key={i}
                    className={`flex h-11 w-11 items-center justify-center rounded-md border font-mono text-sm ${
                      i === syndromeValue - 1
                        ? 'border-emerald-500 bg-emerald-400 text-white'
                        : PARITY_POSITIONS.includes(i + 1)
                          ? 'border-violet-300 bg-violet-100 text-violet-700'
                          : 'border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-stone-700">
            Recovered data bits (positions {DATA_POSITIONS.join(', ')}):{' '}
            <span className="font-mono font-semibold">{recoveredData}</span>{' '}
            {recoveredData === data ? (
              <span className="text-emerald-600">— matches original ✓</span>
            ) : (
              <span className="text-rose-600">— mismatch ✗</span>
            )}
          </p>
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
