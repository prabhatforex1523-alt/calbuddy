import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../auth';
import { getSessionErrorMessage } from '../services/authFeedback';
import { reportError, trackEvent } from '../services/telemetry';

const AUTH_VIEW_STORAGE_KEY = 'calsnap_auth_view';

const getInitialAuthView = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(AUTH_VIEW_STORAGE_KEY) !== 'signup';
};

export const useAuthSession = () => {
  const [showLoginState, setShowLoginState] = useState(getInitialAuthView);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const setShowLogin = (nextValue: boolean) => {
    setShowLoginState(nextValue);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_VIEW_STORAGE_KEY, nextValue ? 'login' : 'signup');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setAuthError(null);
        setCheckingAuth(false);
        trackEvent(firebaseUser ? 'session_restored' : 'session_missing', {
          hasUser: Boolean(firebaseUser),
        });
      },
      (error) => {
        reportError(error, { scope: 'auth_state_listener' });
        setUser(null);
        setAuthError(getSessionErrorMessage(error));
        setCheckingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    authError,
    checkingAuth,
    setShowLogin,
    showLogin: showLoginState,
    user,
  };
};
