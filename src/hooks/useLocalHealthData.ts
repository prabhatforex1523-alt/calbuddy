import { useEffect, useRef, useState } from 'react';

import type { HealthData } from '../types';
import { buildStorageKey, createInitialHealthData, loadStoredHealthData, saveStoredHealthData } from '../services/appData';

type UseLocalHealthDataOptions = {
  onLoadError?: (error: unknown) => void;
  onQuotaExceeded?: (error: unknown) => void;
  onSaveError?: (error: unknown) => void;
  userId: string | undefined;
};

export const useLocalHealthData = ({
  onLoadError,
  onQuotaExceeded,
  onSaveError,
  userId,
}: UseLocalHealthDataOptions) => {
  const SAVE_DEBOUNCE_MS = 240;
  const [data, setData] = useState<HealthData>(() => createInitialHealthData());
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const loadErrorRef = useRef(onLoadError);
  const quotaExceededRef = useRef(onQuotaExceeded);
  const saveErrorRef = useRef(onSaveError);
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<{ userId: string | undefined; data: HealthData } | null>(null);

  const flushPendingSave = () => {
    const pendingSave = pendingSaveRef.current;

    if (!pendingSave) {
      return;
    }

    pendingSaveRef.current = null;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const result = saveStoredHealthData(pendingSave.userId, pendingSave.data);

    if (result.ok === true) {
      return;
    }

    if (result.reason === 'quota') {
      quotaExceededRef.current?.(result.error);
      return;
    }

    saveErrorRef.current?.(result.error);
  };

  useEffect(() => {
    loadErrorRef.current = onLoadError;
    quotaExceededRef.current = onQuotaExceeded;
    saveErrorRef.current = onSaveError;
  }, [onLoadError, onQuotaExceeded, onSaveError]);

  useEffect(() => {
    setIsHydrated(false);
    setHydratedStorageKey(null);
    flushPendingSave();
    const result = loadStoredHealthData(userId);
    setData(result.data);
    setHydratedStorageKey(buildStorageKey(userId));
    setIsHydrated(true);

    if (result.error) {
      loadErrorRef.current?.(result.error);
    }
  }, [userId]);

  useEffect(() => {
    const storageKey = buildStorageKey(userId);

    if (!isHydrated || hydratedStorageKey !== storageKey) {
      return;
    }

    pendingSaveRef.current = {
      userId,
      data,
    };

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      flushPendingSave();
    }, SAVE_DEBOUNCE_MS);
  }, [data, hydratedStorageKey, isHydrated, userId]);

  useEffect(() => {
    const handlePageHide = () => {
      flushPendingSave();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      flushPendingSave();
    };
  }, []);

  return {
    data,
    isHydrated,
    setData,
  };
};
