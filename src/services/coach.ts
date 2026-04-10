import type { UserProfile } from "../types";
import { getSuggestedMealType, suggestMealsForCoach } from "./mealPlanning";

export type DailyCoachStats = {
  consumed: number;
  burned: number;
  water: number;
  protein: number;
  carbs: number;
  fat: number;
  dayFoodCount: number;
  dayActivityCount: number;
  lastWaterLoggedAt?: number;
};

export type CoachInsight = {
  id: string;
  title: string;
  description: string;
};

export const generateCoachInsights = (input: {
  stats: DailyCoachStats;
  profile: UserProfile;
  loggingStreak: number;
  proteinGoal: number;
}): CoachInsight[] => {
  const { stats, profile, loggingStreak, proteinGoal } = input;
  const calorieGap = profile.dailyCalorieGoal - stats.consumed;
  const netCalories = Math.round(stats.consumed - stats.burned);
  const proteinGap = Math.max(0, proteinGoal - stats.protein);
  const insights: CoachInsight[] = [];

  if (stats.dayFoodCount === 0) {
    insights.push({
      id: "first-meal",
      title: "No meals logged yet",
      description:
        "Tap the add button to log your first meal and unlock a more honest calorie, protein, and accountability picture for today.",
    });
  }

  if (calorieGap > 0) {
    insights.push({
      id: "calories-below-goal",
      title: `${Math.round(calorieGap)} kcal below goal`,
      description: `You still have room in today's target. Net intake is ${netCalories} kcal after activity, so one clean meal still fits.`,
    });
  } else if (calorieGap < 0) {
    insights.push({
      id: "calories-above-goal",
      title: `${Math.abs(Math.round(calorieGap))} kcal above goal`,
      description:
        "You are over today's target. Keep the next meal lighter, lead with water, and avoid stacking another rich restaurant-style dish.",
    });
  }

  if (stats.protein < proteinGoal) {
    const [suggestedMeal] = suggestMealsForCoach(
      profile,
      {
        calorieGap: Math.max(220, calorieGap),
        proteinGap,
        preferredMealType: getSuggestedMealType(),
      },
      1
    );

    insights.push({
      id: "protein-low",
      title: "Protein intake is low",
      description: suggestedMeal
        ? `You are at ${Math.round(stats.protein)}g so far. ${suggestedMeal.title} would add about ${suggestedMeal.protein}g protein for roughly ${suggestedMeal.calories} kcal.`
        : `You are at ${Math.round(stats.protein)}g so far. Try to reach around ${proteinGoal}g today.`,
    });
  }

  if (stats.water < profile.dailyWaterGoalMl * 0.7) {
    insights.push({
      id: "water-low",
      title: "Hydration is behind",
      description:
        "Drink more water over the next few hours to stay on pace for your daily goal and reduce noisy hunger signals.",
    });
  }

  if (stats.dayActivityCount === 0 && profile.onboarding.workoutFrequency !== "0-1") {
    insights.push({
      id: "movement-gap",
      title: "No movement logged yet",
      description:
        "Your onboarding says training matters for your goal. Even one walk or workout log will make the coaching more honest.",
    });
  }

  if (profile.onboarding.eatingOutFrequency !== "rare") {
    insights.push({
      id: "restaurant-tip",
      title: "Protect the eating-out moments",
      description:
        "When a restaurant meal is coming, bias toward grilled, egg, dal, or paneer options first and add bread or rice only if calories still allow it.",
    });
  }

  if (loggingStreak > 0) {
    insights.push({
      id: "streak",
      title: `${loggingStreak} day logging streak`,
      description:
        "Consistency is building momentum. Keep logging every meal to hold the streak and give the weekly report enough signal.",
    });
  }

  return insights.slice(0, 4);
};
