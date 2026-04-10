import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDayQualityInsight, buildFoodReviewInsight } from './mealQuality';
import type { FoodEntry } from '../types';

const createEntry = (overrides: Partial<FoodEntry> = {}): FoodEntry => ({
  id: overrides.id ?? crypto.randomUUID(),
  name: overrides.name ?? 'Chicken rice bowl',
  calories: overrides.calories ?? 520,
  protein: overrides.protein ?? 36,
  carbs: overrides.carbs ?? 48,
  fat: overrides.fat ?? 14,
  fiber: overrides.fiber ?? 6,
  sugar: overrides.sugar,
  sodiumMg: overrides.sodiumMg,
  quantity: overrides.quantity ?? 1,
  unit: overrides.unit ?? 'serving',
  servingSize: overrides.servingSize ?? '1 bowl',
  servingWeightGrams: overrides.servingWeightGrams,
  timestamp: overrides.timestamp ?? Date.now(),
  createdAt: overrides.createdAt ?? Date.now(),
  mealType: overrides.mealType ?? 'lunch',
  source: overrides.source ?? 'local',
  confidence: overrides.confidence,
  trustLevel: overrides.trustLevel ?? 'reference',
  sourceDetail: overrides.sourceDetail,
  verifiedSource: overrides.verifiedSource,
  barcode: overrides.barcode,
  brandName: overrides.brandName,
});

test('buildFoodReviewInsight warns when the result is an AI estimate', () => {
  const insight = buildFoodReviewInsight({
    source: 'ai',
    trustLevel: 'estimate',
    confidence: 0.78,
    calories: 640,
    protein: 28,
    carbs: 54,
    fat: 24,
    fiber: 5,
  });

  assert.equal(insight.tone, 'review');
  assert.match(insight.title, /AI estimate/i);
});

test('buildDayQualityInsight flags empty logging days clearly', () => {
  const insight = buildDayQualityInsight({
    entries: [],
    consumed: 0,
    calorieGoal: 2200,
    protein: 0,
    proteinGoal: 140,
    water: 0,
    waterGoalMl: 2600,
  });

  assert.equal(insight.tone, 'attention');
  assert.match(insight.title, /first meal/i);
  assert.equal(insight.badges[0], '0 meals logged');
});

test('buildDayQualityInsight rewards days with strong logging coverage', () => {
  const insight = buildDayQualityInsight({
    entries: [
      createEntry({ mealType: 'breakfast' }),
      createEntry({ id: '2', mealType: 'lunch', name: 'Paneer wrap', calories: 610, protein: 34 }),
      createEntry({ id: '3', mealType: 'dinner', name: 'Dal rice', calories: 540, protein: 28 }),
    ],
    consumed: 1670,
    calorieGoal: 2100,
    protein: 118,
    proteinGoal: 130,
    water: 2200,
    waterGoalMl: 2800,
  });

  assert.equal(insight.tone, 'good');
  assert.match(insight.title, /strong coverage/i);
  assert.ok(insight.badges.some((badge) => /reference-backed/i.test(badge)));
});
