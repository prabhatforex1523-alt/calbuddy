import { addDays, format } from "date-fns";

import type {
  FoodEntry,
  GroceryListItem,
  MealPlanDay,
  MealType,
  PlannedFoodItem,
  PlannedMeal,
  UserProfile,
  WeeklyMealPlan,
} from "../types";

type MealBlueprint = {
  id: string;
  mealType: MealType;
  title: string;
  whyItWorks: string;
  dietStyles: Array<UserProfile["onboarding"]["dietStyle"]>;
  regions: Array<UserProfile["onboarding"]["regionPreference"]>;
  budgetStyles: Array<UserProfile["onboarding"]["budgetStyle"]>;
  cookingStyles: Array<UserProfile["onboarding"]["cookingStyle"]>;
  items: PlannedFoodItem[];
};

const mealTotal = (items: PlannedFoodItem[]) =>
  items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein,
    }),
    { calories: 0, protein: 0 }
  );

const createPlannedMeal = (blueprint: MealBlueprint, seed: string): PlannedMeal => {
  const totals = mealTotal(blueprint.items);

  return {
    id: `${blueprint.id}-${seed}`,
    mealType: blueprint.mealType,
    title: blueprint.title,
    whyItWorks: blueprint.whyItWorks,
    items: blueprint.items.map((item) => ({ ...item })),
    calories: totals.calories,
    protein: totals.protein,
  };
};

const scoreBlueprintForProfile = (blueprint: MealBlueprint, profile: UserProfile) => {
  let score = 0;

  if (blueprint.dietStyles.includes(profile.onboarding.dietStyle)) {
    score += 5;
  }

  if (
    profile.onboarding.regionPreference === "mixed" ||
    blueprint.regions.includes(profile.onboarding.regionPreference) ||
    blueprint.regions.includes("mixed")
  ) {
    score += 2;
  }

  if (blueprint.budgetStyles.includes(profile.onboarding.budgetStyle)) {
    score += 2;
  }

  if (blueprint.cookingStyles.includes(profile.onboarding.cookingStyle)) {
    score += 2;
  }

  const totals = mealTotal(blueprint.items);
  const proteinDensity = totals.calories > 0 ? totals.protein / totals.calories : 0;

  if (profile.goalType === "lose") {
    score += proteinDensity * 100;
    if (totals.calories <= 520) {
      score += 3;
    }
  } else if (profile.goalType === "gain") {
    score += totals.calories / 80;
    if (totals.protein >= 28) {
      score += 3;
    }
  } else {
    score += totals.protein / 6;
  }

  return score;
};

const focusMessages: Record<UserProfile["goalType"], string[]> = {
  lose: [
    "Protein first with lighter calories",
    "Balanced carbs to stay full longer",
    "High-volume meals for easier compliance",
    "Simple repeat meals to reduce decision fatigue",
  ],
  maintain: [
    "Stable energy across the day",
    "Consistent protein and hydration",
    "Repeatable meals you can actually sustain",
    "Enough flexibility for work and weekends",
  ],
  gain: [
    "More calories without random snacking",
    "High-protein meals to support training",
    "Easy surplus days with less cooking friction",
    "Recovery-focused meals after workouts",
  ],
};

