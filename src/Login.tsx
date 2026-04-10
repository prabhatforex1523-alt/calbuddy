import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './auth';
import AuthShell from './components/AuthShell';
import { getLoginErrorMessage } from './services/authFeedback';
import { reportError, trackEvent } from './services/telemetry';

type LoginProps = {
  authError?: string | null;
  onShowSignup: () => void;
};

export default function Login({ authError, onShowSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage(authError ?? '');
  }, [authError]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setErrorMessage('Enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      trackEvent('login_success', { method: 'password' });
    } catch (error) {
      reportError(error, {
        scope: 'login_submit',
        emailDomain: normalizedEmail.split('@')[1] ?? 'unknown',
      });
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badgeLabel="Secure login"
      description="Sign in to open your saved meals, photo-scan review flow, and daily nutrition dashboard."
      footerNote="Your recent foods, streaks, and daily summaries stay tied to the same account after sign in."
      onSecondaryAction={onShowSignup}
      primaryLabel="Returning user"
      secondaryLabel="Create your account"
      secondaryText="New to CALSNAP AI?"
      title="Welcome back"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="premium-auth-field">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Email
          </label>
          <div className="premium-auth-input-wrap">
            <Mail size={18} className="text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              className="neutral-input w-full border-0 bg-transparent p-0 text-[#111827] shadow-none focus-visible:shadow-none dark:text-[#f8fafc]"
            />
          </div>
        </div>

        <div className="premium-auth-field">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Password
          </label>
          <div className="premium-auth-input-wrap">
            <Lock size={18} className="text-slate-400" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              className="neutral-input w-full border-0 bg-transparent p-0 text-[#111827] shadow-none focus-visible:shadow-none dark:text-[#f8fafc]"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="premium-auth-error">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="premium-auth-cta neutral-primary-btn w-full px-4 py-3.5 disabled:opacity-70"
        >
          <span className="inline-flex items-center gap-2">
            {isSubmitting ? 'Signing in...' : 'Continue to dashboard'}
            {!isSubmitting && <ArrowRight size={16} />}
          </span>
        </button>
      </form>
    </AuthShell>
  );
}
