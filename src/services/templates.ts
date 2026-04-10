import type { FoodEntry, MealTemplate, MealTemplateItem, MealType } from "../types";

export const createMealTemplate = (input: {
  name: string;
  mealType: MealType;
  entries: FoodEntry[];
}): MealTemplate => ({
  id: crypto.randomUUID(),
  name: input.name,
  mealType: input.mealType,
  createdAt: Date.now(),
  items: input.entries.map((entry) => ({
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    fiber: entry.fiber,
    sugar: entry.sugar,
    sodiumMg: entry.sodiumMg,
    quantity: entry.quantity || 1,
    unit: entry.unit || "serving",
    servingSize: entry.servingSize,
    servingWeightGrams: entry.servingWeightGrams,
    source: entry.source,
    confidence: entry.confidence,
    trustLevel: entry.trustLevel,
    sourceDetail: entry.sourceDetail,
    verifiedSource: entry.verifiedSource,
    barcode: entry.barcode,
    brandName: entry.brandName,
  })),
});

export const buildFoodEntriesFromTemplate = (
  template: MealTemplate,
  mealType: MealType,
  timestamp: number
): Array<Omit<FoodEntry, "id">> =>
  template.items.map((item: MealTemplateItem) => ({
    ...item,
    mealType,
    createdAt: Date.now(),
    timestamp,
  }));
