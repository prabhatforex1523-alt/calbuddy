import assert from 'node:assert/strict';
import test from 'node:test';

import { createBackupPayload, getBackupFilename, parseBackupText, serializeBackupPayload } from './backup';
import { createInitialHealthData } from './appData';

test('backup round-trip preserves the health data payload', () => {
  const seed = createInitialHealthData();
  seed.profile.name = 'Prabh';
  seed.foodEntries.push({
    id: 'food-1',
    name: 'Moong Chilla',
    calories: 220,
    protein: 13,
    carbs: 20,
    fat: 8,
    quantity: 1,
    unit: 'serving',
    servingSize: '2 pieces',
    timestamp: new Date('2026-04-03T08:00:00').getTime(),
    createdAt: new Date('2026-04-03T08:00:00').getTime(),
    mealType: 'breakfast',
    source: 'manual',
  });

  const payload = createBackupPayload(seed, new Date('2026-04-03T09:00:00'));
  const restored = parseBackupText(serializeBackupPayload(payload));

  assert.equal(restored.profile.name, 'Prabh');
  assert.equal(restored.foodEntries.length, 1);
  assert.equal(restored.foodEntries[0]?.mealType, 'breakfast');
});

test('backup filename uses the export date', () => {
  assert.equal(getBackupFilename(new Date('2026-04-03T09:00:00')), 'calsnap-backup-2026-04-03.json');
});
