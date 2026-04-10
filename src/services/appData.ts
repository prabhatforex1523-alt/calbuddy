import type {
  DashboardMetricKey,
  FastingState,
  HealthData,
  Habit,
  OnboardingProfile,
  UserProfile,
} from '../types';

export const FOOD_REPAIR_VERSION = 'nutrition-fix-v2';
export const THEME_STORAGE_KEY = 'CALSNAP AI_dark_mode';

export const DEFAULT_ONBOARDING: OnboardingProfile = {
  primaryFocus: 'fat_loss',
  dietStyle: 'eggs',
  regionPreference: 'mixed',
  budgetStyle: 'balanced',
  workoutFrequency: '2-4',
  cookingStyle: 'regular',
  eatingOutFrequency: 'weekly',
};

export const ONBOARDING_OPTIONS = {
  primaryFocus: [
    { value: 'fat_loss', label: 'Fat loss' },
    { value: 'recomposition', label: 'Maintain / recomp' },
    { value: 'weight_gain', label: 'Weight gain' },
    { value: 'muscle_gain', label: 'Muscle gain' },
  ],
  dietStyle: [
    { value: 'veg', label: 'Vegetarian' },
    { value: 'eggs', label: 'Veg + eggs' },
    { value: 'nonveg', label: 'Non-veg' },
  ],
  regionPreference: [
    { value: 'north', label: 'North-style / roti-forward' },
    { value: 'south', label: 'South-style / rice-forward' },
    { value: 'west', label: 'West-style / snack-friendly' },
    { value: 'east', label: 'East-style / rice + curry' },
    { value: 'mixed', label: 'Mixed / global' },
  ],
  budgetStyle: [
    { value: 'tight', label: 'Tight budget' },
    { value: 'balanced', label: 'Balanced budget' },
    { value: 'flexible', label: 'Flexible budget' },
  ],
  workoutFrequency: [
    { value: '0-1', label: '0-1 days/week' },
    { value: '2-4', label: '2-4 days/week' },
    { value: '5+', label: '5+ days/week' },
  ],
  cookingStyle: [
    { value: 'minimal', label: 'Minimal cooking' },
    { value: 'regular', label: 'Regular cooking' },
    { value: 'batch', label: 'Batch prep' },
  ],
  eatingOutFrequency: [
    { value: 'rare', label: 'Rarely eat out' },
    { value: 'weekly', label: '1-3 times/week' },
    { value: 'frequent', label: 'Frequent eating out' },
  ],
} as const;

export const PREMIUM_FEATURES = [
  'Actionable daily coach suggestions',
  '7-day meal plan plus grocery list',
  'Restaurant mode with goal-aware picks',
  'Weekly accountability report you can share',
];

export const DEFAULT_DASHBOARD_METRICS: DashboardMetricKey[] = ['carbs', 'fat'];
export const DEFAULT_FASTING_STATE: FastingState = {
  isActive: false,
};

const ONBOARDING_VALUE_CHECKS: {
  [K in keyof OnboardingProfile]: ReadonlySet<OnboardingProfile[K]>;
} = {
  primaryFocus: new Set(ONBOARDING_OPTIONS.primaryFocus.map((option) => option.value)),
  dietStyle: new Set(ONBOARDING_OPTIONS.dietStyle.map((option) => option.value)),
  regionPreference: new Set(ONBOARDING_OPTIONS.regionPreference.map((option) => option.value)),
  budgetStyle: new Set(ONBOARDING_OPTIONS.budgetStyle.map((option) => option.value)),
  workoutFrequency: new Set(ONBOARDING_OPTIONS.workoutFrequency.map((option) => option.value)),
  cookingStyle: new Set(ONBOARDING_OPTIONS.cookingStyle.map((option) => option.value)),
  eatingOutFrequency: new Set(ONBOARDING_OPTIONS.eatingOutFrequency.map((option) => option.value)),
};

const hasSavedCoachOnboarding = (rawOnboarding: unknown): rawOnboarding is Partial<OnboardingProfile> => {
  if (!rawOnboarding || typeof rawOnboarding !== 'object') {
    return false;
  }

  const onboarding = rawOnboarding as Partial<OnboardingProfile>;

  return (Object.keys(ONBOARDING_VALUE_CHECKS) as Array<keyof OnboardingProfile>).some((key) => {
    const value = onboarding[key];
    if (typeof value !== 'string') {
      return false;
    }

    return (ONBOARDING_VALUE_CHECKS[key] as ReadonlySet<string>).has(value);
  });
};

