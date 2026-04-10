import assert from "node:assert/strict";
import test from "node:test";

import type { FoodEntry, UserProfile, WeightEntry } from "../types";
import { buildAdaptiveCalorieRecommendation } from "./adaptiveTargets";

const baseProfile: UserProfile = {
  name: "Taylor",
  dailyCalorieGoal: 2100,
  useAutoCalorieGoal: true,
  dailyWaterGoalMl: 2500,
  age: 29,
  heightCm: 172,
  weightGoal: 70,
  currentWeight: 77,
  goalType: "lose",
  weightUnit: "kg",
  macroUnit: "g",
  waterReminderIntervalHours: 3,
  notificationPermission: "default",
  mealRemindersEnabled: false,
  waterRemindersEnabled: false,
  loggingStreak: 4,
  lastFoodLogDate: "2026-04-04",
  planTier: "premium",
  premiumActivatedAt: 1,
  onboardingCompleted: true,
  onboarding: {
    primaryFocus: "fat_loss",
    dietStyle: "eggs",
    regionPreference: "mixed",
    budgetStyle: "balanced",
    workoutFrequency: "2-4",
    cookingStyle: "regular",
    eatingOutFrequency: "weekly",
  },
  accountabilityPartner: "",
  wallpaperUrl: "",
  wallpaperOpacity: 1,
  wallpaperBlur: 0,
};

const buildFoodEntries = (caloriesPerDay: number[], startDate: string): FoodEntry[] =>
  caloriesPerDay.map((calories, index) => ({
    id: `food-${index}`,
    name: "Tracked Meal",
    calories,
    protein: 40,
    carbs: 60,
    fat: 20,
    quantity: 1,
    unit: "serving",
    timestamp: new Date(`${startDate}T12:00:00`).getTime() - index * 24 * 60 * 60 * 1000,
    createdAt: new Date(`${startDate}T12:00:00`).getTime() - index * 24 * 60 * 60 * 1000,
    mealType: "lunch",
    source: "manual",
  }));

test("adaptive coaching lowers calories when fat loss stalls despite good adherence", () => {
  const weightEntries: WeightEntry[] = [
    { id: "w1", weight: 77.2, timestamp: new Date("2026-03-24T08:00:00").getTime() },
    { id: "w2", weight: 77.1, timestamp: new Date("2026-04-03T08:00:00").getTime() },
  ];

  const recommendation = buildAdaptiveCalorieRecommendation({
    foodEntries: buildFoodEntries([2050, 2120, 2080, 2105, 2060], "2026-04-04"),
    profile: baseProfile,
    proteinGoal: 125,
    weightEntries,
  });

  assert.equal(recommendation.direction, "lower");
  assert.ok(recommendation.recommendedDailyCalories < baseProfile.dailyCalorieGoal);
  assert.ok(recommendation.trackedDays >= 4);
});

test("adaptive coaching holds when there is not enough tracking signal", () => {
  const recommendation = buildAdaptiveCalorieRecommendation({
    foodEntries: buildFoodEntries([2300, 1900], "2026-04-04"),
    profile: baseProfile,
    proteinGoal: 125,
    weightEntries: [],
  });

  assert.equal(recommendation.direction, "hold");
  assert.equal(recommendation.recommendedDailyCalories, baseProfile.dailyCalorieGoal);
});
