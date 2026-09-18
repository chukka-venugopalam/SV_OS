/**
 * Component: RegexNfaVisualizer
 * Serves: act7-d3-regular-expressions ("Regular Expressions") — Regex Testing mode
 *         act7-d3-thompsons-construction ("Thompson's Construction") — NFA Construction mode
 *
 * REPLACEMENT NOTE: these two chapters were originally marked "already covered" by an
 * existing `regex-nfa-visualizer` component. A later audit (by the person who owns
 * this project, not this session) found that component has no working state setter —
 * its display is frozen. This file is a full replacement, built fresh with a real
 * regex engine rather than assuming the old file's shape.
 *
 * What it demonstrates:
 *   Regex Testing mode: a small regex engine (supporting literals, concatenation,
 *   | union, * Kleene star, and parentheses) actually evaluates whether candidate
 *   strings match a pattern the student types in.
 *   Thompson's Construction mode: the same regex is parsed into an AST and mechanically
 *   converted into an NFA using Thompson's construction rules (one fragment per AST
 *   node, wired together with epsilon transitions), then a chosen test string is
 *   simulated through that exact NFA via epsilon-closure/move, state set by state.
 *
 * Design decisions:
 *   - A real recursive-descent parser and a real Thompson's-construction algorithm
 *     back both modes (not a native-RegExp shortcut and not a pre-drawn NFA image),
 *     so typing in a different pattern produces a genuinely different, correctly
 *     constructed NFA — verified independently in Node before shipping.
 *   - Only a deliberately small regex grammar is supported (literals, |, *,
 *     concatenation, parens — no character classes, +, ?, or anchors) so the parser
 *     and the resulting NFA stay small enough to read on screen, while still
 *     containing every operator Thompson's construction has a distinct rule for.
 *   - The NFA is rendered as a transition list (q0 --a--> q1, etc.) rather than an
 *     auto-laid-out graph, since general graph layout is a much harder problem than
 *     this teaching tool needs, and a list keeps every single transition legible even
 *     for a moderately sized NFA.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo (confirmed correct
 *     for this repo).
 */
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type Ast =
  | { type: 'epsilon' }
  | { type: 'lit'; char: string }
  | { type: 'concat'; left: Ast; right: Ast }
  | { type: 'union'; left: Ast; right: Ast }
  | { type: 'star'; child: Ast };

function parseRegex(regex: string): Ast | null {
  let i = 0;
  const peek = () => regex[i];
  const eat = () => regex[i++];

  function parseUnion(): Ast {
    let left = parseConcat();
    while (peek() === '|') {
      eat();
      left = { type: 'union', left, right: parseConcat() };
    }
    return left;
  }
  function parseConcat(): Ast {
    const parts: Ast[] = [];
    while (i < regex.length && peek() !== '|' && peek() !== ')') {
      parts.push(parseStar());
    }
    if (parts.length === 0) return { type: 'epsilon' };
    return parts.reduce((a, b) => ({ type: 'concat', left: a, right: b }));
  }
  function parseStar(): Ast {
    let atom = parseAtom();
    while (peek() === '*') {
      eat();
      atom = { type: 'star', child: atom };
    }
    return atom;
  }
  function parseAtom(): Ast {
    if (peek() === '(') {
      eat();
      const inner = parseUnion();
      if (peek() === ')') eat();
      return inner;
    }
    const c = eat();
    return { type: 'lit', char: c };
  }
  try {
    return parseUnion();
  } catch {
    return null;
  }
}

interface Transition {
  from: string;
  to: string;
  symbol: string | null; // null = epsilon
}
interface Nfa {
  start: string;
  accept: string;
  transitions: Transition[];
}

function buildNfa(ast: Ast): Nfa {
  let counter = 0;
  const newState = () => `q${counter++}`;

  function build(node: Ast): Nfa {
    switch (node.type) {
      case 'epsilon': {
        const s = newState(),
          a = newState();
        return { start: s, accept: a, transitions: [{ from: s, to: a, symbol: null }] };
      }
      case 'lit': {
        const s = newState(),
          a = newState();
        return { start: s, accept: a, transitions: [{ from: s, to: a, symbol: node.char }] };
      }
      case 'concat': {
        const L = build(node.left),
          R = build(node.right);
        return {
          start: L.start,
          accept: R.accept,
          transitions: [
            ...L.transitions,
            ...R.transitions,
            { from: L.accept, to: R.start, symbol: null },
          ],
        };
      }
      case 'union': {
        const L = build(node.left),
          R = build(node.right);
        const s = newState(),
          a = newState();
        return {
          start: s,
          accept: a,
          transitions: [
            ...L.transitions,
            ...R.transitions,
            { from: s, to: L.start, symbol: null },
            { from: s, to: R.start, symbol: null },
            { from: L.accept, to: a, symbol: null },
            { from: R.accept, to: a, symbol: null },
          ],
        };
      }
      case 'star': {
        const C = build(node.child);
        const s = newState(),
          a = newState();
        return {
          start: s,
          accept: a,
          transitions: [
            ...C.transitions,
            { from: s, to: C.start, symbol: null },
            { from: s, to: a, symbol: null },
            { from: C.accept, to: C.start, symbol: null },
            { from: C.accept, to: a, symbol: null },
          ],
        };
      }
    }
  }
  return build(ast);
}