export const INITIAL_PROFILE: UserProfile = {
  name: 'User',
  dailyCalorieGoal: 2000,
  useAutoCalorieGoal: true,
  dailyWaterGoalMl: 2500,
  age: 25,
  heightCm: 170,
  weightGoal: 70,
  currentWeight: 75,
  goalType: 'maintain',
  weightUnit: 'kg',
  macroUnit: 'g',
  useCustomMacroGoals: false,
  customProteinGoal: 120,
  customCarbsGoal: 220,
  customFatGoal: 70,
  dashboardMetrics: [...DEFAULT_DASHBOARD_METRICS],
  netCarbsMode: false,
  fastingPlan: '16:8',
  waterReminderIntervalHours: 3,
  notificationPermission: 'default',
  mealRemindersEnabled: false,
  waterRemindersEnabled: false,
  loggingStreak: 0,
  lastFoodLogDate: '',
  planTier: 'free',
  premiumActivatedAt: undefined,
  onboardingCompleted: false,
  onboarding: { ...DEFAULT_ONBOARDING },
  accountabilityPartner: '',
  wallpaperUrl: '',
  wallpaperOpacity: 1,
  wallpaperBlur: 0,
};

export const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Morning Meditation', icon: 'Brain', color: '#52525b' },
  { id: '2', name: 'Read for 30 mins', icon: 'Coffee', color: '#71717a' },
  { id: '3', name: '8 Hours Sleep', icon: 'Moon', color: '#3f3f46' },
];

export const createInitialHealthData = (): HealthData => ({
  foodEntries: [],
  favoriteFoods: [],
  activityEntries: [],
  waterEntries: [],
  weightEntries: [],
  dailyCheckIns: [],
  habits: [...DEFAULT_HABITS],
  habitLogs: [],
  mealTemplates: [],
  achievements: [],
  profile: { ...INITIAL_PROFILE },
  barcodeLibrary: [],
  adaptiveRecommendation: undefined,
  healthSync: {
    provider: 'health_connect',
    availability: 'unknown',
  },
  fastingState: { ...DEFAULT_FASTING_STATE },
});

export const buildStorageKey = (uid: string | undefined) =>
  uid ? `CALSNAP AI_data_${uid}` : 'CALSNAP AI_data_guest';

