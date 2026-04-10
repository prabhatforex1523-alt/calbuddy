import assert from "node:assert/strict";
import test from "node:test";

import { Capacitor } from "@capacitor/core";

import { createInitialHealthData } from "./appData";
import { mergeHealthSyncIntoData } from "./healthConnect";
import { buildHealthSyncState } from "./healthSync";

test("mergeHealthSyncIntoData saves imported Health Connect weight into app state", () => {
  const initial = createInitialHealthData();
  const merged = mergeHealthSyncIntoData(
    {
      ...initial,
      profile: {
        ...initial.profile,
        currentWeight: 78,
        weightUnit: "kg",
      },
    },
    {
      provider: "health_connect",
      availability: "ready",
      permissionsGranted: true,
      latestWeightKg: 74.6,
      latestWeightAt: new Date("2026-04-04T07:30:00Z").getTime(),
      steps7d: 42000,
      workouts7d: 4,
      averageSleepHours: 7.2,
    }
  );

  assert.equal(merged.healthSync.availability, "ready");
  assert.equal(merged.profile.currentWeight, 74.6);
  assert.equal(merged.weightEntries.length, 1);
  assert.equal(merged.weightEntries[0]?.source, "health_connect");
  assert.equal(merged.weightEntries[0]?.weight, 74.6);
});

test("buildHealthSyncState keeps imported Health Connect metrics on Android", () => {
  const originalGetPlatform = Capacitor.getPlatform;
  (Capacitor as typeof Capacitor & { getPlatform: () => string }).getPlatform = () => "android";

  try {
    const recentWorkoutTime = new Date("2026-04-03T07:30:00Z").getTime();
    const state = buildHealthSyncState({
      activityEntries: [
        {
          id: "activity-1",
          name: "Run",
          caloriesBurned: 260,
          durationMinutes: 30,
          intensity: "Medium",
          timestamp: recentWorkoutTime,
        },
      ],
      weightEntries: [],
      current: {
        provider: "health_connect",
        availability: "ready",
        permissionsGranted: true,
        lastSyncedAt: new Date("2026-04-04T06:00:00Z").getTime(),
        workouts7d: 2,
        steps7d: 38000,
        averageSleepHours: 7.5,
        latestWeightKg: 74.2,
        latestWeightAt: new Date("2026-04-03T06:00:00Z").getTime(),
        note: "Connected",
      },
    });

    assert.equal(state.availability, "ready");
    assert.equal(state.steps7d, 38000);
    assert.equal(state.averageSleepHours, 7.5);
    assert.equal(state.latestWeightKg, 74.2);
    assert.equal(state.workouts7d, 2);
  } finally {
    (Capacitor as typeof Capacitor & { getPlatform: () => string }).getPlatform = originalGetPlatform;
  }
});
