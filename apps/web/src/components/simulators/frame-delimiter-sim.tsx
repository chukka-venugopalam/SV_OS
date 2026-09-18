/**
 * Component: FrameDelimiterSim
 * Serves: act5-d2-ch01-framing-techniques ("Framing Techniques")
 *
 * What it demonstrates:
 *   Byte-stuffing and bit-stuffing inserting escape sequences whenever the frame
 *   delimiter pattern appears inside the payload, then correctly removing those
 *   escapes again on the receiving end (destuffing) so the original payload comes
 *   back unchanged.
 *
 * Design decisions:
 *   - Byte-stuffing uses the real HDLC/PPP convention: FLAG = 0x7E, ESC = 0x7D, and any
 *     occurrence of FLAG or ESC in the payload is replaced by ESC followed by
 *     (byte XOR 0x20). This is a concrete, real-world scheme rather than an invented
 *     placeholder one.
 *   - Bit-stuffing uses the classic HDLC rule: insert a 0 after every five consecutive
 *     1s in the payload bitstream, so the 6-consecutive-1s flag pattern (01111110)
 *     can never appear by accident inside the data.
 *   - Two independent presets are provided that are specifically chosen to already
 *     contain the delimiter pattern, so stuffing visibly does something on first load
 *     rather than the student needing to hunt for a triggering example.
 *   - ASSUMPTION: Tailwind utility classes + lucide-react available in host repo
 *     (same assumption as prior simulators in this set).
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const FLAG = 0x7e; // 01111110
const ESC = 0x7d;

type Mode = 'byte' | 'bit';

function toHexBytes(str: string): number[] {
  return Array.from(str).map((c) => c.charCodeAt(0) & 0xff);
}

// ---------- Byte stuffing ----------
function byteStuff(bytes: number[]): { output: number[]; insertedAt: number[] } {
  const output: number[] = [FLAG];
  const insertedAt: number[] = [];
  bytes.forEach((b) => {
    if (b === FLAG || b === ESC) {
      output.push(ESC);
      insertedAt.push(output.length - 1);
      output.push(b ^ 0x20);
    } else {
      output.push(b);
    }
  });
  output.push(FLAG);
  return { output, insertedAt };
}

function byteDestuff(framed: number[]): number[] {
  const inner = framed.slice(1, -1); // drop start/end flags
  const out: number[] = [];
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === ESC) {
      out.push(inner[i + 1] ^ 0x20);
      i++;
    } else {
      out.push(inner[i]);
    }
  }
  return out;
}

// ---------- Bit stuffing ----------
function bitStuff(bits: string): { output: string; insertedAt: number[] } {
  let output = '';
  let ones = 0;
  const insertedAt: number[] = [];
  for (const b of bits) {
    output += b;
    if (b === '1') {
      ones++;
      if (ones === 5) {
        output += '0';
        insertedAt.push(output.length - 1);
        ones = 0;
      }
    } else {
      ones = 0;
    }
  }
  return { output, insertedAt };
}

function bitDestuff(stuffed: string): string {
  let out = '';
  let ones = 0;
  let i = 0;
  while (i < stuffed.length) {
    const b = stuffed[i];
    out += b;
    if (b === '1') {
      ones++;
      if (ones === 5) {
        i += 2; // skip the stuffed 0
        ones = 0;
        continue;
      }
    } else {
      ones = 0;
    }
    i++;
  }
  return out;
}

const BYTE_PRESET = 'AB~}CD'; // "~" = 0x7E (FLAG), "}" = 0x7D (ESC) — both trigger stuffing
const BIT_PRESET = '0011111101011111100'; // contains a run of 5 and 6 ones

export default function FrameDelimiterSim() {
  const [mode, setMode] = useState<Mode>('byte');
  const [text, setText] = useState(BYTE_PRESET);
  const [bits, setBits] = useState(BIT_PRESET);
  const [revealed, setRevealed] = useState(0); // how many source symbols processed so far
  const [running, setRunning] = useState(false);
  const [showDestuff, setShowDestuff] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceBytes = toHexBytes(text);
  const { output: stuffedBytes, insertedAt: byteInserts } = byteStuff(
    sourceBytes.slice(0, revealed),
  );
  const fullStuffedBytes = byteStuff(sourceBytes).output;

  const { output: stuffedBits, insertedAt: bitInserts } = bitStuff(bits.slice(0, revealed));
  const fullStuffedBits = bitStuff(bits).output;

  const sourceLen = mode === 'byte' ? sourceBytes.length : bits.length;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const reset = () => {
    clearTimer();
    setRevealed(0);
    setRunning(false);
    setShowDestuff(false);
  };
  const stepOnce = () => {
    clearTimer();
    setRevealed((r) => Math.min(sourceLen, r + 1));
  };

  useEffect(() => {
    if (!running) return;
    if (revealed >= sourceLen) {
      setRunning(false);
      setShowDestuff(true);
      return;
    }
    timer.current = setTimeout(stepOnce, 450);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, revealed, sourceLen]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, text, bits]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('byte')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'byte' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Byte stuffing
        </button>
        <button
          onClick={() => setMode('bit')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'bit' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Bit stuffing
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          A network frame needs a clear "start" and "end" marker, called a{' '}
          <strong>delimiter</strong>, so the receiver knows where one message stops and the next
          begins. But what happens if the delimiter's exact pattern shows up naturally inside the
          data being sent? Without a fix, the receiver would think the frame ended early.{' '}
          <strong>Framing</strong> techniques solve this by temporarily disguising any accidental
          delimiter pattern in the payload — a trick called <strong>stuffing</strong> — and then
          removing that disguise again once the frame is safely received (
          <strong>destuffing</strong>).
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Delimiter / flag: </dt>
              <dd className="inline text-stone-600">
                the special pattern marking a frame's start and end — here, the byte 0x7E or the bit
                pattern 01111110.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Escape byte: </dt>
              <dd className="inline text-stone-600">
                (byte stuffing only) a special marker byte (0x7D) inserted right before a real
                delimiter or escape byte found inside the data, telling the receiver "the next byte
                is data, not a flag."
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Bit stuffing: </dt>
              <dd className="inline text-stone-600">
                inserting an extra 0 after every five consecutive 1s in the data, so six 1s in a row
                (the flag pattern) can never occur by accident.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          {mode === 'byte'
            ? "thinking stuffing changes what the data means. It doesn't — stuffing only ever adds extra escape bytes around an accidental flag pattern; destuffing removes exactly those extra bytes, so the delivered payload is byte-for-byte identical to the original."
            : 'assuming a stuffed 0 is just "noise" the receiver has to guess about. It isn\'t a guess — the receiver applies the exact same rule (count five 1s, remove the next bit) deterministically, so destuffing always recovers the original bitstream with zero ambiguity.'}
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Edit the {mode === 'byte' ? 'text' : 'bit string'} below, or keep the preset (it already
            contains a delimiter pattern).
          </li>
          <li>
            Click "Step" to scan one {mode === 'byte' ? 'character' : 'bit'} at a time, or "Run all"
            to scan automatically.
          </li>
          <li>
            Watch highlighted inserts appear in the stuffed output whenever the delimiter pattern is
            found.
          </li>
          <li>
            Once scanning finishes, the destuffed result appears below — compare it to your original
            input.
          </li>
        </ol>
      </div>

      {mode === 'byte' ? (
        <div>
          <label className="text-sm font-medium text-stone-800">
            Payload text (each character = 1 byte)
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value || ' ')}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-stone-400">
            Tip: "~" is the flag byte (0x7E), {'"}"'} is the escape byte (0x7D) — try including
            them.
          </p>
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-stone-800">Payload bits</label>
          <input
            value={bits}
            onChange={(e) => setBits(e.target.value.replace(/[^01]/g, '') || '0')}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          />
        </div>
      )}

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
          disabled={revealed >= sourceLen}
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

      {/* Visualization */}
      {mode === 'byte' ? (
        <div className="space-y-3">
          <FrameRow
            label="Original payload (scanning)"
            cells={sourceBytes.map((b) => String.fromCharCode(b))}
            activeIndex={revealed - 1}
            highlightSet={new Set()}
          />
          <FrameRow
            label="Stuffed frame (transmitted)"
            cells={stuffedBytes.map((b) =>
              b === FLAG ? 'FLAG' : b === ESC ? 'ESC' : String.fromCharCode(b),
            )}
            highlightSet={new Set(byteInserts)}
          />
          {showDestuff && (
            <FrameRow
              label="Destuffed at receiver (should match original)"
              cells={byteDestuff(fullStuffedBytes).map((b) => String.fromCharCode(b))}
              highlightSet={new Set()}
              match={
                byteDestuff(fullStuffedBytes)
                  .map((b) => String.fromCharCode(b))
                  .join('') === text
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <FrameRow
            label="Original bitstream (scanning)"
            cells={bits.split('')}
            activeIndex={revealed - 1}
            highlightSet={new Set()}
            mono
          />
          <FrameRow
            label="Stuffed bitstream (transmitted)"
            cells={stuffedBits.split('')}
            highlightSet={new Set(bitInserts)}
            mono
          />
          {showDestuff && (
            <FrameRow
              label="Destuffed at receiver (should match original)"
              cells={bitDestuff(fullStuffedBits).split('')}
              highlightSet={new Set()}
              mono
              match={bitDestuff(fullStuffedBits) === bits}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FrameRow({
  label,
  cells,
  activeIndex,
  highlightSet,
  mono,
  match,
}: {
  label: string;
  cells: string[];
  activeIndex?: number;
  highlightSet: Set<number>;
  mono?: boolean;
  match?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
        {label}{' '}
        {match !== undefined &&
          (match ? (
            <span className="text-emerald-600">— matches ✓</span>
          ) : (
            <span className="text-rose-600">— mismatch ✗</span>
          ))}
      </p>
      <div className="flex flex-wrap gap-1">
        {cells.map((c, i) => (
          <span
            key={i}
            className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded border px-1 text-xs transition-all duration-200 ${mono ? 'font-mono' : ''} ${
              highlightSet.has(i)
                ? 'scale-110 border-amber-500 bg-amber-400 text-white'
                : activeIndex === i
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : c === 'FLAG'
                    ? 'border-rose-300 bg-rose-100 text-rose-700'
                    : 'border-stone-200 bg-stone-50 text-stone-700'
            }`}
          >
            {c}
          </span>
        ))}
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
