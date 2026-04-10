import type { FoodSearchResult } from "../types";
import { getCachedValue, setCachedValue } from "./cache";

const FOOD_LOOKUP_PREFIX = "calsnap_food_lookup_v2_";
const FOOD_HISTORY_KEY = "calsnap_food_history";
const RECENT_FOODS_KEY = "calsnap_recent_foods_v2";

export const getCachedFood = async (foodName: string) =>
  getCachedValue<FoodSearchResult>(
    `${FOOD_LOOKUP_PREFIX}${foodName.trim().toLowerCase()}`,
    1000 * 60 * 60 * 24 * 30
  );

export const saveCachedFood = async (
  food: FoodSearchResult | Omit<FoodSearchResult, "id" | "servingSize" | "source">
) => {
  const normalized: FoodSearchResult = {
    id: food.name.trim().toLowerCase(),
    servingSize: "1 serving",
    source: "manual",
    ...food,
  };

  setCachedValue(
    `${FOOD_LOOKUP_PREFIX}${normalized.name.trim().toLowerCase()}`,
    normalized
  );
};

export const saveFoodToHistory = (food: string) => {
  try {
    const existing = getFoodHistory();
    const updated = [food, ...existing.filter((item) => item !== food)].slice(0, 50);
    window.localStorage.setItem(FOOD_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving food history", error);
  }
};

export const getFoodHistory = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(FOOD_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveRecentFood = (food: FoodSearchResult) => {
  try {
    const existing = getRecentFoods();
    const updated = [
      food,
      ...existing.filter((item) => item.name.toLowerCase() !== food.name.toLowerCase()),
    ].slice(0, 12);

    window.localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving recent food", error);
  }
};

export const getRecentFoods = (): FoodSearchResult[] => {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_FOODS_KEY) || "[]");
  } catch {
    return [];
  }
};
