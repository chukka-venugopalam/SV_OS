/**
 * Component: DnsResolutionVisualizer
 * Serves: act5-d5-ch01-dns-resolution ("DNS Resolution")
 *
 * What it demonstrates:
 *   A recursive resolver querying root, then TLD, then authoritative name servers in
 *   sequence to resolve a domain into an IP address; then a second lookup of the same
 *   domain hitting the resolver's cache and short-circuiting straight to the answer,
 *   skipping the root/TLD/authoritative chain entirely.
 *
 * Design decisions:
 *   - Uses one concrete worked domain (www.example.com) rather than letting the
 *     student type an arbitrary domain, since the point is the *sequence* of servers
 *     contacted, not a general-purpose DNS client — a fixed example keeps every step
 *     of the animation meaningful and checkable.
 *   - Cache behavior is modeled with an explicit TTL countdown so "the cache doesn't
 *     last forever" is visible, not just "cached = instant forever."
 *   - The client-to-resolver step is kept separate from the resolver-to-{root,TLD,
 *     authoritative} steps so students don't conflate "my computer" with "the
 *     recursive resolver," a very common beginner mix-up.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const DOMAIN = 'www.example.com';
const IP = '93.184.216.34';
const TTL_SECONDS = 10; // shortened for the demo so expiry is watchable, not a real-world TTL

interface Step {
  label: string;
  from: string;
  to: string;
  note: string;
}

const COLD_STEPS: Step[] = [
  {
    label: '1',
    from: 'Client',
    to: 'Resolver',
    note: `Your computer asks its configured recursive resolver: "what's the IP for ${DOMAIN}?"`,
  },
  {
    label: '2',
    from: 'Resolver',
    to: 'Root server',
    note: 'Resolver has nothing cached, so it asks a root server, which doesn\'t know the answer but knows who handles ".com".',
  },
  {
    label: '3',
    from: 'Root server',
    to: 'Resolver',
    note: `Root server replies: "ask the .com TLD server."`,
  },
  {
    label: '4',
    from: 'Resolver',
    to: 'TLD server',
    note: 'Resolver asks the .com TLD (Top-Level Domain) server about "example.com."',
  },
  {
    label: '5',
    from: 'TLD server',
    to: 'Resolver',
    note: '.com TLD server replies: "ask example.com\'s authoritative server."',
  },
  {
    label: '6',
    from: 'Resolver',
    to: 'Authoritative server',
    note: `Resolver asks example.com's own authoritative server for "${DOMAIN}."`,
  },
  {
    label: '7',
    from: 'Authoritative server',
    to: 'Resolver',
    note: `Authoritative server replies with the real answer: ${IP}.`,
  },
  {
    label: '8',
    from: 'Resolver',
    to: 'Client',
    note: `Resolver caches the answer for ${TTL_SECONDS}s and finally replies to your computer with ${IP}.`,
  },
];

const WARM_STEPS: Step[] = [
  {
    label: '1',
    from: 'Client',
    to: 'Resolver',
    note: `Your computer asks again: "what's the IP for ${DOMAIN}?"`,
  },
  {
    label: '2',
    from: 'Resolver',
    to: 'Client',
    note: `Cache hit! Resolver already has ${IP} saved from last time — replies immediately, no root/TLD/authoritative lookups needed.`,
  },
];

export default function DnsResolutionVisualizer() {
  const [cachedUntil, setCachedUntil] = useState<number | null>(null); // epoch-ish counter, null = not cached
  const [now, setNow] = useState(0);
  const [stepIdx, setStepIdx] = useState(-1); // -1 = not started
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCached = cachedUntil !== null && now < cachedUntil;

  // Track, at the moment a query starts, whether it was a cache hit (so mid-animation
  // cache expiry doesn't retroactively change which step list we're playing).
  const stepsWereWarmAtStart = useRef(false);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const startQuery = () => {
    clearTimer();
    stepsWereWarmAtStart.current = isCached;
    setStepIdx(0);
    setRunning(true);
  };

  const stepOnce = () => {
    setStepIdx((i) => {
      const activeSteps = stepsWereWarmAtStart.current ? WARM_STEPS : COLD_STEPS;
      const next = Math.min(activeSteps.length - 1, i + 1);
      if (next === activeSteps.length - 1 && !stepsWereWarmAtStart.current) {
        setCachedUntil(now + TTL_SECONDS);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!running) return;
    const activeSteps = stepsWereWarmAtStart.current ? WARM_STEPS : COLD_STEPS;
    if (stepIdx >= activeSteps.length - 1) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(stepOnce, 800);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepIdx]);

  // simulated clock for TTL countdown
  useEffect(() => {
    tickTimer.current = setInterval(() => setNow((n) => n + 1), 1000);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, []);

  const reset = () => {
    clearTimer();
    setRunning(false);
    setStepIdx(-1);
    setCachedUntil(null);
  };

  const activeSteps = stepsWereWarmAtStart.current ? WARM_STEPS : COLD_STEPS;
  const current = stepIdx >= 0 ? activeSteps[stepIdx] : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          Every time you visit a website by name, something has to translate that name into an
          actual IP address — this is <strong>DNS</strong> (Domain Name System). Your computer
          doesn't do this lookup itself; it asks a <strong>recursive resolver</strong> (often run by
          your ISP) to handle it. If the resolver doesn't already know the answer, it works its way
          down a hierarchy: a <strong>root server</strong> points it to the right{' '}
          <strong>TLD server</strong> (like the one handling ".com"), which points it to the
          domain's own <strong>authoritative server</strong> — the one place that actually knows the
          real answer.
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Recursive resolver: </dt>
              <dd className="inline text-stone-600">
                the server your computer asks; it does all the follow-up work on your behalf.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">
                Root / TLD / authoritative servers:{' '}
              </dt>
              <dd className="inline text-stone-600">
                a hierarchy of servers, each narrowing down who to ask next, ending with the one
                server that actually knows the domain's IP.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Caching / TTL: </dt>
              <dd className="inline text-stone-600">
                the resolver remembers answers for a limited "Time To Live" so it doesn't repeat the
                whole lookup on every request.
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          thinking your own computer contacts the root, TLD, and authoritative servers directly. It
          doesn't — your computer only ever talks to its recursive resolver; the resolver is the one
          doing all the hierarchy-walking, and your computer just waits for one final answer.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Click "Look up {DOMAIN}" to run the first, uncached lookup — watch it walk root → TLD →
            authoritative.
          </li>
          <li>
            Once it finishes, the answer is cached for {TTL_SECONDS} seconds (shown by the
            countdown).
          </li>
          <li>
            Click "Look up {DOMAIN}" again before the cache expires to see the fast cache-hit path
            instead.
          </li>
          <li>
            Wait for the cache to expire (or click Reset) to see the full lookup happen again.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={startQuery}
          disabled={running}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Look up {DOMAIN}
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
        <span className="ml-2 text-sm text-stone-500">
          {isCached ? `Cached — expires in ${cachedUntil! - now}s` : 'Not cached'}
        </span>
      </div>

      {/* Actors */}
      <div className="grid grid-cols-5 gap-1 text-center text-xs">
        {['Client', 'Resolver', 'Root server', 'TLD server', 'Authoritative server'].map(
          (actor) => {
            const isActive = current && (current.from === actor || current.to === actor);
            return (
              <div
                key={actor}
                className={`rounded-md border px-1 py-2 transition-all duration-300 ${isActive ? 'border-violet-600 bg-violet-500 text-white' : 'border-stone-200 bg-stone-50 text-stone-500'}`}
              >
                {actor}
              </div>
            );
          },
        )}
      </div>

      {stepIdx >= 0 && current && (
        <div className="rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
          <p className="mb-1 font-mono text-xs text-stone-400">
            Step {current.label}: {current.from} → {current.to}
          </p>
          <p>{current.note}</p>
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
