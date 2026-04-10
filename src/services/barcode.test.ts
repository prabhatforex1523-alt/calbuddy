import assert from "node:assert/strict";
import test from "node:test";

import type { BarcodeCatalogEntry } from "../types";
import { isLikelyBarcode, normalizeBarcode, upsertBarcodeCatalog } from "./barcode";

test("normalizeBarcode strips non-digits and validates realistic codes", () => {
  assert.equal(normalizeBarcode("8901-2345 6789"), "890123456789");
  assert.equal(isLikelyBarcode("890123456789"), true);
  assert.equal(isLikelyBarcode("12345"), false);
});

test("upsertBarcodeCatalog stores new matches and increments reuse", () => {
  const firstPass = upsertBarcodeCatalog({
    library: [],
    barcode: "890123456789",
    food: {
      id: "food-1",
      name: "Greek Yogurt",
      servingSize: "1 cup",
      baseUnit: "serving",
      calories: 140,
      protein: 17,
      carbs: 8,
      fat: 4,
      source: "usda",
      brandName: "Fit Dairy",
      barcode: "890123456789",
    },
  });

  assert.equal(firstPass.length, 1);
  assert.equal(firstPass[0]?.usageCount, 1);

  const secondPass = upsertBarcodeCatalog({
    library: firstPass as BarcodeCatalogEntry[],
    barcode: "0890123456789",
    food: {
      id: "food-1",
      name: "Greek Yogurt",
      servingSize: "1 cup",
      baseUnit: "serving",
      calories: 140,
      protein: 17,
      carbs: 8,
      fat: 4,
      source: "usda",
      brandName: "Fit Dairy",
      barcode: "890123456789",
    },
  });

  assert.equal(secondPass.length, 1);
  assert.equal(secondPass[0]?.usageCount, 2);
});
