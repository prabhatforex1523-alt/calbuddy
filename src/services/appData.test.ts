import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStorageKey, createInitialHealthData, migrateStoredData } from './appData';

test('migrateStoredData preserves onboarding and fills missing defaults', () => {
  const migrated = migrateStoredData({
    foodEntries: [
      {
        id: 'food-1',
        name: 'Paneer',
        calories: 240,
        protein: 18,
        carbs: 8,
        fat: 14,
        timestamp: 10,
      },
    ],
    profile: {
      name: 'Prabh',
      currentWeight: 80,
      onboarding: {
        primaryFocus: 'muscle_gain',
      },
    },
  });

  assert.equal(migrated.foodEntries[0]?.mealType, 'snack');
  assert.equal(migrated.foodEntries[0]?.unit, 'serving');
  assert.equal(migrated.profile.name, 'Prabh');
  assert.equal(migrated.profile.currentWeight, 80);
  assert.equal(migrated.profile.onboarding.primaryFocus, 'muscle_gain');
  assert.equal(migrated.profile.onboarding.dietStyle, 'eggs');
});

test('migrateStoredData marks coach onboarding complete when workout frequency is already saved', () => {
  const migrated = migrateStoredData({
    profile: {
      onboardingCompleted: false,
      onboarding: {
        workoutFrequency: '5+',
      },
    },
  });

  assert.equal(migrated.profile.onboarding.workoutFrequency, '5+');
  assert.equal(migrated.profile.onboardingCompleted, true);
});

test('createInitialHealthData returns seeded habits and empty logs', () => {
  const initial = createInitialHealthData();

  assert.equal(initial.foodEntries.length, 0);
  assert.equal(initial.activityEntries.length, 0);
  assert.equal(initial.habits.length, 3);
  assert.equal(initial.profile.planTier, 'free');
  assert.equal(initial.barcodeLibrary.length, 0);
  assert.equal(initial.healthSync.availability, 'unknown');
});

test('buildStorageKey isolates guests from signed-in users', () => {
  assert.equal(buildStorageKey(undefined), 'CALSNAP AI_data_guest');
  assert.equal(buildStorageKey('user-1'), 'CALSNAP AI_data_user-1');
});
