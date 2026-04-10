const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/invalid-credential': 'Your email or password is incorrect.',
  'auth/email-already-in-use': 'That email is already in use. Try logging in instead.',
  'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network issue detected. Check your connection and retry.',
  'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
};

const readErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }

  return null;
};

const resolveAuthMessage = (error: unknown, fallback: string) =>
  AUTH_MESSAGES[readErrorCode(error) ?? ''] ?? fallback;

export const getLoginErrorMessage = (error: unknown) =>
  resolveAuthMessage(error, 'Login failed. Check your email and password.');

export const getSignupErrorMessage = (error: unknown) =>
  resolveAuthMessage(error, 'Signup failed. Try a different email or a stronger password.');

export const getSessionErrorMessage = (error: unknown) =>
  resolveAuthMessage(error, 'We could not restore your session. Please sign in again.');
