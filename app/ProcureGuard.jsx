export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex max-w-4xl flex-col gap-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Stage 3.1
          </p>
          <h1 className="mt-3 text-4xl font-semibold">ProcureGuard AI</h1>
          <p className="mt-3 text-lg text-slate-600">
            Intelligent 3-Way Procurement Matching
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Initialization complete</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The React, Vite, Tailwind, and Claude API proxy scaffold is ready.
            CSV upload and Claude prompt-chain orchestration come in Stage 3.2.
          </p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="font-semibold text-green-700">Frontend shell</p>
              <p className="mt-1 text-slate-600">Ready</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="font-semibold text-blue-700">Claude proxy</p>
              <p className="mt-1 text-slate-600">Configured</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="font-semibold text-amber-700">Core workflow</p>
              <p className="mt-1 text-slate-600">Stage 3.2</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
