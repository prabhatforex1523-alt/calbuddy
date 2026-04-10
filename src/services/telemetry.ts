import type { FirebaseApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import type { Analytics } from 'firebase/analytics';

type TelemetryType = 'event' | 'error';

export type TelemetryRecord = {
  id: string;
  type: TelemetryType;
  name: string;
  timestamp: number;
  message?: string;
  context?: Record<string, string | number | boolean | null>;
};

const TELEMETRY_STORAGE_KEY = 'calsnap_telemetry_buffer';
const TELEMETRY_LIMIT = 50;

let analyticsInstance: Analytics | null = null;
let telemetryInitPromise: Promise<void> | null = null;
let globalHandlersInstalled = false;
let analyticsModule:
  | {
      getAnalytics: (app: FirebaseApp) => Analytics;
      isSupported: () => Promise<boolean>;
      logEvent: (
        analytics: Analytics,
        eventName: string,
        eventParams?: Record<string, string | number | boolean | null>
      ) => void;
      setAnalyticsCollectionEnabled: (analytics: Analytics, enabled: boolean) => void;
    }
  | null = null;

const canUseBrowser = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isNativeApp = () => Capacitor.isNativePlatform();

const sanitizeValue = (value: unknown): string | number | boolean | null => {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'undefined') {
    return null;
  }

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const sanitizeContext = (context?: Record<string, unknown>) => {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, sanitizeValue(value)])
  );
};

const readBuffer = (): TelemetryRecord[] => {
  if (!canUseBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TelemetryRecord[]) : [];
  } catch {
    return [];
  }
};

const writeBuffer = (records: TelemetryRecord[]) => {
  if (!canUseBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(records.slice(-TELEMETRY_LIMIT)));
  } catch {
    // Swallow telemetry write failures so monitoring never breaks the app.
  }
};

const appendRecord = (record: TelemetryRecord) => {
  writeBuffer([...readBuffer(), record]);
};

const normalizeEventName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'calsnap_event';

const createRecord = (
  type: TelemetryType,
  name: string,
  message?: string,
  context?: Record<string, unknown>
): TelemetryRecord => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  name,
  timestamp: Date.now(),
  message,
  context: sanitizeContext(context),
});

export const initializeTelemetry = async (firebaseApp: FirebaseApp) => {
  if (telemetryInitPromise) {
    return telemetryInitPromise;
  }

  telemetryInitPromise = (async () => {
    if (!canUseBrowser() || isNativeApp()) {
      return;
    }

    try {
      analyticsModule ??= await import('firebase/analytics');
      const supported = await analyticsModule.isSupported();

      if (!supported) {
        return;
      }

      analyticsInstance = analyticsModule.getAnalytics(firebaseApp);
      analyticsModule.setAnalyticsCollectionEnabled(analyticsInstance, true);
    } catch {
      analyticsInstance = null;
    }
  })();

  return telemetryInitPromise;
};

export const trackEvent = (name: string, context?: Record<string, unknown>) => {
  const sanitizedContext = sanitizeContext(context);
  appendRecord(createRecord('event', name, undefined, context));

  if (!analyticsInstance) {
    return;
  }

  try {
    analyticsModule?.logEvent(analyticsInstance, normalizeEventName(name), sanitizedContext);
  } catch {
    appendRecord(createRecord('error', 'telemetry_log_event_failed', 'Analytics event logging failed', { name }));
  }
};

export const reportError = (error: unknown, context?: Record<string, unknown>) => {
  const message = error instanceof Error ? error.message : String(error);
  const record = createRecord('error', 'app_error', message, {
    ...(context || {}),
    stack: error instanceof Error ? error.stack ?? null : null,
  });

  appendRecord(record);
  console.error(message, error);

  if (!analyticsInstance) {
    return;
  }

  try {
    analyticsModule?.logEvent(analyticsInstance, 'app_error', {
      message,
      ...(record.context || {}),
    });
  } catch {
    appendRecord(createRecord('error', 'telemetry_log_error_failed', 'Analytics error logging failed', { message }));
  }
};

export const installGlobalErrorHandlers = () => {
  if (!canUseBrowser() || globalHandlersInstalled) {
    return () => undefined;
  }

  const handleError = (event: ErrorEvent) => {
    reportError(event.error ?? event.message, {
      scope: 'window_error',
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    reportError(event.reason, {
      scope: 'unhandled_rejection',
    });
  };

  globalHandlersInstalled = true;
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);

  return () => {
    globalHandlersInstalled = false;
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
  };
};

export const getTelemetryBuffer = () => readBuffer();

export const clearTelemetryBuffer = () => {
  if (!canUseBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(TELEMETRY_STORAGE_KEY);
  } catch {
    // Ignore telemetry cleanup failures.
  }
};

export const getTelemetrySummary = () => {
  const records = readBuffer();
  const events = records.filter((record) => record.type === 'event');
  const errors = records.filter((record) => record.type === 'error');

  return {
    total: records.length,
    events: events.length,
    errors: errors.length,
    lastEvent: events[events.length - 1] || null,
    lastError: errors[errors.length - 1] || null,
  };
};
