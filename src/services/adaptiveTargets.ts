import { subDays } from "date-fns";

import type {
  AdaptiveCalorieRecommendation,
  FoodEntry,
  UserProfile,
  WeightEntry,
} from "../types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round1 = (value: number) => Math.round(value * 10) / 10;

const getWeightKg = (profile: Pick<UserProfile, "currentWeight" | "weightUnit">) =>
  profile.weightUnit === "kg" ? profile.currentWeight : profile.currentWeight / 2.20462;

const buildWeightTrend = (
  weightEntries: WeightEntry[],
  weightUnit: UserProfile["weightUnit"],
  referenceTimestamp: number
) => {
  const cutoff = subDays(new Date(referenceTimestamp), 21).getTime();
  const recent = [...weightEntries]
    .filter((entry) => entry.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 2) {
    return null;
  }

  const first = recent[0];
  const last = recent[recent.length - 1];
  const daySpan = Math.max(1, (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));
  const deltaKg =
    weightUnit === "kg"
      ? last.weight - first.weight
      : (last.weight - first.weight) / 2.20462;

  return round1((deltaKg / daySpan) * 7);
};

export const buildAdaptiveCalorieRecommendation = (input: {
  foodEntries: FoodEntry[];
  profile: UserProfile;
  proteinGoal: number;
  weightEntries: WeightEntry[];
}): AdaptiveCalorieRecommendation => {
  const latestTimestamps = [
    ...input.foodEntries.map((entry) => entry.timestamp),
    ...input.weightEntries.map((entry) => entry.timestamp),
  ];
  const latestLoggedTimestamp =
    latestTimestamps.length > 0 ? Math.max(...latestTimestamps) : new Date().setHours(0, 0, 0, 0);
  const cutoff = subDays(new Date(latestLoggedTimestamp), 7).getTime();
  const recentFoods = input.foodEntries.filter((entry) => entry.timestamp >= cutoff);
  const dailyCalories = new Map<string, number>();

  for (const entry of recentFoods) {
    const key = new Date(entry.timestamp).toISOString().slice(0, 10);
    dailyCalories.set(key, (dailyCalories.get(key) || 0) + entry.calories);
  }

  const trackedDays = dailyCalories.size;
  const averageTrackedCalories =
    trackedDays > 0
      ? Math.round(Array.from(dailyCalories.values()).reduce((sum, value) => sum + value, 0) / trackedDays)
      : 0;

  const adherenceScore =
    trackedDays === 0
      ? 0
      : Math.round(
          Array.from(dailyCalories.values()).reduce((score, value) => {
            const deviation = Math.abs(value - input.profile.dailyCalorieGoal);
            const closeness = clamp(100 - (deviation / Math.max(1, input.profile.dailyCalorieGoal)) * 100, 0, 100);
            return score + closeness;
          }, 0) / trackedDays
        );

  const weightTrendPerWeekKg = buildWeightTrend(
    input.weightEntries,
    input.profile.weightUnit,
    latestLoggedTimestamp
  );
  const generatedAt = latestLoggedTimestamp;
  const currentDailyCalories = input.profile.dailyCalorieGoal;
  const recommendedProteinGoal = Math.max(
    input.proteinGoal,
    Math.round(
      clamp(
        getWeightKg(input.profile) * (input.profile.goalType === "gain" ? 1.8 : 1.6),
        90,
        190
      )
    )
  );

  let recommendedDailyCalories = currentDailyCalories;
  let direction: AdaptiveCalorieRecommendation["direction"] = "hold";
  let headline = "Keep current targets";
  let rationale = "The app needs a little more stable signal before changing calories.";
  let nextStep = "Track at least 4 days this week so the next check-in can adjust with confidence.";

  if (trackedDays >= 4) {
    if (input.profile.goalType === "lose") {
      if (weightTrendPerWeekKg !== null && weightTrendPerWeekKg > -0.15 && adherenceScore >= 70) {
        recommendedDailyCalories = clamp(currentDailyCalories - 120, 1200, 4200);
        direction = "lower";
        headline = "Tighten calories slightly";
        rationale = "You logged enough days, stayed fairly close to target, and weight loss is slower than expected.";
        nextStep = "Trim about 120 kcal, keep protein high, and review again after a full week.";
      } else if (weightTrendPerWeekKg !== null && weightTrendPerWeekKg < -0.75 && adherenceScore >= 70) {
        recommendedDailyCalories = clamp(currentDailyCalories + 100, 1200, 4200);
        direction = "raise";
        headline = "Ease the deficit a touch";
        rationale = "Weight is dropping quickly enough that recovery and compliance may be easier with a slightly higher target.";
        nextStep = "Add a small protein-forward snack or slightly larger dinner and re-check next week.";
      } else {
        headline = "Fat-loss pace looks stable";
        rationale = "Your recent intake and weight trend do not justify a calorie change right now.";
        nextStep = "Hold steady and keep getting complete logging days.";
      }
    } else if (input.profile.goalType === "gain") {
      if (weightTrendPerWeekKg !== null && weightTrendPerWeekKg < 0.1 && adherenceScore >= 65) {
        recommendedDailyCalories = clamp(currentDailyCalories + 140, 1200, 4200);
        direction = "raise";
        headline = "Push the surplus slightly";
        rationale = "You are logging well, but body weight is not climbing enough for a gain phase.";
        nextStep = "Add roughly 140 kcal through protein-plus-carb foods and reassess next week.";
      } else if (weightTrendPerWeekKg !== null && weightTrendPerWeekKg > 0.5 && adherenceScore >= 65) {
        recommendedDailyCalories = clamp(currentDailyCalories - 100, 1200, 4200);
        direction = "lower";
        headline = "Slow the gain slightly";
        rationale = "Weight is rising faster than needed, so a small calorie trim should keep the gain cleaner.";
        nextStep = "Reduce one dense snack or slightly trim portions and re-check after 7 days.";
      } else {
        headline = "Surplus looks usable";
        rationale = "Your current gain target is close enough to hold for another week.";
        nextStep = "Keep logging, especially on training days, so the next check-in stays specific.";
      }
    } else {
      if (weightTrendPerWeekKg !== null && weightTrendPerWeekKg > 0.35 && adherenceScore >= 70) {
        recommendedDailyCalories = clamp(currentDailyCalories - 100, 1200, 4200);
        direction = "lower";
        headline = "Nudge maintenance a bit lower";
        rationale = "Weight is drifting upward even though logging is reasonably consistent.";
        nextStep = "Reduce calories slightly and keep movement steady for the next week.";
      } else if (weightTrendPerWeekKg !== null && weightTrendPerWeekKg < -0.35 && adherenceScore >= 70) {
        recommendedDailyCalories = clamp(currentDailyCalories + 100, 1200, 4200);
        direction = "raise";
        headline = "Nudge maintenance a bit higher";
        rationale = "Weight is drifting down while adherence is strong, so a small bump should help stabilize.";
        nextStep = "Add a small balanced snack and reassess at the next check-in.";
      } else {
        headline = "Maintenance looks stable";
        rationale = "Recent intake and weight trend are close enough to maintenance to hold your target.";
        nextStep = "Stay consistent and re-check after another week of logs.";
      }
    }
  }

  return {
    recommendedDailyCalories,
    recommendedProteinGoal,
    currentDailyCalories,
    averageTrackedCalories,
    trackedDays,
    adherenceScore,
    weightTrendPerWeekKg,
    direction,
    headline,
    rationale,
    nextStep,
    generatedAt,
  };
};
