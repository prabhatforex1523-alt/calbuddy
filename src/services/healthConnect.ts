import { Capacitor, registerPlugin } from "@capacitor/core";

import type { HealthData, HealthSyncState, WeightEntry } from "../types";

type HealthConnectPlugin = {
  getStatus(): Promise<HealthSyncState>;
  requestHealthAccess(): Promise<HealthSyncState>;
  sync(): Promise<HealthSyncState>;
};

const HealthConnect = registerPlugin<HealthConnectPlugin>("HealthConnect");

const roundWeight = (value: number) => Math.round(value * 10) / 10;

export const isHealthConnectSupportedPlatform = () => Capacitor.getPlatform() === "android";

const buildFallbackState = (): HealthSyncState => ({
  provider: "health_connect",
  availability: Capacitor.getPlatform() === "web" ? "unsupported" : "unknown",
  note:
    Capacitor.getPlatform() === "web"
      ? "Health Connect is Android-only. Local tracking and cloud food sync still work worldwide."
      : "Health Connect is not available on this device.",
});

const normalizeSyncState = (state?: Partial<HealthSyncState> | null): HealthSyncState => ({
  provider: "health_connect",
  availability: state?.availability ?? (isHealthConnectSupportedPlatform() ? "setup_required" : buildFallbackState().availability),
  lastSyncedAt: state?.lastSyncedAt,
  workouts7d: state?.workouts7d,
  steps7d: state?.steps7d,
  averageSleepHours: state?.averageSleepHours,
  latestWeightKg: state?.latestWeightKg,
  latestWeightAt: state?.latestWeightAt,
  permissionsGranted: state?.permissionsGranted,
  note: state?.note,
});

const callHealthConnect = async (
  method: keyof HealthConnectPlugin
): Promise<HealthSyncState> => {
  if (!isHealthConnectSupportedPlatform()) {
    return buildFallbackState();
  }

  try {
    const result = await HealthConnect[method]();
    return normalizeSyncState(result);
  } catch (error) {
    console.error(`Health Connect ${method} failed`, error);
    return normalizeSyncState({
      availability: "unknown",
      note: "Health Connect could not be reached on this device right now.",
    });
  }
};

export const getHealthConnectStatus = () => callHealthConnect("getStatus");

export const requestHealthConnectPermissions = () => callHealthConnect("requestHealthAccess");

export const syncHealthConnectData = () => callHealthConnect("sync");

export const shouldAutoRefreshHealthConnect = (
  state: HealthSyncState | undefined,
  maxAgeMs = 1000 * 60 * 60 * 6
) =>
  isHealthConnectSupportedPlatform() &&
  state?.availability === "ready" &&
  (!state.lastSyncedAt || Date.now() - state.lastSyncedAt > maxAgeMs);

export const mergeHealthSyncIntoData = (
  data: HealthData,
  syncState: HealthSyncState
): HealthData => {
  const normalizedState = normalizeSyncState(syncState);

  if (
    typeof normalizedState.latestWeightKg !== "number" ||
    typeof normalizedState.latestWeightAt !== "number"
  ) {
    return {
      ...data,
      healthSync: normalizedState,
    };
  }

  const importedWeight =
    data.profile.weightUnit === "lbs"
      ? roundWeight(normalizedState.latestWeightKg * 2.20462)
      : roundWeight(normalizedState.latestWeightKg);

  const latestManualWeightTimestamp = data.weightEntries
    .filter((entry) => entry.source !== "health_connect")
    .reduce((latest, entry) => Math.max(latest, entry.timestamp || 0), 0);

  const hasManualWeightAtTimestamp = data.weightEntries.some(
    (entry) => entry.source !== "health_connect" && entry.timestamp === normalizedState.latestWeightAt
  );

  const nextWeightEntriesBase = data.weightEntries.filter(
    (entry) => entry.source !== "health_connect"
  );

  const nextImportedEntry: WeightEntry = {
    id: `health-connect-${normalizedState.latestWeightAt}`,
    weight: importedWeight,
    timestamp: normalizedState.latestWeightAt,
    source: "health_connect",
  };

  const nextWeightEntries = hasManualWeightAtTimestamp
    ? nextWeightEntriesBase
    : [...nextWeightEntriesBase, nextImportedEntry].sort((a, b) => a.timestamp - b.timestamp);

  return {
    ...data,
    healthSync: normalizedState,
    weightEntries: nextWeightEntries,
    profile:
      !hasManualWeightAtTimestamp && normalizedState.latestWeightAt >= latestManualWeightTimestamp
        ? {
            ...data.profile,
            currentWeight: importedWeight,
          }
        : data.profile,
  };
};
