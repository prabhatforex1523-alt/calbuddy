import type { FoodSearchResult, RestaurantChoice, UserProfile } from "../types";
import { enrichFoodMetadata } from "./nutritionTrust";

const splitMenuItems = (menuText: string) =>
  Array.from(
    new Set(
      menuText
        .split(/\r?\n|,|;|\|/)
        .map((item) => item.trim())
        .filter((item) => item.length > 1)
    )
  ).slice(0, 12);

const estimateMenuItem = (name: string) => {
  const lower = name.toLowerCase();
  let calories = 320;
  let protein = 12;
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (/grilled|tandoori|tikka|roasted/.test(lower)) {
    calories -= 40;
    protein += 8;
    reasons.push("grilled-style prep is usually easier to fit");
  }

  if (/chicken|fish|prawn/.test(lower)) {
    calories += 90;
    protein += 18;
    reasons.push("leans higher in protein");
  }

  if (/egg/.test(lower)) {
    calories += 70;
    protein += 10;
    reasons.push("adds a useful protein bump");
  }

  if (/paneer/.test(lower)) {
    calories += 120;
    protein += 12;
    reasons.push("vegetarian protein option");
  }

  if (/dal|rajma|chole|sambar/.test(lower)) {
    calories += 40;
    protein += 8;
    reasons.push("legume-based choice with better satiety");
  }

  if (/salad|soup/.test(lower)) {
    calories -= 120;
    reasons.push("lighter base");
  }

  if (/rice|biryani|pulao|noodle/.test(lower)) {
    calories += 180;
  }

  if (/naan|paratha|kulcha|pizza|burger|fries/.test(lower)) {
    calories += 220;
    cautions.push("extra refined carbs can raise calories fast");
  }

  if (/fried|crispy|pakora|manchurian|loaded/.test(lower)) {
    calories += 200;
    cautions.push("fried prep is harder to keep on target");
  }

  if (/butter|makhani|creamy|cream|cheese|alfredo/.test(lower)) {
    calories += 180;
    cautions.push("rich sauces can hide a lot of calories");
  }

  if (/dessert|cake|ice cream|brownie|shake/.test(lower)) {
    calories += 260;
    protein -= 4;
    cautions.push("mostly a treat choice, not a recovery meal");
  }

  calories = Math.max(90, calories);
  protein = Math.max(2, protein);

  return {
    calories,
    protein,
    reason:
      reasons[0] ||
      "reasonable restaurant fallback when you want something predictable",
    caution: cautions[0],
  };
};

const scoreRestaurantChoice = (
  choice: Pick<RestaurantChoice, "calories" | "protein">,
  profile: UserProfile,
  calorieGap: number,
  proteinGap: number
) => {
  const proteinDensity = choice.protein / Math.max(1, choice.calories);
  let score = 55 + proteinDensity * 120;

  if (profile.goalType === "lose") {
    score -= Math.max(0, choice.calories - Math.max(320, calorieGap)) / 6;
    score += choice.protein >= 20 ? 8 : 0;
  } else if (profile.goalType === "gain") {
    score += Math.min(18, choice.calories / 35);
    score += Math.min(12, choice.protein);
  } else {
    score -= Math.abs(choice.calories - Math.max(300, calorieGap || 420)) / 10;
    score += Math.min(10, choice.protein / 2);
  }

  if (proteinGap > 20) {
    score += Math.min(15, choice.protein);
  }

  return Math.round(score);
};

export const getRestaurantRecommendations = (
  menuText: string,
  profile: UserProfile,
  calorieGap: number,
  proteinGap: number
): RestaurantChoice[] =>
  splitMenuItems(menuText)
    .map((name, index) => {
      const estimate = estimateMenuItem(name);
      const score = scoreRestaurantChoice(
        { calories: estimate.calories, protein: estimate.protein },
        profile,
        calorieGap,
        proteinGap
      );

      return {
        id: `restaurant-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        calories: estimate.calories,
        protein: estimate.protein,
        score,
        reason: estimate.reason,
        caution: estimate.caution,
        fit: score >= 74 ? "best" : score >= 60 ? "good" : "limit",
      } satisfies RestaurantChoice;
    })
    .sort((a, b) => b.score - a.score || b.protein - a.protein || a.calories - b.calories)
    .slice(0, 4);

export const restaurantChoiceToFoodResult = (choice: RestaurantChoice): FoodSearchResult =>
  enrichFoodMetadata({
    id: choice.id,
    name: choice.name,
    servingSize: "1 restaurant serving",
    baseUnit: "serving",
    calories: choice.calories,
    protein: choice.protein,
    carbs: Math.max(8, Math.round(choice.calories / 12)),
    fat: Math.max(4, Math.round(choice.calories / 28)),
    source: "manual",
    confidence: 0.58,
    trustLevel: "estimate",
    sourceDetail: "Restaurant mode estimate",
    verifiedSource: false,
  });
