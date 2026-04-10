import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDVdssDjjMfb0THXaysToAiYIyE6KXwAuE',
  authDomain: 'calsnap-ai-82070.firebaseapp.com',
  projectId: 'calsnap-ai-82070',
  storageBucket: 'calsnap-ai-82070.firebasestorage.app',
  messagingSenderId: '490865535846',
  appId: '1:490865535846:web:008df8c65a8f6dbffbf6a7',
  measurementId: 'G-G8V057DXR8',
};

export const firebaseApp = initializeApp(firebaseConfig);

const isNativeApp = Capacitor.isNativePlatform();

const createAuthInstance = () => {
  try {
    if (isNativeApp) {
      // Capacitor apps do not behave like normal browser tabs, so we keep the
      // auth bootstrap path conservative to avoid WebView startup failures.
      return initializeAuth(firebaseApp, {
        persistence: browserLocalPersistence,
      });
    }

    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch (error) {
    console.warn('Auth initialization fallback triggered:', error);

    try {
      return getAuth(firebaseApp);
    } catch (fallbackError) {
      console.warn('Auth fallback to in-memory persistence triggered:', fallbackError);

      return initializeAuth(firebaseApp, {
        persistence: inMemoryPersistence,
      });
    }
  }
};

export const auth = createAuthInstance();
