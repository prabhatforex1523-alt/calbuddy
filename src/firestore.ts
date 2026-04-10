import { Capacitor } from '@capacitor/core';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore';

import { firebaseApp } from './firebase';

const isNativeApp = Capacitor.isNativePlatform();

const createFirestoreInstance = () => {
  try {
    if (isNativeApp) {
      // Native WebViews behave differently than multi-tab browsers, so keep
      // the mobile build on the safer in-memory cache path during startup.
      return initializeFirestore(firebaseApp, {
        localCache: memoryLocalCache(),
      });
    }

    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({}),
      }),
    });
  } catch (error) {
    console.error('Firestore initialization fallback triggered:', error);
    return getFirestore(firebaseApp);
  }
};

export const db = createFirestoreInstance();
