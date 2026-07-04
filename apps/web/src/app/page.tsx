export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          Phase 2.1 — Foundation Complete
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
          Silicon Valley
          <span className="text-primary-600 dark:text-primary-400"> Learning OS</span>
        </h1>

        <p className="mb-8 text-lg text-neutral-600 dark:text-neutral-400">
          Google Maps for Computer Science Learning.
          An interactive knowledge graph that maps concepts, technologies, projects, and careers.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card rounded-xl p-6 text-left">
            <div className="mb-2 text-2xl">🗺️</div>
            <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
              Knowledge Graph
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Explore connections between CS concepts
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 text-left">
            <div className="mb-2 text-2xl">🧭</div>
            <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
              Career Navigator
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Find your learning roadmap to any career
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 text-left">
            <div className="mb-2 text-2xl">📊</div>
            <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
              Progress Tracking
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Track your learning journey
            </p>
          </div>
        </div>

        <div className="mt-12 text-sm text-neutral-400 dark:text-neutral-500">
          <p>Next.js 15 · TypeScript · Tailwind CSS · Turborepo</p>
        </div>
      </div>
    </main>
  );
}
