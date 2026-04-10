import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './auth';
import AuthShell from './components/AuthShell';
import { getSignupErrorMessage } from './services/authFeedback';
import { reportError, trackEvent } from './services/telemetry';

type SignupProps = {
  authError?: string | null;
  onShowLogin: () => void;
};

export default function Signup({ authError, onShowLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage(authError ?? '');
  }, [authError]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setErrorMessage('Enter both email and password.');
      return;
    }

    if (normalizedPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      trackEvent('signup_success', { method: 'password' });
    } catch (error) {
      reportError(error, {
        scope: 'signup_submit',
        emailDomain: normalizedEmail.split('@')[1] ?? 'unknown',
      });
      setErrorMessage(getSignupErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badgeLabel="New account"
      description="Create an account to save meals, reuse recent foods, and keep your nutrition history in one place."
      footerNote="Photo scan still goes through review before save, and you can always fall back to search or manual entry."
      onSecondaryAction={onShowLogin}
      primaryLabel="First-time setup"
      secondaryLabel="Sign in instead"
      secondaryText="Already have an account?"
      title="Create your account"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="premium-auth-field">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
            className="neutral-input w-full p-3.5 text-[#111827] dark:text-[#f8fafc]"
          />
        </div>

        <div className="premium-auth-field">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
            className="neutral-input w-full p-3.5 text-[#111827] dark:text-[#f8fafc]"
          />
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
