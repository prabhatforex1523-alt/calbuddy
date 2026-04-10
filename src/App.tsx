import { signOut, type User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import {
  ArrowUpRight,
  Bell,
  Brain,
  Camera,
  CheckCircle2,
  Circle,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Loader2,
  LogOut,
  Moon as MoonIcon,
  Package,
  PlusCircle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun as SunIcon,
  Target,
  TrendingUp,
  Upload,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type MotionProps, type Transition } from 'motion/react';
import { clsx } from 'clsx';
import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type CSSProperties,
  type FormEventHandler,
} from 'react';

import { auth } from './auth';
import { AppBottomNav } from './components/AppBottomNav';
import { AppDialog } from './components/AppDialog';
import { AddFoodModal } from './components/AddFoodModal';
import { AppHeader } from './components/AppHeader';
import { HabitsTab } from './components/HabitsTab';
import { HistoryTab } from './components/HistoryTab';
import { ProfileTab } from './components/ProfileTab';
import { ScanTab } from './components/ScanTab';
import { TodayTab } from './components/TodayTab';
import { WeightTab } from './components/WeightTab';
import { useFoodLogSync } from './hooks/useFoodLogSync';
import { useLocalHealthData } from './hooks/useLocalHealthData';
import { parseFoodInput } from './parseFoodInput';
import {
  DEFAULT_DASHBOARD_METRICS,
  DEFAULT_ONBOARDING,
  ONBOARDING_OPTIONS,
  applyWallpaperToDocument,
  createInitialHealthData,
  loadThemePreference,
  saveThemePreference,
} from './services/appData';
import { buildAdaptiveCalorieRecommendation } from './services/adaptiveTargets';
import { evaluateAchievements } from './services/achievements';
import { isAiFoodScanAvailable, scanFoodImage } from './services/aiFoodScan';
import { createBackupPayload, getBackupFilename, parseBackupText, serializeBackupPayload } from './services/backup';
import { getRecentFoods, saveFoodToHistory, saveRecentFood } from './services/cacheFood';
import { lookupBarcodeFood, normalizeBarcode, upsertBarcodeCatalog } from './services/barcode';
import { generateCoachInsights } from './services/coach';
import { lookupFoodData, searchFoods } from './services/foodData';
import { addFoodLog, clearFoodLogs, deleteFoodLog, updateFoodLog } from './services/foodLogs';
import { scaleFoodNutrition } from './services/foodScaling';
import {
  getHealthConnectStatus,
  isHealthConnectSupportedPlatform,
  mergeHealthSyncIntoData,
  requestHealthConnectPermissions,
  shouldAutoRefreshHealthConnect,
  syncHealthConnectData,
} from './services/healthConnect';
import { buildHealthSyncState } from './services/healthSync';
import { buildDayQualityInsight, buildFoodReviewInsight } from './services/mealQuality';
import { describeFoodTrust, getFoodSourceLabel } from './services/nutritionTrust';
import { requestNotificationPermission, startReminderScheduler } from './services/reminders';
import { getTelemetrySummary, reportError, trackEvent } from './services/telemetry';
import { createMealTemplate } from './services/templates';
import { isUsdaLookupAvailable } from './services/usda';
import {
  createWallpaperAssetReference,
  deleteWallpaperAsset,
  isWallpaperAssetReference,
  loadWallpaperAsset,
  saveWallpaperAsset,
} from './services/wallpaperStorage';
import type {
  ActivityEntry,
  DashboardMetricKey,
  FoodEntry,
  FoodSearchResult,
  HealthData,
  MealType,
  OnboardingProfile,
  UserProfile,
  WaterEntry,
  WeightEntry,
} from './types';

type AppTab = 'today' | 'history' | 'scan' | 'habits' | 'activity' | 'weight' | 'profile';

type ActionFeedback = {
  kind: 'food' | 'habit' | 'weight';
  message: string;
  token: number;
} | null;

type FoodDraftMeta = {
  barcode?: string;
  brandName?: string;
  confidence?: number;
  id?: string;
  servingSize?: string;
  servingWeightGrams?: number;
  source: FoodSearchResult['source'];
  sourceDetail?: string;
  trustLevel?: FoodSearchResult['trustLevel'];
  verifiedSource?: boolean;
};

type ConfirmDialogState = {
  confirmLabel: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  title: string;
  tone?: 'danger' | 'primary';
} | null;

type HabitDialogState = {
  name: string;
} | null;

type ActivityDialogState = {
  calories: string;
  duration: string;
  entryId?: string;
  name: string;
  submitLabel: string;
  title: string;
} | null;

type WaterDialogState = {
  amount: string;
  entryId?: string;
  submitLabel: string;
  title: string;
} | null;

type TemplateDialogState = {
  mealType: MealType;
  name: string;
} | null;

type WeightEditDialogState = {
  entryId: string;
  weight: string;
} | null;

type InfoDialogState = {
  description: string;
  title: string;
} | null;

type HabitHistoryEntry = {
  habitId: string;
  icon: string;
  id: string;
  name: string;
  timestamp: number;
  type: 'habit';
};

type CombinedHistoryEntryView =
  | (FoodEntry & { type: 'food' })
  | (ActivityEntry & { type: 'activity' })
  | (WaterEntry & { type: 'water' })
  | (WeightEntry & { type: 'weight' })
  | HabitHistoryEntry;

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const MEAL_VISUALS: Record<MealType, { accentClass: string; icon: LucideIcon }> = {
  breakfast: { accentClass: 'premium-log-meal-breakfast', icon: Coffee },
  lunch: { accentClass: 'premium-log-meal-lunch', icon: Utensils },
  dinner: { accentClass: 'premium-log-meal-dinner', icon: MoonIcon },
  snack: { accentClass: 'premium-log-meal-snack', icon: Sparkles },
};

const GOAL_LABELS: Record<UserProfile['goalType'], string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain',
  gain: 'Gain Weight',
};

const GOAL_FOCUS_OPTIONS: Array<{
  helper: string;
  icon: LucideIcon;
  label: string;
  value: OnboardingProfile['primaryFocus'];
}> = [
  { value: 'fat_loss', label: 'Fat loss', helper: 'Lean down with a clear calorie deficit.', icon: Flame },
  { value: 'recomposition', label: 'Maintain / recomp', helper: 'Stay steady while improving body composition.', icon: Target },
  { value: 'weight_gain', label: 'Weight gain', helper: 'Add scale weight with a steady calorie surplus.', icon: TrendingUp },
  { value: 'muscle_gain', label: 'Muscle gain', helper: 'Bias calories and protein toward growth.', icon: Dumbbell },
];

const DASHBOARD_METRIC_OPTIONS: Array<{
  helper: string;
  icon: LucideIcon;
  label: string;
  value: DashboardMetricKey;
}> = [
  { value: 'carbs', label: 'Carbs', helper: 'Fuel and recovery', icon: Brain },
  { value: 'fat', label: 'Fat', helper: 'Hormones and satiety', icon: Heart },
  { value: 'fiber', label: 'Fiber', helper: 'Digestion and fullness', icon: Sparkles },
  { value: 'sugar', label: 'Sugar', helper: 'Keep spikes visible', icon: Coffee },
  { value: 'sodium', label: 'Sodium', helper: 'Packaged-food awareness', icon: ShieldCheck },
];

const FASTING_PLAN_OPTIONS = [
  { value: '12:12', label: '12:12', fastHours: 12, eatingHours: 12 },
  { value: '14:10', label: '14:10', fastHours: 14, eatingHours: 10 },
  { value: '16:8', label: '16:8', fastHours: 16, eatingHours: 8 },
  { value: '18:6', label: '18:6', fastHours: 18, eatingHours: 6 },
] as const;

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundNutrition = (value: number) => Math.round(value * 10) / 10;
const getDateKey = (value: number | Date) => format(value, 'yyyy-MM-dd');
const getNumericInputValue = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const getIntegerInputValue = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isDashboardMetricKey = (value: unknown): value is DashboardMetricKey =>
  typeof value === 'string' && DASHBOARD_METRIC_OPTIONS.some((option) => option.value === value);

