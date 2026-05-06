import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("ProcureGuard render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-[#080a12] dark:text-slate-100">
          <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
              Workspace interrupted
            </p>
            <h1 className="mt-2 text-2xl font-semibold">ProcureGuard AI needs a reload</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The review workspace could not finish loading. Reloading usually restores the current session.
            </p>
            <button
              className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
