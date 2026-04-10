import { Capacitor } from "@capacitor/core";
import { subDays } from "date-fns";

import type { ActivityEntry, HealthSyncState, WeightEntry } from "../types";

const buildPlatformFallbackNote = (platform: string, hasRecentWeights: boolean) => {
  if (platform === "android") {
    return hasRecentWeights
      ? "Local workouts and weigh-ins are ready. Connect Health Connect to import steps, sleep, workouts, and body metrics automatically."
      : "Health Connect can pull steps, sleep, workouts, and body metrics into CALSNAP AI on this Android device.";
  }

  if (platform === "web") {
    return "Health Connect is Android-only. Local tracking and cloud food sync still work worldwide.";
  }

  return "Native health sync is not configured on this device yet, so local tracking stays in control.";
};

export const buildHealthSyncState = (input: {
  activityEntries: ActivityEntry[];
  current?: HealthSyncState;
  weightEntries: WeightEntry[];
}): HealthSyncState => {
  const platform = Capacitor.getPlatform();
  const cutoff = subDays(new Date(), 7).getTime();
  const localWorkouts7d = input.activityEntries.filter((entry) => entry.timestamp >= cutoff).length;
  const hasRecentWeights = input.weightEntries.some((entry) => entry.timestamp >= cutoff);
  const current = input.current;

  if (platform === "android") {
    const hasNativeSnapshot =
      current?.availability === "ready" ||
      typeof current?.steps7d === "number" ||
      typeof current?.averageSleepHours === "number" ||
      typeof current?.latestWeightKg === "number" ||
      typeof current?.lastSyncedAt === "number";

    if (hasNativeSnapshot) {
      return {
        provider: "health_connect",
        availability: current?.availability ?? "ready",
        lastSyncedAt: current?.lastSyncedAt,
        workouts7d:
          typeof current?.workouts7d === "number"
            ? Math.max(current.workouts7d, localWorkouts7d)
            : localWorkouts7d,
        steps7d: current?.steps7d,
        averageSleepHours: current?.averageSleepHours,
        latestWeightKg: current?.latestWeightKg,
        latestWeightAt: current?.latestWeightAt,
        permissionsGranted: current?.permissionsGranted ?? current?.availability === "ready",
        note:
          current?.note ||
          "Health Connect is attached and CALSNAP AI can import steps, sleep, workouts, and weight.",
      };
    }

    return {
      provider: "health_connect",
      availability: "setup_required",
      workouts7d: localWorkouts7d,
      permissionsGranted: false,
      note: buildPlatformFallbackNote(platform, hasRecentWeights),
    };
  }

  return {
    provider: "health_connect",
    availability: platform === "web" ? "unsupported" : "unknown",
    lastSyncedAt: current?.lastSyncedAt,
    workouts7d:
      typeof current?.workouts7d === "number"
        ? Math.max(current.workouts7d, localWorkouts7d)
        : localWorkouts7d,
    steps7d: current?.steps7d,
    averageSleepHours: current?.averageSleepHours,
    latestWeightKg: current?.latestWeightKg,
    latestWeightAt: current?.latestWeightAt,
    permissionsGranted: current?.permissionsGranted,
    note: current?.note || buildPlatformFallbackNote(platform, hasRecentWeights),
  };
};
