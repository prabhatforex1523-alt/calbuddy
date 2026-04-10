import { isSameDay, startOfDay, subDays } from "date-fns";

import type {
  ActivityEntry,
  DailyCheckIn,
  FoodEntry,
  UserProfile,
  WaterEntry,
  WeeklyProgressReport,
  WeightEntry,
} from "../types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const buildWeeklyProgressReport = (input: {
  foodEntries: FoodEntry[];
  waterEntries: WaterEntry[];
  activityEntries: ActivityEntry[];
  weightEntries: WeightEntry[];
  dailyCheckIns: DailyCheckIn[];
  profile: UserProfile;
  proteinGoal: number;
  loggingStreak: number;
}): WeeklyProgressReport => {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => subDays(today, index));

  const daySummaries = days.map((date) => {
    const food = input.foodEntries.filter((entry) => isSameDay(new Date(entry.timestamp), date));
    const water = input.waterEntries.filter((entry) => isSameDay(new Date(entry.timestamp), date));
    const activity = input.activityEntries.filter((entry) => isSameDay(new Date(entry.timestamp), date));
    const checkIn = input.dailyCheckIns.find((entry) => isSameDay(new Date(entry.timestamp), date));

    return {
      logged: food.length > 0,
      calories: food.reduce((sum, entry) => sum + entry.calories, 0),
      protein: food.reduce((sum, entry) => sum + entry.protein, 0),
      water: water.reduce((sum, entry) => sum + Math.max(0, entry.amountMl), 0),
      workouts: activity.length,
      checkIn,
    };
  });

  const trackedDays = daySummaries.filter((day) => day.logged).length;
  const goalHitDays = daySummaries.filter(
    (day) =>
      day.logged &&
      day.calories >= input.profile.dailyCalorieGoal * 0.85 &&
      day.calories <= input.profile.dailyCalorieGoal * 1.1
  ).length;
  const checkInDays = daySummaries.filter((day) => day.checkIn).length;
  const avgProtein = Math.round(
    daySummaries.reduce((sum, day) => sum + day.protein, 0) / daySummaries.length
  );
  const avgWater = Math.round(
    daySummaries.reduce((sum, day) => sum + day.water, 0) / daySummaries.length
  );
  const workoutCount = daySummaries.reduce((sum, day) => sum + day.workouts, 0);

  const recentWeights = [...input.weightEntries]
    .filter((entry) => entry.timestamp >= subDays(today, 14).getTime())
    .sort((a, b) => a.timestamp - b.timestamp);

  const firstWeight = recentWeights[0]?.weight;
  const lastWeight = recentWeights[recentWeights.length - 1]?.weight;
  const weightDelta =
    typeof firstWeight === "number" && typeof lastWeight === "number"
      ? Math.round((lastWeight - firstWeight) * 10) / 10
      : null;

  const goalHitRate = Math.round((goalHitDays / Math.max(1, trackedDays)) * 100);
  const waterAdherence = Math.round((avgWater / Math.max(1, input.profile.dailyWaterGoalMl)) * 100);
  const accountabilityScore = clamp(
    Math.round(
      (trackedDays / 7) * 40 +
        (goalHitRate / 100) * 25 +
        (checkInDays / 7) * 20 +
        clamp(waterAdherence, 0, 100) * 0.15
    ),
    0,
    100
  );

  const headline =
    accountabilityScore >= 80
      ? "High-accountability week"
      : accountabilityScore >= 60
        ? "Momentum is building"
        : "Consistency needs tightening";

  const summaryParts = [
    `${trackedDays}/7 days were fully tracked`,
    `protein averaged ${avgProtein}g`,
    `${checkInDays}/7 check-ins were completed`,
  ];

  if (weightDelta !== null) {
    summaryParts.push(
      `weight moved ${weightDelta === 0 ? "flat" : weightDelta > 0 ? `up ${weightDelta}` : `down ${Math.abs(weightDelta)}`}${input.profile.weightUnit}`
    );
  }

  const wins = [
    trackedDays >= 5
      ? `You logged enough days to actually coach from the data instead of guessing.`
      : `The streak still has life. A few more fully tracked days will make the data much more usable.`,
    avgProtein >= input.proteinGoal * 0.8
      ? `Average protein stayed near target, which supports satiety and recovery.`
      : `Protein is still recoverable if you lock in one repeat high-protein meal each day.`,
    workoutCount > 0
      ? `${workoutCount} workout log${workoutCount === 1 ? "" : "s"} gave the calorie balance much better context.`
      : `This week was mostly food-only data, so adding even one workout log would sharpen the coaching.`,
  ];

  const watchouts = [
    avgProtein < input.proteinGoal * 0.75
      ? `Protein averaged ${avgProtein}g against a ${input.proteinGoal}g target, so the next meal needs to carry more of the load.`
      : `Protein is no longer the main gap. Keep it steady instead of chasing perfect days.`,
    avgWater < input.profile.dailyWaterGoalMl * 0.75
      ? `Hydration ran below target on average, which usually makes hunger and energy feel noisier.`
      : `Water stayed reasonably close to target, so hydration is not the first bottleneck right now.`,
    input.profile.onboarding.eatingOutFrequency === "frequent" && goalHitRate < 50
      ? `Eating-out frequency is probably where calories are escaping, so restaurant decisions need tighter defaults.`
      : `Your biggest risk now is missed logging days, not one-off bad meals.`,
  ];

  const nextMoves = [
    input.profile.onboarding.dietStyle === "veg"
      ? `Anchor one repeat vegetarian protein meal each day, like paneer bhurji, curd, or dal plus roti.`
      : input.profile.onboarding.dietStyle === "eggs"
        ? `Use eggs or curd as your fallback protein move whenever the day is running behind.`
        : `Keep one repeat chicken or egg meal ready for busy workdays so protein does not collapse.`,
    input.profile.onboarding.eatingOutFrequency !== "rare"
      ? `Use restaurant mode before ordering and pick the highest-protein option that still fits the day.`
      : `Stick with the repeat meal plan on busy days instead of improvising with random snacks.`,
    checkInDays < 5
      ? `Complete a short daily check-in for the next week so the report can separate hunger, stress, and true calorie issues.`
      : `Keep the check-in habit running so weekly reports stay specific instead of generic.`,
  ];

  const shareText = [
    "CALSNAP weekly coach summary",
    `Headline: ${headline}`,
    `Tracked days: ${trackedDays}/7`,
    `Goal-hit rate: ${goalHitRate}%`,
    `Average protein: ${avgProtein}g`,
    `Average water: ${avgWater} ml`,
    `Accountability score: ${accountabilityScore}/100`,
    `Logging streak: ${input.loggingStreak} day${input.loggingStreak === 1 ? "" : "s"}`,
    `Next move: ${nextMoves[0]}`,
  ].join("\n");

  return {
    headline,
    summary: `${summaryParts.join(", ")}.`,
    wins,
    watchouts,
    nextMoves,
    accountabilityScore,
    shareText,
  };
};
