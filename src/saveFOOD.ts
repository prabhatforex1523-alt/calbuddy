import type { FoodEntry } from "./types";
import { addFoodLog } from "./services/foodLogs";

export const saveFood = async (
  uid: string,
  foodData: Omit<FoodEntry, "id">
) => {
  return addFoodLog(uid, {
    ...foodData,
    createdAt: foodData.createdAt || Date.now(),
    timestamp: foodData.timestamp || Date.now(),
    mealType: foodData.mealType || "snack",
    quantity: foodData.quantity || 1,
    unit: foodData.unit || "serving",
    servingSize: foodData.servingSize || "1 serving",
    source: foodData.source || "manual",
  });
};

