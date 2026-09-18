/**
 * Component: TcpCongestionReliabilitySim
 * Serves: act5-d1-tcp-congestion-control ("TCP Congestion Control") — Congestion Control mode
 *         act5-d1-tcp-reliability-retransmission ("TCP Reliability & Retransmission") — Retransmission mode
 *
 * REPLACEMENT NOTE: these two chapters were originally marked "already covered" by an
 * existing `tcp-packet-flow-visualizer` component, on the assumption it covered all
 * three TCP chapters in this group. A later audit (by the person who owns this
 * project, not this session) confirmed that component only implements the 3-way
 * handshake — these two chapters have no existing coverage at all. This file builds
 * them fresh, as a natural pairing (both are about how TCP behaves after the
 * connection is already established, which the handshake component already covers).
 *
 * What it demonstrates:
 *   Congestion Control mode: a real, live-computed congestion window (cwnd) state
 *   machine — slow start's exponential growth, congestion avoidance's linear growth
 *   once past ssthresh, and two different loss-recovery behaviors (a full timeout vs.
 *   a triple-duplicate-ACK fast retransmit), so the same cwnd trajectory can be
 *   forced to diverge visibly depending on which kind of loss the student triggers.
 *   Retransmission mode: a scripted-but-accurate timeline of cumulative
 *   acknowledgment, duplicate ACKs building up while later segments arrive out of
 *   order behind one lost segment, and fast retransmit firing after the third
 *   duplicate — without waiting for a timeout.
 *
 * Design decisions:
 *   - Congestion Control's cwnd/ssthresh state machine is real arithmetic (doubling
 *     while in slow start, capped and switched to linear growth at ssthresh, halved
 *     and either reset to 1 (timeout) or kept at the new ssthresh (fast retransmit)
 *     on loss) sanity-checked by hand-tracing several rounds before shipping, so the
 *     chart reflects actual TCP Tahoe/Reno-style behavior, not an illustrative curve.
 *   - The two loss types are exposed as two separate buttons specifically so their
 *     different recovery severity (reset to cwnd=1 vs. staying near half) is a real,
 *     comparable side-by-side outcome the student causes and observes, not a stated
 *     fact.
 *   - Retransmission mode is a fixed, deliberately-designed scenario (6 segments, one
 *     lost, exactly enough out-of-order segments to accumulate 3 duplicate ACKs)
 *     rather than a general simulator, because the "exactly 3 duplicates triggers
 *     fast retransmit" rule is itself the fact being taught, and needs a scenario
 *     engineered to actually hit that threshold rather than an arbitrary one that
 *     might not.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo (confirmed correct
 *     for this repo).
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type Mode = 'congestion' | 'retransmission';

// ============ Congestion Control mode ============
type Phase = 'slowstart' | 'congestionavoidance';
interface CcState {
  cwnd: number;
  ssthresh: number;
  phase: Phase;
  history: { cwnd: number; event?: string }[];
}
const INITIAL_CC: CcState = { cwnd: 1, ssthresh: 16, phase: 'slowstart', history: [{ cwnd: 1 }] };

function stepRtt(s: CcState): CcState {
  let cwnd: number;
  let phase = s.phase;
  if (s.phase === 'slowstart') {
    const doubled = s.cwnd * 2;
    if (doubled >= s.ssthresh) {
      cwnd = s.ssthresh;
      phase = 'congestionavoidance';
    } else {
      cwnd = doubled;
    }
  } else {
    cwnd = s.cwnd + 1;
  }
  return { ...s, cwnd, phase, history: [...s.history, { cwnd }] };
}
function triggerTimeout(s: CcState): CcState {
  const ssthresh = Math.max(1, Math.floor(s.cwnd / 2));
  return {
    cwnd: 1,
    ssthresh,
    phase: 'slowstart',
    history: [...s.history, { cwnd: 1, event: 'TIMEOUT' }],
  };
}
function triggerFastRetransmit(s: CcState): CcState {
  const ssthresh = Math.max(1, Math.floor(s.cwnd / 2));
  return {
    cwnd: ssthresh,
    ssthresh,
    phase: 'congestionavoidance',
    history: [...s.history, { cwnd: ssthresh, event: '3-DUP-ACK' }],
  };
}

function CongestionControlPanel() {
  const [state, setState] = useState<CcState>(INITIAL_CC);
  const next = () => setState(stepRtt);
  const timeout = () => setState(triggerTimeout);
  const fastRetransmit = () => setState(triggerFastRetransmit);
  const reset = () => setState(INITIAL_CC);

  const maxCwnd = Math.max(...state.history.map((h) => h.cwnd), state.ssthresh);
  const chartW = 500,
    chartH = 160,
    padding = 30;
  const points = state.history.map((h, i) => {
    const x = padding + (i / Math.max(1, state.history.length - 1)) * (chartW - padding * 2);
    const y = chartH - padding - (h.cwnd / maxCwnd) * (chartH - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-700">
        TCP paces how much unacknowledged data it'll send using a{' '}
        <strong>congestion window (cwnd)</strong>. It starts small and grows fast (
        <strong>slow start</strong>: doubling every round trip) up to a threshold called{' '}
        <strong>ssthresh</strong>, then grows much more cautiously (
        <strong>congestion avoidance</strong>: +1 per round trip) after that. When loss is detected,
        cwnd drops — how much depends on how the loss was detected.
      </p>
      <div className="rounded-lg border border-stone-200 p-4 text-sm">
        <p className="mb-2 font-semibold text-stone-900">Key terms</p>
        <dl className="space-y-1.5">
          <div>
            <dt className="inline font-medium text-stone-900">Slow start: </dt>
            <dd className="inline text-stone-600">
              cwnd doubles every round trip until it reaches ssthresh — despite the name, this phase
              grows fast.
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-stone-900">Congestion avoidance: </dt>
            <dd className="inline text-stone-600">
              cwnd grows by only 1 per round trip once past ssthresh — cautious, linear growth.
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-stone-900">ssthresh: </dt>
            <dd className="inline text-stone-600">
              the "slow start threshold" — the boundary where growth switches from doubling to +1,
              and gets recalculated after every loss.
            </dd>
          </div>
        </dl>
      </div>
      <CommonMistake>
        assuming "slow start" means growth is slow. It's actually the fastest-growing phase
        (doubling every round trip) — the name refers to starting from a small cwnd, not to the
        growth rate once underway. Congestion avoidance, which comes after, is the genuinely slow,
        linear-growth phase.
      </CommonMistake>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Next round trip" repeatedly and watch cwnd double, then switch to +1 growth after
            ssthresh.
          </li>
          <li>
            At any point, trigger a "Timeout" or a "3 duplicate ACKs" loss — compare how differently
            cwnd recovers.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Next round trip
        </button>
        <button
          onClick={timeout}
          className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white"
        >
          Simulate timeout
        </button>
        <button
          onClick={fastRetransmit}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white"
        >
          Simulate 3 duplicate ACKs
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="cwnd" value={state.cwnd} />
        <Stat label="ssthresh" value={state.ssthresh} />
        <Stat
          label="phase"
          value={state.phase === 'slowstart' ? 'slow start' : 'congestion avoidance'}
        />
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full rounded-md border border-stone-200 bg-stone-50"
      >
        <polyline points={points.join(' ')} fill="none" stroke="#7c3aed" strokeWidth={2} />
        {state.history.map((h, i) => {
          const x = padding + (i / Math.max(1, state.history.length - 1)) * (chartW - padding * 2);
          const y = chartH - padding - (h.cwnd / maxCwnd) * (chartH - padding * 2);
          return h.event ? <circle key={i} cx={x} cy={y} r={4} fill="#f43f5e" /> : null;
        })}
      </svg>
      <p className="text-xs text-stone-400">
        Red dots mark loss events. Notice a timeout drops cwnd to 1 and restarts slow start; a
        3-dup-ACK only halves it and stays in congestion avoidance.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 p-3 text-center">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="font-mono font-semibold text-stone-900">{value}</p>
    </div>
  );
}

// ============ Retransmission mode ============
interface RetransStep {
  label: string;
  sent?: string;
  received?: string;
  note: string;
}
const RETRANS_STEPS: RetransStep[] = [
  { label: '0', note: 'Sender transmits segments 1–6. Segment 3 is lost in transit (simulated).' },
  {
    label: '1',
    received: 'Seg 1 arrives',
    note: 'Receiver sends ACK 2 ("I have everything through 1, expecting 2 next").',
  },
  { label: '2', received: 'Seg 2 arrives', note: 'Receiver sends ACK 3 (expecting 3 next).' },
  {
    label: '3',
    received: 'Seg 3 — LOST',
    note: 'Never arrives. Receiver has nothing new to acknowledge yet.',
  },
  {
    label: '4',
    received: 'Seg 4 arrives (out of order)',
    note: "Receiver still can't move past the gap at 3 — sends duplicate ACK 3 (1st duplicate).",
  },
  {
    label: '5',
    received: 'Seg 5 arrives (out of order)',
    note: 'Still gapped at 3 — sends duplicate ACK 3 (2nd duplicate).',
  },
  {
    label: '6',
    received: 'Seg 6 arrives (out of order)',
    note: 'Sends duplicate ACK 3 (3rd duplicate) — sender has now seen 3 duplicate ACKs.',
  },
  {
    label: '7',
    sent: 'Fast retransmit: resend Seg 3',
    note: "Sender doesn't wait for a timeout — 3 duplicate ACKs is itself treated as a strong enough loss signal to retransmit immediately.",
  },
  {
    label: '8',
    received: 'Seg 3 (retransmitted) arrives',
    note: 'Gap filled — receiver can now acknowledge everything at once: ACK 7 (cumulative, covering 3 through 6 all together).',
  },
];

function RetransmissionPanel() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(RETRANS_STEPS.length - 1, s + 1));
  const reset = () => setStep(0);
  const dupCount = Math.max(0, Math.min(3, step - 3));

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-700">
        TCP uses <strong>cumulative acknowledgment</strong>: an ACK number means "I've received
        everything up through this point," not just "I received this one segment." When a segment is
        lost but later ones keep arriving, the receiver can't advance its ACK number past the gap —
        it just keeps re-sending the same ACK, called a <strong>duplicate ACK</strong>. Three
        duplicate ACKs in a row is treated as a strong enough signal of loss that the sender
        retransmits immediately, called <strong>fast retransmit</strong> — without waiting for a
        timeout.
      </p>
      <div className="rounded-lg border border-stone-200 p-4 text-sm">
        <p className="mb-2 font-semibold text-stone-900">Key terms</p>
        <dl className="space-y-1.5">
          <div>
            <dt className="inline font-medium text-stone-900">Cumulative ACK: </dt>
            <dd className="inline text-stone-600">
              an acknowledgment number meaning "everything up to here has arrived," not just one
              segment.
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-stone-900">Duplicate ACK: </dt>
            <dd className="inline text-stone-600">
              the same ACK number sent again, because a gap is blocking the receiver from advancing
              it.
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-stone-900">Fast retransmit: </dt>
            <dd className="inline text-stone-600">
              resending a segment immediately after 3 duplicate ACKs, instead of waiting for a
              timeout.
            </dd>
          </div>
        </dl>
      </div>
      <CommonMistake>
        assuming a duplicate ACK means the receiver is confused or made a mistake. It's actually
        working correctly — cumulative ACKs simply can't skip over a gap, so re-sending the same ACK
        number is the receiver's only honest way to say "still missing something before I can move
        forward."
      </CommonMistake>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>Click "Next event" to step through segments arriving, with segment 3 lost.</li>
          <li>
            Watch the duplicate-ACK counter build up to 3, then trigger fast retransmit — before any
            timeout.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={next}
          disabled={step >= RETRANS_STEPS.length - 1}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Next event
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span className="ml-2 text-sm text-stone-500">Duplicate ACKs seen: {dupCount} / 3</span>
      </div>

      <div className="space-y-1">
        {RETRANS_STEPS.slice(0, step + 1).map((s, i) => (
          <div
            key={i}
            className={`rounded-md border px-3 py-2 text-sm ${i === step ? 'border-violet-300 bg-violet-50' : 'border-stone-200'}`}
          >
            <p className="font-mono text-xs text-stone-400">event {s.label}</p>
            {s.received && <p className="font-mono text-stone-800">← {s.received}</p>}
            {s.sent && <p className="font-mono font-semibold text-rose-700">→ {s.sent}</p>}
            <p className="mt-0.5 text-xs text-stone-600">{s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TcpCongestionReliabilitySim() {
  const [mode, setMode] = useState<Mode>('congestion');
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('congestion')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'congestion' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Congestion Control
        </button>
        <button
          onClick={() => setMode('retransmission')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'retransmission' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Reliability & Retransmission
        </button>
      </div>
      <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
      {mode === 'congestion' ? <CongestionControlPanel /> : <RetransmissionPanel />}
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