const normalizeDashboardMetrics = (metrics?: DashboardMetricKey[]) => {
  const nextMetrics = Array.isArray(metrics)
    ? Array.from(new Set(metrics.filter((item) => isDashboardMetricKey(item))))
    : [];

  return (nextMetrics.length > 0 ? nextMetrics : DEFAULT_DASHBOARD_METRICS).slice(0, 2);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

const getWeightKg = (profile: Pick<UserProfile, 'currentWeight' | 'weightUnit'>) =>
  profile.weightUnit === 'kg' ? profile.currentWeight : profile.currentWeight / 2.20462;

const deriveMacroTargets = (input: {
  ignoreCustom?: boolean;
  profile: UserProfile;
}) => {
  if (!input.ignoreCustom && input.profile.useCustomMacroGoals) {
    return {
      protein: Math.max(0, Math.round(input.profile.customProteinGoal ?? 0)),
      carbs: Math.max(0, Math.round(input.profile.customCarbsGoal ?? 0)),
      fat: Math.max(0, Math.round(input.profile.customFatGoal ?? 0)),
    };
  }

  const weightKg = Math.max(40, getWeightKg(input.profile));
  const focus = input.profile.onboarding?.primaryFocus ?? DEFAULT_ONBOARDING.primaryFocus;

  const proteinMultiplier =
    focus === 'muscle_gain'
      ? 2
      : focus === 'fat_loss'
        ? 1.8
        : focus === 'weight_gain'
          ? 1.7
          : 1.6;
  const fatRatio =
    input.profile.goalType === 'lose' ? 0.26 : input.profile.goalType === 'gain' ? 0.28 : 0.27;

  const protein = Math.max(95, Math.round(weightKg * proteinMultiplier));
  const fat = clampNumber(Math.round((input.profile.dailyCalorieGoal * fatRatio) / 9), 45, 110);
  const carbs = Math.max(80, Math.round((input.profile.dailyCalorieGoal - protein * 4 - fat * 9) / 4));

  return { protein, carbs, fat };
};

const computeLoggingStreak = (entries: FoodEntry[]) => {
  if (entries.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(new Set(entries.map((entry) => getDateKey(entry.timestamp)))).sort((left, right) =>
    right.localeCompare(left)
  );

  if (uniqueDays.length === 0) {
    return 0;
  }

  const today = getDateKey(new Date());
  const yesterday = getDateKey(subDays(new Date(), 1));
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let pointer = startOfDay(new Date(uniqueDays[0]));

  while (uniqueDays[streak] === getDateKey(pointer)) {
    streak += 1;
    pointer = subDays(pointer, 1);
  }

  return streak;
};

const getTimeSegment = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const formatFoodCatalogSummary = (item: FoodSearchResult) =>
  `${Math.round(item.calories)} kcal | ${Math.round(item.protein)}g protein | ${item.servingSize || '1 serving'}`;

const formatNutritionValue = (value: number, kind: 'macro' | 'calorie' = 'macro') =>
  `${kind === 'calorie' ? Math.round(value) : roundNutrition(value)}${kind === 'calorie' ? ' kcal' : 'g'}`;

const foodEntryToPerUnitResult = (entry: FoodEntry): FoodSearchResult => {
  const quantity = Math.max(1, entry.quantity || 1);

  return {
    id: entry.id,
    name: entry.name,
    servingSize: entry.servingSize || '1 serving',
    servingWeightGrams: entry.servingWeightGrams,
    calories: roundNutrition(entry.calories / quantity),
    protein: roundNutrition(entry.protein / quantity),
    carbs: roundNutrition(entry.carbs / quantity),
    fat: roundNutrition(entry.fat / quantity),
    fiber: typeof entry.fiber === 'number' ? roundNutrition(entry.fiber / quantity) : undefined,
    sugar: typeof entry.sugar === 'number' ? roundNutrition(entry.sugar / quantity) : undefined,
    sodiumMg: typeof entry.sodiumMg === 'number' ? roundNutrition(entry.sodiumMg / quantity) : undefined,
    source: entry.source,
    confidence: entry.confidence,
    trustLevel: entry.trustLevel,
    sourceDetail: entry.sourceDetail,
    verifiedSource: entry.verifiedSource,
    barcode: entry.barcode,
    brandName: entry.brandName,
  };
};

const foodEntryToSearchResult = (entry: FoodEntry): FoodSearchResult => ({
  id: entry.id,
  name: entry.name,
  servingSize: entry.servingSize || '1 serving',
  servingWeightGrams: entry.servingWeightGrams,
  calories: entry.calories,
  protein: entry.protein,
  carbs: entry.carbs,
  fat: entry.fat,
  fiber: entry.fiber,
  sugar: entry.sugar,
  sodiumMg: entry.sodiumMg,
  source: entry.source,
  confidence: entry.confidence,
  trustLevel: entry.trustLevel,
  sourceDetail: entry.sourceDetail,
  verifiedSource: entry.verifiedSource,
  barcode: entry.barcode,
  brandName: entry.brandName,
});

const getHabitStreak = (habitId: string, data: HealthData) => {
  const loggedDays = Array.from(
    new Set(
      data.habitLogs
        .filter((log) => log.habitId === habitId)
        .map((log) => getDateKey(log.timestamp))
    )
  ).sort((left, right) => right.localeCompare(left));

  if (loggedDays.length === 0) {
    return 0;
  }

  let streak = 0;
  let pointer = startOfDay(new Date(loggedDays[0]));

  while (loggedDays[streak] === getDateKey(pointer)) {
    streak += 1;
    pointer = subDays(pointer, 1);
  }

  return streak;
};

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorLike = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};

const detectBarcodeFromFile = async (file: File) => {
  const BarcodeDetectorCtor = (window as Window & { BarcodeDetector?: BarcodeDetectorLike }).BarcodeDetector;
  if (!BarcodeDetectorCtor) {
    return null;
  }

  const imageBitmap = await createImageBitmap(file);
  try {
    const detector = new BarcodeDetectorCtor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    const results = await detector.detect(imageBitmap);
    return results[0]?.rawValue ? normalizeBarcode(results[0].rawValue) : null;
  } finally {
    imageBitmap.close();
  }
};

export default function App({ user }: { user: User }) {
  const shouldReduceMotion = Boolean(useReducedMotion()) || Capacitor.isNativePlatform();
  const userId = user.uid;
  const aiFoodScanAvailable = isAiFoodScanAvailable();
  const usdaLookupAvailable = isUsdaLookupAvailable();
  const barcodeDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
  const selectedDate = useMemo(() => new Date(), []);

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isDarkMode, setIsDarkMode] = useState(loadThemePreference);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [timeNow, setTimeNow] = useState(Date.now());
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback>(null);
  const [recentCompletedHabitId, setRecentCompletedHabitId] = useState<string | null>(null);
  const [recentWeightEntryId, setRecentWeightEntryId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wallpaperPreviewUrl, setWallpaperPreviewUrl] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [habitDialog, setHabitDialog] = useState<HabitDialogState>(null);
  const [activityDialog, setActivityDialog] = useState<ActivityDialogState>(null);
  const [waterDialog, setWaterDialog] = useState<WaterDialogState>(null);
  const [templateDialog, setTemplateDialog] = useState<TemplateDialogState>(null);
  const [weightEditDialog, setWeightEditDialog] = useState<WeightEditDialogState>(null);
  const [infoDialog, setInfoDialog] = useState<InfoDialogState>(null);

  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFoodEntry, setEditingFoodEntry] = useState<FoodEntry | null>(null);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [foodSearchInput, setFoodSearchInput] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<FoodSearchResult[]>([]);
  const [isFoodSearchLoading, setIsFoodSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFoodBase, setSelectedFoodBase] = useState<FoodSearchResult | null>(null);
  const [foodDraftMeta, setFoodDraftMeta] = useState<FoodDraftMeta>({ source: 'manual' });
  const [manualNutritionMode, setManualNutritionMode] = useState(false);
  const [shouldShowBarcodeComposer, setShouldShowBarcodeComposer] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState('1');
  const [foodUnit, setFoodUnit] = useState('serving');
  const [foodCalories, setFoodCalories] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  const [foodCarbs, setFoodCarbs] = useState('');
  const [foodFat, setFoodFat] = useState('');
  const [foodFiber, setFoodFiber] = useState('');
  const [foodSugar, setFoodSugar] = useState('');
  const [foodSodiumMg, setFoodSodiumMg] = useState('');
  const [foodBarcode, setFoodBarcode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [recentFoods, setRecentFoods] = useState<FoodSearchResult[]>(() => getRecentFoods());

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  const addActionFeedback = (kind: NonNullable<ActionFeedback>['kind'], message: string) => {
    setActionFeedback({ kind, message, token: Date.now() });
  };

  const { data, isHydrated, setData } = useLocalHealthData({
    userId,
    onLoadError: (error) => {
      reportError(error, { scope: 'health_data_load', userId });
      showToast('Local data could not be fully restored. Starting from a safe state.', 'error');
    },
    onQuotaExceeded: (error) => {
      reportError(error, { scope: 'health_data_quota', userId });
      showToast('Storage is full. Remove large wallpaper assets or old logs to keep saving.', 'error');
    },
    onSaveError: (error) => {
      reportError(error, { scope: 'health_data_save', userId });
      showToast('Changes could not be saved locally right now.', 'error');
    },
  });

  const { foodLogError } = useFoodLogSync({
    foodEntries: data.foodEntries,
    roundNutrition,
    setData,
    showToast,
    userId,
  });

  const selectedDashboardMetrics = useMemo(
    () => normalizeDashboardMetrics(data.profile.dashboardMetrics),
    [data.profile.dashboardMetrics]
  );

  const macroTargets = useMemo(() => deriveMacroTargets({ profile: data.profile }), [data.profile]);
  const autoMacroTargets = useMemo(
    () => deriveMacroTargets({ profile: data.profile, ignoreCustom: true }),
    [data.profile]
  );
  const proteinGoal = macroTargets.protein;
  const carbsGoal = macroTargets.carbs;
  const fatGoal = macroTargets.fat;

  const suggestedMealType = useMemo<MealType>(() => {
    const hour = new Date(timeNow).getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 20) return 'snack';
    return 'dinner';
  }, [timeNow]);

  const setNutritionFieldsFromFood = (food: Pick<FoodSearchResult, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodiumMg'>) => {
    setFoodCalories(String(roundNutrition(food.calories)));
    setFoodProtein(String(roundNutrition(food.protein)));
    setFoodCarbs(String(roundNutrition(food.carbs)));
    setFoodFat(String(roundNutrition(food.fat)));
    setFoodFiber(food.fiber !== undefined ? String(roundNutrition(food.fiber)) : '');
    setFoodSugar(food.sugar !== undefined ? String(roundNutrition(food.sugar)) : '');
    setFoodSodiumMg(food.sodiumMg !== undefined ? String(roundNutrition(food.sodiumMg)) : '');
  };

  const resetFoodComposer = (nextMealType: MealType = suggestedMealType) => {
    setEditingFoodEntry(null);
    setMealType(nextMealType);
    setFoodSearchInput('');
    setFoodSearchResults([]);
    setIsFoodSearchLoading(false);
    setShowSuggestions(false);
    setSelectedFoodBase(null);
    setFoodDraftMeta({ source: 'manual' });
    setManualNutritionMode(false);
    setShouldShowBarcodeComposer(false);
    setFoodQuantity('1');
    setFoodUnit('serving');
    setFoodCalories('');
    setFoodProtein('');
    setFoodCarbs('');
    setFoodFat('');
    setFoodFiber('');
    setFoodSugar('');
    setFoodSodiumMg('');
    setFoodBarcode('');
    setIsAnalyzing(false);
  };

  const closeFoodModal = () => {
    setFoodModalOpen(false);
    resetFoodComposer(suggestedMealType);
  };

  const openAddFood = (nextMealType: MealType = suggestedMealType) => {
    resetFoodComposer(nextMealType);
    setFoodModalOpen(true);
  };

  const applyFoodResultToDraft = (
    food: FoodSearchResult,
    options?: { name?: string; quantity?: number; unit?: string }
  ) => {
    const nextQuantity = Math.max(0.1, options?.quantity ?? getNumericInputValue(foodQuantity, 1));
    const nextUnit = (options?.unit || foodUnit || 'serving').trim() || 'serving';
    const scaled = scaleFoodNutrition(food, nextQuantity, nextUnit);

    setSelectedFoodBase(food);
    setFoodDraftMeta({
      id: food.id,
      source: food.source,
      confidence: food.confidence,
      trustLevel: food.trustLevel,
      sourceDetail: food.sourceDetail,
      verifiedSource: food.verifiedSource,
      servingSize: food.servingSize,
      servingWeightGrams: food.servingWeightGrams,
      barcode: food.barcode,
      brandName: food.brandName,
    });
    setFoodSearchInput(options?.name ?? food.name);
    setFoodQuantity(String(nextQuantity));
    setFoodUnit(nextUnit);
    setFoodBarcode(food.barcode ?? '');
    setShouldShowBarcodeComposer(Boolean(food.barcode));
    setManualNutritionMode(false);
    setShowSuggestions(false);
    setNutritionFieldsFromFood(scaled);
  };

  const openManualEntry = () => {
    const parsedInput = parseFoodInput(foodSearchInput);
    const nextName = parsedInput.foodName || foodSearchInput.trim();

    setSelectedFoodBase(null);
    setFoodDraftMeta({
      source: 'manual',
      trustLevel: 'manual',
      sourceDetail: 'Manual nutrition entry',
      verifiedSource: false,
      servingSize: '1 serving',
    });
    setFoodSearchInput(nextName);
    setFoodQuantity(String(Math.max(0.1, parsedInput.quantity || getNumericInputValue(foodQuantity, 1))));
    setFoodUnit(parsedInput.unit || foodUnit || 'serving');
    setManualNutritionMode(true);
    setShowSuggestions(false);
  };

  const openFoodEditor = (entry: FoodEntry) => {
    const baseFood = foodEntryToPerUnitResult(entry);
    setFoodModalOpen(true);
    setEditingFoodEntry(entry);
    setMealType(entry.mealType);
    setFoodDraftMeta({
      id: entry.id,
      source: entry.source,
      confidence: entry.confidence,
      trustLevel: entry.trustLevel,
      sourceDetail: entry.sourceDetail,
      verifiedSource: entry.verifiedSource,
      servingSize: entry.servingSize,
      servingWeightGrams: entry.servingWeightGrams,
      barcode: entry.barcode,
      brandName: entry.brandName,
    });
    setSelectedFoodBase(baseFood);
    setFoodSearchInput(entry.name);
    setFoodQuantity(String(entry.quantity || 1));
    setFoodUnit(entry.unit || 'serving');
    setFoodBarcode(entry.barcode ?? '');
    setShouldShowBarcodeComposer(Boolean(entry.barcode));
    setManualNutritionMode(true);
    setShowSuggestions(false);
    setNutritionFieldsFromFood(entry);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeNow(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(window.navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOnline);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    saveThemePreference(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }

    const timer = window.setTimeout(() => setActionFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [actionFeedback]);

  useEffect(() => {
    const reminderTeardown = startReminderScheduler({
      profile: data.profile,
      userScope: userId || 'guest',
    });

    return () => reminderTeardown();
  }, [data.profile, userId]);

  useEffect(() => {
    const nextStreak = computeLoggingStreak(data.foodEntries);
    const latestFoodTimestamp = data.foodEntries.reduce((latest, entry) => Math.max(latest, entry.timestamp), 0);
    const lastFoodLogDate = latestFoodTimestamp ? getDateKey(latestFoodTimestamp) : '';

    if (
      data.profile.loggingStreak === nextStreak &&
      data.profile.lastFoodLogDate === lastFoodLogDate
    ) {
      return;
    }

    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        loggingStreak: nextStreak,
        lastFoodLogDate,
      },
    }));
  }, [data.foodEntries, data.profile.lastFoodLogDate, data.profile.loggingStreak, setData]);

  useEffect(() => {
    let cancelled = false;

    const loadWallpaper = async () => {
      if (!data.profile.wallpaperUrl) {
        if (!cancelled) {
          setWallpaperPreviewUrl('');
        }
        return;
      }

      if (!isWallpaperAssetReference(data.profile.wallpaperUrl)) {
        if (!cancelled) {
          setWallpaperPreviewUrl(data.profile.wallpaperUrl);
        }
        return;
      }

      try {
        const asset = await loadWallpaperAsset(data.profile.wallpaperUrl);
        if (!cancelled) {
          setWallpaperPreviewUrl(asset || '');
        }
      } catch (error) {
        reportError(error, { scope: 'wallpaper_load', userId });
        if (!cancelled) {
          setWallpaperPreviewUrl('');
        }
      }
    };

    void loadWallpaper();

    return () => {
      cancelled = true;
    };
  }, [data.profile.wallpaperUrl, userId]);

  useEffect(() => {
    applyWallpaperToDocument({
      wallpaperUrl: wallpaperPreviewUrl,
      wallpaperOpacity: data.profile.wallpaperOpacity,
      wallpaperBlur: data.profile.wallpaperBlur,
    });
  }, [data.profile.wallpaperBlur, data.profile.wallpaperOpacity, wallpaperPreviewUrl]);

  useEffect(() => {
    let cancelled = false;

    const syncHealthStatus = async () => {
      if (!isHealthConnectSupportedPlatform()) {
        setData((prev) => ({
          ...prev,
          healthSync: buildHealthSyncState({
            activityEntries: prev.activityEntries,
            current: prev.healthSync,
            weightEntries: prev.weightEntries,
          }),
        }));
        return;
      }

      const status = await getHealthConnectStatus();
      if (cancelled) {
        return;
      }

      setData((prev) => mergeHealthSyncIntoData(prev, status));

      if (shouldAutoRefreshHealthConnect(status)) {
        const refreshed = await syncHealthConnectData();
        if (!cancelled) {
          setData((prev) => mergeHealthSyncIntoData(prev, refreshed));
        }
      }
    };

    void syncHealthStatus().catch((error) => {
      reportError(error, { scope: 'health_sync_boot', userId });
    });

    return () => {
      cancelled = true;
    };
  }, [setData, userId]);

  useEffect(() => {
    if (!foodModalOpen || manualNutritionMode) {
      return;
    }

    const query = parseFoodInput(foodSearchInput).foodName || foodSearchInput.trim();
    if (query.length < 2) {
      setFoodSearchResults([]);
      setIsFoodSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsFoodSearchLoading(true);
      void searchFoods(query)
        .then((results) => {
          if (cancelled) {
            return;
          }

          startTransition(() => {
            setFoodSearchResults(results);
          });
        })
        .catch((error) => {
          reportError(error, { scope: 'food_search', query, userId });
          if (!cancelled) {
            setFoodSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsFoodSearchLoading(false);
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [foodModalOpen, foodSearchInput, manualNutritionMode, userId]);

  useEffect(() => {
    if (!selectedFoodBase) {
      return;
    }

    const scaled = scaleFoodNutrition(
      selectedFoodBase,
      Math.max(0.1, getNumericInputValue(foodQuantity, 1)),
      foodUnit || 'serving'
    );
    setNutritionFieldsFromFood(scaled);
  }, [foodQuantity, foodUnit, selectedFoodBase]);

  const shouldShowReviewPanel = Boolean(editingFoodEntry || manualNutritionMode || selectedFoodBase);
  const shouldShowManualNutritionFields = shouldShowReviewPanel;
  const foodDraftName = foodSearchInput.trim();
  const foodDraftValue = foodDraftName;
  const foodServingSize = foodDraftMeta.servingSize || selectedFoodBase?.servingSize || '1 serving';

  const currentFoodDraft = useMemo(
    () => ({
      name: foodDraftName,
      calories: getNumericInputValue(foodCalories),
      protein: getNumericInputValue(foodProtein),
      carbs: getNumericInputValue(foodCarbs),
      fat: getNumericInputValue(foodFat),
      fiber: foodFiber ? getNumericInputValue(foodFiber) : undefined,
      sugar: foodSugar ? getNumericInputValue(foodSugar) : undefined,
      sodiumMg: foodSodiumMg ? getNumericInputValue(foodSodiumMg) : undefined,
      quantity: Math.max(0.1, getNumericInputValue(foodQuantity, 1)),
      unit: foodUnit.trim() || 'serving',
      servingSize: foodServingSize,
      servingWeightGrams: foodDraftMeta.servingWeightGrams,
      source: foodDraftMeta.source,
      confidence: foodDraftMeta.confidence,
      trustLevel: foodDraftMeta.trustLevel,
      sourceDetail: foodDraftMeta.sourceDetail,
      verifiedSource: foodDraftMeta.verifiedSource,
      barcode: normalizeBarcode(foodBarcode || foodDraftMeta.barcode || ''),
      brandName: foodDraftMeta.brandName,
    }),
    [
      foodBarcode,
      foodCalories,
      foodCarbs,
      foodDraftMeta,
      foodDraftName,
      foodFat,
      foodFiber,
      foodProtein,
      foodQuantity,
      foodServingSize,
      foodSodiumMg,
      foodSugar,
      foodUnit,
    ]
  );

  const currentFoodTrust = useMemo(() => describeFoodTrust(currentFoodDraft), [currentFoodDraft]);
  const currentFoodReviewInsight = useMemo(
    () => buildFoodReviewInsight(currentFoodDraft),
    [currentFoodDraft]
  );

  const reviewNutritionChips = useMemo(
    () =>
      shouldShowReviewPanel
        ? [
            { label: 'Calories', value: formatNutritionValue(currentFoodDraft.calories, 'calorie') },
            { label: 'Protein', value: formatNutritionValue(currentFoodDraft.protein) },
            { label: 'Carbs', value: formatNutritionValue(currentFoodDraft.carbs) },
            { label: 'Fat', value: formatNutritionValue(currentFoodDraft.fat) },
          ]
        : [],
    [currentFoodDraft, shouldShowReviewPanel]
  );

  const currentFoodTrustBadgeClassName =
    currentFoodTrust.trustLevel === 'verified'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : currentFoodTrust.trustLevel === 'reference'
        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
        : currentFoodTrust.trustLevel === 'estimate'
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          : 'bg-slate-500/10 text-slate-700 dark:text-slate-300';

  const footerHint = useMemo(() => {
    if (currentFoodDraft.source === 'ai') {
      return {
        title: 'Photo scan stays review-first',
        detail: 'Check portion size, oils, and mixed dishes before you save the estimate.',
      };
    }

    if (currentFoodDraft.source === 'manual') {
      return {
        title: 'Manual entry stays flexible',
        detail: 'Use manual mode when the food is niche, homemade, or easier to log from memory.',
      };
    }

    return {
      title: 'Reference-backed result',
      detail: 'You can still adjust amount, macros, or notes before this goes into your log.',
    };
  }, [currentFoodDraft.source]);

  const mealOptions = useMemo(
    () =>
      MEAL_TYPES.map((value) => ({
        value,
        label: MEAL_LABELS[value],
        icon: MEAL_VISUALS[value].icon,
      })),
    []
  );

  const resolvedHealthSync = useMemo(
    () =>
      buildHealthSyncState({
        activityEntries: data.activityEntries,
        current: data.healthSync,
        weightEntries: data.weightEntries,
      }),
    [data.activityEntries, data.healthSync, data.weightEntries]
  );

  const dayFood = useMemo(
    () => data.foodEntries.filter((entry) => isSameDay(entry.timestamp, selectedDate)),
    [data.foodEntries, selectedDate]
  );
  const dayWater = useMemo(
    () => data.waterEntries.filter((entry) => isSameDay(entry.timestamp, selectedDate)),
    [data.waterEntries, selectedDate]
  );
  const dailyActivity = useMemo(
    () => data.activityEntries.filter((entry) => isSameDay(entry.timestamp, selectedDate)),
    [data.activityEntries, selectedDate]
  );

  const dailyStats = useMemo(
    () => ({
      consumed: dayFood.reduce((sum, entry) => sum + entry.calories, 0),
      protein: dayFood.reduce((sum, entry) => sum + entry.protein, 0),
      carbs: dayFood.reduce((sum, entry) => sum + entry.carbs, 0),
      fat: dayFood.reduce((sum, entry) => sum + entry.fat, 0),
      fiber: dayFood.reduce((sum, entry) => sum + (entry.fiber || 0), 0),
      sugar: dayFood.reduce((sum, entry) => sum + (entry.sugar || 0), 0),
      sodium: dayFood.reduce((sum, entry) => sum + (entry.sodiumMg || 0), 0),
      water: dayWater.reduce((sum, entry) => sum + entry.amountMl, 0),
      burned: dailyActivity.reduce((sum, entry) => sum + entry.caloriesBurned, 0),
      dayFoodCount: dayFood.length,
      dayActivityCount: dailyActivity.length,
    }),
    [dailyActivity, dayFood, dayWater]
  );

  const dailyNetCarbs = Math.max(0, dailyStats.carbs - dailyStats.fiber);
  const calorieProgressPercent = clampNumber(
    Math.round((dailyStats.consumed / Math.max(1, data.profile.dailyCalorieGoal)) * 100),
    0,
    100
  );
  const proteinProgressPercent = clampNumber(
    Math.round((dailyStats.protein / Math.max(1, proteinGoal)) * 100),
    0,
    100
  );
  const waterProgressPercent = clampNumber(
    Math.round((dailyStats.water / Math.max(1, data.profile.dailyWaterGoalMl)) * 100),
    0,
    100
  );
  const remainingCalories = Math.max(0, data.profile.dailyCalorieGoal - dailyStats.consumed);
  const remainingProtein = Math.max(0, proteinGoal - dailyStats.protein);
  const remainingWater = Math.max(0, data.profile.dailyWaterGoalMl - dailyStats.water);
  const loggingStreak = data.profile.loggingStreak;

  const goalFocusKey = data.profile.onboarding?.primaryFocus ?? DEFAULT_ONBOARDING.primaryFocus;
  const goalFocusLabel =
    GOAL_FOCUS_OPTIONS.find((option) => option.value === goalFocusKey)?.label ?? GOAL_LABELS[data.profile.goalType];
  const goalModeLabel = GOAL_LABELS[data.profile.goalType];
  const selectedDashboardMetricLabels = selectedDashboardMetrics.map((metric) =>
    metric === 'carbs' && data.profile.netCarbsMode
      ? 'Net Carbs'
      : DASHBOARD_METRIC_OPTIONS.find((option) => option.value === metric)?.label ?? metric
  );

  const activeFastingPlan =
    FASTING_PLAN_OPTIONS.find((option) => option.value === (data.profile.fastingPlan || '16:8')) || FASTING_PLAN_OPTIONS[2];
  const fastingProgressPercent = useMemo(() => {
    if (!data.fastingState?.isActive || !data.fastingState.startedAt) {
      return 0;
    }

    const elapsedHours = Math.max(0, (timeNow - data.fastingState.startedAt) / (1000 * 60 * 60));
    return clampNumber(Math.round((elapsedHours / activeFastingPlan.fastHours) * 100), 0, 100);
  }, [activeFastingPlan.fastHours, data.fastingState?.isActive, data.fastingState?.startedAt, timeNow]);

  const fastingSummary = useMemo(() => {
    if (!data.fastingState?.isActive || !data.fastingState.startedAt) {
      return {
        status: 'Ready to start',
        headline: `${activeFastingPlan.label} fast`,
        detail: `${activeFastingPlan.fastHours}h fasting | ${activeFastingPlan.eatingHours}h eating window`,
      };
    }

    const elapsedHours = Math.max(0, (timeNow - data.fastingState.startedAt) / (1000 * 60 * 60));
    const remainingHours = Math.max(0, activeFastingPlan.fastHours - elapsedHours);

    if (remainingHours <= 0.05) {
      return {
        status: 'Fast complete',
        headline: `${activeFastingPlan.label} complete`,
        detail: 'End the fast when you are ready to log your next meal.',
      };
    }

    return {
      status: 'Fast in progress',
      headline: `${remainingHours.toFixed(1)}h remaining`,
      detail: `${elapsedHours.toFixed(1)}h done of your ${activeFastingPlan.fastHours}h target`,
    };
  }, [activeFastingPlan.eatingHours, activeFastingPlan.fastHours, activeFastingPlan.label, data.fastingState?.isActive, data.fastingState?.startedAt, timeNow]);

  const dailyQualityInsight = useMemo(
    () =>
      buildDayQualityInsight({
        calorieGoal: data.profile.dailyCalorieGoal,
        consumed: dailyStats.consumed,
        entries: dayFood,
        protein: dailyStats.protein,
        proteinGoal,
        water: dailyStats.water,
        waterGoalMl: data.profile.dailyWaterGoalMl,
      }),
    [dailyStats.consumed, dailyStats.protein, dailyStats.water, data.profile.dailyCalorieGoal, data.profile.dailyWaterGoalMl, dayFood, proteinGoal]
  );

  const coachInsights = useMemo(
    () =>
      generateCoachInsights({
        stats: {
          consumed: dailyStats.consumed,
          burned: dailyStats.burned,
          water: dailyStats.water,
          protein: dailyStats.protein,
          carbs: dailyStats.carbs,
          fat: dailyStats.fat,
          dayFoodCount: dailyStats.dayFoodCount,
          dayActivityCount: dailyStats.dayActivityCount,
        },
        profile: data.profile,
        loggingStreak,
        proteinGoal,
      }),
    [dailyStats, data.profile, loggingStreak, proteinGoal]
  );

  const achievements = useMemo(
    () =>
      evaluateAchievements({
        data,
        loggingStreak,
        consumed: dailyStats.consumed,
        protein: dailyStats.protein,
        water: dailyStats.water,
        proteinGoal,
      }).achievements,
    [data, dailyStats.consumed, dailyStats.protein, dailyStats.water, loggingStreak, proteinGoal]
  );

  const achievementSummary = useMemo(() => {
    const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
    const nextLocked = achievements.find((achievement) => !achievement.unlocked) || null;

    return {
      total: achievements.length,
      unlockedCount,
      completionRate: achievements.length ? Math.round((unlockedCount / achievements.length) * 100) : 0,
      nextLocked: nextLocked
        ? {
            title: nextLocked.title,
            description: nextLocked.description,
          }
        : null,
    };
  }, [achievements]);

  const mobileSyncBadge = useMemo(() => {
    if (!userId) {
      return {
        label: 'Local only',
        className: 'border border-amber-200 bg-amber-50 text-amber-700',
      };
    }

    if (!isOnline) {
      return {
        label: 'Offline mode',
        className: 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200',
      };
    }

    if (foodLogError) {
      return {
        label: 'Sync issue',
        className: 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
      };
    }

    return {
      label: 'Cloud backed',
      className: 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    };
  }, [foodLogError, isOnline, userId]);

  const handleQuickWaterChange = (amount: number) => {
    const entry: WaterEntry = {
      id: crypto.randomUUID(),
      amountMl: amount,
      timestamp: Date.now(),
    };

    setData((prev) => ({
      ...prev,
      waterEntries: [entry, ...prev.waterEntries].sort((left, right) => right.timestamp - left.timestamp),
    }));
    showToast(`${amount} ml water logged.`);
  };

  const handleSubmitHabitDialog = () => {
    if (!habitDialog?.name.trim()) {
      showToast('Add a habit name first.', 'error');
      return;
    }

    setData((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: crypto.randomUUID(),
          name: habitDialog.name.trim(),
          icon: 'Sparkles',
          color: '#22c55e',
        },
      ],
    }));
    setHabitDialog(null);
    showToast('Habit added.');
  };

  const handleSubmitActivityDialog = () => {
    if (!activityDialog?.name.trim()) {
      showToast('Add a workout name first.', 'error');
      return;
    }

    const durationMinutes = Math.max(1, getIntegerInputValue(activityDialog.duration, 30));
    const caloriesBurned = Math.max(0, getIntegerInputValue(activityDialog.calories, 150));

    if (activityDialog.entryId) {
      setData((prev) => ({
        ...prev,
        activityEntries: prev.activityEntries.map((item) =>
          item.id === activityDialog.entryId
            ? {
                ...item,
                name: activityDialog.name.trim(),
                durationMinutes,
                caloriesBurned,
                intensity: caloriesBurned >= 350 ? 'High' : caloriesBurned >= 180 ? 'Medium' : 'Low',
              }
            : item
        ),
      }));
      showToast('Workout updated.');
    } else {
      const entry: ActivityEntry = {
        id: crypto.randomUUID(),
        name: activityDialog.name.trim(),
        durationMinutes,
        caloriesBurned,
        intensity: caloriesBurned >= 350 ? 'High' : caloriesBurned >= 180 ? 'Medium' : 'Low',
        timestamp: Date.now(),
      };

      setData((prev) => ({
        ...prev,
        activityEntries: [entry, ...prev.activityEntries].sort((left, right) => right.timestamp - left.timestamp),
      }));
      showToast('Workout logged.');
    }

    setActivityDialog(null);
  };

  const handleSubmitWaterDialog = () => {
    if (!waterDialog) {
      return;
    }

    const amountMl = Math.max(1, getIntegerInputValue(waterDialog.amount, 250));
    if (waterDialog.entryId) {
      setData((prev) => ({
        ...prev,
        waterEntries: prev.waterEntries.map((item) => (item.id === waterDialog.entryId ? { ...item, amountMl } : item)),
      }));
      showToast('Water entry updated.');
    } else {
      handleQuickWaterChange(amountMl);
    }

    setWaterDialog(null);
  };

  const handleSubmitTemplateDialog = () => {
    if (!templateDialog?.name.trim()) {
      showToast('Add a template name first.', 'error');
      return;
    }

    const mealEntries = dayFood.filter((entry) => entry.mealType === templateDialog.mealType);
    if (mealEntries.length === 0) {
      showToast('Log a meal first before saving it as a template.', 'error');
      return;
    }

    setData((prev) => ({
      ...prev,
      mealTemplates: [
        createMealTemplate({
          name: templateDialog.name.trim(),
          mealType: templateDialog.mealType,
          entries: mealEntries,
        }),
        ...prev.mealTemplates,
      ].slice(0, 24),
    }));
    setTemplateDialog(null);
    showToast('Meal template saved.');
  };

  const handleSubmitWeightEditDialog = () => {
    if (!weightEditDialog) {
      return;
    }

    const weight = Math.max(0, getNumericInputValue(weightEditDialog.weight));
    setData((prev) => ({
      ...prev,
      weightEntries: prev.weightEntries.map((item) => (item.id === weightEditDialog.entryId ? { ...item, weight } : item)),
      profile: { ...prev.profile, currentWeight: weight },
    }));
    setWeightEditDialog(null);
    showToast('Weight updated.');
  };

  const handleToggleHabit = (habitId: string) => {
    const todayKey = getDateKey(new Date());
    const existingLog = data.habitLogs.find((log) => log.habitId === habitId && getDateKey(log.timestamp) === todayKey);

    if (existingLog) {
      setData((prev) => ({
        ...prev,
        habitLogs: prev.habitLogs.filter((log) => log.id !== existingLog.id),
      }));
      addActionFeedback('habit', 'Habit unchecked for today.');
      setRecentCompletedHabitId(null);
      return;
    }

    setData((prev) => ({
      ...prev,
      habitLogs: [
        { id: crypto.randomUUID(), habitId, timestamp: Date.now() },
        ...prev.habitLogs,
      ],
    }));
    addActionFeedback('habit', 'Habit completed.');
    setRecentCompletedHabitId(habitId);
  };

  const handleOpenAddHabit = () => {
    setHabitDialog({ name: '' });
  };

  const handleDeleteHabit = (habit: HealthData['habits'][number]) => {
    setConfirmDialog({
      title: `Delete ${habit.name}?`,
      description: 'This removes the habit and its past check-ins from the app.',
      confirmLabel: 'Delete habit',
      tone: 'danger',
      onConfirm: () => {
        setData((prev) => ({
          ...prev,
          habits: prev.habits.filter((item) => item.id !== habit.id),
          habitLogs: prev.habitLogs.filter((log) => log.habitId !== habit.id),
        }));
        showToast('Habit removed.');
      },
    });
  };

  const handleOpenAddActivity = () => {
    setActivityDialog({
      title: 'Log workout',
      submitLabel: 'Save workout',
      name: '',
      duration: '30',
      calories: '150',
    });
  };

  const handleLogWeight = (weight: number) => {
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      weight: roundNutrition(weight),
      timestamp: Date.now(),
      source: 'manual',
    };

    setData((prev) => ({
      ...prev,
      weightEntries: [...prev.weightEntries, entry].sort((left, right) => left.timestamp - right.timestamp),
      profile: {
        ...prev.profile,
        currentWeight: roundNutrition(weight),
      },
    }));
    setRecentWeightEntryId(entry.id);
    addActionFeedback('weight', 'Weight logged.');
  };

  const handleDeleteWeightEntry = async (entryId: string) => {
    setConfirmDialog({
      title: 'Delete weight entry?',
      description: 'This removes the weigh-in from your progress trend.',
      confirmLabel: 'Delete weight',
      tone: 'danger',
      onConfirm: () => {
        setData((prev) => ({
          ...prev,
          weightEntries: prev.weightEntries.filter((entry) => entry.id !== entryId),
        }));
        showToast('Weight entry deleted.');
      },
    });
  };

  const handleGoalFocusChange = (nextFocus: OnboardingProfile['primaryFocus']) => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        onboarding: {
          ...prev.profile.onboarding,
          primaryFocus: nextFocus,
        },
      },
    }));
  };

  const persistFoodEntry = async (payload: Omit<FoodEntry, 'id'>) => {
    if (editingFoodEntry) {
      const nextEntry: FoodEntry = { ...payload, id: editingFoodEntry.id };
      if (userId) {
        await updateFoodLog(userId, editingFoodEntry.id, payload);
      }
      setData((prev) => ({
        ...prev,
        foodEntries: prev.foodEntries.map((entry) => (entry.id === editingFoodEntry.id ? nextEntry : entry)),
        barcodeLibrary: payload.barcode
          ? upsertBarcodeCatalog({
              library: prev.barcodeLibrary,
              barcode: payload.barcode,
              food: foodEntryToSearchResult(nextEntry),
            })
          : prev.barcodeLibrary,
      }));
      return nextEntry;
    }

    const nextEntry = userId
      ? await addFoodLog(userId, payload)
      : { ...payload, id: crypto.randomUUID() };

    setData((prev) => ({
      ...prev,
      foodEntries: [nextEntry, ...prev.foodEntries].sort((left, right) => right.timestamp - left.timestamp),
      barcodeLibrary: payload.barcode
        ? upsertBarcodeCatalog({
            library: prev.barcodeLibrary,
            barcode: payload.barcode,
            food: foodEntryToSearchResult(nextEntry),
          })
        : prev.barcodeLibrary,
    }));
    return nextEntry;
  };

  const handleSaveRecentFood = (food: FoodSearchResult) => {
    saveRecentFood(food);
    saveFoodToHistory(food.name);
    setRecentFoods(getRecentFoods());
  };

  const handleFoodSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!foodDraftValue) {
      showToast('Add a food name first.', 'error');
      return;
    }

    if (!shouldShowReviewPanel) {
      const parsed = parseFoodInput(foodSearchInput);
      const lookupName = parsed.foodName || foodSearchInput.trim();
      const nextQuantity = Math.max(0.1, parsed.quantity || 1);
      const nextUnit = parsed.unit || 'serving';

      try {
        setIsAnalyzing(true);
        const matched = await lookupFoodData(lookupName, nextQuantity, nextUnit);
        if (matched) {
          applyFoodResultToDraft(matched, {
            name: lookupName,
            quantity: nextQuantity,
            unit: nextUnit,
          });
          return;
        }

        openManualEntry();
      } catch (error) {
        reportError(error, { scope: 'food_lookup', food: foodSearchInput, userId });
        openManualEntry();
      } finally {
        setIsAnalyzing(false);
      }

      return;
    }

    const payload: Omit<FoodEntry, 'id'> = {
      name: foodDraftValue,
      calories: currentFoodDraft.calories,
      protein: currentFoodDraft.protein,
      carbs: currentFoodDraft.carbs,
      fat: currentFoodDraft.fat,
      fiber: currentFoodDraft.fiber,
      sugar: currentFoodDraft.sugar,
      sodiumMg: currentFoodDraft.sodiumMg,
      quantity: currentFoodDraft.quantity,
      unit: currentFoodDraft.unit,
      servingSize: currentFoodDraft.servingSize,
      servingWeightGrams: currentFoodDraft.servingWeightGrams,
      createdAt: editingFoodEntry?.createdAt ?? Date.now(),
      timestamp: Date.now(),
      mealType,
      source: currentFoodDraft.source,
      confidence: currentFoodDraft.confidence,
      trustLevel: currentFoodDraft.trustLevel,
      sourceDetail: currentFoodDraft.sourceDetail,
      verifiedSource: currentFoodDraft.verifiedSource,
      barcode: currentFoodDraft.barcode || undefined,
      brandName: currentFoodDraft.brandName || undefined,
    };

    try {
      const savedEntry = await persistFoodEntry(payload);
      handleSaveRecentFood(foodEntryToSearchResult(savedEntry));
      addActionFeedback('food', editingFoodEntry ? 'Food updated.' : 'Food logged.');
      trackEvent(editingFoodEntry ? 'food_updated' : 'food_logged', {
        mealType,
        source: payload.source,
        userId,
      });
      closeFoodModal();
    } catch (error) {
      reportError(error, { scope: 'food_save', userId, mealType, source: payload.source });
      showToast('Food could not be saved right now.', 'error');
    }
  };

  const handleSearchResultSelect = async (item: FoodSearchResult) => {
    const parsed = parseFoodInput(foodSearchInput);
    applyFoodResultToDraft(item, {
      quantity: parsed.quantity || 1,
      unit: parsed.unit || 'serving',
      name: item.name,
    });
  };

  const handleRecentFoodSelect = async (food: FoodSearchResult, nextMealType: MealType) => {
    try {
      const quantity = Math.max(0.1, getNumericInputValue(foodQuantity, 1));
      const unit = foodUnit || 'serving';
      const scaled = scaleFoodNutrition(food, quantity, unit);
      const payload: Omit<FoodEntry, 'id'> = {
        name: food.name,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        fiber: scaled.fiber,
        sugar: scaled.sugar,
        sodiumMg: scaled.sodiumMg,
        quantity,
        unit,
        servingSize: food.servingSize || '1 serving',
        servingWeightGrams: food.servingWeightGrams,
        createdAt: Date.now(),
        timestamp: Date.now(),
        mealType: nextMealType,
        source: food.source,
        confidence: food.confidence,
        trustLevel: food.trustLevel,
        sourceDetail: food.sourceDetail,
        verifiedSource: food.verifiedSource,
        barcode: food.barcode,
        brandName: food.brandName,
      };
      const savedEntry = await persistFoodEntry(payload);
      handleSaveRecentFood(foodEntryToSearchResult(savedEntry));
      addActionFeedback('food', `${food.name} re-added.`);
      closeFoodModal();
    } catch (error) {
      reportError(error, { scope: 'recent_food_save', userId });
      showToast('Recent food could not be added.', 'error');
    }
  };

  const handleFoodImageUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setIsAnalyzing(true);
      const dataUrl = await readFileAsDataUrl(file);
      const [meta, base64] = dataUrl.split(',');
      const mimeType = meta.match(/^data:(.+);base64$/)?.[1] || file.type || 'image/jpeg';
      const scannedFood = await scanFoodImage({ base64, mimeType });
      applyFoodResultToDraft(scannedFood, { quantity: 1, unit: 'serving', name: scannedFood.name });
      setFoodModalOpen(true);
      setActiveTab('today');
      showToast('Photo scan ready for review.');
    } catch (error) {
      reportError(error, { scope: 'food_scan', userId, fileType: file.type || 'unknown' });
      showToast(error instanceof Error ? error.message : 'Photo scan could not analyze that image.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickCameraFlow = () => {
    if (!aiFoodScanAvailable) {
      showToast('Photo scan is not set up here yet. Use search or manual entry for now.', 'error');
      return;
    }

    setActiveTab('scan');
    if (!cameraInputRef.current) {
      showToast('Camera scan is not ready yet. Try again in a moment.', 'error');
      return;
    }

    cameraInputRef.current.click();
  };

  const handleQuickGalleryFlow = () => {
    if (!aiFoodScanAvailable) {
      showToast('Photo scan is not set up here yet. Use search or manual entry for now.', 'error');
      return;
    }

    setActiveTab('scan');
    if (!fileInputRef.current) {
      showToast('Photo upload is not ready yet. Try again in a moment.', 'error');
      return;
    }

    fileInputRef.current.click();
  };

  const handleBarcodeLookup = async () => {
    const normalized = normalizeBarcode(foodBarcode);
    if (!normalized) {
      showToast('Enter a valid barcode first.', 'error');
      return;
    }

    try {
      setIsBarcodeScanning(true);
      const result = await lookupBarcodeFood({ barcode: normalized, library: data.barcodeLibrary });
      if (!result) {
        showToast('No packaged food match was found for that barcode.', 'error');
        return;
      }

      applyFoodResultToDraft(result, { quantity: 1, unit: 'serving', name: result.name });
      setFoodModalOpen(true);
      showToast('Barcode match ready for review.');
    } catch (error) {
      reportError(error, { scope: 'barcode_lookup', barcode: normalized, userId });
      showToast('Barcode lookup failed right now.', 'error');
    } finally {
      setIsBarcodeScanning(false);
    }
  };

  const handleBarcodeImageUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setIsBarcodeScanning(true);
      const detectedBarcode = (await detectBarcodeFromFile(file)) || normalizeBarcode(file.name);
      if (!detectedBarcode) {
        showToast('No barcode was detected in that image.', 'error');
        return;
      }

      setFoodBarcode(detectedBarcode);
      const result = await lookupBarcodeFood({ barcode: detectedBarcode, library: data.barcodeLibrary });
      if (!result) {
        showToast('That barcode did not match a saved or USDA item.', 'error');
        return;
      }

      applyFoodResultToDraft(result, { quantity: 1, unit: 'serving', name: result.name });
      setFoodModalOpen(true);
    } catch (error) {
      reportError(error, { scope: 'barcode_image_lookup', userId });
      showToast('Barcode image lookup failed.', 'error');
    } finally {
      setIsBarcodeScanning(false);
    }
  };

  const handleDeleteFoodEntry = async (entryId: string) => {
    setConfirmDialog({
      title: 'Delete food entry?',
      description: 'This removes the meal from your log and daily totals.',
      confirmLabel: 'Delete food',
      tone: 'danger',
      onConfirm: async () => {
        setData((prev) => ({
          ...prev,
          foodEntries: prev.foodEntries.filter((entry) => entry.id !== entryId),
        }));

        if (userId) {
          try {
            await deleteFoodLog(userId, entryId);
          } catch (error) {
            reportError(error, { scope: 'food_delete', entryId, userId });
            showToast('Food was removed locally, but cloud delete failed.', 'error');
            return;
          }
        }

        showToast('Food deleted.');
      },
    });
  };

  const handleDeleteWaterEntry = async (entryId: string) => {
    setConfirmDialog({
      title: 'Delete water entry?',
      description: 'This removes the hydration check-in from your day.',
      confirmLabel: 'Delete water',
      tone: 'danger',
      onConfirm: () => {
        setData((prev) => ({
          ...prev,
          waterEntries: prev.waterEntries.filter((entry) => entry.id !== entryId),
        }));
        showToast('Water entry deleted.');
      },
    });
  };

  const isFavoriteFoodEntry = (entry: FoodEntry) =>
    data.favoriteFoods.some(
      (favorite) =>
        favorite.name.toLowerCase() === entry.name.toLowerCase() &&
        (favorite.barcode || '') === (entry.barcode || '') &&
        favorite.source === entry.source
    );

  const handleToggleFavoriteFoodEntry = (entry: FoodEntry) => {
    const favoriteFood = foodEntryToSearchResult(entry);
    setData((prev) => {
      const exists = prev.favoriteFoods.some(
        (favorite) =>
          favorite.name.toLowerCase() === favoriteFood.name.toLowerCase() &&
          (favorite.barcode || '') === (favoriteFood.barcode || '') &&
          favorite.source === favoriteFood.source
      );

      return {
        ...prev,
        favoriteFoods: exists
          ? prev.favoriteFoods.filter(
              (favorite) =>
                !(
                  favorite.name.toLowerCase() === favoriteFood.name.toLowerCase() &&
                  (favorite.barcode || '') === (favoriteFood.barcode || '') &&
                  favorite.source === favoriteFood.source
                )
            )
          : [favoriteFood, ...prev.favoriteFoods].slice(0, 20),
      };
    });
  };

  const handleOpenWaterModal = () => {
    setWaterDialog({
      title: 'Log water',
      submitLabel: 'Save water',
      amount: '250',
    });
  };

  const handleSaveMealTemplate = (nextMealType: MealType) => {
    const mealEntries = dayFood.filter((entry) => entry.mealType === nextMealType);
    if (mealEntries.length === 0) {
      showToast('Log a meal first before saving it as a template.', 'error');
      return;
    }

    setTemplateDialog({
      mealType: nextMealType,
      name: `${MEAL_LABELS[nextMealType]} favorite`,
    });
  };

  const handleEditCombinedHistoryEntry = (entry: CombinedHistoryEntryView) => {
    if (entry.type === 'food') {
      openFoodEditor(entry);
      return;
    }

    if (entry.type === 'water') {
      setWaterDialog({
        title: 'Edit water',
        submitLabel: 'Update water',
        entryId: entry.id,
        amount: String(entry.amountMl),
      });
      return;
    }

    if (entry.type === 'weight') {
      setWeightEditDialog({
        entryId: entry.id,
        weight: String(entry.weight),
      });
      return;
    }

    if (entry.type === 'activity') {
      setActivityDialog({
        title: 'Edit workout',
        submitLabel: 'Update workout',
        entryId: entry.id,
        name: entry.name,
        duration: String(entry.durationMinutes),
        calories: String(entry.caloriesBurned),
      });
      return;
    }

    showToast('Habit history cannot be edited directly.', 'error');
  };

  const handleDeleteCombinedHistoryEntry = async (entry: CombinedHistoryEntryView) => {
    if (entry.type === 'food') {
      await handleDeleteFoodEntry(entry.id);
      return;
    }

    if (entry.type === 'water') {
      await handleDeleteWaterEntry(entry.id);
      return;
    }

    if (entry.type === 'weight') {
      await handleDeleteWeightEntry(entry.id);
      return;
    }

    if (entry.type === 'activity') {
      setConfirmDialog({
        title: 'Delete workout?',
        description: 'This removes the activity log from your day and weekly totals.',
        confirmLabel: 'Delete workout',
        tone: 'danger',
        onConfirm: () => {
          setData((prev) => ({
            ...prev,
            activityEntries: prev.activityEntries.filter((item) => item.id !== entry.id),
          }));
          showToast('Workout deleted.');
        },
      });
      return;
    }

    setConfirmDialog({
      title: 'Delete habit check-in?',
      description: 'This removes the completed habit from today.',
      confirmLabel: 'Delete check-in',
      tone: 'danger',
      onConfirm: () => {
        setData((prev) => ({
          ...prev,
          habitLogs: prev.habitLogs.filter((item) => item.id !== entry.id),
        }));
        showToast('Habit check-in deleted.');
      },
    });
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const nextState =
        resolvedHealthSync.availability === 'setup_required'
          ? await requestHealthConnectPermissions()
          : await syncHealthConnectData();
      setData((prev) => mergeHealthSyncIntoData(prev, nextState));
      showToast(
        resolvedHealthSync.availability === 'setup_required'
          ? 'Health Connect permissions updated.'
          : 'Health data synced.'
      );
    } catch (error) {
      reportError(error, { scope: 'health_sync_manual', userId });
      showToast('Health sync failed on this device.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    const permission = await requestNotificationPermission();
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        notificationPermission: permission,
      },
    }));
  };

  const handleExportBackup = () => {
    const payload = createBackupPayload(data);
    const blob = new Blob([serializeBackupPayload(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = getBackupFilename();
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported.');
  };

  const handleImportBackupClick = () => {
    importFileRef.current?.click();
  };

  const handleImportBackup: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const nextData = parseBackupText(text);
      setData(nextData);
      showToast('Backup imported.');
    } catch (error) {
      reportError(error, { scope: 'backup_import', userId });
      showToast(error instanceof Error ? error.message : 'Backup import failed.', 'error');
    }
  };

  const handleWallpaperUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const assetReference = createWallpaperAssetReference(userId);
      await saveWallpaperAsset(assetReference, dataUrl);
      setWallpaperPreviewUrl(dataUrl);
      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          wallpaperUrl: assetReference,
        },
      }));
      showToast('Wallpaper updated.');
    } catch (error) {
      reportError(error, { scope: 'wallpaper_upload', userId });
      showToast('Wallpaper could not be saved.', 'error');
    }
  };

  const handleRemoveWallpaper = () => {
    if (data.profile.wallpaperUrl && isWallpaperAssetReference(data.profile.wallpaperUrl)) {
      void deleteWallpaperAsset(data.profile.wallpaperUrl).catch((error) => {
        reportError(error, { scope: 'wallpaper_delete', userId });
      });
    }

    setWallpaperPreviewUrl('');
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        wallpaperUrl: '',
      },
    }));
  };

  const adaptiveRecommendation = useMemo(
    () =>
      buildAdaptiveCalorieRecommendation({
        foodEntries: data.foodEntries,
        profile: data.profile,
        proteinGoal,
        weightEntries: data.weightEntries,
      }),
    [data.foodEntries, data.profile, data.weightEntries, proteinGoal]
  );

  const handleApplyAdaptiveRecommendation = () => {
    setData((prev) => ({
      ...prev,
      adaptiveRecommendation,
      profile: {
        ...prev.profile,
        dailyCalorieGoal: adaptiveRecommendation.recommendedDailyCalories,
        useAutoCalorieGoal: true,
        customProteinGoal: adaptiveRecommendation.recommendedProteinGoal,
      },
    }));
    showToast('Suggested goal applied.');
  };

  const handleActivatePremium = () => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        planTier: 'premium',
        premiumActivatedAt: Date.now(),
      },
    }));
    showToast('Premium unlocked for this account.');
  };

  const handleResetAllData = async () => {
    setConfirmDialog({
      title: 'Reset all app data?',
      description: 'This clears local progress, templates, favorites, and cached setup for this account.',
      confirmLabel: 'Reset everything',
      tone: 'danger',
      onConfirm: async () => {
        try {
          if (userId && data.foodEntries.length > 0) {
            await clearFoodLogs(userId, data.foodEntries.map((entry) => entry.id));
          }
        } catch (error) {
          reportError(error, { scope: 'food_clear_remote', userId });
        }

        setWallpaperPreviewUrl('');
        setRecentFoods([]);
        setData(createInitialHealthData());
        showToast('All local app data was reset.');
      },
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const historyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = subDays(new Date(), 6 - index);
      const calories = data.foodEntries
        .filter((entry) => isSameDay(entry.timestamp, date))
        .reduce((sum, entry) => sum + entry.calories, 0);

      return {
        date: format(date, 'EEE'),
        calories: Math.round(calories),
        goal: data.profile.dailyCalorieGoal,
      };
    });
  }, [data.foodEntries, data.profile.dailyCalorieGoal]);

  const proteinHistoryData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = subDays(new Date(), 6 - index);
        return {
          date: format(date, 'EEE'),
          protein: Math.round(
            data.foodEntries
              .filter((entry) => isSameDay(entry.timestamp, date))
              .reduce((sum, entry) => sum + entry.protein, 0)
          ),
        };
      }),
    [data.foodEntries]
  );

  const waterHistoryData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = subDays(new Date(), 6 - index);
        return {
          date: format(date, 'EEE'),
          water: Math.round(
            data.waterEntries
              .filter((entry) => isSameDay(entry.timestamp, date))
              .reduce((sum, entry) => sum + entry.amountMl, 0)
          ),
          goal: data.profile.dailyWaterGoalMl,
        };
      }),
    [data.profile.dailyWaterGoalMl, data.waterEntries]
  );

  const weightHistoryData = useMemo(() => {
    return data.weightEntries
      .slice(-14)
      .map((entry) => ({
        date: format(entry.timestamp, 'MMM d'),
        weight: entry.weight,
        goal: data.profile.weightGoal,
      }));
  }, [data.profile.weightGoal, data.weightEntries]);

  const progressAverageCalories = useMemo(() => {
    const trackedDays = historyData.filter((item) => item.calories > 0);
    return trackedDays.length
      ? Math.round(trackedDays.reduce((sum, item) => sum + item.calories, 0) / trackedDays.length)
      : 0;
  }, [historyData]);

  const progressGoalGap = roundNutrition(Math.abs(data.profile.currentWeight - data.profile.weightGoal));
  const sortedWeightEntries = useMemo(
    () => [...data.weightEntries].sort((left, right) => left.timestamp - right.timestamp),
    [data.weightEntries]
  );
  const progressLatestWeightDelta =
    sortedWeightEntries.length >= 2
      ? roundNutrition(sortedWeightEntries[sortedWeightEntries.length - 1].weight - sortedWeightEntries[sortedWeightEntries.length - 2].weight)
      : null;

  const weeklyReview = useMemo(() => {
    const trackedDays = historyData.filter((item) => item.calories > 0).length;
    const goalHitDays = historyData.filter((item) => item.calories > 0 && item.calories <= data.profile.dailyCalorieGoal * 1.08).length;

    return {
      avgProtein: proteinHistoryData.length
        ? Math.round(proteinHistoryData.reduce((sum, item) => sum + item.protein, 0) / proteinHistoryData.length)
        : 0,
      avgWater: waterHistoryData.length
        ? Math.round(waterHistoryData.reduce((sum, item) => sum + item.water, 0) / waterHistoryData.length)
        : 0,
      goalHitDays,
      goalHitRate: trackedDays ? Math.round((goalHitDays / trackedDays) * 100) : 0,
      trackedDays,
      workoutCount: data.activityEntries.filter((entry) => entry.timestamp >= subDays(new Date(), 7).getTime()).length,
    };
  }, [data.activityEntries, data.profile.dailyCalorieGoal, historyData, proteinHistoryData, waterHistoryData]);

  const dailyHabitCompletion = useMemo(
    () =>
      data.habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        completed: data.habitLogs.some((log) => log.habitId === habit.id && getDateKey(log.timestamp) === getDateKey(new Date())),
        streak: getHabitStreak(habit.id, data),
      })),
    [data]
  );

  const habitCompletion = dailyHabitCompletion.map(({ completed, id, name, streak }) => ({
    completed,
    id,
    name,
    streak,
  }));

  const filteredFoodCount = dayFood.filter((entry) =>
    !foodSearchQuery.trim() || entry.name.toLowerCase().includes(foodSearchQuery.trim().toLowerCase())
  ).length;

  const mealSections = MEAL_TYPES.map((meal) => {
    const entries = dayFood.filter((entry) => entry.mealType === meal);
    const visibleEntries = entries.filter(
      (entry) => !foodSearchQuery.trim() || entry.name.toLowerCase().includes(foodSearchQuery.trim().toLowerCase())
    );

    return {
      meal,
      title: MEAL_LABELS[meal],
      entries: visibleEntries,
      entryCount: entries.length,
      totalCalories: Math.round(entries.reduce((sum, entry) => sum + entry.calories, 0)),
      totalProtein: Math.round(entries.reduce((sum, entry) => sum + entry.protein, 0)),
    };
  });

  const dayWeightEntries = data.weightEntries.filter((entry) => isSameDay(entry.timestamp, selectedDate));
  const dayHabitHistoryEntries: HabitHistoryEntry[] = data.habitLogs
    .filter((entry) => isSameDay(entry.timestamp, selectedDate))
    .map((entry) => {
      const habit = data.habits.find((item) => item.id === entry.habitId);
      return {
        ...entry,
        type: 'habit',
        icon: habit?.icon || 'Sparkles',
        name: habit?.name || 'Habit',
      };
    });

  const combinedHistory = useMemo(
    () =>
      [
        ...dayFood.map((entry) => ({ ...entry, type: 'food' as const })),
        ...dailyActivity.map((entry) => ({ ...entry, type: 'activity' as const })),
        ...dayWater.map((entry) => ({ ...entry, type: 'water' as const })),
        ...dayWeightEntries.map((entry) => ({ ...entry, type: 'weight' as const })),
        ...dayHabitHistoryEntries,
      ].sort((left, right) => right.timestamp - left.timestamp),
    [dailyActivity, dayFood, dayHabitHistoryEntries, dayWater, dayWeightEntries]
  );

  const getCombinedHistoryTitle = (entry: CombinedHistoryEntryView) => {
    switch (entry.type) {
      case 'food':
        return entry.name;
      case 'activity':
        return entry.name;
      case 'water':
        return 'Water';
      case 'weight':
        return 'Weight';
      case 'habit':
      default:
        return entry.name;
    }
  };

  const getCombinedHistoryMetric = (entry: CombinedHistoryEntryView) => {
    switch (entry.type) {
      case 'food':
        return `${Math.round(entry.calories)} kcal`;
      case 'activity':
        return `${entry.caloriesBurned} kcal`;
      case 'water':
        return `${entry.amountMl} ml`;
      case 'weight':
        return `${entry.weight}${data.profile.weightUnit}`;
      case 'habit':
      default:
        return format(entry.timestamp, 'p');
    }
  };

  const progressHighlight =
    waterProgressPercent < 60 ? 'water' : proteinProgressPercent < 70 ? 'protein' : calorieProgressPercent < 70 ? 'calories' : null;

  const metricCardMap = {
    calories: {
      label: 'Calories',
      value: `${Math.round(dailyStats.consumed)}`,
      helper: remainingCalories <= 0 ? 'Goal reached today' : `${Math.round(remainingCalories)} kcal left`,
      icon: Flame,
      accentClass: 'premium-feature-tile premium-feature-tile-brand',
      highlight: 'calories' as const,
      progress: calorieProgressPercent,
      progressFill: 'linear-gradient(90deg, #22c55e, #16a34a)',
    },
    protein: {
      label: 'Protein',
      value: `${Math.round(dailyStats.protein)}g`,
      helper: remainingProtein <= 0 ? 'Protein goal covered' : `${Math.round(remainingProtein)}g left`,
      icon: Utensils,
      accentClass: 'premium-feature-tile premium-feature-tile-amber',
      highlight: 'protein' as const,
      progress: proteinProgressPercent,
      progressFill: 'linear-gradient(90deg, #0f172a, #475569)',
    },
    water: {
      label: 'Hydration',
      value: `${Math.round(dailyStats.water)} ml`,
      helper: remainingWater <= 0 ? 'Water goal covered' : `${Math.round(remainingWater)} ml left`,
      icon: Droplets,
      accentClass: 'premium-feature-tile premium-home-grid-card-water',
      highlight: 'water' as const,
      progress: waterProgressPercent,
      progressFill: 'linear-gradient(90deg, #38bdf8, #0284c7)',
    },
    carbs: {
      label: data.profile.netCarbsMode ? 'Net carbs' : 'Carbs',
      value: `${Math.round(data.profile.netCarbsMode ? dailyNetCarbs : dailyStats.carbs)}g`,
      helper: `Goal ${carbsGoal}g`,
      icon: Brain,
      accentClass: 'premium-feature-tile premium-home-grid-card-carbs',
      progress: clampNumber(Math.round(((data.profile.netCarbsMode ? dailyNetCarbs : dailyStats.carbs) / Math.max(1, carbsGoal)) * 100), 0, 100),
      progressFill: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    },
    fat: {
      label: 'Fat',
      value: `${Math.round(dailyStats.fat)}g`,
      helper: `Goal ${fatGoal}g`,
      icon: Heart,
      accentClass: 'premium-feature-tile premium-home-grid-card-fat',
      progress: clampNumber(Math.round((dailyStats.fat / Math.max(1, fatGoal)) * 100), 0, 100),
      progressFill: 'linear-gradient(90deg, #fb7185, #fda4af)',
    },
    fiber: {
      label: 'Fiber',
      value: `${Math.round(dailyStats.fiber)}g`,
      helper: 'Target 30g daily',
      icon: Sparkles,
      accentClass: 'premium-feature-tile',
      progress: clampNumber(Math.round((dailyStats.fiber / 30) * 100), 0, 100),
      progressFill: 'linear-gradient(90deg, #22c55e, #84cc16)',
    },
    sugar: {
      label: 'Sugar',
      value: `${Math.round(dailyStats.sugar)}g`,
      helper: 'Keep packaged-food spikes visible',
      icon: Coffee,
      accentClass: 'premium-feature-tile',
      progress: clampNumber(Math.round((dailyStats.sugar / 50) * 100), 0, 100),
      progressFill: 'linear-gradient(90deg, #f59e0b, #f97316)',
    },
    sodium: {
      label: 'Sodium',
      value: `${Math.round(dailyStats.sodium)}mg`,
      helper: 'Track high-salt days',
      icon: ShieldCheck,
      accentClass: 'premium-feature-tile',
      progress: clampNumber(Math.round((dailyStats.sodium / 2300) * 100), 0, 100),
      progressFill: 'linear-gradient(90deg, #64748b, #94a3b8)',
    },
  } as const;

  const todaySummaryCards = [
    metricCardMap.calories,
    metricCardMap.protein,
    metricCardMap.water,
    ...selectedDashboardMetrics.map((metric) => metricCardMap[metric]),
  ].slice(0, 5);

  const todayQuickActionCards = [
    {
      label: 'Search food',
      description: 'Type or pick a recent food and review it before you save.',
      icon: Search,
      onClick: () => openAddFood(suggestedMealType),
    },
    {
      label: 'Scan meal',
      description: 'Use a photo when it is faster than typing the meal.',
      icon: Camera,
      onClick: () => setActiveTab('scan'),
    },
    {
      label: 'Quick water',
      description: 'Log a 250 ml water check-in without breaking your flow.',
      icon: Droplets,
      onClick: () => handleQuickWaterChange(250),
    },
    {
      label: 'Open habits',
      description: 'Check consistency and keep the streak moving.',
      icon: Sparkles,
      onClick: () => setActiveTab('habits'),
    },
  ];

  const todaySuggestedShortcutNames = recentFoods.slice(0, 4).map((food) => food.name);
  const homeInsightHighlights = [
    {
      label: 'Daily quality',
      title: dailyQualityInsight.title,
      detail: dailyQualityInsight.detail,
      icon: ShieldCheck,
    },
    {
      label: 'Coach suggestion',
      title: coachInsights[0]?.title || 'Keep today readable',
      detail: coachInsights[0]?.description || 'Search, scan, or log water so the dashboard has enough signal to help.',
      icon: Sparkles,
    },
    {
      label: 'Trust note',
      title: currentFoodDraft.source === 'manual' ? 'Search stays the fastest path' : 'Review keeps the log trustworthy',
      detail: 'Each meal stays editable, and source labels keep estimates separate from reference-backed items.',
      icon: ArrowUpRight,
    },
  ];

  const homeMomentumMetrics = [
    {
      label: 'Meals',
      value: `${dayFood.length}`,
      helper: dayFood.length > 0 ? `${MEAL_TYPES.filter((meal) => dayFood.some((entry) => entry.mealType === meal)).length} meal windows used` : 'Start with your first log',
    },
    {
      label: 'Water',
      value: `${Math.round(dailyStats.water)} ml`,
      helper: remainingWater <= 0 ? 'Goal covered' : `${Math.round(remainingWater)} ml left`,
    },
    {
      label: 'Movement',
      value: `${resolvedHealthSync.workouts7d ?? data.activityEntries.length}`,
      helper: resolvedHealthSync.availability === 'ready' ? 'Health Connect aware' : 'Local workouts tracked',
    },
  ];

  const profileDietStyleLabel =
    ONBOARDING_OPTIONS.dietStyle.find((option) => option.value === data.profile.onboarding.dietStyle)?.label ?? 'Not set';
  const profileEatingOutLabel =
    ONBOARDING_OPTIONS.eatingOutFrequency.find((option) => option.value === data.profile.onboarding.eatingOutFrequency)?.label ?? 'Not set';

  const profileOverviewCards = [
    {
      label: 'Goal track',
      value: goalFocusLabel,
      helper: `Goal ${data.profile.weightGoal}${data.profile.weightUnit}`,
      icon: Target,
      tone: 'brand',
    },
    {
      label: 'Calories',
      value: `${data.profile.dailyCalorieGoal} kcal`,
      helper: data.profile.useAutoCalorieGoal ? 'Adaptive target on' : 'Manual target',
      icon: Flame,
      tone: 'amber',
    },
    {
      label: 'Logging streak',
      value: `${loggingStreak} days`,
      helper: `${dayFood.length} foods today`,
      icon: TrendingUp,
      tone: 'slate',
    },
    {
      label: 'Sync',
      value: mobileSyncBadge.label,
      helper: userId ? (isOnline ? 'Cloud backup ready' : 'Offline mode') : 'Stored on this device',
      icon: Package,
      tone: 'emerald',
    },
  ];

  const profileSetupCards = [
    { label: 'Diet style', value: profileDietStyleLabel, icon: Sparkles },
    { label: 'Eating out', value: profileEatingOutLabel, icon: Utensils },
    { label: 'Support', value: data.profile.accountabilityPartner?.trim() || 'Add a coach or partner', icon: Star },
  ];

  const profileNotificationLabel =
    data.profile.notificationPermission === 'default' ? 'Not requested' : data.profile.notificationPermission;

  const profileInfoRows = [
    { label: 'Age', value: `${data.profile.age} yrs`, icon: SunIcon },
    { label: 'Height', value: `${data.profile.heightCm} cm`, icon: Scale },
    { label: 'Current weight', value: `${data.profile.currentWeight}${data.profile.weightUnit}`, icon: TrendingUp },
  ];

  const profileGoalRows = [
    { label: 'Main goal', value: goalFocusLabel, icon: Target },
    { label: 'Daily calories', value: `${data.profile.dailyCalorieGoal} kcal`, icon: Flame },
    { label: 'Macro targets', value: `${proteinGoal}P / ${carbsGoal}C / ${fatGoal}F`, icon: Dumbbell },
    { label: 'Water goal', value: `${data.profile.dailyWaterGoalMl} ml`, icon: Droplets },
  ];

  const healthSyncMetricCards = [
    { label: 'Availability', value: resolvedHealthSync.availability.replace('_', ' ') },
    { label: 'Workouts 7d', value: String(resolvedHealthSync.workouts7d ?? 0) },
    { label: 'Steps 7d', value: resolvedHealthSync.steps7d ? `${resolvedHealthSync.steps7d}` : 'N/A' },
    { label: 'Sleep avg', value: resolvedHealthSync.averageSleepHours ? `${resolvedHealthSync.averageSleepHours}h` : 'N/A' },
  ];

  const telemetrySummary = getTelemetrySummary();
  const syncButtonLabel = isSyncing
    ? 'Syncing...'
    : resolvedHealthSync.availability === 'setup_required'
      ? 'Connect Health Connect'
      : 'Sync health data';

  const actionLinkStyles = 'neutral-pill-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold';
  const segmentedButtonStyles = (active: boolean) =>
    clsx(
      'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
      active
        ? 'bg-[#111827] text-white border-[#111827] dark:bg-brand-500 dark:border-brand-500'
        : 'bg-white/80 text-slate-600 border-slate-200 dark:bg-white/[0.03] dark:text-slate-300 dark:border-white/10'
    );
  const listEntryMotionProps: MotionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.2, ease: 'easeOut' },
      };
  const mobileCardTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 260, damping: 26 };
  const sheetTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 280, damping: 28 };

  const subtitle =
    activeTab === 'today'
      ? 'Today Dashboard'
      : activeTab === 'history'
        ? 'Meal Log'
        : activeTab === 'scan'
          ? 'Photo And Barcode Scan'
          : activeTab === 'habits'
            ? 'Daily Habits'
            : activeTab === 'weight'
              ? 'Progress'
              : 'Profile';

  const topTabs: Array<{ label: string; tab: Exclude<AppTab, 'activity' | 'profile'> }> = [
    { label: 'Home', tab: 'today' },
    { label: 'Log', tab: 'history' },
    { label: 'Scan', tab: 'scan' },
    { label: 'Habits', tab: 'habits' },
    { label: 'Progress', tab: 'weight' },
  ];

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <Loader2 className="mx-auto animate-spin text-brand-500" size={24} />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Restoring CALSNAP AI for {user.email || 'your account'}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <AppHeader
          isDarkMode={isDarkMode}
          isProfileActive={activeTab === 'profile'}
          onOpenProfile={() => setActiveTab('profile')}
          onToggleDarkMode={() => setIsDarkMode((value) => !value)}
          shouldUseLiteEffects={shouldReduceMotion}
          subtitle={subtitle}
        />

        <main className="px-4 pb-32">
          <div className="mx-auto max-w-5xl space-y-5">
            {foodLogError ? (
              <div className="neutral-row rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {foodLogError}
              </div>
            ) : null}

            <div className="flex gap-2 overflow-x-auto pb-1">
              {topTabs.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                    activeTab === item.tab
                      ? 'bg-[#111827] text-white dark:bg-brand-500'
                      : 'bg-white/80 text-slate-600 border border-slate-200 dark:bg-white/3 dark:text-slate-300 dark:border-white/10'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {activeTab === 'today' ? (
              <TodayTab
                activeFastingPlan={activeFastingPlan}
                aiFoodScanAvailable={aiFoodScanAvailable}
                achievementSummary={achievementSummary}
                coachSuggestionCtaLabel={coachInsights[0]?.title}
                dailyQualityInsight={dailyQualityInsight}
                dayFoodCount={dayFood.length}
                fastingIsActive={Boolean(data.fastingState?.isActive)}
                fastingProgressPercent={fastingProgressPercent}
                fastingSummary={fastingSummary}
                homeInsightHighlights={homeInsightHighlights}
                homeMomentumMetrics={homeMomentumMetrics}
                isSelectedDateToday={true}
                loggingStreak={loggingStreak}
                mobileCardTransition={mobileCardTransition}
                mobileSyncBadge={mobileSyncBadge}
                netCarbsMode={Boolean(data.profile.netCarbsMode)}
                onCoachSuggestionTap={() =>
                  setInfoDialog({
                    title: coachInsights[0]?.title || 'Coach suggestion',
                    description: coachInsights[0]?.description || 'Keep logging to unlock more tailored coaching.',
                  })
                }
                onEndFast={() =>
                  setData((prev) => ({
                    ...prev,
                    fastingState: {
                      isActive: false,
                      lastCompletedAt: Date.now(),
                      lastDurationHours:
                        prev.fastingState?.startedAt
                          ? roundNutrition((Date.now() - prev.fastingState.startedAt) / (1000 * 60 * 60))
                          : undefined,
                    },
                  }))
                }
                onNextBestActionTap={() => {
                  if (dayFood.length === 0) {
                    openAddFood(suggestedMealType);
                    return;
                  }
                  if (remainingWater > 0) {
                    handleQuickWaterChange(250);
                    return;
                  }
                  setActiveTab('scan');
                }}
                onOpenAddFood={() => openAddFood(suggestedMealType)}
                onOpenProfile={() => setActiveTab('profile')}
                onOpenProgress={() => setActiveTab('weight')}
                onOpenScan={() => setActiveTab('scan')}
                onQuickPickShortcut={(name) => {
                  openAddFood(suggestedMealType);
                  setFoodSearchInput(name);
                  setShowSuggestions(true);
                }}
                onQuickWaterBoost={() => handleQuickWaterChange(250)}
                onStartFast={() =>
                  setData((prev) => ({
                    ...prev,
                    fastingState: {
                      isActive: true,
                      startedAt: Date.now(),
                      lastCompletedAt: prev.fastingState?.lastCompletedAt,
                      lastDurationHours: prev.fastingState?.lastDurationHours,
                    },
                  }))
                }
                progressHighlight={progressHighlight}
                selectedDashboardMetricLabels={selectedDashboardMetricLabels}
                selectedDate={selectedDate}
                timeSegment={getTimeSegment(new Date(timeNow))}
                todayQuickActionCards={todayQuickActionCards}
                todaySuggestedShortcutNames={todaySuggestedShortcutNames}
                todaySummaryCards={todaySummaryCards}
                userFirstName={data.profile.name.trim().split(' ')[0] || 'there'}
              />
            ) : null}

            {activeTab === 'history' ? (
              <HistoryTab
                calorieProgressPercent={calorieProgressPercent}
                combinedHistory={combinedHistory}
                dailyConsumed={dailyStats.consumed}
                dayFood={dayFood}
                dayWater={dayWater}
                filteredFoodCount={filteredFoodCount}
                foodSearchQuery={foodSearchQuery}
                formatFoodSourceLabel={getFoodSourceLabel}
                formatMealLabel={(value) => MEAL_LABELS[value]}
                getCombinedHistoryMetric={getCombinedHistoryMetric}
                getCombinedHistoryTitle={getCombinedHistoryTitle}
                isFavoriteFoodEntry={isFavoriteFoodEntry}
                isSelectedDateToday={true}
                listEntryMotionProps={listEntryMotionProps}
                mealSections={mealSections}
                mealTypes={MEAL_TYPES}
                mealVisuals={MEAL_VISUALS}
                netCarbsMode={Boolean(data.profile.netCarbsMode)}
                onChangeFoodSearchQuery={setFoodSearchQuery}
                onDeleteCombinedHistoryEntry={handleDeleteCombinedHistoryEntry}
                onDeleteFoodEntry={handleDeleteFoodEntry}
                onDeleteWaterEntry={handleDeleteWaterEntry}
                onEditCombinedHistoryEntry={handleEditCombinedHistoryEntry}
                onEditFoodEntry={openFoodEditor}
                onOpenFoodModalForMeal={(value) => openAddFood(value)}
                onOpenScanTab={() => setActiveTab('scan')}
                onOpenSuggestedFoodModal={() => openAddFood(suggestedMealType)}
                onOpenWaterModal={handleOpenWaterModal}
                onQuickWaterChange={handleQuickWaterChange}
                onSaveMealTemplate={handleSaveMealTemplate}
                onToggleFavoriteFoodEntry={handleToggleFavoriteFoodEntry}
                progressHighlight={progressHighlight}
                proteinGrams={dailyStats.protein}
                proteinProgressPercent={proteinProgressPercent}
                remainingProtein={remainingProtein}
                remainingWater={remainingWater}
                selectedDateLabel={format(selectedDate, 'EEEE, MMM d')}
                visibleMealSectionCount={mealSections.filter((section) => section.entryCount > 0).length}
                waterMl={dailyStats.water}
                waterProgressPercent={waterProgressPercent}
              />
            ) : null}

            {activeTab === 'scan' ? (
              <ScanTab
                aiFoodScanAvailable={aiFoodScanAvailable}
                barcodeCameraInputRef={barcodeCameraInputRef}
                barcodeDetectorSupported={barcodeDetectorSupported}
                barcodeGalleryInputRef={barcodeGalleryInputRef}
                foodBarcode={foodBarcode}
                isAnalyzing={isAnalyzing}
                isBarcodeScanning={isBarcodeScanning}
                onBarcodeImageUpload={handleBarcodeImageUpload}
                onFoodBarcodeChange={setFoodBarcode}
                onQuickBarcodeLookup={handleBarcodeLookup}
                onQuickCameraFlow={handleQuickCameraFlow}
                onQuickGalleryFlow={handleQuickGalleryFlow}
                onSearchFoodInstead={() => openAddFood(suggestedMealType)}
                savedBarcodeCount={data.barcodeLibrary.length}
              />
            ) : null}

            {activeTab === 'habits' ? (
              <HabitsTab
                actionFeedback={actionFeedback}
                actionLinkStyles={actionLinkStyles}
                dailyHabitCompletion={dailyHabitCompletion}
                onOpenAddHabit={handleOpenAddHabit}
                onToggleHabit={handleToggleHabit}
                recentCompletedHabitId={recentCompletedHabitId}
              />
            ) : null}

            {activeTab === 'weight' ? (
              <WeightTab
                achievements={achievements}
                achievementSummary={{ total: achievementSummary.total, unlockedCount: achievementSummary.unlockedCount }}
                actionFeedback={actionFeedback}
                autoMacroTargets={autoMacroTargets}
                carbsGoal={carbsGoal}
                chartAnimationEnabled={!shouldReduceMotion}
                dailyActivity={dailyActivity}
                dailyProtein={dailyStats.protein}
                fatGoal={fatGoal}
                goalFocusKey={goalFocusKey}
                goalFocusLabel={goalFocusLabel}
                goalFocusOptions={GOAL_FOCUS_OPTIONS}
                goalModeLabel={goalModeLabel}
                habitCompletion={habitCompletion}
                historyData={historyData}
                isDarkMode={isDarkMode}
                loggingStreak={loggingStreak}
                onApplyAdaptiveRecommendation={handleApplyAdaptiveRecommendation}
                onDeleteWeightEntry={handleDeleteWeightEntry}
                onGoalFocusChange={handleGoalFocusChange}
                onLogWeight={handleLogWeight}
                onOpenAddActivity={handleOpenAddActivity}
                onOpenAddHabit={handleOpenAddHabit}
                onOpenGoalCenter={() =>
                  document.getElementById('progress-goal-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                onToggleHabit={handleToggleHabit}
                profile={data.profile}
                progressAverageCalories={progressAverageCalories}
                progressGoalGap={progressGoalGap}
                progressLatestWeightDelta={progressLatestWeightDelta}
                proteinGoal={proteinGoal}
                proteinHistoryData={proteinHistoryData}
                recentWeightEntryId={recentWeightEntryId}
                remainingWater={remainingWater}
                segmentedButtonStyles={segmentedButtonStyles}
                setData={setData}
                waterHistoryData={waterHistoryData}
                weeklyReview={weeklyReview}
                weightEntries={sortedWeightEntries}
                weightHistoryData={weightHistoryData}
              />
            ) : null}
            {activeTab === 'profile' ? (
              <ProfileTab
                actionLinkStyles={actionLinkStyles}
                activeFastingPlan={{ label: activeFastingPlan.label, value: activeFastingPlan.value }}
                adaptiveRecommendation={{
                  nextStep: adaptiveRecommendation.nextStep,
                  recommendedDailyCalories: adaptiveRecommendation.recommendedDailyCalories,
                  recommendedProteinGoal: adaptiveRecommendation.recommendedProteinGoal,
                }}
                barcodeLibraryCount={data.barcodeLibrary.length}
                dashboardMetricOptions={DASHBOARD_METRIC_OPTIONS}
                fastingPlanOptions={FASTING_PLAN_OPTIONS.map(({ label, value }) => ({ label, value }))}
                fastingProgressPercent={fastingProgressPercent}
                fastingState={data.fastingState || { isActive: false }}
                fastingSummary={{ detail: fastingSummary.detail, status: fastingSummary.status }}
                goalFocusLabel={goalFocusLabel}
                habits={data.habits}
                healthSyncMetricCards={healthSyncMetricCards}
                healthSyncState={{
                  availability: resolvedHealthSync.availability.replace('_', ' '),
                  lastSyncedAt: resolvedHealthSync.lastSyncedAt,
                  note: resolvedHealthSync.note,
                }}
                importFileRef={importFileRef}
                isDarkMode={isDarkMode}
                isPremium={data.profile.planTier === 'premium'}
                isSyncing={isSyncing}
                loggingStreak={loggingStreak}
                mealTemplateCount={data.mealTemplates.length}
                mobileSyncBadge={mobileSyncBadge}
                onAccountabilityPartnerChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, accountabilityPartner: value } }))
                }
                onActivatePremium={handleActivatePremium}
                onAgeChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, age: getIntegerInputValue(value, prev.profile.age) } }))
                }
                onApplyAdaptiveRecommendation={handleApplyAdaptiveRecommendation}
                onCurrentWeightChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, currentWeight: getNumericInputValue(value, prev.profile.currentWeight) } }))
                }
                onDeleteHabit={handleDeleteHabit}
                onExportBackup={handleExportBackup}
                onFastingAction={() =>
                  setData((prev) => ({
                    ...prev,
                    fastingState: prev.fastingState?.isActive
                      ? {
                          isActive: false,
                          lastCompletedAt: Date.now(),
                          lastDurationHours:
                            prev.fastingState.startedAt
                              ? roundNutrition((Date.now() - prev.fastingState.startedAt) / (1000 * 60 * 60))
                              : undefined,
                        }
                      : {
                          isActive: true,
                          startedAt: Date.now(),
                          lastCompletedAt: prev.fastingState?.lastCompletedAt,
                          lastDurationHours: prev.fastingState?.lastDurationHours,
                        },
                  }))
                }
                onFastingPlanChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, fastingPlan: value } }))
                }
                onHeightChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, heightCm: getNumericInputValue(value, prev.profile.heightCm) } }))
                }
                onImportBackup={handleImportBackup}
                onImportBackupClick={handleImportBackupClick}
                onLogout={handleLogout}
                onMacroUnitChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, macroUnit: value } }))
                }
                onOpenAddHabit={handleOpenAddHabit}
                onOpenOnboarding={() =>
                  document.getElementById('profile-preferences')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                onOpenProgress={() => setActiveTab('weight')}
                onRemoveWallpaper={handleRemoveWallpaper}
                onRequestNotificationPermission={handleRequestNotificationPermission}
                onResetAllData={handleResetAllData}
                onSync={handleSync}
                onToggleDashboardMetric={(value) =>
                  setData((prev) => {
                    const current = normalizeDashboardMetrics(prev.profile.dashboardMetrics);
                    const exists = current.includes(value);
                    const next = exists
                      ? current.filter((metric) => metric !== value)
                      : [...current, value].slice(-2);

                    return {
                      ...prev,
                      profile: {
                        ...prev.profile,
                        dashboardMetrics: next.length > 0 ? next : [...DEFAULT_DASHBOARD_METRICS],
                      },
                    };
                  })
                }
                onToggleMealReminders={() =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, mealRemindersEnabled: !prev.profile.mealRemindersEnabled } }))
                }
                onToggleNetCarbs={() =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, netCarbsMode: !prev.profile.netCarbsMode } }))
                }
                onToggleWaterReminders={() =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, waterRemindersEnabled: !prev.profile.waterRemindersEnabled } }))
                }
                onWallpaperBlurChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, wallpaperBlur: clampNumber(getIntegerInputValue(value, prev.profile.wallpaperBlur || 0), 0, 20) } }))
                }
                onWallpaperOpacityChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, wallpaperOpacity: clampNumber(getNumericInputValue(value, prev.profile.wallpaperOpacity || 1), 0.2, 1) } }))
                }
                onWallpaperUpload={handleWallpaperUpload}
                onWaterReminderIntervalChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, waterReminderIntervalHours: clampNumber(getIntegerInputValue(value, prev.profile.waterReminderIntervalHours), 1, 12) } }))
                }
                onWeightUnitChange={(value) =>
                  setData((prev) => ({ ...prev, profile: { ...prev.profile, weightUnit: value } }))
                }
                profile={data.profile}
                profileGoalRows={profileGoalRows}
                profileInfoRows={profileInfoRows}
                profileNotificationLabel={profileNotificationLabel}
                profileOverviewCards={profileOverviewCards}
                profileSetupCards={profileSetupCards}
                segmentedButtonStyles={segmentedButtonStyles}
                selectedDashboardMetricLabels={selectedDashboardMetricLabels}
                selectedDashboardMetrics={selectedDashboardMetrics}
                syncButtonLabel={syncButtonLabel}
                telemetrySummary={telemetrySummary}
                usdaLookupAvailable={usdaLookupAvailable}
                wallpaperPreviewUrl={wallpaperPreviewUrl}
              />
            ) : null}
          </div>
        </main>

        <AppBottomNav
          activeTab={activeTab}
          onAddFood={() => openAddFood(suggestedMealType)}
          onTabChange={(tab) => setActiveTab(tab)}
          shouldReduceMotion={shouldReduceMotion}
        />

        <AddFoodModal
          aiFoodScanAvailable={aiFoodScanAvailable}
          cameraInputRef={cameraInputRef}
          currentFoodReviewInsight={currentFoodReviewInsight}
          currentFoodTrust={currentFoodTrust}
          currentFoodTrustBadgeClassName={currentFoodTrustBadgeClassName}
          editingFoodEntry={editingFoodEntry}
          fileInputRef={fileInputRef}
          foodBarcode={foodBarcode}
          foodCalories={foodCalories}
          foodCarbs={foodCarbs}
          foodDraftName={foodDraftName}
          foodDraftValue={foodDraftValue}
          foodFat={foodFat}
          foodFiber={foodFiber}
          foodProtein={foodProtein}
          foodQuantity={foodQuantity}
          foodSearchInput={foodSearchInput}
          foodSearchResults={foodSearchResults}
          foodServingSize={foodServingSize}
          foodSodiumMg={foodSodiumMg}
          foodSugar={foodSugar}
          foodUnit={foodUnit}
          formatCatalogFoodSummary={formatFoodCatalogSummary}
          formatNutritionValue={formatNutritionValue}
          isAnalyzing={isAnalyzing}
          isFoodSearchLoading={isFoodSearchLoading}
          isOpen={foodModalOpen}
          mealOptions={mealOptions}
          mealType={mealType}
          onBarcodeLookup={handleBarcodeLookup}
          onClose={closeFoodModal}
          onFoodBarcodeChange={setFoodBarcode}
          onFoodCaloriesChange={setFoodCalories}
          onFoodCarbsChange={setFoodCarbs}
          onFoodFatChange={setFoodFat}
          onFoodFiberChange={setFoodFiber}
          onFoodProteinChange={setFoodProtein}
          onFoodQuantityChange={setFoodQuantity}
          onFoodSodiumMgChange={setFoodSodiumMg}
          onFoodSugarChange={setFoodSugar}
          onFoodUnitChange={setFoodUnit}
          onImageUpload={handleFoodImageUpload}
          onMealTypeChange={setMealType}
          onOpenManualEntry={openManualEntry}
          onRecentFoodSelect={handleRecentFoodSelect}
          onScanInstead={() => {
            closeFoodModal();
            setActiveTab('scan');
          }}
          onSearchChange={setFoodSearchInput}
          onSearchFocus={() => setShowSuggestions(true)}
          onSelectSearchResult={handleSearchResultSelect}
          onSubmit={handleFoodSubmit}
          onToggleBarcodeComposer={() => setShouldShowBarcodeComposer((value) => !value)}
          onTriggerPhotoScan={() => cameraInputRef.current?.click()}
          onUseManualEntryFromEmpty={openManualEntry}
          recentFoods={recentFoods}
          reviewNutritionChips={reviewNutritionChips}
          sheetTransition={sheetTransition}
          shouldShowBarcodeComposer={shouldShowBarcodeComposer}
          shouldShowManualNutritionFields={shouldShowManualNutritionFields}
          shouldShowReviewPanel={shouldShowReviewPanel}
          showSuggestions={showSuggestions}
          footerHint={footerHint}
        />

        <AppDialog
          isOpen={Boolean(habitDialog)}
          onClose={() => setHabitDialog(null)}
          title="Add habit"
          description="Create a simple daily habit to keep consistency visible."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitHabitDialog();
            }}
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Habit name
              </label>
              <input
                type="text"
                value={habitDialog?.name || ''}
                onChange={(event) => setHabitDialog((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                placeholder="Morning walk"
                className="neutral-input w-full p-3"
              />
            </div>
            <button type="submit" className="neutral-primary-btn w-full py-3 text-sm font-semibold">
              Save habit
            </button>
          </form>
        </AppDialog>

        <AppDialog
          isOpen={Boolean(activityDialog)}
          onClose={() => setActivityDialog(null)}
          title={activityDialog?.title || 'Workout'}
          description="Keep movement logs simple so calories burned and weekly consistency stay useful."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitActivityDialog();
            }}
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Workout name
              </label>
              <input
                type="text"
                value={activityDialog?.name || ''}
                onChange={(event) =>
                  setActivityDialog((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                placeholder="Strength training"
                className="neutral-input w-full p-3"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Minutes
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={activityDialog?.duration || ''}
                  onChange={(event) =>
                    setActivityDialog((prev) => (prev ? { ...prev, duration: event.target.value } : prev))
                  }
                  className="neutral-input w-full p-3"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={activityDialog?.calories || ''}
                  onChange={(event) =>
                    setActivityDialog((prev) => (prev ? { ...prev, calories: event.target.value } : prev))
                  }
                  className="neutral-input w-full p-3"
                />
              </div>
            </div>
            <button type="submit" className="neutral-primary-btn w-full py-3 text-sm font-semibold">
              {activityDialog?.submitLabel || 'Save workout'}
            </button>
          </form>
        </AppDialog>

        <AppDialog
          isOpen={Boolean(waterDialog)}
          onClose={() => setWaterDialog(null)}
          title={waterDialog?.title || 'Water'}
          description="Quick hydration check-ins should be fast and readable."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitWaterDialog();
            }}
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Amount in ml
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={waterDialog?.amount || ''}
                onChange={(event) => setWaterDialog((prev) => (prev ? { ...prev, amount: event.target.value } : prev))}
                className="neutral-input w-full p-3"
              />
            </div>
            <button type="submit" className="neutral-primary-btn w-full py-3 text-sm font-semibold">
              {waterDialog?.submitLabel || 'Save water'}
            </button>
          </form>
        </AppDialog>

        <AppDialog
          isOpen={Boolean(templateDialog)}
          onClose={() => setTemplateDialog(null)}
          title="Save meal template"
          description="Turn a meal you already logged into a quick re-use template."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitTemplateDialog();
            }}
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Template name
              </label>
              <input
                type="text"
                value={templateDialog?.name || ''}
                onChange={(event) =>
                  setTemplateDialog((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                className="neutral-input w-full p-3"
              />
            </div>
            <button type="submit" className="neutral-primary-btn w-full py-3 text-sm font-semibold">
              Save template
            </button>
          </form>
        </AppDialog>

        <AppDialog
          isOpen={Boolean(weightEditDialog)}
          onClose={() => setWeightEditDialog(null)}
          title="Edit weight"
          description={`Update the saved weigh-in in ${data.profile.weightUnit}.`}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitWeightEditDialog();
            }}
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Weight ({data.profile.weightUnit})
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={weightEditDialog?.weight || ''}
                onChange={(event) =>
                  setWeightEditDialog((prev) => (prev ? { ...prev, weight: event.target.value } : prev))
                }
                className="neutral-input w-full p-3"
              />
            </div>
            <button type="submit" className="neutral-primary-btn w-full py-3 text-sm font-semibold">
              Update weight
            </button>
          </form>
        </AppDialog>

        <AppDialog
          isOpen={Boolean(infoDialog)}
          onClose={() => setInfoDialog(null)}
          title={infoDialog?.title || 'Info'}
          description={infoDialog?.description || ''}
        >
          <button type="button" onClick={() => setInfoDialog(null)} className="neutral-primary-btn w-full py-3 text-sm font-semibold">
            Close
          </button>
        </AppDialog>

        <AppDialog
          isOpen={Boolean(confirmDialog)}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog?.title || 'Confirm'}
          description={confirmDialog?.description || ''}
        >
          <div className="flex gap-3">
            <button type="button" onClick={() => setConfirmDialog(null)} className="neutral-secondary-btn flex-1 py-3 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const action = confirmDialog?.onConfirm;
                setConfirmDialog(null);
                if (action) {
                  void action();
                }
              }}
              className={clsx(
                'flex-1 rounded-2xl py-3 text-sm font-semibold text-white',
                confirmDialog?.tone === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#111827] hover:bg-slate-800 dark:bg-brand-500 dark:hover:bg-brand-600'
              )}
            >
              {confirmDialog?.confirmLabel || 'Confirm'}
            </button>
          </div>
        </AppDialog>

        <AnimatePresence>
          {toast ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={clsx(
                'fixed left-1/2 bottom-24 z-70 -translate-x-1/2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg',
                toast.type === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#111827] text-white dark:bg-brand-500'
              )}
            >
              {toast.message}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
