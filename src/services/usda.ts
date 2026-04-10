import type { FoodSearchResult } from "../types";
import { getCachedValue, setCachedValue } from "./cache";
import { enrichFoodMetadata } from "./nutritionTrust";

const usdaKey =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_USDA_API_KEY
    : undefined;
const USDA_SEARCH_CACHE_PREFIX = "calsnap_usda_search_v2_";
const USDA_LOOKUP_CACHE_PREFIX = "calsnap_usda_lookup_v2_";
const USDA_CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const OFFICIAL_DATA_TYPES = new Set(["Foundation", "SR Legacy", "Survey (FNDDS)"]);

export const isUsdaLookupAvailable = () => Boolean(usdaKey);

type UsdaFoodNutrient = {
  nutrientName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId: number;
  description?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

const normalizeBarcode = (value?: string) => (value || "").replace(/\D/g, "");

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

const getNutrientValue = (nutrients: UsdaFoodNutrient[] = [], name: string) => {
  const found = nutrients.find(
    (item) => (item.nutrientName || "").toLowerCase() === name.toLowerCase()
  );

  return Number(found?.value || 0);
};

const normalizeUsdaFood = (food: UsdaFood): FoodSearchResult =>
  enrichFoodMetadata({
    id: `usda-${food.fdcId}`,
    name: food.description || "USDA Food",
    servingSize: food.servingSize
      ? `${food.servingSize} ${food.servingSizeUnit || "g"}`
      : "100 g",
    servingWeightGrams:
      food.servingSize &&
      ["g", "gm", "grm", "gram", "grams"].includes((food.servingSizeUnit || "").toLowerCase())
        ? Number(food.servingSize)
        : undefined,
    baseUnit: "100g",
    calories: getNutrientValue(food.foodNutrients, "Energy"),
    protein: getNutrientValue(food.foodNutrients, "Protein"),
    carbs: getNutrientValue(food.foodNutrients, "Carbohydrate, by difference"),
    fat: getNutrientValue(food.foodNutrients, "Total lipid (fat)"),
    fiber: getNutrientValue(food.foodNutrients, "Fiber, total dietary"),
    sugar: getNutrientValue(food.foodNutrients, "Sugars, total including NLEA"),
    sodiumMg: getNutrientValue(food.foodNutrients, "Sodium, Na"),
    source: "usda",
    brandName: food.brandName || food.brandOwner,
    barcode: normalizeBarcode(food.gtinUpc),
    verifiedSource: OFFICIAL_DATA_TYPES.has(food.dataType || ""),
    trustLevel: OFFICIAL_DATA_TYPES.has(food.dataType || "") ? "verified" : "reference",
    sourceDetail:
      food.dataType === "Branded"
        ? `USDA branded lookup${food.brandName ? ` | ${food.brandName}` : ""}`
        : "USDA global reference database",
  });

const rankUsdaFood = (food: UsdaFood, query: string) => {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  const description = normalizeText(food.description || "");
  const descriptionTokens = new Set(tokenize(food.description || ""));
  const matchedTokens = queryTokens.filter((token) => descriptionTokens.has(token));
  const tokenCoverage = queryTokens.length > 0 ? matchedTokens.length / queryTokens.length : 1;
  const officialPenalty = OFFICIAL_DATA_TYPES.has(food.dataType || "") ? 0 : 1;
  const brandPenalty =
    food.dataType === "Branded" || food.brandOwner || food.brandName ? 1 : 0;

  const matchPenalty =
    description === normalizedQuery
      ? 0
      : description.startsWith(normalizedQuery)
        ? 1
        : description.includes(normalizedQuery)
          ? 2
          : tokenCoverage >= 0.75
            ? 3
            : 10;

  return {
    officialPenalty,
    brandPenalty,
    matchPenalty,
    coveragePenalty: 1 - tokenCoverage,
    descriptionLength: description.length,
  };
};

const sortUsdaFoods = (foods: UsdaFood[], query: string) =>
  [...foods].sort((a, b) => {
    const aRank = rankUsdaFood(a, query);
    const bRank = rankUsdaFood(b, query);

    return (
      aRank.officialPenalty - bRank.officialPenalty ||
      aRank.brandPenalty - bRank.brandPenalty ||
      aRank.matchPenalty - bRank.matchPenalty ||
      aRank.coveragePenalty - bRank.coveragePenalty ||
      aRank.descriptionLength - bRank.descriptionLength
    );
  });

const requestUsdaSearch = async (query: string, pageSize = 25) => {
  if (!usdaKey) {
    return [];
  }

  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}&query=${encodeURIComponent(
      query
    )}&pageSize=${pageSize}`
  );

  if (!response.ok) {
    throw new Error("USDA search failed");
  }

  const data = (await response.json()) as { foods?: UsdaFood[] };
  return data.foods || [];
};

export const searchUsdaFoods = async (query: string, pageSize = 8) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  const cached = getCachedValue<FoodSearchResult[]>(
    `${USDA_SEARCH_CACHE_PREFIX}${normalizedQuery}`,
    USDA_CACHE_TTL
  );

  if (cached) {
    return cached;
  }

  try {
    const foods = await requestUsdaSearch(normalizedQuery, pageSize);
    const rankedFoods = sortUsdaFoods(foods, normalizedQuery);
    const results = rankedFoods
      .map(normalizeUsdaFood)
      .filter(
        (result, index, list) =>
          list.findIndex((item) => item.name.toLowerCase() === result.name.toLowerCase()) === index
      );
    setCachedValue(`${USDA_SEARCH_CACHE_PREFIX}${normalizedQuery}`, results);
    return results;
  } catch (error) {
    console.error("USDA search error", error);
    return [];
  }
};

export const lookupUsdaFood = async (name: string) => {
  const normalizedName = name.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  const cached = getCachedValue<FoodSearchResult>(
    `${USDA_LOOKUP_CACHE_PREFIX}${normalizedName}`,
    USDA_CACHE_TTL
  );

  if (cached) {
    return cached;
  }

  const singularName = normalizedName.endsWith("s") ? normalizedName.slice(0, -1) : normalizedName;
  const searchQueries = Array.from(new Set([normalizedName, singularName])).filter(Boolean);
  const results = (
    await Promise.all(searchQueries.map((query) => searchUsdaFoods(query, 25)))
  ).flat();
  const preferred =
    results.find((item) => normalizeText(item.name) === normalizeText(normalizedName)) ||
    results.find((item) => normalizeText(item.name).startsWith(normalizeText(singularName))) ||
    results[0] ||
    null;

  if (preferred) {
    setCachedValue(`${USDA_LOOKUP_CACHE_PREFIX}${normalizedName}`, preferred);
  }

  return preferred;
};

export const lookupUsdaBarcode = async (barcode: string) => {
  const normalizedBarcode = normalizeBarcode(barcode);

  if (!normalizedBarcode) {
    return null;
  }

  const cacheKey = `${USDA_LOOKUP_CACHE_PREFIX}barcode_${normalizedBarcode}`;
  const cached = getCachedValue<FoodSearchResult>(cacheKey, USDA_CACHE_TTL);

  if (cached) {
    return cached;
  }

  try {
    const foods = await requestUsdaSearch(normalizedBarcode, 25);
    const exactMatch = foods.find((food) => normalizeBarcode(food.gtinUpc) === normalizedBarcode);
    const preferred = exactMatch ? normalizeUsdaFood(exactMatch) : null;

    if (preferred) {
      setCachedValue(cacheKey, preferred);
    }

    return preferred;
  } catch (error) {
    console.error("USDA barcode lookup error", error);
    return null;
  }
};
