import assert from 'node:assert/strict';
import test from 'node:test';

import { getLoginErrorMessage, getSessionErrorMessage, getSignupErrorMessage } from './authFeedback';

test('maps firebase login errors to clearer messages', () => {
  assert.equal(
    getLoginErrorMessage({ code: 'auth/invalid-credential' }),
    'Your email or password is incorrect.'
  );
});

test('maps firebase signup errors to clearer messages', () => {
  assert.equal(
    getSignupErrorMessage({ code: 'auth/email-already-in-use' }),
    'That email is already in use. Try logging in instead.'
  );
});

test('falls back gracefully for unknown session errors', () => {
  assert.equal(
    getSessionErrorMessage({ code: 'auth/something-else' }),
    'We could not restore your session. Please sign in again.'
  );
});
