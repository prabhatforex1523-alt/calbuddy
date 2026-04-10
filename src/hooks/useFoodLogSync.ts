import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { subscribeToFoodLogs, updateFoodLog } from '../services/foodLogs';
import { lookupFoodData } from '../services/foodData';
import { FOOD_REPAIR_VERSION } from '../services/appData';
import { reportError, trackEvent } from '../services/telemetry';
import type { FoodEntry, HealthData } from '../types';

type ToastType = 'success' | 'error';

type UseFoodLogSyncOptions = {
  foodEntries: FoodEntry[];
  roundNutrition: (value: number) => number;
  setData: Dispatch<SetStateAction<HealthData>>;
  showToast: (message: string, type?: ToastType) => void;
  userId: string | undefined;
};

export const useFoodLogSync = ({
  foodEntries,
  roundNutrition,
  setData,
  showToast,
  userId,
}: UseFoodLogSyncOptions) => {
  const [foodLogError, setFoodLogError] = useState<string | null>(null);
  const repairingFoodEntriesRef = useRef(false);
  const processedFoodRepairIdsRef = useRef(new Set<string>());
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (!userId) {
      setFoodLogError(null);
      setData((prev) => ({ ...prev, foodEntries: [] }));
      processedFoodRepairIdsRef.current.clear();
      return;
    }

    const unsubscribe = subscribeToFoodLogs(
      userId,
      (nextFoodEntries) => {
        setFoodLogError(null);
        setData((prev) => ({ ...prev, foodEntries: nextFoodEntries }));
      },
      (error) => {
        reportError(error, { scope: 'food_log_subscribe', userId });
        setFoodLogError('Could not load your food log from Firestore. Your local data is still available.');
      }
    );

    return () => unsubscribe();
  }, [setData, userId]);

  useEffect(() => {
    if (!userId || repairingFoodEntriesRef.current || foodEntries.length === 0) {
      return;
    }

    const repairVersionKey = `calsnap_food_repair_version_${userId}`;
    if (window.localStorage.getItem(repairVersionKey) !== FOOD_REPAIR_VERSION) {
      processedFoodRepairIdsRef.current.clear();
      window.localStorage.setItem(repairVersionKey, FOOD_REPAIR_VERSION);
    }

    const candidates = foodEntries.filter(
      (entry) =>
        (entry.source === 'local' || entry.source === 'usda') &&
        !processedFoodRepairIdsRef.current.has(entry.id)
    );

    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;
    repairingFoodEntriesRef.current = true;

    const repairEntries = async () => {
      const updates: Array<{ id: string; payload: Partial<FoodEntry> }> = [];

      for (const entry of candidates) {
        processedFoodRepairIdsRef.current.add(entry.id);

        const refreshed = await lookupFoodData(
          entry.name,
          entry.quantity || 1,
          entry.unit || 'serving'
        );

        if (!refreshed || cancelled) {
          continue;
        }

        const payload: Partial<FoodEntry> = {
          calories: roundNutrition(refreshed.calories),
          protein: roundNutrition(refreshed.protein),
          carbs: roundNutrition(refreshed.carbs),
          fat: roundNutrition(refreshed.fat),
          fiber: typeof refreshed.fiber === 'number' ? roundNutrition(refreshed.fiber) : undefined,
          sugar: typeof refreshed.sugar === 'number' ? roundNutrition(refreshed.sugar) : undefined,
          sodiumMg: typeof refreshed.sodiumMg === 'number' ? roundNutrition(refreshed.sodiumMg) : undefined,
          servingSize: refreshed.servingSize || entry.servingSize || '1 serving',
          servingWeightGrams: refreshed.servingWeightGrams,
          source: refreshed.source || entry.source,
          confidence: refreshed.confidence,
          trustLevel: refreshed.trustLevel,
          sourceDetail: refreshed.sourceDetail,
          verifiedSource: refreshed.verifiedSource,
          barcode: refreshed.barcode,
          brandName: refreshed.brandName,
        };

        const changed =
          Math.abs((entry.calories || 0) - (payload.calories || 0)) > 0.5 ||
          Math.abs((entry.protein || 0) - (payload.protein || 0)) > 0.2 ||
          Math.abs((entry.carbs || 0) - (payload.carbs || 0)) > 0.2 ||
          Math.abs((entry.fat || 0) - (payload.fat || 0)) > 0.2 ||
          Math.abs((entry.fiber || 0) - (payload.fiber || 0)) > 0.2 ||
          Math.abs((entry.sugar || 0) - (payload.sugar || 0)) > 0.2 ||
          Math.abs((entry.sodiumMg || 0) - (payload.sodiumMg || 0)) > 1 ||
          (entry.servingSize || '1 serving') !== payload.servingSize ||
          (entry.source || 'manual') !== payload.source ||
          (entry.servingWeightGrams ?? null) !== (payload.servingWeightGrams ?? null) ||
          (entry.trustLevel ?? null) !== (payload.trustLevel ?? null) ||
          (entry.sourceDetail ?? null) !== (payload.sourceDetail ?? null) ||
          (entry.verifiedSource ?? null) !== (payload.verifiedSource ?? null) ||
          (entry.barcode ?? null) !== (payload.barcode ?? null) ||
          (entry.brandName ?? null) !== (payload.brandName ?? null);

        if (!changed) {
          continue;
        }

        await updateFoodLog(userId, entry.id, payload);
        updates.push({ id: entry.id, payload });
      }

      if (cancelled || updates.length === 0) {
        return;
      }

      setData((prev) => ({
        ...prev,
        foodEntries: prev.foodEntries.map((item) => {
          const match = updates.find((update) => update.id === item.id);
          return match ? { ...item, ...match.payload } : item;
        }),
      }));

      trackEvent('food_log_repaired', {
        repairedCount: updates.length,
        userId,
      });
      showToastRef.current('Food log nutrition was refreshed with corrected data.');
    };

    void repairEntries()
      .catch((error) => {
        reportError(error, { scope: 'food_log_repair', userId, candidateCount: candidates.length });
      })
      .finally(() => {
        repairingFoodEntriesRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [foodEntries, roundNutrition, setData, userId]);

  return {
    foodLogError,
  };
};
