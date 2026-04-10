import type { FoodSearchResult } from "../types";

type NormalizedUnit =
  | "grams"
  | "kg"
  | "piece"
  | "slice"
  | "serving"
  | "cup"
  | "tbsp"
  | "tsp"
  | "ml"
  | "oz";

type ScalableFood = {
  name: string;
  baseUnit?: FoodSearchResult["baseUnit"];
  servingSize?: string;
  servingWeightGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
};

const OUNCES_TO_GRAMS = 28.3495;

const COMMON_PORTION_WEIGHTS: Array<{
  match: string[];
  weights: Partial<Record<NormalizedUnit, number>>;
}> = [
  { match: ["egg", "eggs"], weights: { piece: 50, serving: 50 } },
  { match: ["egg white", "egg whites"], weights: { piece: 33, serving: 33 } },
  { match: ["egg yolk", "egg yolks"], weights: { piece: 17, serving: 17 } },
  { match: ["roti", "chapati", "chapatti"], weights: { piece: 40, serving: 40 } },
  { match: ["paratha"], weights: { piece: 80, serving: 80 } },
  { match: ["naan"], weights: { piece: 90, serving: 90 } },
  { match: ["tortilla"], weights: { piece: 49, serving: 49 } },
  {
    match: ["bread", "toast", "whole wheat bread", "sourdough bread"],
    weights: { slice: 28, piece: 28, serving: 28 },
  },
  { match: ["bagel"], weights: { piece: 95, serving: 95 } },
  { match: ["banana"], weights: { piece: 118, serving: 118 } },
  { match: ["apple"], weights: { piece: 182, serving: 182 } },
  { match: ["orange"], weights: { piece: 140, serving: 140 } },
];

const round1 = (value: number) => Math.round(value * 10) / 10;

const normalizeFoodName = (value: string) => value.trim().toLowerCase();

const parseServingWeightGrams = (
  food: Pick<ScalableFood, "servingWeightGrams" | "servingSize">
) => {
  if (
    typeof food.servingWeightGrams === "number" &&
    Number.isFinite(food.servingWeightGrams) &&
    food.servingWeightGrams > 0
  ) {
    return food.servingWeightGrams;
  }

  const match = (food.servingSize || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(g|gram|grams|grm)$/i);

  if (!match) {
    return undefined;
  }

  return Number(match[1]);
};

const getKnownPortionWeight = (foodName: string, unit: NormalizedUnit) => {
  const normalizedName = normalizeFoodName(foodName);
  const match = COMMON_PORTION_WEIGHTS.find((rule) =>
    rule.match.some(
      (keyword) => normalizedName === keyword || normalizedName.includes(keyword)
    )
  );

  return match?.weights[unit];
};

export const normalizeQuantityUnit = (unit?: string): NormalizedUnit => {
  const normalized = (unit || "serving").trim().toLowerCase();

  if (["g", "gram", "grams"].includes(normalized)) return "grams";
  if (["kg", "kilogram", "kilograms"].includes(normalized)) return "kg";
  if (["piece", "pieces", "pc", "pcs"].includes(normalized)) return "piece";
  if (["slice", "slices"].includes(normalized)) return "slice";
  if (["cup", "cups"].includes(normalized)) return "cup";
  if (["tbsp", "tablespoon", "tablespoons"].includes(normalized)) return "tbsp";
  if (["tsp", "teaspoon", "teaspoons"].includes(normalized)) return "tsp";
  if (["ml", "milliliter", "milliliters"].includes(normalized)) return "ml";
  if (["oz", "ounce", "ounces"].includes(normalized)) return "oz";

  return "serving";
};

export const getNutritionScaleFactor = (
  food: Pick<ScalableFood, "name" | "baseUnit" | "servingWeightGrams" | "servingSize">,
  quantity = 1,
  unit?: string
) => {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const normalizedUnit = normalizeQuantityUnit(unit);

  if (food.baseUnit === "100g") {
    if (normalizedUnit === "grams") {
      return safeQuantity / 100;
    }

    if (normalizedUnit === "kg") {
      return safeQuantity * 10;
    }

    if (normalizedUnit === "oz") {
      return (safeQuantity * OUNCES_TO_GRAMS) / 100;
    }

    const knownWeight =
      getKnownPortionWeight(food.name, normalizedUnit) ??
      (normalizedUnit === "serving" ? parseServingWeightGrams(food) : undefined);

    if (knownWeight) {
      return (safeQuantity * knownWeight) / 100;
    }

    return safeQuantity;
  }

  return safeQuantity;
};

export const scaleFoodNutrition = <T extends ScalableFood>(
  food: T,
  quantity = 1,
  unit?: string
) => {
  const factor = getNutritionScaleFactor(food, quantity, unit);

  return {
    ...food,
    calories: round1(food.calories * factor),
    protein: round1(food.protein * factor),
    carbs: round1(food.carbs * factor),
    fat: round1(food.fat * factor),
    fiber: typeof food.fiber === "number" ? round1(food.fiber * factor) : food.fiber,
    sugar: typeof food.sugar === "number" ? round1(food.sugar * factor) : food.sugar,
    sodiumMg:
      typeof food.sodiumMg === "number" ? round1(food.sodiumMg * factor) : food.sodiumMg,
  } as T;
};
