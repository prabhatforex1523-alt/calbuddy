export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity?: number;
  unit?: string;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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

export interface BoxColors {
  summary?: string;
  water?: string;
  food?: string;
  activity?: string;
  habits?: string;
  weight?: string;
}

export interface UserProfile {
  name: string;
  dailyCalorieGoal: number;
  dailyWaterGoalMl: number;
  weightGoal: number;
  currentWeight: number;
  weightUnit: 'kg' | 'lbs';
  macroUnit: 'g' | '%';
  primaryColor?: string;
  cardColor?: string;
  darkCardColor?: string;
  boxColors?: BoxColors;
  darkBoxColors?: BoxColors;
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
}

export interface HealthData {
  foodEntries: FoodEntry[];
  activityEntries: ActivityEntry[];
  waterEntries: WaterEntry[];
  weightEntries: WeightEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  profile: UserProfile;
}
