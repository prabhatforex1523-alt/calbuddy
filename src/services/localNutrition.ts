import localFoods from "../data/localFoods.json";

export type LocalFoodBaseUnit = "piece" | "100g" | "serving";

export type LocalFoodItem = {
  name: string;
  aliases?: string[] | string;
  servingSize: string;
  baseUnit: LocalFoodBaseUnit;
  servingWeightGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const BLOCKED_LOCAL_FOODS = new Set(["butter chicken", "carrot"]);

const normalizeAliases = (aliases?: string[] | string) =>
  Array.isArray(aliases)
    ? aliases
    : typeof aliases === "string" && aliases.trim()
      ? aliases
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

const normalizeServingWeightGrams = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const hasBrokenNutritionValues = (item: LocalFoodItem) => {
  const calories = Number(item.calories || 0);
  const protein = Number(item.protein || 0);
  const carbs = Number(item.carbs || 0);
  const fat = Number(item.fat || 0);
  const totalMacros = protein + carbs + fat;

  return (
    BLOCKED_LOCAL_FOODS.has(item.name.trim().toLowerCase()) ||
    calories > 900 ||
    totalMacros > 100.5 ||
    (calories <= 0 && totalMacros > 0.5) ||
    (calories < 10 && totalMacros > 5)
  );
};

const FOOD_ITEMS = (localFoods as LocalFoodItem[])
  .map((item) => ({
    ...item,
    aliases: normalizeAliases(item.aliases),
    servingWeightGrams: normalizeServingWeightGrams(item.servingWeightGrams),
  }))
  .filter((item) => !hasBrokenNutritionValues(item));

const TITLE_CASE = (value: string) =>
  value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalize = (value: string) =>
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
  normalize(value)
    .split(" ")
    .map(singularizeToken)
    .filter(Boolean);

const normalizeTokens = (value: string) => tokenize(value).join(" ");

const allNamesForItem = (item: LocalFoodItem) => [
  item.name,
  ...(Array.isArray(item.aliases) ? item.aliases : []),
];

const getItemSearchKeys = (item: LocalFoodItem) =>
  allNamesForItem(item).map((value) => ({
    raw: value,
    normalized: normalize(value),
    tokenized: normalizeTokens(value),
  }));

const rankFoodMatch = (item: LocalFoodItem, query: string) => {
  const normalizedQuery = normalize(query);
  const tokenizedQuery = normalizeTokens(query);

  let bestScore = Number.POSITIVE_INFINITY;

  for (const key of getItemSearchKeys(item)) {
    if (key.normalized === normalizedQuery || key.tokenized === tokenizedQuery) {
      bestScore = Math.min(bestScore, 0);
      continue;
    }

    if (
      key.normalized.startsWith(normalizedQuery) ||
      key.tokenized.startsWith(tokenizedQuery)
    ) {
      bestScore = Math.min(bestScore, 1);
      continue;
    }

    if (key.normalized.includes(normalizedQuery) || key.tokenized.includes(tokenizedQuery)) {
      bestScore = Math.min(bestScore, 2);
      continue;
    }

    const queryTokens = tokenize(query);
    const keyTokens = new Set(tokenize(key.raw));

    if (queryTokens.length > 0 && queryTokens.every((token) => keyTokens.has(token))) {
      bestScore = Math.min(bestScore, 3);
    }
  }

  return bestScore;
};

const matchesFood = (item: LocalFoodItem, query: string) =>
  Number.isFinite(rankFoodMatch(item, query));

const isDirectLookupMatch = (item: LocalFoodItem, query: string) => {
  const normalizedQuery = normalize(query);
  const tokenizedQuery = normalizeTokens(query);
  const queryTokens = tokenize(query);

  return getItemSearchKeys(item).some((key) => {
    if (key.normalized === normalizedQuery || key.tokenized === tokenizedQuery) {
      return true;
    }

    const keyTokens = tokenize(key.raw);
    const sameTokenCount = queryTokens.length > 0 && queryTokens.length === keyTokens.length;

    if (sameTokenCount && queryTokens.every((token) => keyTokens.includes(token))) {
      return true;
    }

    if (queryTokens.length === 1 && keyTokens.length === 1) {
      return (
        key.normalized.startsWith(normalizedQuery) ||
        normalizedQuery.startsWith(key.normalized) ||
        key.tokenized.startsWith(tokenizedQuery) ||
        tokenizedQuery.startsWith(key.tokenized) ||
        key.normalized.includes(normalizedQuery) ||
        normalizedQuery.includes(key.normalized)
      );
    }

    return false;
  });
};

const sortFoodsByRelevance = (items: LocalFoodItem[], query: string) =>
  [...items].sort((a, b) => {
    const aScore = rankFoodMatch(a, query);
    const bScore = rankFoodMatch(b, query);

    return aScore - bScore || a.name.localeCompare(b.name);
  });

export const getLocalNutrition = (foodName: string): LocalFoodItem | null => {
  const query = foodName.trim();

  if (!query) {
    return null;
  }

  const matches = sortFoodsByRelevance(
    FOOD_ITEMS.filter((item) => isDirectLookupMatch(item, query)),
    query
  );

  return matches[0] || null;
};

export const searchLocalFoods = (query: string, limit = 8): string[] => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return sortFoodsByRelevance(
    FOOD_ITEMS.filter((item) => matchesFood(item, normalizedQuery)),
    normalizedQuery
  )
    .slice(0, limit)
    .map((item) => TITLE_CASE(item.name));
};

export const searchLocalFoodItems = (query: string, limit = 8): LocalFoodItem[] => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return sortFoodsByRelevance(
    FOOD_ITEMS.filter((item) => matchesFood(item, normalizedQuery)),
    normalizedQuery
  ).slice(0, limit);
};

export const getLocalFoodNames = (): string[] =>
  FOOD_ITEMS.map((item) => TITLE_CASE(item.name));
