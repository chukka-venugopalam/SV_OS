/**
 * Component: HttpRequestResponseVisualizer
 * Serves: act5-d5-ch02-http ("HTTP")
 *
 * What it demonstrates:
 *   Build mode: assembling an HTTP request (method, path, headers, body) and seeing
 *   the matching response (status code, headers, body) it produces.
 *   Statelessness mode: a stateless request to a protected resource failing outright,
 *   contrasted against the same resource succeeding once a cookie-based session is
 *   established and carried on the next request — making "HTTP itself has no memory"
 *   a directly observable fact rather than an assertion.
 *
 * Design decisions:
 *   - A tiny fixed mock "server" (3 canned routes) answers requests, rather than a
 *     real network call, so the exact request/response pairing is fully controllable
 *     and reproducible for teaching.
 *   - Statelessness mode intentionally sends the *first* protected-resource request
 *     with no cookie attached even though a "session" conceptually could exist, to
 *     make the point concrete: HTTP does not automatically remember anything between
 *     requests — carrying state is something the client and server have to do
 *     explicitly, via a mechanism like cookies.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type BuildMethod = 'GET' | 'POST' | 'DELETE';

function mockServer(
  method: BuildMethod,
  path: string,
  body: string,
): { status: number; headers: Record<string, string>; body: string } {
  if (path === '/users/1' && method === 'GET') {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '{"id": 1, "name": "Ada Lovelace"}',
    };
  }
  if (path === '/users' && method === 'POST') {
    if (!body.trim())
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: '{"error": "Missing request body"}',
      };
    return {
      status: 201,
      headers: { 'Content-Type': 'application/json', Location: '/users/2' },
      body: '{"id": 2, "created": true}',
    };
  }
  if (path === '/users/1' && method === 'DELETE') {
    return { status: 204, headers: {}, body: '' };
  }
  return {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
    body: '{"error": "Not found"}',
  };
}

export default function HttpRequestResponseVisualizer() {
  const [tab, setTab] = useState<'build' | 'stateless'>('build');

  // --- Build mode state ---
  const [method, setMethod] = useState<BuildMethod>('GET');
  const [path, setPath] = useState('/users/1');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<ReturnType<typeof mockServer> | null>(null);

  const send = () => setResponse(mockServer(method, path, body));

  // --- Statelessness mode state ---
  const [step1Result, setStep1Result] = useState<null | 'denied'>(null);
  const [step2Result, setStep2Result] = useState<null | 'cookie-set'>(null);
  const [step3Result, setStep3Result] = useState<null | 'authorized'>(null);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setTab('build')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'build' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Build a request
        </button>
        <button
          onClick={() => setTab('stateless')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'stateless' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Stateless vs. cookies
        </button>
      </div>

      {tab === 'build' ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            <strong>HTTP</strong> (HyperText Transfer Protocol) is the request/response language
            browsers and servers speak. A <strong>request</strong> names a <strong>method</strong>{' '}
            (what action — GET to read, POST to create, DELETE to remove), a <strong>path</strong>{' '}
            (which resource), and optionally headers and a body. The server replies with a{' '}
            <strong>response</strong>: a numeric <strong>status code</strong> summarizing what
            happened, plus its own headers and body.
          </p>
          <div className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-medium text-stone-900">Method: </dt>
                <dd className="inline text-stone-600">
                  the action being requested — GET (read), POST (create), DELETE (remove), etc.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Status code: </dt>
                <dd className="inline text-stone-600">
                  a 3-digit number summarizing the result — 2xx success, 4xx client error, 5xx
                  server error.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Headers: </dt>
                <dd className="inline text-stone-600">
                  metadata attached to a request or response, like the content's format.
                </dd>
              </div>
            </dl>
          </div>
          <CommonMistake>
            assuming a 200 status always means "it worked" in a broad sense, or that a 404 always
            means "the whole server is broken." Status codes describe the outcome of one specific
            request to one specific resource — try requesting{' '}
            <span className="font-mono">/users/1</span> vs an unknown path below and compare.
          </CommonMistake>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>
                Choose a method and enter a path (try <span className="font-mono">/users/1</span>,{' '}
                <span className="font-mono">/users</span> with POST, or a made-up path).
              </li>
              <li>For POST, optionally type a body.</li>
              <li>Click "Send request" and read the response panel that appears below.</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as BuildMethod)}
              className="rounded-md border border-stone-300 px-2 py-2 font-mono text-sm"
            >
              <option>GET</option>
              <option>POST</option>
              <option>DELETE</option>
            </select>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="min-w-[160px] flex-1 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
            />
            <button
              onClick={send}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Send request
            </button>
          </div>
          {method === 'POST' && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"name": "Grace Hopper"}'
              className="w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
              rows={2}
            />
          )}

          {response && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-stone-200 p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Request</p>
                <p className="font-mono text-sm">
                  {method} {path} HTTP/1.1
                </p>
                {method === 'POST' && body && (
                  <p className="mt-1 font-mono text-xs text-stone-500">{body}</p>
                )}
              </div>
              <div
                className={`rounded-md border p-3 ${response.status < 300 ? 'border-emerald-300 bg-emerald-50' : response.status < 500 ? 'border-amber-300 bg-amber-50' : 'border-rose-300 bg-rose-50'}`}
              >
                <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Response</p>
                <p className="font-mono text-sm font-semibold">HTTP/1.1 {response.status}</p>
                {Object.entries(response.headers).map(([k, v]) => (
                  <p key={k} className="font-mono text-xs text-stone-500">
                    {k}: {v}
                  </p>
                ))}
                {response.body && (
                  <p className="mt-1 font-mono text-xs text-stone-700">{response.body}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            HTTP is <strong>stateless</strong> — by itself, a server has no memory that you made a
            previous request at all. Every request stands completely alone. So how does a website
            "remember" that you're logged in? Through <strong>cookies</strong>: after you log in,
            the server sends back a <span className="font-mono">Set-Cookie</span> header containing
            a session token, and your browser automatically attaches that same token as a{' '}
            <span className="font-mono">Cookie</span> header on every later request — the memory
            lives in that repeated header, not in HTTP itself.
          </p>
          <div className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-medium text-stone-900">Stateless: </dt>
                <dd className="inline text-stone-600">
                  each HTTP request is handled with no built-in memory of previous requests.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Set-Cookie: </dt>
                <dd className="inline text-stone-600">
                  a response header the server uses to hand the browser a small token to remember.
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-900">Cookie: </dt>
                <dd className="inline text-stone-600">
                  the same token, sent back by the browser as a request header on every subsequent
                  request.
                </dd>
              </div>
            </dl>
          </div>
          <CommonMistake>
            thinking the server itself somehow "remembers" your browser between requests. It doesn't
            — every request the server receives is standalone, and it's the browser re-sending the
            exact same cookie token every time that makes it look like the server has memory.
          </CommonMistake>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>
                Click "Request /profile (no cookie yet)" — see it get denied, since there's nothing
                linking this request to any session.
              </li>
              <li>
                Click "Log in" — the server responds with a Set-Cookie header issuing a session
                token.
              </li>
              <li>
                Click "Request /profile (with cookie)" — this time the browser automatically
                attaches that cookie, and the server recognizes the session.
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStep1Result('denied')}
              disabled={!!step1Result}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              1. Request /profile (no cookie yet)
            </button>
            <button
              onClick={() => {
                setStep2Result('cookie-set');
              }}
              disabled={!step1Result || !!step2Result}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              2. Log in
            </button>
            <button
              onClick={() => setStep3Result('authorized')}
              disabled={!step2Result || !!step3Result}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              3. Request /profile (with cookie)
            </button>
            <button
              onClick={() => {
                setStep1Result(null);
                setStep2Result(null);
                setStep3Result(null);
              }}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            {step1Result && (
              <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm">
                <p className="font-mono">
                  GET /profile HTTP/1.1 <span className="text-stone-400">(no Cookie header)</span>
                </p>
                <p className="mt-1 font-mono font-semibold">HTTP/1.1 401 Unauthorized</p>
              </div>
            )}
            {step2Result && (
              <div className="rounded-md border border-sky-300 bg-sky-50 p-3 text-sm">
                <p className="font-mono">POST /login HTTP/1.1</p>
                <p className="mt-1 font-mono font-semibold">HTTP/1.1 200 OK</p>
                <p className="font-mono text-xs text-stone-600">Set-Cookie: session=8f3a2c...</p>
              </div>
            )}
            {step3Result && (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm">
                <p className="font-mono">GET /profile HTTP/1.1</p>
                <p className="font-mono text-xs text-stone-600">Cookie: session=8f3a2c...</p>
                <p className="mt-1 font-mono font-semibold">HTTP/1.1 200 OK — welcome back, Ada!</p>
              </div>
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
