/**
 * Component: TlsHandshakeSim
 * Serves: act5-d5-ch03-ssl-tls-handshake ("SSL/TLS Handshake")
 *
 * What it demonstrates:
 *   The TLS handshake negotiating a cipher suite, the server presenting a
 *   certificate, an asymmetric key exchange deriving a shared symmetric session key,
 *   and the moment encryption switches over from asymmetric to fast symmetric
 *   encryption once that session key exists — all shown as an explicit
 *   client/server message sequence with a visible "before/after" encryption-mode
 *   indicator.
 *
 * Design decisions:
 *   - Modeled as a modern TLS 1.3-style handshake (ClientHello -> ServerHello +
 *     cert + key share -> derived secret -> Finished) rather than the older
 *     multi-round-trip TLS 1.2 handshake, since it's shorter and is what's actually
 *     deployed by default today, while still containing every concept the chapter
 *     asks for (cipher negotiation, certificate exchange, asymmetric-to-symmetric
 *     key derivation).
 *   - The "why not just use asymmetric encryption the whole time" question is
 *     answered directly in the Common Mistake callout, since it's the single most
 *     common point of confusion for this topic.
 *   - Each step explicitly tags whether it travels as plaintext, asymmetrically
 *     protected, or symmetrically encrypted, with a persistent lock icon +
 *     color-coded badge, so the "switchover point" is unambiguous rather than
 *     implied by step order alone.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle, Lock, LockOpen, KeyRound } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Protection = 'plain' | 'asymmetric' | 'symmetric';

interface Step {
  from: 'Client' | 'Server';
  to: 'Client' | 'Server';
  label: string;
  detail: string;
  protection: Protection;
}

const STEPS: Step[] = [
  {
    from: 'Client',
    to: 'Server',
    label: 'ClientHello',
    detail:
      'Client sends the cipher suites it supports, plus a random value and its half of a key exchange.',
    protection: 'plain',
  },
  {
    from: 'Server',
    to: 'Client',
    label: 'ServerHello',
    detail:
      "Server picks one cipher suite from the client's list — that choice is now locked in for this connection.",
    protection: 'plain',
  },
  {
    from: 'Server',
    to: 'Client',
    label: 'Certificate',
    detail:
      'Server sends its digital certificate, containing its public key, signed by a trusted Certificate Authority.',
    protection: 'plain',
  },
  {
    from: 'Client',
    to: 'Client',
    label: 'Verify certificate',
    detail:
      "Client checks the certificate's signature against trusted root CAs, and that the domain name matches.",
    protection: 'plain',
  },
  {
    from: 'Server',
    to: 'Client',
    label: 'Key share',
    detail:
      'Server sends its half of the key exchange, protected using the negotiated asymmetric algorithm.',
    protection: 'asymmetric',
  },
  {
    from: 'Client',
    to: 'Client',
    label: 'Derive session key',
    detail:
      'Both sides now independently combine the two key-exchange halves to compute the exact same shared symmetric session key — without ever sending that key itself over the network.',
    protection: 'asymmetric',
  },
  {
    from: 'Client',
    to: 'Server',
    label: 'Finished',
    detail:
      'Client sends a Finished message, now encrypted with the freshly derived symmetric session key.',
    protection: 'symmetric',
  },
  {
    from: 'Server',
    to: 'Client',
    label: 'Finished',
    detail:
      'Server replies with its own Finished message, also symmetrically encrypted — the handshake is complete.',
    protection: 'symmetric',
  },
  {
    from: 'Client',
    to: 'Server',
    label: 'Application data',
    detail:
      'All further traffic — the actual webpage request and response — travels fast, symmetrically encrypted with the session key.',
    protection: 'symmetric',
  },
];

const PROTECTION_STYLE: Record<Protection, { label: string; className: string; icon: ReactNode }> =
  {
    plain: {
      label: 'plaintext',
      className: 'bg-stone-100 text-stone-600 border-stone-300',
      icon: <LockOpen className="h-3.5 w-3.5" />,
    },
    asymmetric: {
      label: 'asymmetric',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <KeyRound className="h-3.5 w-3.5" />,
    },
    symmetric: {
      label: 'symmetric',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <Lock className="h-3.5 w-3.5" />,
    },
  };

export default function TlsHandshakeSim() {
  const [idx, setIdx] = useState(0); // -1 not started shown as 0 with "not started" gate
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const start = () => {
    setStarted(true);
    setIdx(0);
    setRunning(true);
  };
  const reset = () => {
    clearTimer();
    setStarted(false);
    setIdx(0);
    setRunning(false);
  };
  const stepOnce = () => setIdx((i) => Math.min(STEPS.length - 1, i + 1));

  useEffect(() => {
    if (!running) return;
    if (idx >= STEPS.length - 1) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, 900);
    return clearTimer;
  }, [running, idx]);

  const _current = STEPS[idx];
  const switchedToSymmetric = STEPS.slice(0, idx + 1).some((s) => s.protection === 'symmetric');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          When your browser connects to a secure ("https") website, it first performs a{' '}
          <strong>TLS handshake</strong> — a short negotiation that agrees on an encryption method,
          verifies the server is who it claims to be, and produces a shared secret key both sides
          know but never actually transmitted. It starts with slower <strong>asymmetric</strong>{' '}
          cryptography (using separate public/private keys) just long enough to safely agree on a{' '}
          <strong>symmetric</strong> session key — then switches to that much faster symmetric
          encryption for the actual data.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Certificate: </dt>
              <dd className="inline text-stone-600">
                a document proving a server's public key really belongs to it, signed by a trusted
                Certificate Authority.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Asymmetric encryption: </dt>
              <dd className="inline text-stone-600">
                encryption using a public/private key pair — secure but computationally expensive
                for large amounts of data.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Session key: </dt>
              <dd className="inline text-stone-600">
                a symmetric key both sides derive independently during the handshake, used to
                encrypt all the actual traffic that follows.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming the browser and server just encrypt the actual webpage traffic with asymmetric
          keys the whole time, since that's the "secure" one. In practice asymmetric encryption is
          too slow for bulk data, so it's used only briefly, during the handshake, purely to safely
          agree on a symmetric session key — all the real application data afterward is encrypted
          symmetrically instead, which is far faster.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Start handshake" to begin, then "Step forward" or "Run" to advance through each
            message.
          </li>
          <li>Watch the badge on each message: plaintext, asymmetric, or symmetric protection.</li>
          <li>
            Notice the exact moment the badge switches to "symmetric" — everything after that point
            uses the fast session key instead of the slower asymmetric keys.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!started ? (
          <button
            onClick={start}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Start handshake
          </button>
        ) : (
          <>
            <button
              onClick={() => setRunning(true)}
              disabled={idx >= STEPS.length - 1}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Run
            </button>
            <button
              onClick={stepOnce}
              disabled={idx >= STEPS.length - 1}
              className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
            >
              Step forward
            </button>
          </>
        )}
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        {switchedToSymmetric && (
          <span className="ml-2 text-sm font-medium text-emerald-700">
            Session key established — now using symmetric encryption.
          </span>
        )}
      </div>

      {started && (
        <div className="space-y-2">
          {STEPS.slice(0, idx + 1).map((s, i) => {
            const style = PROTECTION_STYLE[s.protection];
            const isCurrent = i === idx;
            return (
              <div
                key={i}
                className={`rounded-md border p-3 text-sm transition-all duration-300 ${isCurrent ? 'border-violet-300 bg-violet-50' : 'border-stone-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-stone-900">
                    {s.from === s.to ? `${s.from} (internal)` : `${s.from} → ${s.to}`}: {s.label}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${style.className}`}
                  >
                    {style.icon}
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600">{s.detail}</p>
              </div>
            );
          })}
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
