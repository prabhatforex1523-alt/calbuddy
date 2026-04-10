import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firestore";
import type { FoodEntry } from "../types";

type FoodLogInput = Omit<FoodEntry, "id">;

const sanitizeFoodLogInput = (food: Partial<FoodLogInput>) => {
  const normalized: Record<string, unknown> = {
    name: food.name || "Unknown Food",
    calories: Number(food.calories || 0),
    protein: Number(food.protein || 0),
    carbs: Number(food.carbs || 0),
    fat: Number(food.fat || 0),
    quantity: food.quantity ?? 1,
    unit: food.unit || "serving",
    servingSize: food.servingSize || "1 serving",
    createdAt: Number(food.createdAt || food.timestamp || Date.now()),
    timestamp: Number(food.timestamp || Date.now()),
    mealType: food.mealType || "snack",
    source: food.source || "manual",
  };

  if (typeof food.fiber === "number" && Number.isFinite(food.fiber) && food.fiber >= 0) {
    normalized.fiber = food.fiber;
  }

  if (typeof food.sugar === "number" && Number.isFinite(food.sugar) && food.sugar >= 0) {
    normalized.sugar = food.sugar;
  }

  if (typeof food.sodiumMg === "number" && Number.isFinite(food.sodiumMg) && food.sodiumMg >= 0) {
    normalized.sodiumMg = food.sodiumMg;
  }

  if (
    typeof food.servingWeightGrams === "number" &&
    Number.isFinite(food.servingWeightGrams) &&
    food.servingWeightGrams > 0
  ) {
    normalized.servingWeightGrams = food.servingWeightGrams;
  }

  if (typeof food.confidence === "number" && Number.isFinite(food.confidence)) {
    normalized.confidence = food.confidence;
  }

  if (food.trustLevel) {
    normalized.trustLevel = food.trustLevel;
  }

  if (typeof food.sourceDetail === "string" && food.sourceDetail.trim()) {
    normalized.sourceDetail = food.sourceDetail.trim();
  }

  if (typeof food.verifiedSource === "boolean") {
    normalized.verifiedSource = food.verifiedSource;
  }

  if (typeof food.barcode === "string" && food.barcode.trim()) {
    normalized.barcode = food.barcode.trim();
  }

  if (typeof food.brandName === "string" && food.brandName.trim()) {
    normalized.brandName = food.brandName.trim();
  }

  return normalized as FoodLogInput;
};

const sanitizeFoodLogUpdates = (updates: Partial<FoodLogInput>) => {
  const normalized: Record<string, unknown> = {};

  if (updates.name !== undefined) normalized.name = updates.name || "Unknown Food";
  if (updates.calories !== undefined) normalized.calories = Number(updates.calories || 0);
  if (updates.protein !== undefined) normalized.protein = Number(updates.protein || 0);
  if (updates.carbs !== undefined) normalized.carbs = Number(updates.carbs || 0);
  if (updates.fat !== undefined) normalized.fat = Number(updates.fat || 0);
  if (updates.fiber !== undefined) normalized.fiber = Number(updates.fiber || 0);
  if (updates.sugar !== undefined) normalized.sugar = Number(updates.sugar || 0);
  if (updates.sodiumMg !== undefined) normalized.sodiumMg = Number(updates.sodiumMg || 0);
  if (updates.quantity !== undefined) normalized.quantity = updates.quantity ?? 1;
  if (updates.unit !== undefined) normalized.unit = updates.unit || "serving";
  if (updates.servingSize !== undefined) normalized.servingSize = updates.servingSize || "1 serving";
  if (updates.createdAt !== undefined) normalized.createdAt = Number(updates.createdAt || Date.now());
  if (updates.timestamp !== undefined) normalized.timestamp = Number(updates.timestamp || Date.now());
  if (updates.mealType !== undefined) normalized.mealType = updates.mealType || "snack";
  if (updates.source !== undefined) normalized.source = updates.source || "manual";
  if (
    typeof updates.servingWeightGrams === "number" &&
    Number.isFinite(updates.servingWeightGrams) &&
    updates.servingWeightGrams > 0
  ) {
    normalized.servingWeightGrams = updates.servingWeightGrams;
  }
  if (typeof updates.confidence === "number" && Number.isFinite(updates.confidence)) {
    normalized.confidence = updates.confidence;
  }
  if (updates.trustLevel !== undefined) normalized.trustLevel = updates.trustLevel;
  if (updates.sourceDetail !== undefined) normalized.sourceDetail = updates.sourceDetail || "";
  if (updates.verifiedSource !== undefined) normalized.verifiedSource = updates.verifiedSource;
  if (updates.barcode !== undefined) normalized.barcode = updates.barcode || "";
  if (updates.brandName !== undefined) normalized.brandName = updates.brandName || "";

  return normalized;
};

