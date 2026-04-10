import React from 'react';

import { reportError } from '../services/telemetry';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, {
      scope: 'render_boundary',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8fafc] dark:bg-[#08110f]">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#22322d] bg-white/95 dark:bg-[#0d1916]/95 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.15)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">CALSNAP AI</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            We captured the error so we can debug it. Reload the app to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="neutral-primary-btn mt-6 w-full py-3 font-semibold"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