const MEAL_LIBRARY: MealBlueprint[] = [
  {
    id: "moong-chilla-curd",
    mealType: "breakfast",
    title: "Moong Chilla + Curd Plate",
    whyItWorks: "Easy Indian breakfast with strong protein and enough volume to keep hunger down.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular", "batch"],
    items: [
      { name: "Moong Chilla", quantity: 2, unit: "pieces", servingSize: "2 pieces", calories: 220, protein: 14, carbs: 26, fat: 6, source: "manual" },
      { name: "Curd", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 110, protein: 9, carbs: 7, fat: 5, source: "manual" },
    ],
  },
  {
    id: "idli-sambar-curd",
    mealType: "breakfast",
    title: "Idli Sambar Protein Start",
    whyItWorks: "Comfortable South-style breakfast that stays moderate in calories and digestion-friendly.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["south", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Idli", quantity: 3, unit: "pieces", servingSize: "3 idli", calories: 180, protein: 6, carbs: 36, fat: 1, source: "manual" },
      { name: "Sambar", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 120, protein: 5, carbs: 14, fat: 4, source: "manual" },
      { name: "Curd", quantity: 1, unit: "small bowl", servingSize: "1 small bowl", calories: 80, protein: 6, carbs: 5, fat: 4, source: "manual" },
    ],
  },
  {
    id: "egg-omelette-toast",
    mealType: "breakfast",
    title: "Masala Omelette + Toast",
    whyItWorks: "Fast breakfast for gym users who want protein without heavy prep.",
    dietStyles: ["eggs", "nonveg"],
    regions: ["north", "west", "east", "south", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Masala Omelette", quantity: 1, unit: "plate", servingSize: "2 eggs", calories: 170, protein: 14, carbs: 3, fat: 11, source: "manual" },
      { name: "Whole Wheat Toast", quantity: 2, unit: "slices", servingSize: "2 slices", calories: 140, protein: 6, carbs: 24, fat: 2, source: "manual" },
      { name: "Milk", quantity: 1, unit: "glass", servingSize: "1 glass", calories: 130, protein: 8, carbs: 10, fat: 6, source: "manual" },
    ],
  },
  {
    id: "paneer-sandwich-fruit",
    mealType: "breakfast",
    title: "Paneer Sandwich + Fruit",
    whyItWorks: "Portable breakfast for busy workdays with a better protein base than plain toast or poha.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["balanced", "flexible"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Paneer Sandwich", quantity: 1, unit: "sandwich", servingSize: "1 sandwich", calories: 320, protein: 20, carbs: 28, fat: 14, source: "manual" },
      { name: "Banana", quantity: 1, unit: "piece", servingSize: "1 medium banana", calories: 105, protein: 1, carbs: 27, fat: 0, source: "manual" },
    ],
  },
  {
    id: "dal-rice-salad",
    mealType: "lunch",
    title: "Dal Rice + Salad",
    whyItWorks: "Reliable home-style lunch that keeps carbs steady without feeling too restrictive.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "east", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular", "batch"],
    items: [
      { name: "Dal", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 180, protein: 10, carbs: 22, fat: 5, source: "manual" },
      { name: "Steamed Rice", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 210, protein: 4, carbs: 45, fat: 1, source: "manual" },
      { name: "Cucumber Salad", quantity: 1, unit: "plate", servingSize: "1 plate", calories: 40, protein: 1, carbs: 8, fat: 0, source: "manual" },
    ],
  },
  {
    id: "paneer-roti-bowl",
    mealType: "lunch",
    title: "Paneer Roti Power Bowl",
    whyItWorks: "Solid protein hit for vegetarian users trying to push protein without relying on powders.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["balanced", "flexible"],
    cookingStyles: ["regular", "batch"],
    items: [
      { name: "Paneer Bhurji", quantity: 1, unit: "plate", servingSize: "1 plate", calories: 290, protein: 22, carbs: 9, fat: 18, source: "manual" },
      { name: "Roti", quantity: 2, unit: "pieces", servingSize: "2 roti", calories: 220, protein: 6, carbs: 42, fat: 3, source: "manual" },
      { name: "Kachumber Salad", quantity: 1, unit: "small bowl", servingSize: "1 small bowl", calories: 45, protein: 2, carbs: 9, fat: 0, source: "manual" },
    ],
  },
  {
    id: "egg-curry-rice",
    mealType: "lunch",
    title: "Egg Curry + Rice",
    whyItWorks: "Budget-friendly protein lunch that works well for people who eat eggs but not meat.",
    dietStyles: ["eggs", "nonveg"],
    regions: ["north", "east", "south", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["regular", "batch"],
    items: [
      { name: "Egg Curry", quantity: 1, unit: "plate", servingSize: "2 eggs", calories: 240, protein: 16, carbs: 8, fat: 15, source: "manual" },
      { name: "Steamed Rice", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 210, protein: 4, carbs: 45, fat: 1, source: "manual" },
      { name: "Curd", quantity: 1, unit: "small bowl", servingSize: "1 small bowl", calories: 80, protein: 6, carbs: 5, fat: 4, source: "manual" },
    ],
  },
  {
    id: "chicken-rice-bowl",
    mealType: "lunch",
    title: "Chicken Rice Bowl",
    whyItWorks: "High-protein lunch with enough carbs for training days and busy afternoons.",
    dietStyles: ["nonveg"],
    regions: ["north", "west", "south", "mixed"],
    budgetStyles: ["balanced", "flexible"],
    cookingStyles: ["minimal", "regular", "batch"],
    items: [
      { name: "Grilled Chicken", quantity: 180, unit: "g", servingSize: "180 g", calories: 300, protein: 42, carbs: 0, fat: 12, source: "manual" },
      { name: "Jeera Rice", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 230, protein: 4, carbs: 44, fat: 4, source: "manual" },
      { name: "Sauteed Vegetables", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 90, protein: 3, carbs: 10, fat: 4, source: "manual" },
    ],
  },
  {
    id: "khichdi-curd",
    mealType: "dinner",
    title: "Khichdi + Curd Reset Dinner",
    whyItWorks: "Lighter dinner choice that still feels home-style and easy to digest.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "east", "west", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular", "batch"],
    items: [
      { name: "Dal Khichdi", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 320, protein: 12, carbs: 52, fat: 7, source: "manual" },
      { name: "Curd", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 110, protein: 9, carbs: 7, fat: 5, source: "manual" },
    ],
  },
  {
    id: "paneer-dinner",
    mealType: "dinner",
    title: "Paneer Bhurji + Roti Dinner",
    whyItWorks: "A better vegetarian dinner when protein is trailing behind target.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["balanced", "flexible"],
    cookingStyles: ["minimal", "regular", "batch"],
    items: [
      { name: "Paneer Bhurji", quantity: 1, unit: "plate", servingSize: "1 plate", calories: 290, protein: 22, carbs: 9, fat: 18, source: "manual" },
      { name: "Roti", quantity: 2, unit: "pieces", servingSize: "2 roti", calories: 220, protein: 6, carbs: 42, fat: 3, source: "manual" },
      { name: "Sauteed Vegetables", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 90, protein: 3, carbs: 10, fat: 4, source: "manual" },
    ],
  },
  {
    id: "egg-roti-dinner",
    mealType: "dinner",
    title: "Egg Bhurji + Roti Dinner",
    whyItWorks: "Fast weekday dinner that improves protein without a heavy calorie spike.",
    dietStyles: ["eggs", "nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Egg Bhurji", quantity: 1, unit: "plate", servingSize: "3 eggs", calories: 250, protein: 18, carbs: 6, fat: 16, source: "manual" },
      { name: "Roti", quantity: 2, unit: "pieces", servingSize: "2 roti", calories: 220, protein: 6, carbs: 42, fat: 3, source: "manual" },
      { name: "Curd", quantity: 1, unit: "small bowl", servingSize: "1 small bowl", calories: 80, protein: 6, carbs: 5, fat: 4, source: "manual" },
    ],
  },
  {
    id: "chicken-tikka-dinner",
    mealType: "dinner",
    title: "Chicken Tikka + Rice Dinner",
    whyItWorks: "High-protein dinner that works especially well after training or on eating-out days.",
    dietStyles: ["nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["balanced", "flexible"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Chicken Tikka", quantity: 180, unit: "g", servingSize: "180 g", calories: 310, protein: 44, carbs: 5, fat: 12, source: "manual" },
      { name: "Jeera Rice", quantity: 0.75, unit: "cup", servingSize: "3/4 cup", calories: 170, protein: 3, carbs: 33, fat: 3, source: "manual" },
      { name: "Green Salad", quantity: 1, unit: "plate", servingSize: "1 plate", calories: 35, protein: 2, carbs: 6, fat: 0, source: "manual" },
    ],
  },
  {
    id: "roasted-chana-buttermilk",
    mealType: "snack",
    title: "Roasted Chana + Buttermilk",
    whyItWorks: "Cheap, portable snack that reduces random cravings better than tea-time biscuits.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "south", "east", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular", "batch"],
    items: [
      { name: "Roasted Chana", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 140, protein: 8, carbs: 22, fat: 2, source: "manual" },
      { name: "Buttermilk", quantity: 1, unit: "glass", servingSize: "1 glass", calories: 60, protein: 4, carbs: 7, fat: 2, source: "manual" },
    ],
  },
  {
    id: "curd-fruit-bowl",
    mealType: "snack",
    title: "Curd + Fruit Bowl",
    whyItWorks: "Simple snack for office or evening hunger when you want something light but useful.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "south", "east", "mixed"],
    budgetStyles: ["tight", "balanced", "flexible"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Curd", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 110, protein: 9, carbs: 7, fat: 5, source: "manual" },
      { name: "Seasonal Fruit", quantity: 1, unit: "bowl", servingSize: "1 bowl", calories: 95, protein: 1, carbs: 24, fat: 0, source: "manual" },
    ],
  },
  {
    id: "boiled-eggs-fruit",
    mealType: "snack",
    title: "Boiled Eggs + Fruit",
    whyItWorks: "Quick snack that raises protein cleanly when the day is slipping behind target.",
    dietStyles: ["eggs", "nonveg"],
    regions: ["north", "west", "south", "east", "mixed"],
    budgetStyles: ["tight", "balanced"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Boiled Eggs", quantity: 2, unit: "pieces", servingSize: "2 eggs", calories: 156, protein: 13, carbs: 1, fat: 11, source: "manual" },
      { name: "Apple", quantity: 1, unit: "piece", servingSize: "1 medium apple", calories: 95, protein: 0, carbs: 25, fat: 0, source: "manual" },
    ],
  },
  {
    id: "paneer-snack-box",
    mealType: "snack",
    title: "Paneer Snack Box",
    whyItWorks: "Higher-protein snack for vegetarian users who need a stronger recovery option.",
    dietStyles: ["veg", "eggs", "nonveg"],
    regions: ["north", "west", "mixed"],
    budgetStyles: ["balanced", "flexible"],
    cookingStyles: ["minimal", "regular"],
    items: [
      { name: "Paneer Cubes", quantity: 120, unit: "g", servingSize: "120 g", calories: 220, protein: 18, carbs: 5, fat: 14, source: "manual" },
      { name: "Cucumber", quantity: 1, unit: "cup", servingSize: "1 cup", calories: 20, protein: 1, carbs: 4, fat: 0, source: "manual" },
    ],
  },
];