const foodLogsCollection = (uid: string) =>
  collection(db, "users", uid, "foodLogs");

export const subscribeToFoodLogs = (
  uid: string,
  onData: (foods: FoodEntry[]) => void,
  onError: (error: Error) => void
) => {
  const foodLogsQuery = query(
    foodLogsCollection(uid),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    foodLogsQuery,
    (snapshot) => {
      const foods = snapshot.docs.map((snapshotDoc) => {
        const item = snapshotDoc.data() as Omit<FoodEntry, "id">;

        return {
          id: snapshotDoc.id,
          name: item.name || "Unknown Food",
          calories: Number(item.calories || 0),
          protein: Number(item.protein || 0),
          carbs: Number(item.carbs || 0),
          fat: Number(item.fat || 0),
          fiber: typeof item.fiber === "number" ? Number(item.fiber) : undefined,
          sugar: typeof item.sugar === "number" ? Number(item.sugar) : undefined,
          sodiumMg: typeof item.sodiumMg === "number" ? Number(item.sodiumMg) : undefined,
          quantity: item.quantity || 1,
          unit: item.unit || "serving",
          servingSize: item.servingSize || "1 serving",
          servingWeightGrams:
            typeof item.servingWeightGrams === "number" && Number.isFinite(item.servingWeightGrams)
              ? Number(item.servingWeightGrams)
              : undefined,
          mealType: item.mealType || "snack",
          createdAt: Number(item.createdAt || item.timestamp || Date.now()),
          timestamp: Number(item.timestamp || Date.now()),
          source: item.source || "manual",
          confidence: item.confidence ? Number(item.confidence) : undefined,
          trustLevel: item.trustLevel,
          sourceDetail: item.sourceDetail,
          verifiedSource: typeof item.verifiedSource === "boolean" ? item.verifiedSource : undefined,
          barcode: item.barcode,
          brandName: item.brandName,
        };
      });

      onData(foods);
    },
    (error) => {
      onError(error instanceof Error ? error : new Error("Failed to load food logs."));
    }
  );
};

export const addFoodLog = async (uid: string, food: FoodLogInput): Promise<FoodEntry> => {
  const newDoc = doc(foodLogsCollection(uid));
  const sanitizedFood = sanitizeFoodLogInput(food);
  const entry: FoodEntry = {
    id: newDoc.id,
    ...sanitizedFood,
  };

  await setDoc(newDoc, sanitizedFood);

  return entry;
};

export const updateFoodLog = async (
  uid: string,
  entryId: string,
  updates: Partial<FoodLogInput>
) => {
  const foodDoc = doc(db, "users", uid, "foodLogs", entryId);
  await updateDoc(foodDoc, sanitizeFoodLogUpdates(updates));
};

export const deleteFoodLog = async (uid: string, entryId: string) => {
  const foodDoc = doc(db, "users", uid, "foodLogs", entryId);
  await deleteDoc(foodDoc);
};

export const clearFoodLogs = async (uid: string, entryIds: string[]) => {
  const batch = writeBatch(db);

  entryIds.forEach((entryId) => {
    batch.delete(doc(db, "users", uid, "foodLogs", entryId));
  });

  await batch.commit();
};
