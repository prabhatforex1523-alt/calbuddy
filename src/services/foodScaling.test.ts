import assert from "node:assert/strict";
import test from "node:test";

import { getNutritionScaleFactor, scaleFoodNutrition } from "./foodScaling";

test("scales 100g foods by gram input", () => {
  const scaled = scaleFoodNutrition(
    {
      name: "rice",
      servingSize: "100 g",
      baseUnit: "100g",
      calories: 130,
      protein: 2.4,
      carbs: 28.2,
      fat: 0.3,
    },
    150,
    "grams"
  );

  assert.equal(scaled.calories, 195);
  assert.equal(scaled.protein, 3.6);
  assert.equal(scaled.carbs, 42.3);
  assert.equal(scaled.fat, 0.5);
});

test("uses serving weight for 100g foods when servings are requested", () => {
  const factor = getNutritionScaleFactor(
    {
      name: "aloo gobi",
      servingSize: "255 g",
      servingWeightGrams: 255,
      baseUnit: "100g",
    },
    1,
    "serving"
  );

  assert.equal(factor, 2.55);
});

test("supports serving-based foods without type narrowing issues", () => {
  const scaled = scaleFoodNutrition(
    {
      name: "protein bowl",
      servingSize: "1 bowl",
      baseUnit: "serving",
      calories: 320,
      protein: 24,
      carbs: 28,
      fat: 12,
    },
    2,
    "servings"
  );

  assert.equal(scaled.calories, 640);
  assert.equal(scaled.protein, 48);
  assert.equal(scaled.carbs, 56);
  assert.equal(scaled.fat, 24);
});