function epsilonClosure(states: Set<string>, transitions: Transition[]): Set<string> {
  const stack = [...states];
  const result = new Set(states);
  while (stack.length) {
    const s = stack.pop()!;
    transitions
      .filter((t) => t.from === s && t.symbol === null)
      .forEach((t) => {
        if (!result.has(t.to)) {
          result.add(t.to);
          stack.push(t.to);
        }
      });
  }
  return result;
}
function move(states: Set<string>, symbol: string, transitions: Transition[]): Set<string> {
  const result = new Set<string>();
  states.forEach((s) =>
    transitions.filter((t) => t.from === s && t.symbol === symbol).forEach((t) => result.add(t.to)),
  );
  return result;
}
function nfaMatches(nfa: Nfa, input: string): boolean {
  let current = epsilonClosure(new Set([nfa.start]), nfa.transitions);
  for (const ch of input) {
    current = epsilonClosure(move(current, ch, nfa.transitions), nfa.transitions);
    if (current.size === 0) return false;
  }
  return current.has(nfa.accept);
}

const DEFAULT_REGEX = 'a(b|c)*';
const TEST_STRINGS = ['a', 'ab', 'ac', 'abcbc', 'b', 'ba', ''];

type Mode = 'testing' | 'construction';

export default function RegexNfaVisualizer() {
  const [mode, setMode] = useState<Mode>('testing');
  const [regexText, setRegexText] = useState(DEFAULT_REGEX);
  const [testInput, setTestInput] = useState('abcbc');
  const [simStep, setSimStep] = useState(0);

  const ast = useMemo(() => parseRegex(regexText), [regexText]);
  const nfa = useMemo(() => (ast ? buildNfa(ast) : null), [ast]);

  const simTrace = useMemo(() => {
    if (!nfa) return [];
    const trace: { symbol: string; states: Set<string> }[] = [];
    let current = epsilonClosure(new Set([nfa.start]), nfa.transitions);
    trace.push({ symbol: '(start)', states: current });
    for (const ch of testInput) {
      current = epsilonClosure(move(current, ch, nfa.transitions), nfa.transitions);
      trace.push({ symbol: ch, states: current });
    }
    return trace;
  }, [nfa, testInput]);

  const nextSim = () => setSimStep((s) => Math.min(simTrace.length - 1, s + 1));
  const resetSim = () => setSimStep(0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-2 border-b border-stone-200 pb-4">
        <button
          onClick={() => setMode('testing')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'testing' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Regex testing
        </button>
        <button
          onClick={() => {
            setMode('construction');
            resetSim();
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'construction' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
        >
          Thompson's construction
        </button>
      </div>

      {mode === 'testing' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
            <p className="text-sm leading-relaxed text-stone-700">
              A <strong>regular expression</strong> is a compact pattern describing a set of
              strings. This tool supports literal characters, <span className="font-mono">|</span>{' '}
              (either side matches), <span className="font-mono">*</span> (zero or more repeats of
              whatever comes before it), and parentheses for grouping. The pattern{' '}
              <span className="font-mono">a(b|c)*</span> means: one "a", then zero or more of either
              "b" or "c", in any mix.
            </p>
            <div className="rounded-lg border border-stone-200 p-4">
              <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
              <dl className="space-y-1.5 text-sm">
                <div>
                  <dt className="inline font-medium text-stone-900">Union ( | ): </dt>
                  <dd className="inline text-stone-600">matches whatever is on either side.</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Kleene star ( * ): </dt>
                  <dd className="inline text-stone-600">
                    zero or more repetitions of whatever it's attached to.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Concatenation: </dt>
                  <dd className="inline text-stone-600">
                    writing two patterns next to each other means "this, then that" — no symbol
                    needed.
                  </dd>
                </div>
              </dl>
            </div>
            <CommonMistake>
              assuming * means "one or more," the way it's sometimes used informally. In formal
              regular expressions, * always means <em>zero</em> or more — the empty match is always
              allowed, which is why "" (empty string) can match a pattern like{' '}
              <span className="font-mono">a*</span>.
            </CommonMistake>
          </div>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>Edit the pattern below (try "a(b|c)*", "(ab)*", or "a|b").</li>
              <li>Each test string is checked against it live using a real matching engine.</li>
            </ol>
          </div>

          <div>
            <label className="text-xs text-stone-500">Pattern</label>
            <input
              value={regexText}
              onChange={(e) => setRegexText(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
            />
          </div>

          {nfa ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEST_STRINGS.map((s) => {
                const ok = nfaMatches(nfa, s);
                return (
                  <div
                    key={s}
                    className={`rounded-md border px-2 py-1.5 font-mono text-sm ${ok ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
                  >
                    "{s || 'ε'}" — {ok ? 'match' : 'no match'}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-rose-600">Could not parse this pattern.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
            <p className="text-sm leading-relaxed text-stone-700">
              <strong>Thompson's construction</strong> is a mechanical algorithm for turning any
              regular expression into an equivalent NFA. Each piece of the pattern gets its own
              small NFA fragment with exactly one start and one accept state, and the fragments are
              wired together with <strong>epsilon transitions</strong> (moves that don't consume any
              input) following one fixed rule per operator — concatenation chains two fragments,
              union branches into both, and star adds a loop back plus a skip-over path.
            </p>
            <div className="rounded-lg border border-stone-200 p-4">
              <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
              <dl className="space-y-1.5 text-sm">
                <div>
                  <dt className="inline font-medium text-stone-900">Epsilon transition: </dt>
                  <dd className="inline text-stone-600">
                    a move between states that requires no input symbol at all.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-stone-900">Fragment: </dt>
                  <dd className="inline text-stone-600">
                    a small NFA piece with exactly one start and one accept state, built for one
                    part of the regex.
                  </dd>
                </div>
              </dl>
            </div>
            <CommonMistake>
              assuming Thompson's construction tries to produce the smallest possible NFA. It
              doesn't — it deliberately trades size for a completely mechanical, always-correct
              procedure: every operator adds its own fixed set of new states and epsilon
              transitions, even when a human could combine things more cleverly by hand.
            </CommonMistake>
          </div>

          <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">How to use this</p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>
                The NFA below is built fresh from the pattern "{regexText}" using Thompson's rules.
              </li>
              <li>
                Enter a test string, then click "Step" to simulate it through the NFA — watch the
                current set of possible states update after each character.
              </li>
            </ol>
          </div>

          {nfa && (
            <>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
                  NFA transitions (start: {nfa.start}, accept: {nfa.accept})
                </p>
                <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto font-mono text-xs sm:grid-cols-3">
                  {nfa.transitions.map((t, i) => (
                    <div key={i} className="rounded border border-stone-200 bg-stone-50 px-2 py-1">
                      {t.from} --{t.symbol ?? 'ε'}--&gt; {t.to}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-stone-500">Test string:</label>
                <input
                  value={testInput}
                  onChange={(e) => {
                    setTestInput(e.target.value);
                    resetSim();
                  }}
                  className="w-32 rounded-md border border-stone-300 px-2 py-1 font-mono text-sm"
                />
                <button
                  onClick={nextSim}
                  disabled={simStep >= simTrace.length - 1}
                  className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Step
                </button>
                <button
                  onClick={resetSim}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                >
                  Reset
                </button>
              </div>

              {simTrace[simStep] && (
                <div className="rounded-md border border-stone-200 p-4 text-sm">
                  <p className="mb-1 font-mono text-xs text-stone-400">
                    after "{simTrace[simStep].symbol}"
                  </p>
                  <p className="font-mono">
                    current possible states:{' '}
                    {[...simTrace[simStep].states].sort().join(', ') || '(none — rejected)'}
                  </p>
                  {simStep === simTrace.length - 1 && (
                    <p
                      className={`mt-2 font-semibold ${simTrace[simStep].states.has(nfa.accept) ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {simTrace[simStep].states.has(nfa.accept) ? 'ACCEPTED' : 'REJECTED'} —{' '}
                      {simTrace[simStep].states.has(nfa.accept)
                        ? 'the accept state is in the current set.'
                        : 'the accept state is not in the current set.'}
                    </p>
                  )}
                </div>
              )}
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
