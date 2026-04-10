import type { FoodSearchResult } from "../types";
import {
  getLocalNutrition,
  searchLocalFoodItems,
  type LocalFoodItem,
} from "./localNutrition";
import { lookupUsdaBarcode, lookupUsdaFood, searchUsdaFoods } from "./usda";
import { getCachedFood, saveCachedFood } from "./cacheFood";
import { scaleFoodNutrition } from "./foodScaling";
import { enrichFoodMetadata } from "./nutritionTrust";

const normalizeBarcode = (value: string) => value.replace(/\D/g, "");
const isBarcodeQuery = (value: string) => /^\d{8,14}$/.test(normalizeBarcode(value));

const titleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const singularizeToken = (token: string) => {
  if (token.endsWith("ies") && token.length > 3) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("es") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
};

const tokenize = (value: string) =>
  normalizeText(value)
    .split(" ")
    .map(singularizeToken)
    .filter(Boolean);

const buildLookupCandidates = (name: string) => {
  const normalized = normalizeText(name);

  if (!normalized) {
    return [];
  }

  const tokens = tokenize(normalized);
  const singular = tokens.join(" ");
  const withoutCommonWords = tokens
    .filter((token) => !["a", "an", "the", "of", "with"].includes(token))
    .join(" ");

  return Array.from(new Set([normalized, singular, withoutCommonWords])).filter(Boolean);
};

const normalizeLocalFood = (item: LocalFoodItem): FoodSearchResult =>
  enrichFoodMetadata({
    id: `local-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: titleCase(item.name),
    servingSize: item.servingSize,
    baseUnit: item.baseUnit,
    servingWeightGrams: item.servingWeightGrams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    source: "local",
    trustLevel: "reference",
    verifiedSource: false,
    sourceDetail: "Curated regional staples library",
  });

export const searchFoods = async (query: string, limit = 8) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  if (isBarcodeQuery(normalizedQuery)) {
    const barcodeResult = await lookupUsdaBarcode(normalizedQuery);
    return barcodeResult ? [barcodeResult] : [];
  }

  const localResults = searchLocalFoodItems(normalizedQuery, limit).map(normalizeLocalFood);

  if (localResults.length >= limit) {
    return localResults.slice(0, limit);
  }

  const usdaResults = await searchUsdaFoods(normalizedQuery, limit);
  const merged = [
    ...localResults,
    ...usdaResults.filter(
      (result) =>
        !localResults.some(
          (localResult) => localResult.name.toLowerCase() === result.name.toLowerCase()
        )
    ),
  ];

  return merged.slice(0, limit);
};

export const lookupFoodData = async (
  name: string,
  quantity = 1,
  unit = "serving"
): Promise<FoodSearchResult | null> => {
  const rawName = name.trim();

  if (!rawName) {
    return null;
  }

  if (isBarcodeQuery(rawName)) {
    return lookupUsdaBarcode(rawName);
  }

  const cached = await getCachedFood(rawName);
  if (cached) {
    return scaleFoodNutrition(cached, quantity, unit);
  }

  const lookupCandidates = buildLookupCandidates(rawName);

  for (const candidate of lookupCandidates) {
    const cachedCandidate = await getCachedFood(candidate);
    if (cachedCandidate) {
      return scaleFoodNutrition(cachedCandidate, quantity, unit);
    }
  }

  for (const candidate of lookupCandidates) {
    const localFood = getLocalNutrition(candidate);

    if (localFood) {
      const baseResult = normalizeLocalFood(localFood);
      const scaled = scaleFoodNutrition(baseResult, quantity, unit);
      await saveCachedFood(baseResult);
      if (candidate !== rawName) {
        await saveCachedFood({ ...baseResult, name: rawName });
      }
      return scaled;
    }
  }

  for (const candidate of lookupCandidates) {
    const usdaFood = await lookupUsdaFood(candidate);

    if (usdaFood) {
      const baseResult =
        normalizeText(usdaFood.name) === normalizeText(rawName)
          ? usdaFood
          : { ...usdaFood, name: rawName };

      const scaled = scaleFoodNutrition(baseResult, quantity, unit);
      await saveCachedFood(baseResult);
      return scaled;
    }
  }

  for (const candidate of lookupCandidates) {
    const usdaResults = await searchUsdaFoods(candidate, 5);
    const best = usdaResults[0];

    if (best) {
      const baseResult =
        normalizeText(best.name) === normalizeText(rawName)
          ? best
          : { ...best, name: rawName };

      const scaled = scaleFoodNutrition(baseResult, quantity, unit);
      await saveCachedFood(baseResult);
      return scaled;
    }
  }

  return null;
};
