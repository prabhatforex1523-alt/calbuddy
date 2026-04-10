import assert from "node:assert/strict";
import test from "node:test";

import { getLocalNutrition, searchLocalFoodItems } from "./localNutrition";

test("matches local foods by alias", () => {
  const result = getLocalNutrition("apples");

  assert.ok(result);
  assert.equal(result?.name, "apple");
  assert.equal(result?.baseUnit, "100g");
});

test("searches local foods by partial query", () => {
  const results = searchLocalFoodItems("apple", 3);

  assert.ok(results.length > 0);
  assert.equal(results[0]?.name, "apple");
});

test("filters out clearly broken local nutrition rows", () => {
  assert.equal(getLocalNutrition("butter chicken"), null);
  assert.equal(getLocalNutrition("carrot"), null);
  assert.equal(getLocalNutrition("muesli"), null);
  assert.equal(getLocalNutrition("spaghetti carbonara"), null);
});

test("keeps nearby valid matches even when an invalid exact match is removed", () => {
  const results = searchLocalFoodItems("carrot", 5);

  assert.ok(results.every((item) => item.name !== "carrot"));
  assert.ok(results.some((item) => item.name === "carrot cake"));
});