const getBlueprintsForMealType = (profile: UserProfile, mealType: MealType) => {
  const candidates = MEAL_LIBRARY.filter((item) => item.mealType === mealType);
  const dietMatched = candidates.filter((item) => item.dietStyles.includes(profile.onboarding.dietStyle));
  const regionMatched =
    profile.onboarding.regionPreference === "mixed"
      ? dietMatched
      : dietMatched.filter(
          (item) =>
            item.regions.includes(profile.onboarding.regionPreference) ||
            item.regions.includes("mixed")
        );
  const budgetMatched = regionMatched.filter((item) =>
    item.budgetStyles.includes(profile.onboarding.budgetStyle)
  );
  const cookingMatched = budgetMatched.filter((item) =>
    item.cookingStyles.includes(profile.onboarding.cookingStyle)
  );

  const pool =
    cookingMatched.length > 0
      ? cookingMatched
      : budgetMatched.length > 0
        ? budgetMatched
        : regionMatched.length > 0
          ? regionMatched
          : dietMatched.length > 0
            ? dietMatched
            : candidates;

  const ranked = [...pool].sort(
    (a, b) => scoreBlueprintForProfile(b, profile) - scoreBlueprintForProfile(a, profile)
  );

  return ranked;
};

const pickMeal = (items: MealBlueprint[], index: number) => {
  if (items.length === 0) {
    throw new Error("No meal blueprints available");
  }

  return items[index % items.length];
};

