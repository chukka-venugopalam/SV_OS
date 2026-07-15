import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Background gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-40 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          className="from-primary-200 to-primary-400 dark:from-primary-800 dark:to-primary-600 relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:opacity-10"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-40 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          className="from-primary-300 to-info-400 dark:from-primary-700 dark:to-info-600 relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] dark:opacity-10"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <header className="fixed top-0 z-50 w-full border-b border-neutral-200/50 bg-white/70 backdrop-blur-xl dark:border-neutral-700/50 dark:bg-neutral-950/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            <span className="text-primary-600 dark:text-primary-400">SV</span>-OS
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center px-6 pt-14">
        <div className="mx-auto max-w-4xl text-center">
          {/* Pre-heading badge */}
          <div className="animate-fade-in border-primary-200/50 bg-primary-50/80 text-primary-700 dark:border-primary-800/50 dark:bg-primary-950/50 dark:text-primary-300 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="bg-primary-500 h-2 w-2 animate-pulse rounded-full" />
            Phase 2.1 — Foundation Complete
          </div>

          {/* Main heading */}
          <h1 className="animate-slide-up text-balance text-5xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl dark:text-neutral-50">
            Silicon Valley
            <span className="from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-gradient-to-r bg-clip-text text-transparent">
              {' '}
              Learning OS
            </span>
          </h1>

          <p className="animate-slide-up mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Google Maps for Computer Science Learning. An interactive knowledge graph that maps
            concepts, technologies, projects, and careers — so you always know what to study next
            and why.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 inline-flex h-11 items-center justify-center rounded-lg px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
            >
              Start learning free
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-8 text-sm font-semibold text-neutral-900 shadow-sm transition-all duration-200 hover:bg-neutral-50 hover:shadow-md active:scale-[0.97] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              Explore the graph
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="animate-fade-in mt-16 grid gap-4 sm:grid-cols-3">
            <div className="group rounded-2xl border border-neutral-200/60 bg-white/60 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300/60 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:hover:border-neutral-600/60">
              <div className="bg-primary-50 dark:bg-primary-950 mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-600 dark:text-primary-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Knowledge Graph
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                Explore connections between Computer Science concepts interactively
              </p>
            </div>

            <div className="group rounded-2xl border border-neutral-200/60 bg-white/60 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300/60 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:hover:border-neutral-600/60">
              <div className="bg-primary-50 dark:bg-primary-950 mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-600 dark:text-primary-400"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Career Navigator
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                Find your personalized learning roadmap to any tech career
              </p>
            </div>

            <div className="group rounded-2xl border border-neutral-200/60 bg-white/60 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300/60 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:hover:border-neutral-600/60">
              <div className="bg-primary-50 dark:bg-primary-950 mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-600 dark:text-primary-400"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Progress Tracking
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                Track your learning journey with detailed analytics and insights
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 border-t border-neutral-200/50 py-8 dark:border-neutral-800/50">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Built with Next.js 15 · TypeScript · Tailwind CSS v4 · Turborepo
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
