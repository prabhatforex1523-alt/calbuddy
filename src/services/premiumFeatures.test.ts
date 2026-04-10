import assert from "node:assert/strict";
import test from "node:test";

import type { UserProfile } from "../types";
import {
  buildFoodEntriesFromPlannedMeal,
  buildWeeklyMealPlan,
} from "./mealPlanning";
import {
  getRestaurantRecommendations,
  restaurantChoiceToFoodResult,
} from "./restaurantMode";
import { buildWeeklyProgressReport } from "./weeklyReport";

const baseProfile: UserProfile = {
  name: "Prabh",
  dailyCalorieGoal: 2100,
  useAutoCalorieGoal: true,
  dailyWaterGoalMl: 2500,
  age: 27,
  heightCm: 175,
  weightGoal: 72,
  currentWeight: 78,
  goalType: "lose",
  weightUnit: "kg",
  macroUnit: "g",
  waterReminderIntervalHours: 3,
  notificationPermission: "default",
  mealRemindersEnabled: false,
  waterRemindersEnabled: false,
  loggingStreak: 4,
  lastFoodLogDate: "2026-04-03",
  planTier: "premium",
  premiumActivatedAt: 1,
  onboardingCompleted: true,
  onboarding: {
    primaryFocus: "fat_loss",
    dietStyle: "veg",
    regionPreference: "mixed",
    budgetStyle: "balanced",
    workoutFrequency: "2-4",
    cookingStyle: "regular",
    eatingOutFrequency: "weekly",
  },
  accountabilityPartner: "Coach",
  wallpaperUrl: "",
  wallpaperOpacity: 1,
  wallpaperBlur: 0,
};

test("buildWeeklyMealPlan creates a 7-day vegetarian plan without non-veg meals", () => {
  const plan = buildWeeklyMealPlan(baseProfile, new Date("2026-04-03T09:00:00"));

  assert.equal(plan.days.length, 7);
  assert.ok(plan.groceryList.length > 0);
  assert.ok(
    plan.days.every((day) =>
      day.meals.every((meal) =>
        meal.items.every(
          (item) =>
            !/chicken|egg|fish|prawn/i.test(item.name)
        )
      )
    )
  );
});

test("buildFoodEntriesFromPlannedMeal preserves meal type and nutrition", () => {
  const plan = buildWeeklyMealPlan(baseProfile, new Date("2026-04-03T09:00:00"));
  const meal = plan.days[0].meals[0];
  const entries = buildFoodEntriesFromPlannedMeal(meal, new Date("2026-04-03T12:00:00").getTime());

  assert.ok(entries.length > 0);
  assert.equal(entries[0]?.mealType, meal.mealType);
  assert.equal(
    Math.round(entries.reduce((sum, entry) => sum + entry.protein, 0)),
    meal.protein
  );
});

test("restaurant mode ranks leaner menu items above richer ones for fat loss", () => {
  const choices = getRestaurantRecommendations(
    "paneer tikka, butter naan, chicken tikka, biryani",
    {
      ...baseProfile,
      onboarding: {
        ...baseProfile.onboarding,
        dietStyle: "nonveg",
      },
    },
    500,
    30
  );

  assert.ok(choices.length > 1);
  assert.equal(choices[0]?.name, "chicken tikka");
  assert.ok(choices[0]?.score >= choices[1]?.score);

  const foodResult = restaurantChoiceToFoodResult(choices[0]!);
  assert.equal(foodResult.source, "manual");
  assert.ok(foodResult.protein > 0);
});

test("weekly report returns accountability summary and share text", () => {
  const report = buildWeeklyProgressReport({
    foodEntries: [
      {
        id: "1",
        name: "Paneer Bhurji",
        calories: 300,
        protein: 24,
        carbs: 10,
        fat: 18,
        timestamp: new Date("2026-04-03T10:00:00").getTime(),
        createdAt: new Date("2026-04-03T10:00:00").getTime(),
        mealType: "lunch",
        source: "manual",
      },
      {
        id: "2",
        name: "Moong Chilla",
        calories: 240,
        protein: 16,
        carbs: 25,
        fat: 7,
        timestamp: new Date("2026-04-02T09:00:00").getTime(),
        createdAt: new Date("2026-04-02T09:00:00").getTime(),
        mealType: "breakfast",
        source: "manual",
      },
    ],
    waterEntries: [
      { id: "w1", amountMl: 2200, timestamp: new Date("2026-04-03T12:00:00").getTime() },
      { id: "w2", amountMl: 1800, timestamp: new Date("2026-04-02T12:00:00").getTime() },
    ],
    activityEntries: [
      {
        id: "a1",
        name: "Walk",
        caloriesBurned: 220,
        durationMinutes: 35,
        intensity: "Medium",
        timestamp: new Date("2026-04-03T18:00:00").getTime(),
      },
    ],
    weightEntries: [
      { id: "wt1", weight: 78, timestamp: new Date("2026-03-28T08:00:00").getTime() },
      { id: "wt2", weight: 77.4, timestamp: new Date("2026-04-03T08:00:00").getTime() },
    ],
    dailyCheckIns: [
      { id: "c1", timestamp: new Date("2026-04-03T08:30:00").getTime(), energy: 4, hunger: 3, mood: 4, note: "solid day" },
      { id: "c2", timestamp: new Date("2026-04-02T08:30:00").getTime(), energy: 3, hunger: 2, mood: 4, note: "" },
    ],
    profile: baseProfile,
    proteinGoal: 120,
    loggingStreak: 4,
  });

  assert.ok(report.accountabilityScore >= 0);
  assert.ok(report.headline.length > 0);
  assert.ok(report.shareText.includes("CALSNAP weekly coach summary"));
});