export const migrateStoredData = (raw: unknown): HealthData => {
  const baseData = createInitialHealthData();

  if (!raw || typeof raw !== 'object') {
    return baseData;
  }

  const parsed = raw as Partial<HealthData>;
  const profile = parsed.profile || ({} as Partial<UserProfile>);
const inferredOnboardingCompleted =
    profile.onboardingCompleted === true || hasSavedCoachOnboarding(profile.onboarding);
  const savedDashboardMetrics = Array.isArray(profile.dashboardMetrics)
    ? profile.dashboardMetrics.filter(
        (item): item is DashboardMetricKey =>
          ['carbs', 'fat', 'fiber', 'sugar', 'sodium'].includes(String(item))
      )
    : [];
  const normalizedDashboardMetrics =
    savedDashboardMetrics.length > 0
      ? Array.from(new Set(savedDashboardMetrics)).slice(0, 2)
      : [...DEFAULT_DASHBOARD_METRICS];
  const fastingState =
    parsed.fastingState && typeof parsed.fastingState === 'object'
      ? {
          isActive: parsed.fastingState.isActive === true,
          startedAt:
            typeof parsed.fastingState.startedAt === 'number'
              ? parsed.fastingState.startedAt
              : undefined,
          lastCompletedAt:
            typeof parsed.fastingState.lastCompletedAt === 'number'
              ? parsed.fastingState.lastCompletedAt
              : undefined,
          lastDurationHours:
            typeof parsed.fastingState.lastDurationHours === 'number'
              ? parsed.fastingState.lastDurationHours
              : undefined,
        }
      : { ...DEFAULT_FASTING_STATE };

  return {
    foodEntries: Array.isArray(parsed.foodEntries)
      ? parsed.foodEntries.map((entry) => ({
          createdAt: entry.createdAt ?? entry.timestamp ?? Date.now(),
          mealType: entry.mealType ?? 'snack',
          quantity: entry.quantity ?? 1,
          unit: entry.unit ?? 'serving',
          servingSize: entry.servingSize ?? '1 serving',
          source: entry.source ?? 'manual',
          confidence: entry.confidence,
          ...entry,
        }))
      : [],
    favoriteFoods: Array.isArray(parsed.favoriteFoods)
      ? parsed.favoriteFoods.filter((item) => item && typeof item.name === 'string')
      : [],
    activityEntries: Array.isArray(parsed.activityEntries) ? parsed.activityEntries : [],
    waterEntries: Array.isArray(parsed.waterEntries) ? parsed.waterEntries : [],
    weightEntries: Array.isArray(parsed.weightEntries)
      ? parsed.weightEntries.map((entry) => ({
          ...entry,
          source: entry.source === 'health_connect' ? 'health_connect' : 'manual',
        }))
      : [],
    dailyCheckIns: Array.isArray(parsed.dailyCheckIns)
      ? parsed.dailyCheckIns.map((entry) => ({
          id: entry.id ?? crypto.randomUUID(),
          timestamp: Number(entry.timestamp ?? Date.now()),
          energy: Number(entry.energy ?? 3),
          hunger: Number(entry.hunger ?? 3),
          mood: Number(entry.mood ?? 3),
          note: entry.note ?? '',
        }))
      : [],
    habits: Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : [...DEFAULT_HABITS],
    habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [],
    mealTemplates: Array.isArray(parsed.mealTemplates) ? parsed.mealTemplates : [],
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    barcodeLibrary: Array.isArray(parsed.barcodeLibrary) ? parsed.barcodeLibrary : [],
    adaptiveRecommendation:
      parsed.adaptiveRecommendation && typeof parsed.adaptiveRecommendation === 'object'
        ? parsed.adaptiveRecommendation
        : undefined,
    healthSync:
      parsed.healthSync && typeof parsed.healthSync === 'object'
        ? {
            provider: 'health_connect',
            availability: parsed.healthSync.availability ?? 'unknown',
            lastSyncedAt:
              typeof parsed.healthSync.lastSyncedAt === 'number'
                ? parsed.healthSync.lastSyncedAt
                : undefined,
            workouts7d:
              typeof parsed.healthSync.workouts7d === 'number'
                ? parsed.healthSync.workouts7d
                : undefined,
            steps7d:
              typeof parsed.healthSync.steps7d === 'number'
                ? parsed.healthSync.steps7d
                : undefined,
            averageSleepHours:
              typeof parsed.healthSync.averageSleepHours === 'number'
                ? parsed.healthSync.averageSleepHours
                : undefined,
            latestWeightKg:
              typeof parsed.healthSync.latestWeightKg === 'number'
                ? parsed.healthSync.latestWeightKg
                : undefined,
            latestWeightAt:
              typeof parsed.healthSync.latestWeightAt === 'number'
                ? parsed.healthSync.latestWeightAt
                : undefined,
            permissionsGranted:
              typeof parsed.healthSync.permissionsGranted === 'boolean'
                ? parsed.healthSync.permissionsGranted
                : undefined,
            note: typeof parsed.healthSync.note === 'string' ? parsed.healthSync.note : undefined,
          }
        : baseData.healthSync,
    fastingState,
    profile: {
      ...INITIAL_PROFILE,
      ...profile,
      dailyCalorieGoal: Number(profile.dailyCalorieGoal ?? INITIAL_PROFILE.dailyCalorieGoal),
      useAutoCalorieGoal: profile.useAutoCalorieGoal ?? INITIAL_PROFILE.useAutoCalorieGoal,
      dailyWaterGoalMl: Number(profile.dailyWaterGoalMl ?? INITIAL_PROFILE.dailyWaterGoalMl),
      age: Number(profile.age ?? INITIAL_PROFILE.age),
      heightCm: Number(profile.heightCm ?? INITIAL_PROFILE.heightCm),
      weightGoal: Number(profile.weightGoal ?? INITIAL_PROFILE.weightGoal),
      currentWeight: Number(profile.currentWeight ?? INITIAL_PROFILE.currentWeight),
      goalType: profile.goalType ?? INITIAL_PROFILE.goalType,
      useCustomMacroGoals: profile.useCustomMacroGoals ?? INITIAL_PROFILE.useCustomMacroGoals,
      customProteinGoal: Number(profile.customProteinGoal ?? INITIAL_PROFILE.customProteinGoal),
      customCarbsGoal: Number(profile.customCarbsGoal ?? INITIAL_PROFILE.customCarbsGoal),
      customFatGoal: Number(profile.customFatGoal ?? INITIAL_PROFILE.customFatGoal),
      dashboardMetrics: normalizedDashboardMetrics,
      netCarbsMode: profile.netCarbsMode ?? INITIAL_PROFILE.netCarbsMode,
      fastingPlan:
        profile.fastingPlan && ['12:12', '14:10', '16:8', '18:6'].includes(profile.fastingPlan)
          ? profile.fastingPlan
          : INITIAL_PROFILE.fastingPlan,
      waterReminderIntervalHours: Number(profile.waterReminderIntervalHours ?? INITIAL_PROFILE.waterReminderIntervalHours),
      notificationPermission: profile.notificationPermission ?? INITIAL_PROFILE.notificationPermission,
      mealRemindersEnabled: profile.mealRemindersEnabled ?? INITIAL_PROFILE.mealRemindersEnabled,
      waterRemindersEnabled: profile.waterRemindersEnabled ?? INITIAL_PROFILE.waterRemindersEnabled,
      loggingStreak: Number(profile.loggingStreak ?? INITIAL_PROFILE.loggingStreak),
      lastFoodLogDate: profile.lastFoodLogDate ?? INITIAL_PROFILE.lastFoodLogDate,
      planTier: profile.planTier ?? INITIAL_PROFILE.planTier,
      premiumActivatedAt:
        typeof profile.premiumActivatedAt === 'number' ? profile.premiumActivatedAt : undefined,
      onboardingCompleted: inferredOnboardingCompleted,
      onboarding: {
        ...DEFAULT_ONBOARDING,
        ...(profile.onboarding || {}),
      },
      accountabilityPartner: profile.accountabilityPartner ?? '',
      wallpaperUrl: profile.wallpaperUrl ?? '',
      wallpaperOpacity: profile.wallpaperOpacity ?? 1,
      wallpaperBlur: profile.wallpaperBlur ?? 0,
    },
  };
};

