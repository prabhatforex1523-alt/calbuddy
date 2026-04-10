import type { Achievement, HealthData } from "../types";

const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first-meal", title: "First Meal Logged", description: "Log your first meal.", icon: "Utensils" },
  { id: "streak-3", title: "3 Day Streak", description: "Log food for 3 days in a row.", icon: "Flame" },
  { id: "streak-7", title: "7 Day Streak", description: "Log food for 7 days in a row.", icon: "Sparkles" },
  { id: "calorie-goal", title: "Calorie Goal Hit", description: "Reach your daily calorie goal.", icon: "TrendingUp" },
  { id: "protein-goal", title: "Protein Goal Hit", description: "Hit your protein goal for the day.", icon: "Dumbbell" },
  { id: "water-goal", title: "Water Goal Completed", description: "Reach your daily water target.", icon: "Droplets" },
];

export const evaluateAchievements = (input: {
  data: HealthData;
  loggingStreak: number;
  consumed: number;
  protein: number;
  water: number;
  proteinGoal: number;
}): { achievements: Achievement[]; newlyUnlocked: Achievement[] } => {
  const existing = input.data.achievements || [];
  const existingMap = new Map(existing.map((item) => [item.id, item]));
  const now = Date.now();

  const unlockedIds = new Set<string>();

  if (input.data.foodEntries.length > 0) unlockedIds.add("first-meal");
  if (input.loggingStreak >= 3) unlockedIds.add("streak-3");
  if (input.loggingStreak >= 7) unlockedIds.add("streak-7");
  if (input.consumed >= input.data.profile.dailyCalorieGoal) unlockedIds.add("calorie-goal");
  if (input.protein >= input.proteinGoal) unlockedIds.add("protein-goal");
  if (input.water >= input.data.profile.dailyWaterGoalMl) unlockedIds.add("water-goal");

  const achievements = ACHIEVEMENT_DEFS.map((def) => {
    const current = existingMap.get(def.id);
    const unlocked = unlockedIds.has(def.id);

    return {
      ...def,
      unlocked,
      unlockedAt:
        unlocked && !current?.unlockedAt
          ? now
          : current?.unlockedAt,
    } satisfies Achievement;
  });

  const newlyUnlocked = achievements.filter(
    (item) => item.unlocked && !existingMap.get(item.id)?.unlocked
  );

  return { achievements, newlyUnlocked };
};
