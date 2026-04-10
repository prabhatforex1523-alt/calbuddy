export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'local' | 'usda' | 'ai' | 'manual';
export type NutritionTrustLevel = 'verified' | 'reference' | 'estimate' | 'manual';
export type PlanTier = 'free' | 'premium';
export type OnboardingPrimaryFocus = 'fat_loss' | 'recomposition' | 'weight_gain' | 'muscle_gain';
export type DietStyle = 'veg' | 'eggs' | 'nonveg';
export type RegionPreference = 'north' | 'south' | 'east' | 'west' | 'mixed';
export type BudgetStyle = 'tight' | 'balanced' | 'flexible';
export type WorkoutFrequency = '0-1' | '2-4' | '5+';
export type CookingStyle = 'minimal' | 'regular' | 'batch';
export type EatingOutFrequency = 'rare' | 'weekly' | 'frequent';
export type DashboardMetricKey = 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium';
export type FastingPlan = '12:12' | '14:10' | '16:8' | '18:6';

export interface OnboardingProfile {
  primaryFocus: OnboardingPrimaryFocus;
  dietStyle: DietStyle;
  regionPreference: RegionPreference;
  budgetStyle: BudgetStyle;
  workoutFrequency: WorkoutFrequency;
  cookingStyle: CookingStyle;
  eatingOutFrequency: EatingOutFrequency;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  quantity?: number;
  unit?: string;
  servingSize?: string;
  servingWeightGrams?: number;
  timestamp: number;
  createdAt: number;
  mealType: MealType;
  source: FoodSource;
  confidence?: number;
  trustLevel?: NutritionTrustLevel;
  sourceDetail?: string;
  verifiedSource?: boolean;
  barcode?: string;
  brandName?: string;
}

export interface FoodSearchResult {
  id: string;
  name: string;
  servingSize: string;
  baseUnit?: 'piece' | '100g' | 'serving';
  servingWeightGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  source: FoodSource;
  confidence?: number;
  trustLevel?: NutritionTrustLevel;
  sourceDetail?: string;
  verifiedSource?: boolean;
  barcode?: string;
  brandName?: string;
}

export interface ActivityEntry {
  id: string;
  name: string;
  caloriesBurned: number;
  durationMinutes: number;
  intensity: 'Low' | 'Medium' | 'High';
  timestamp: number;
}

export interface WaterEntry {
  id: string;
  amountMl: number;
  timestamp: number;
  caloriesConsumed?: number;
  caloriesBurned?: number;
}

export interface UserProfile {
  name: string;
  dailyCalorieGoal: number;
  useAutoCalorieGoal: boolean;
  dailyWaterGoalMl: number;
  age: number;
  heightCm: number;
  weightGoal: number;
  currentWeight: number;
  goalType: 'lose' | 'maintain' | 'gain';
  weightUnit: 'kg' | 'lbs';
  macroUnit: 'g' | '%';
  useCustomMacroGoals?: boolean;
  customProteinGoal?: number;
  customCarbsGoal?: number;
  customFatGoal?: number;
  dashboardMetrics?: DashboardMetricKey[];
  netCarbsMode?: boolean;
  fastingPlan?: FastingPlan;
  waterReminderIntervalHours: number;
  notificationPermission: 'default' | 'granted' | 'denied';
  mealRemindersEnabled: boolean;
  waterRemindersEnabled: boolean;
  loggingStreak: number;
  lastFoodLogDate: string;
  planTier: PlanTier;
  premiumActivatedAt?: number;
  onboardingCompleted: boolean;
  onboarding: OnboardingProfile;
  accountabilityPartner: string;
  wallpaperUrl?: string;
  wallpaperOpacity?: number;
  wallpaperBlur?: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  timestamp: number;
}

export interface WeightEntry {
  id: string;
  weight: number;
  timestamp: number;
  source?: 'manual' | 'health_connect';
}

export interface DailyCheckIn {
  id: string;
  timestamp: number;
  energy: number;
  hunger: number;
  mood: number;
  note: string;
}

export interface MealTemplateItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  quantity: number;
  unit: string;
  servingSize?: string;
  servingWeightGrams?: number;
  source: FoodSource;
  confidence?: number;
  trustLevel?: NutritionTrustLevel;
  sourceDetail?: string;
  verifiedSource?: boolean;
  barcode?: string;
  brandName?: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: MealType;
  createdAt: number;
  items: MealTemplateItem[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlannedFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  quantity: number;
  unit: string;
  servingSize: string;
  source: FoodSource;
  confidence?: number;
  trustLevel?: NutritionTrustLevel;
  sourceDetail?: string;
  verifiedSource?: boolean;
  barcode?: string;
  brandName?: string;
}

export interface PlannedMeal {
  id: string;
  mealType: MealType;
  title: string;
  whyItWorks: string;
  items: PlannedFoodItem[];
  calories: number;
  protein: number;
}

export interface MealPlanDay {
  id: string;
  dateKey: string;
  dayLabel: string;
  focus: string;
  meals: PlannedMeal[];
  totals: {
    calories: number;
    protein: number;
  };
}

export interface GroceryListItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface WeeklyMealPlan {
  generatedAt: number;
  planName: string;
  days: MealPlanDay[];
  groceryList: GroceryListItem[];
}

export interface RestaurantChoice {
  id: string;
  name: string;
  calories: number;
  protein: number;
  score: number;
  reason: string;
  caution?: string;
  fit: 'best' | 'good' | 'limit';
}

export interface WeeklyProgressReport {
  headline: string;
  summary: string;
  wins: string[];
  watchouts: string[];
  nextMoves: string[];
  accountabilityScore: number;
  shareText: string;
}

export interface BarcodeCatalogEntry {
  id: string;
  barcode: string;
  name: string;
  brandName?: string;
  food: FoodSearchResult;
  usageCount: number;
  lastUsedAt: number;
  savedAt: number;
}

export interface AdaptiveCalorieRecommendation {
  recommendedDailyCalories: number;
  recommendedProteinGoal: number;
  currentDailyCalories: number;
  averageTrackedCalories: number;
  trackedDays: number;
  adherenceScore: number;
  weightTrendPerWeekKg: number | null;
  direction: 'lower' | 'hold' | 'raise';
  headline: string;
  rationale: string;
  nextStep: string;
  generatedAt: number;
}

export interface HealthSyncState {
  provider: 'health_connect';
  availability: 'ready' | 'unsupported' | 'setup_required' | 'unknown';
  lastSyncedAt?: number;
  workouts7d?: number;
  steps7d?: number;
  averageSleepHours?: number;
  latestWeightKg?: number;
  latestWeightAt?: number;
  permissionsGranted?: boolean;
  note?: string;
}

export interface FastingState {
  isActive: boolean;
  startedAt?: number;
  lastCompletedAt?: number;
  lastDurationHours?: number;
}

export interface HealthData {
  foodEntries: FoodEntry[];
  favoriteFoods: FoodSearchResult[];
  activityEntries: ActivityEntry[];
  waterEntries: WaterEntry[];
  weightEntries: WeightEntry[];
  dailyCheckIns: DailyCheckIn[];
  habits: Habit[];
  habitLogs: HabitLog[];
  mealTemplates: MealTemplate[];
  achievements: Achievement[];
  profile: UserProfile;
  barcodeLibrary: BarcodeCatalogEntry[];
  adaptiveRecommendation?: AdaptiveCalorieRecommendation;
  healthSync: HealthSyncState;
  fastingState?: FastingState;
}
