import type { BarcodeCatalogEntry, FoodSearchResult } from "../types";
import { lookupUsdaBarcode } from "./usda";

const stripLeadingZeroes = (value: string) => value.replace(/^0+/, "") || "0";

export const normalizeBarcode = (value: string) => value.replace(/\D/g, "");

export const isLikelyBarcode = (value: string) => /^\d{8,14}$/.test(normalizeBarcode(value));

const barcodeMatches = (left: string, right: string) => {
  const normalizedLeft = normalizeBarcode(left);
  const normalizedRight = normalizeBarcode(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    stripLeadingZeroes(normalizedLeft) === stripLeadingZeroes(normalizedRight)
  );
};

export const lookupBarcodeFood = async (input: {
  barcode: string;
  library: BarcodeCatalogEntry[];
}): Promise<FoodSearchResult | null> => {
  const normalizedBarcode = normalizeBarcode(input.barcode);

  if (!isLikelyBarcode(normalizedBarcode)) {
    return null;
  }

  const localMatch = [...input.library]
    .sort((a, b) => b.usageCount - a.usageCount || b.lastUsedAt - a.lastUsedAt)
    .find((entry) => barcodeMatches(entry.barcode, normalizedBarcode));

  if (localMatch) {
    return {
      ...localMatch.food,
      barcode: normalizedBarcode,
      brandName: localMatch.brandName || localMatch.food.brandName,
    };
  }

  return lookupUsdaBarcode(normalizedBarcode);
};

export const upsertBarcodeCatalog = (input: {
  library: BarcodeCatalogEntry[];
  barcode: string;
  food: FoodSearchResult;
}): BarcodeCatalogEntry[] => {
  const normalizedBarcode = normalizeBarcode(input.barcode);

  if (!isLikelyBarcode(normalizedBarcode)) {
    return input.library;
  }

  const existing = input.library.find((entry) => barcodeMatches(entry.barcode, normalizedBarcode));
  const baseFood: FoodSearchResult = {
    ...input.food,
    barcode: normalizedBarcode,
  };

  if (existing) {
    const updatedEntry: BarcodeCatalogEntry = {
      ...existing,
      barcode: normalizedBarcode,
      name: baseFood.name,
      brandName: baseFood.brandName || existing.brandName,
      food: {
        ...existing.food,
        ...baseFood,
      },
      usageCount: existing.usageCount + 1,
      lastUsedAt: Date.now(),
    };

    return [
      updatedEntry,
      ...input.library.filter((entry) => entry.id !== existing.id),
    ].slice(0, 40);
  }

  const createdEntry: BarcodeCatalogEntry = {
    id: `barcode-${normalizedBarcode}`,
    barcode: normalizedBarcode,
    name: baseFood.name,
    brandName: baseFood.brandName,
    food: baseFood,
    usageCount: 1,
    lastUsedAt: Date.now(),
    savedAt: Date.now(),
  };

  return [createdEntry, ...input.library].slice(0, 40);
};