const buildDailyMeals = (profile: UserProfile, dayIndex: number) => {
  const breakfasts = getBlueprintsForMealType(profile, "breakfast");
  const lunches = getBlueprintsForMealType(profile, "lunch");
  const dinners = getBlueprintsForMealType(profile, "dinner");
  const snacks = getBlueprintsForMealType(profile, "snack");

  const meals = [
    createPlannedMeal(pickMeal(breakfasts, dayIndex), `breakfast-${dayIndex}`),
    createPlannedMeal(pickMeal(lunches, dayIndex + 1), `lunch-${dayIndex}`),
    createPlannedMeal(pickMeal(dinners, dayIndex + 2), `dinner-${dayIndex}`),
    createPlannedMeal(pickMeal(snacks, dayIndex + (profile.goalType === "gain" ? 2 : 0)), `snack-${dayIndex}`),
  ];

  if (profile.goalType === "gain") {
    meals.push(
      createPlannedMeal(pickMeal(snacks, dayIndex + 1), `extra-snack-${dayIndex}`)
    );
  }

  return meals;
};

const buildGroceryList = (days: MealPlanDay[]): GroceryListItem[] => {
  const map = new Map<string, GroceryListItem>();

  for (const day of days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        const key = `${item.name.toLowerCase()}__${item.unit.toLowerCase()}`;
        const existing = map.get(key);

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          map.set(key, {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          });
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const buildWeeklyMealPlan = (
  profile: UserProfile,
  startDate = new Date()
): WeeklyMealPlan => {
  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const currentDate = addDays(startDate, dayIndex);
    const meals = buildDailyMeals(profile, dayIndex);
    const totals = meals.reduce(
      (sum, meal) => ({
        calories: sum.calories + meal.calories,
        protein: sum.protein + meal.protein,
      }),
      { calories: 0, protein: 0 }
    );

    return {
      id: `meal-plan-day-${dayIndex}`,
      dateKey: format(currentDate, "yyyy-MM-dd"),
      dayLabel: format(currentDate, "EEE d MMM"),
      focus: focusMessages[profile.goalType][dayIndex % focusMessages[profile.goalType].length],
      meals,
      totals,
    } satisfies MealPlanDay;
  });

  const planName =
    profile.goalType === "lose"
      ? "Lean Coach Plan"
      : profile.goalType === "gain"
        ? "High-Protein Growth Plan"
        : "Balanced Consistency Plan";

  return {
    generatedAt: Date.now(),
    planName,
    days,
    groceryList: buildGroceryList(days),
  };
};

