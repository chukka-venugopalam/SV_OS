/**
 * Component: CrcCalculatorVisualizer
 * Serves: act5-d2-ch02-error-detection-parity-crc ("Error Detection — Parity & CRC")
 *
 * What it demonstrates:
 *   Parity mode: a single parity bit catching any single-bit flip but missing
 *   two-bit (even-count) flips.
 *   CRC mode: binary polynomial long division (XOR-based, not subtraction) computing
 *   a checksum step by step, appending it to the message, and a corrupted frame then
 *   failing the same division check at the receiver.
 *
 * Design decisions:
 *   - CRC uses a small worked example (4-bit data, 3-bit generator "1011", matching a
 *     standard textbook CRC-3 example) so every XOR step fits on screen and the
 *     student can follow the whole division by eye, rather than a realistic
 *     CRC-32-sized computation that would be unreadable as a step trace.
 *   - The parity example uses the same worked codeword length as the CRC to keep the
 *     two ideas visually comparable side by side conceptually (same "kind" of frame,
 *     two different error-detection strategies).
 *   - Corruption is applied by letting the student click bits to flip them directly
 *     (not a random "corrupt" button), so cause and effect are explicit rather than
 *     hidden behind randomness.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type Mode = 'parity' | 'crc';

const DATA = '1101'; // 4-bit example data word, shared by both modes for comparability
const GENERATOR = '1011'; // CRC-3-style generator polynomial (degree 3 -> 3 check bits)

function xorDivide(
  dividend: string,
  generator: string,
): { steps: { row: string; op: 'xor' | 'bring' }[]; remainder: string } {
  const n = generator.length;
  let work = dividend.split('');
  const steps: { row: string; op: 'xor' | 'bring' }[] = [];
  for (let i = 0; i <= dividend.length - n; i++) {
    if (work[i] === '1') {
      for (let j = 0; j < n; j++) {
        work[i + j] = String(Number(work[i + j]) ^ Number(generator[j]));
      }
      steps.push({ row: work.join(''), op: 'xor' });
    } else {
      steps.push({ row: work.join(''), op: 'bring' });
    }
  }
  const remainder = work.slice(dividend.length - (n - 1)).join('');
  return { steps, remainder };
}

function computeParity(bits: string): '0' | '1' {
  const ones = bits.split('').filter((b) => b === '1').length;
  return ones % 2 === 0 ? '0' : '1'; // even parity: parity bit makes total 1s even
}

function flip(bits: string, index: number): string {
  return bits
    .split('')
    .map((b, i) => (i === index ? (b === '1' ? '0' : '1') : b))
    .join('');
}

export default function CrcCalculatorVisualizer() {
  const [mode, setMode] = useState<Mode>('parity');

  // --- Parity state ---
  const [flippedParity, setFlippedParity] = useState<number[]>([]);
  const parityBit = computeParity(DATA);
  const codeword = DATA + parityBit;
  const receivedParity = flippedParity.reduce((acc, i) => flip(acc, i), codeword);
  const recomputedParityCheck =
    computeParity(receivedParity.slice(0, -1)) === receivedParity.slice(-1);

  // --- CRC state ---
  const n = GENERATOR.length - 1;
  const dividend = DATA + '0'.repeat(n);
  const { steps, remainder } = xorDivide(dividend, GENERATOR);
  const [crcStepIndex, setCrcStepIndex] = useState(0);
  const transmitted = DATA + remainder;
  const [flippedCrc, setFlippedCrc] = useState<number[]>([]);
  const receivedCrc = flippedCrc.reduce((acc, i) => flip(acc, i), transmitted);
  const { remainder: checkRemainder } = xorDivide(receivedCrc, GENERATOR);
  const crcOk = Number(checkRemainder) === 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('parity')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'parity' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Parity bit
        </button>
        <button
          onClick={() => setMode('crc')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'crc' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          CRC (polynomial division)
        </button>
      </div>

      {mode === 'parity' ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            The simplest way to catch a transmission error is to count something. A{' '}
            <strong>parity bit</strong> is one extra bit added so that the total number of 1s in the
            message is always even (this is called <strong>even parity</strong>). If exactly one bit
            flips in transit, the count of 1s becomes odd, and the receiver can tell something
            broke. This mode lets you flip individual bits of a transmitted codeword and see when
            the parity check catches it — and when it doesn't.
          </p>
          <div className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-medium text-stone-900">Parity bit: </dt>
                <dd className="inline text-stone-600">
                  an extra bit chosen so the total count of 1s in the codeword is even.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Codeword: </dt>
                <dd className="inline text-stone-600">
                  the original data plus its parity bit, as actually transmitted.
                </dd>
              </div>
            </dl>
          </div>
          <CommonMistake>
            assuming a parity check catches "an error" in general. It only reliably catches an{' '}
            <em>odd</em> number of flipped bits. Flip exactly two bits and the total count of 1s is
            even again — the check passes even though the data is now wrong. Try flipping two bits
            below to see it slip through.
          </CommonMistake>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>
                The codeword below is the 4-bit data <span className="font-mono">{DATA}</span> plus
                its computed parity bit.
              </li>
              <li>
                Click any bit to flip it (simulating transmission corruption). Click again to flip
                it back.
              </li>
              <li>
                Watch the "parity check" verdict update — flip 1 bit to see it fail, then flip a 2nd
                to see it wrongly pass.
              </li>
              <li>Click "Reset" to restore the original codeword.</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFlippedParity([])}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            >
              Reset
            </button>
            <span className="text-sm text-stone-500">
              Bits flipped so far: {flippedParity.length}
            </span>
          </div>

          <div className="flex gap-1">
            {receivedParity.split('').map((b, i) => (
              <button
                key={i}
                onClick={() =>
                  setFlippedParity((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]))
                }
                className={`flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm transition-all ${
                  i === codeword.length - 1
                    ? 'border-violet-300 bg-violet-100 text-violet-700'
                    : flippedParity.includes(i)
                      ? 'border-rose-500 bg-rose-400 text-white'
                      : 'border-stone-300 bg-white text-stone-800'
                }`}
                title={i === codeword.length - 1 ? 'parity bit' : `data bit ${i + 1}`}
              >
                {b}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400">
            Violet bit = the parity bit. Click any bit to toggle a flip.
          </p>

          <div
            className={`rounded-lg p-4 text-sm ${recomputedParityCheck ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}
          >
            <p className="font-semibold">
              {recomputedParityCheck
                ? flippedParity.length === 0
                  ? 'No corruption — parity check passes, as expected.'
                  : 'Parity check passes — but the data may still be wrong! (Even number of flips slipped through.)'
                : 'Parity check FAILS — receiver correctly detects corruption.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            A <strong>CRC</strong> (Cyclic Redundancy Check) is a stronger error-detection code than
            a single parity bit. The sender treats the data as a binary number and divides it by an
            agreed-upon constant called the <strong>generator polynomial</strong>, using a special
            kind of division that uses XOR instead of subtraction. The remainder of that division
            becomes the checksum, appended to the message. The receiver repeats the exact same
            division on the whole received message — if nothing changed in transit, the remainder
            comes out as all zeros.
          </p>
          <div className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-medium text-stone-900">Generator polynomial: </dt>
                <dd className="inline text-stone-600">
                  a fixed bit pattern (here <span className="font-mono">{GENERATOR}</span>) both
                  sender and receiver agree on in advance.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">XOR division: </dt>
                <dd className="inline text-stone-600">
                  binary long division where each subtraction step is done with XOR instead of
                  normal subtraction.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Remainder / CRC checksum: </dt>
                <dd className="inline text-stone-600">
                  what's left over after dividing — this becomes the extra bits appended to the
                  message.
                </dd>
              </div>
            </dl>
          </div>
          <CommonMistake>
            trying to do the division with ordinary subtraction and borrowing, the way you'd divide
            decimal numbers by hand. CRC division uses XOR at every step instead — there's no
            borrowing, and a step only "subtracts" the generator when the current leading bit is 1.
          </CommonMistake>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>
                Data <span className="font-mono">{DATA}</span> gets {n} zero bits appended, ready to
                divide.
              </li>
              <li>
                Click "Step" to reveal one row of the XOR long division at a time, or "Show all
                steps."
              </li>
              <li>
                The final remainder becomes the CRC appended to the data — that's what's actually
                transmitted.
              </li>
              <li>
                Click bits in the transmitted frame below to corrupt it, and watch the receiver's
                check fail.
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCrcStepIndex((s) => Math.min(steps.length, s + 1))}
              disabled={crcStepIndex >= steps.length}
              className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
            >
              Step
            </button>
            <button
              onClick={() => setCrcStepIndex(steps.length)}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Show all steps
            </button>
            <button
              onClick={() => setCrcStepIndex(0)}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            >
              Reset
            </button>
          </div>

          <div className="space-y-1 overflow-x-auto rounded-md bg-stone-50 p-3 font-mono text-sm">
            <div>
              &nbsp;&nbsp;{dividend} &nbsp;÷ {GENERATOR}
            </div>
            {steps.slice(0, crcStepIndex).map((s, i) => (
              <div key={i} className={s.op === 'xor' ? 'text-rose-600' : 'text-stone-400'}>
                {s.op === 'xor' ? 'XOR ' : 'skip'} → {s.row}
              </div>
            ))}
            {crcStepIndex >= steps.length && (
              <div className="border-t border-stone-200 pt-1 font-semibold text-stone-900">
                Remainder (CRC) = {remainder}
              </div>
            )}
          </div>

          {crcStepIndex >= steps.length && (
            <>
              <p className="mt-4 text-xs uppercase tracking-wide text-stone-400">
                Transmitted frame = data + CRC — click a bit to corrupt it
              </p>
              <div className="flex gap-1">
                {receivedCrc.split('').map((b, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setFlippedCrc((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]))
                    }
                    className={`flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm transition-all ${
                      i >= DATA.length
                        ? 'border-violet-300 bg-violet-100 text-violet-700'
                        : flippedCrc.includes(i)
                          ? 'border-rose-500 bg-rose-400 text-white'
                          : 'border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div
                className={`rounded-lg p-4 text-sm ${crcOk ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
              >
                <p className="font-semibold">
                  Receiver divides {receivedCrc} by {GENERATOR} → remainder{' '}
                  {checkRemainder || '0'.repeat(n)}.{' '}
                  {crcOk
                    ? 'Zero remainder — frame accepted as uncorrupted.'
                    : 'Non-zero remainder — corruption detected, frame rejected.'}
                </p>
              </div>
            </>
          )}
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
