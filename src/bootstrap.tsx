import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import Signup from './Signup';
import Login from './Login';
import ErrorBoundary from './components/ErrorBoundary';
import { firebaseApp } from './firebase';
import { useAuthSession } from './hooks/useAuthSession';
import { initializeTelemetry, installGlobalErrorHandlers } from './services/telemetry';

function SessionLoader({ detail, message }: { detail?: string | null; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#8b7e66]">CALSNAP AI</p>
        <p className="mt-3 text-sm text-[#5a6b8b]">{message}</p>
        {detail ? (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:border-[#22322d] dark:bg-[#10211c]/80 dark:text-slate-300">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Root() {
  const { authError, checkingAuth, setShowLogin, showLogin, user } = useAuthSession();

  useEffect(() => {
    void initializeTelemetry(firebaseApp);
    const teardown = installGlobalErrorHandlers();

    return () => teardown();
  }, []);

  if (checkingAuth) {
    return <SessionLoader message="Checking your session..." />;
  }

  if (user) {
    return <App user={user} />;
  }

  return showLogin ? (
    <Login authError={authError} onShowSignup={() => setShowLogin(false)} />
  ) : (
    <Signup authError={authError} onShowLogin={() => setShowLogin(true)} />
  );
}

export const mountApp = (rootElement: HTMLElement) => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </React.StrictMode>
  );
};