export const suggestMealsForCoach = (
  profile: UserProfile,
  input: {
    calorieGap: number;
    proteinGap: number;
    preferredMealType?: MealType;
  },
  limit = 2
): PlannedMeal[] => {
  const mealTypes: MealType[] = input.preferredMealType
    ? [input.preferredMealType]
    : ["snack", "lunch", "dinner", "breakfast"];
  const desiredCalories = Math.min(650, Math.max(180, input.calorieGap || 280));
  const desiredProtein = Math.max(12, input.proteinGap || 18);

  const candidates = mealTypes
    .flatMap((mealType) => getBlueprintsForMealType(profile, mealType))
    .map((blueprint, index) => {
      const plannedMeal = createPlannedMeal(blueprint, `coach-${index}`);
      const fitScore =
        Math.abs(plannedMeal.calories - desiredCalories) +
        Math.abs(plannedMeal.protein - desiredProtein) * 9 -
        scoreBlueprintForProfile(blueprint, profile) * 10;

      return { plannedMeal, fitScore };
    })
    .sort((a, b) => a.fitScore - b.fitScore)
    .slice(0, limit);

  return candidates.map((item) => item.plannedMeal);
};

export const buildFoodEntriesFromPlannedMeal = (
  meal: PlannedMeal,
  timestamp: number
): Array<Omit<FoodEntry, "id">> =>
  meal.items.map((item) => ({
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    sugar: item.sugar,
    sodiumMg: item.sodiumMg,
    quantity: item.quantity,
    unit: item.unit,
    servingSize: item.servingSize,
    createdAt: Date.now(),
    timestamp,
    mealType: meal.mealType,
    source: item.source,
    confidence: item.confidence,
    trustLevel: item.trustLevel,
    sourceDetail: item.sourceDetail,
    verifiedSource: item.verifiedSource,
    barcode: item.barcode,
    brandName: item.brandName,
  }));

export const getSuggestedMealType = (date = new Date()): MealType => {
  const hour = date.getHours();

  if (hour < 11) {
    return "breakfast";
  }

  if (hour < 16) {
    return "lunch";
  }

  if (hour < 20) {
    return "snack";
  }

  return "dinner";
};