export const loadThemePreference = () => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveThemePreference = (isDarkMode: boolean) => {
  window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode.toString());
};

export const applyWallpaperToDocument = (
  profile: Pick<UserProfile, 'wallpaperUrl' | 'wallpaperOpacity' | 'wallpaperBlur'>
) => {
  const root = document.documentElement;
  const { wallpaperUrl, wallpaperOpacity = 1, wallpaperBlur = 0 } = profile;

  if (wallpaperUrl) {
    root.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`);
    root.style.setProperty('--wallpaper-opacity', wallpaperOpacity.toString());
    root.style.setProperty('--wallpaper-blur', `${wallpaperBlur}px`);
    document.body.style.backgroundImage = 'none';
    return;
  }

  root.style.setProperty('--wallpaper-url', 'none');
  root.style.setProperty('--wallpaper-opacity', '1');
  root.style.setProperty('--wallpaper-blur', '0px');
  document.body.style.backgroundImage = 'none';
};

export type HealthDataLoadResult = {
  data: HealthData;
  error?: unknown;
};

export type HealthDataSaveResult =
  | { ok: true }
  | { ok: false; error: unknown; reason: 'quota' | 'unknown' };

export const loadStoredHealthData = (userId: string | undefined): HealthDataLoadResult => {
  const storageKey = buildStorageKey(userId);

  try {
    const saved = window.localStorage.getItem(storageKey);
    return {
      data: saved ? migrateStoredData(JSON.parse(saved)) : createInitialHealthData(),
    };
  } catch (error) {
    return {
      data: createInitialHealthData(),
      error,
    };
  }
};

export const saveStoredHealthData = (userId: string | undefined, data: HealthData): HealthDataSaveResult => {
  try {
    window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(data));
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return { ok: false, error, reason: 'quota' };
    }

    return { ok: false, error, reason: 'unknown' };
  }
};
