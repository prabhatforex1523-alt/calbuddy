import { format } from 'date-fns';
import {
  Bell,
  Brain,
  Camera,
  CheckCircle2,
  Circle,
  Coffee,
  Download,
  Droplets,
  Flame,
  Globe2,
  Heart,
  Image,
  LogOut,
  Moon as MoonIcon,
  Package,
  Plus,
  PlusCircle,
  RefreshCw,
  Scale,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sun as SunIcon,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  User as UserIcon,
  Utensils,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import type { ChangeEventHandler, ComponentType, RefObject } from 'react';

import type { DashboardMetricKey, FastingPlan, Habit, HealthData, UserProfile } from '../types';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type ProfileRow = {
  icon: IconComponent;
  label: string;
  value: string;
};

type ProfileOverviewCard = {
  helper: string;
  icon: IconComponent;
  label: string;
  tone: string;
  value: string;
};

type ProfileSetupCard = {
  icon: IconComponent;
  label: string;
  value: string;
};

type DashboardMetricOption = {
  helper: string;
  icon: IconComponent;
  label: string;
  value: DashboardMetricKey;
};

type FastingPlanOption = {
  label: string;
  value: FastingPlan;
};

type AdaptiveRecommendationSummary = {
  nextStep: string;
  recommendedDailyCalories: number;
  recommendedProteinGoal: number;
};

type HealthSyncStateSummary = {
  availability: string;
  lastSyncedAt?: number;
  note?: string;
};

type HealthSyncMetricCard = {
  label: string;
  value: string;
};

type MobileSyncBadge = {
  className: string;
  label: string;
};

type TelemetrySummary = {
  errors: number;
  events: number;
  total: number;
};

type ProfileTabProps = {
  actionLinkStyles: string;
  activeFastingPlan: FastingPlanOption;
  adaptiveRecommendation: AdaptiveRecommendationSummary;
  barcodeLibraryCount: number;
  dashboardMetricOptions: readonly DashboardMetricOption[];
  fastingPlanOptions: readonly FastingPlanOption[];
  fastingProgressPercent: number;
  fastingState: HealthData['fastingState'];
  fastingSummary: {
    detail: string;
    status: string;
  };
  goalFocusLabel: string;
  habits: Habit[];
  healthSyncMetricCards: HealthSyncMetricCard[];
  healthSyncState: HealthSyncStateSummary;
  importFileRef: RefObject<HTMLInputElement | null>;
  isDarkMode: boolean;
  isPremium: boolean;
  isSyncing: boolean;
  loggingStreak: number;
  mealTemplateCount: number;
  mobileSyncBadge: MobileSyncBadge;
  onAccountabilityPartnerChange: (value: string) => void;
  onActivatePremium: () => void;
  onAgeChange: (value: string) => void;
  onApplyAdaptiveRecommendation: () => void;
  onCurrentWeightChange: (value: string) => void;
  onDeleteHabit: (habit: Habit) => void;
  onExportBackup: () => void;
  onFastingAction: () => void;
  onFastingPlanChange: (value: FastingPlan) => void;
  onHeightChange: (value: string) => void;
  onImportBackup: ChangeEventHandler<HTMLInputElement>;
  onImportBackupClick: () => void;
  onLogout: () => void;
  onMacroUnitChange: (value: UserProfile['macroUnit']) => void;
  onOpenAddHabit: () => void;
  onOpenOnboarding: () => void;
  onOpenProgress: () => void;
  onRemoveWallpaper: () => void;
  onRequestNotificationPermission: () => void;
  onResetAllData: () => void;
  onSync: () => void;
  onToggleDashboardMetric: (value: DashboardMetricKey) => void;
  onToggleMealReminders: () => void;
  onToggleNetCarbs: () => void;
  onToggleWaterReminders: () => void;
  onWallpaperBlurChange: (value: string) => void;
  onWallpaperOpacityChange: (value: string) => void;
  onWallpaperUpload: ChangeEventHandler<HTMLInputElement>;
  onWaterReminderIntervalChange: (value: string) => void;
  onWeightUnitChange: (value: UserProfile['weightUnit']) => void;
  profile: UserProfile;
  profileGoalRows: ProfileRow[];
  profileInfoRows: ProfileRow[];
  profileNotificationLabel: string;
  profileOverviewCards: ProfileOverviewCard[];
  profileSetupCards: ProfileSetupCard[];
  segmentedButtonStyles: (active: boolean) => string;
  selectedDashboardMetricLabels: string[];
  selectedDashboardMetrics: DashboardMetricKey[];
  syncButtonLabel: string;
  telemetrySummary: TelemetrySummary;
  usdaLookupAvailable: boolean;
  wallpaperPreviewUrl: string;
};

const habitIcons: Record<string, IconComponent> = {
  Bell,
  Brain,
  CheckCircle2,
  Circle,
  Coffee,
  Droplets,
  Flame,
  Heart,
  Moon: MoonIcon,
  PlusCircle,
  Scale,
  Sparkles,
  Sun: SunIcon,
  TrendingUp,
  Utensils,
};

function HabitIcon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  const Icon = habitIcons[name] || Sparkles;
  return <Icon size={size} className={className} />;
}

export function ProfileTab({
  actionLinkStyles,
  activeFastingPlan,
  adaptiveRecommendation,
  barcodeLibraryCount,
  dashboardMetricOptions,
  fastingPlanOptions,
  fastingProgressPercent,
  fastingState,
  fastingSummary,
  goalFocusLabel,
  habits,
  healthSyncMetricCards,
  healthSyncState,
  importFileRef,
  isDarkMode,
  isPremium,
  isSyncing,
  loggingStreak,
  mealTemplateCount,
  mobileSyncBadge,
  onAccountabilityPartnerChange,
  onActivatePremium,
  onAgeChange,
  onApplyAdaptiveRecommendation,
  onCurrentWeightChange,
  onDeleteHabit,
  onExportBackup,
  onFastingAction,
  onFastingPlanChange,
  onHeightChange,
  onImportBackup,
  onImportBackupClick,
  onLogout,
  onMacroUnitChange,
  onOpenAddHabit,
  onOpenOnboarding,
  onOpenProgress,
  onRemoveWallpaper,
  onRequestNotificationPermission,
  onResetAllData,
  onSync,
  onToggleDashboardMetric,
  onToggleMealReminders,
  onToggleNetCarbs,
  onToggleWaterReminders,
  onWallpaperBlurChange,
  onWallpaperOpacityChange,
  onWallpaperUpload,
  onWaterReminderIntervalChange,
  onWeightUnitChange,
  profile,
  profileGoalRows,
  profileInfoRows,
  profileNotificationLabel,
  profileOverviewCards,
  profileSetupCards,
  segmentedButtonStyles,
  selectedDashboardMetricLabels,
  selectedDashboardMetrics,
  syncButtonLabel,
  telemetrySummary,
  usdaLookupAvailable,
  wallpaperPreviewUrl,
}: ProfileTabProps) {
  const displayName = profile.name.trim() || 'Your profile';
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'C';

  return (
    <section className="space-y-6 premium-tab-shell premium-profile-shell">
      <div className="glass-card premium-tab-hero premium-profile-hero p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="premium-profile-avatar w-16 h-16 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 text-2xl font-bold">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="premium-tab-kicker text-[11px] font-bold uppercase tracking-[0.18em]">Profile</p>
              <h3 className="mt-2 text-2xl font-bold text-[#111827] dark:text-white">{displayName}</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {goalFocusLabel} plan with a goal weight of {profile.weightGoal}
                {profile.weightUnit}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={clsx('premium-home-chip', isPremium ? 'premium-home-chip-brand' : 'premium-home-chip-muted')}>
                  {isPremium ? 'Planning tools on' : 'Basic plan'}
                </span>
                <span className={clsx('premium-home-chip', mobileSyncBadge.className)}>{mobileSyncBadge.label}</span>
                <span className="premium-home-chip premium-home-chip-soft">{loggingStreak} day streak</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="premium-delete-btn premium-profile-action-btn px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {profileOverviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={clsx('premium-profile-overview-card', `premium-profile-overview-card-${card.tone}`)}>
                <div className="premium-profile-overview-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-2 text-base font-bold text-[#111827] dark:text-white">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{card.helper}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Personal info</p>
              <h4 className="mt-1 font-bold text-[#111827] dark:text-white">Base details</h4>
            </div>
            <UserIcon size={20} className="text-brand-500" />
          </div>
          <div className="space-y-3">
            {profileInfoRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="premium-profile-list-row">
                  <div className="premium-icon-badge bg-slate-50 dark:bg-slate-900">
                    <Icon size={18} className="text-[#111827] dark:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{row.label}</p>
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{row.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Goals</p>
              <h4 className="mt-1 font-bold text-[#111827] dark:text-white">Current targets</h4>
            </div>
            <Target size={20} className="text-brand-500" />
          </div>
          <div className="space-y-3">
            {profileGoalRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="premium-profile-list-row">
                  <div className="premium-icon-badge bg-slate-50 dark:bg-slate-900">
                    <Icon size={18} className="text-[#111827] dark:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{row.label}</p>
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{row.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onOpenProgress}
            className="neutral-secondary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <TrendingUp size={16} />
            Edit in Progress
          </button>
        </div>
      </div>
      <div className="glass-card p-6 space-y-5 border border-brand-500/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Profile setup</p>
            <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Personal setup and planning</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              These settings help food suggestions and weekly summaries match your routine.
            </p>
          </div>
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
              isPremium ? 'bg-brand-500/15 text-brand-500' : 'bg-slate-200 text-slate-700 dark:bg-[#24364e] dark:text-slate-200'
            )}
          >
            {isPremium ? 'Planning on' : 'Basic'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {profileSetupCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="premium-profile-setup-card">
                <div className="premium-icon-badge bg-slate-50 dark:bg-slate-900">
                  <Icon size={18} className="text-[#111827] dark:text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{card.label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827] dark:text-white">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="neutral-secondary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            Edit preferences
          </button>
          {!isPremium && (
            <button
              type="button"
              onClick={onActivatePremium}
              className="neutral-primary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Turn on planning tools
            </button>
          )}
        </div>

        <div className="neutral-row rounded-2xl p-4">
          <label className="block w-full">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Support person or coach</span>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Keep one trusted name here for accountability and weekly check-ins.
            </span>
            <input
              type="text"
              value={profile.accountabilityPartner}
              onChange={(event) => onAccountabilityPartnerChange(event.target.value)}
              placeholder="Example: Gym buddy, partner, or coach"
              className="neutral-input w-full mt-4 p-3"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-7 space-y-5 border border-brand-500/15">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Goal center</p>
              <h4 className="mt-2 font-bold text-[#111827] dark:text-white">{goalFocusLabel}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Goal changes, calories, water, and macros now live in Progress so this screen can stay cleaner.
              </p>
            </div>
            <ShieldCheck size={20} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="premium-profile-setting-chip">
              <span>Main goal</span>
              <strong>{goalFocusLabel}</strong>
            </div>
            <div className="premium-profile-setting-chip">
              <span>Suggested calories</span>
              <strong>{adaptiveRecommendation.recommendedDailyCalories} kcal</strong>
            </div>
            <div className="premium-profile-setting-chip">
              <span>Protein guide</span>
              <strong>{adaptiveRecommendation.recommendedProteinGoal}g</strong>
            </div>
          </div>

          <div className="neutral-row rounded-2xl p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{adaptiveRecommendation.nextStep}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onOpenProgress} className="neutral-primary-btn flex-1 py-3 text-sm font-semibold">
              Open goal setup
            </button>
            <button
              type="button"
              onClick={onApplyAdaptiveRecommendation}
              className="neutral-secondary-btn flex-1 py-3 text-sm font-semibold"
            >
              Use suggested goal
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-7 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Data Trust</p>
                <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Search coverage and sources</h4>
              </div>
              <Globe2 size={20} className="text-brand-500 shrink-0" />
            </div>
            <div className="grid gap-3">
              <div className="neutral-row rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Regional + staple foods</span>
                <span className="font-semibold text-[#111827] dark:text-white">Built in</span>
              </div>
              <div className="neutral-row rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">USDA global reference lookup</span>
                <span className="font-semibold text-[#111827] dark:text-white">{usdaLookupAvailable ? 'Configured' : 'API key needed'}</span>
              </div>
              <div className="neutral-row rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Saved barcode matches</span>
                <span className="font-semibold text-[#111827] dark:text-white">{barcodeLibraryCount}</span>
              </div>
              <div className="neutral-row rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Remembered meals</span>
                <span className="font-semibold text-[#111827] dark:text-white">{mealTemplateCount}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-7 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Data & Sync</p>
                <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Sync overview</h4>
              </div>
              <Package size={20} className="text-brand-500 shrink-0" />
            </div>
            <div className="neutral-row rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#111827] dark:text-white">Health sync status</span>
                <span
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]',
                    healthSyncState.availability === 'setup_required'
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
                      : healthSyncState.availability === 'ready'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-500/10 text-slate-700 dark:text-slate-200'
                  )}
                >
                  {healthSyncState.availability === 'setup_required' ? 'Android ready' : healthSyncState.availability}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{healthSyncState.note}</p>
              {healthSyncState.lastSyncedAt && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Last sync check: {format(new Date(healthSyncState.lastSyncedAt), 'MMM d, h:mm a')}
                </p>
              )}
              {healthSyncMetricCards.length > 0 && (
                <div className="grid gap-2 pt-2 sm:grid-cols-2">
                  {healthSyncMetricCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-[#22322d] dark:bg-[#0f1c18]/70">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{card.label}</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827] dark:text-white">{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
              Diagnostics and telemetry are available below in Advanced so this screen can stay focused on everyday settings.
            </div>
          </div>
        </div>
      </div>

      <div id="profile-preferences" className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Preferences</p>
            <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Display preferences</h4>
          </div>
          <SettingsIcon size={20} className="text-brand-500 shrink-0" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="premium-profile-setting-chip">
            <span>Weight unit</span>
            <strong>{profile.weightUnit.toUpperCase()}</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Macro display</span>
            <strong>{profile.macroUnit === 'g' ? 'Grams' : 'Percent'}</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Theme</span>
            <strong>{isDarkMode ? 'Dark' : 'Light'}</strong>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Weight Unit</label>
            <div className="flex gap-2">
              {(['kg', 'lbs'] as const).map((unit) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={unit}
                  type="button"
                  onClick={() => onWeightUnitChange(unit)}
                  className={clsx('flex-1 py-2.5 rounded-xl text-xs font-bold', segmentedButtonStyles(profile.weightUnit === unit))}
                >
                  {unit.toUpperCase()}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Macronutrient Display</label>
            <div className="flex gap-2">
              {(['g', '%'] as const).map((unit) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={unit}
                  type="button"
                  onClick={() => onMacroUnitChange(unit)}
                  className={clsx('flex-1 py-2.5 rounded-xl text-xs font-bold', segmentedButtonStyles(profile.macroUnit === unit))}
                >
                  {unit === 'g' ? 'Grams (g)' : 'Percentage (%)'}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            Main goal, calorie target, water goal, and macro targets now live in Progress.
          </div>

          <button
            type="button"
            onClick={onOpenProgress}
            className="neutral-secondary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <TrendingUp size={16} />
            Open Progress goal setup
          </button>
        </div>
      </div>
      <div className="glass-card p-6 space-y-5 border border-brand-500/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Nutrition tracking</p>
            <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Macros, dashboard, and fasting</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Keep the premium Home dashboard simple by choosing the two extra metrics that matter most.
            </p>
          </div>
          <Sparkles size={20} className="text-brand-500 shrink-0" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="premium-profile-setting-chip">
            <span>Dashboard focus</span>
            <strong>{selectedDashboardMetricLabels.join(' + ')}</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Carb mode</span>
            <strong>{profile.netCarbsMode ? 'Net carbs' : 'Total carbs'}</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Fasting plan</span>
            <strong>{activeFastingPlan.label}</strong>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase block">Home dashboard metrics</label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardMetricOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedDashboardMetrics.includes(option.value);

              return (
                <button
                  key={`dashboard-metric-${option.value}`}
                  type="button"
                  onClick={() => onToggleDashboardMetric(option.value)}
                  className={clsx('premium-profile-setup-card text-left transition-all', isSelected && 'premium-profile-setup-card-active')}
                >
                  <div className="premium-icon-badge bg-slate-50 dark:bg-slate-900">
                    <Icon size={18} className="text-[#111827] dark:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{option.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#111827] dark:text-white">
                      {option.value === 'carbs' && profile.netCarbsMode ? 'Net Carbs' : option.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{option.helper}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose up to 2 extra dashboard cards. Calories, protein, and water stay pinned.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="neutral-row rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-brand-500" />
              <div>
                <p className="font-semibold text-[#111827] dark:text-white">Net carbs mode</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Subtract fiber from carbs anywhere your dashboard shows carb tracking.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleNetCarbs}
              className={clsx('w-full py-2.5 rounded-xl text-sm font-semibold', segmentedButtonStyles(Boolean(profile.netCarbsMode)))}
            >
              {profile.netCarbsMode ? 'Net carbs on' : 'Use total carbs'}
            </button>
          </div>

          <div className="neutral-row rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#111827] dark:text-white">Intermittent fasting</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{fastingSummary.detail}</p>
              </div>
              <span className="premium-home-chip premium-home-chip-soft">{fastingSummary.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {fastingPlanOptions.map((option) => (
                <button
                  key={`fasting-plan-${option.value}`}
                  type="button"
                  onClick={() => onFastingPlanChange(option.value)}
                  className={clsx('py-2.5 rounded-xl text-xs font-bold', segmentedButtonStyles(activeFastingPlan.value === option.value))}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="premium-progress-track">
              <div
                className="premium-progress-fill"
                style={{ width: `${fastingProgressPercent}%`, background: 'linear-gradient(90deg, #111827, #22c55e)' }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onFastingAction}
                className="neutral-primary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <MoonIcon size={16} />
                {fastingState?.isActive ? 'End fast' : 'Start fast'}
              </button>
              {fastingState?.lastDurationHours ? (
                <div className="neutral-row rounded-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                  Last fast: <span className="ml-1 font-semibold text-[#111827] dark:text-white">{fastingState.lastDurationHours}h</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <details className="glass-card p-7 space-y-5">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Routines</p>
            <p className="mt-1 text-sm font-semibold text-[#111827] dark:text-white">Open habit management</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] bg-slate-200 text-slate-700 dark:bg-[#24364e] dark:text-slate-200">
            Secondary
          </span>
        </summary>

        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[#111827] dark:text-white">Manage Habits</h4>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onOpenAddHabit} className={actionLinkStyles}>
              <Plus size={16} /> Add Habit
            </motion.button>
          </div>

          <div className="space-y-2">
            {habits.length === 0 ? (
              <p className="text-center py-4 text-slate-600 dark:text-slate-300 text-xs italic">No habits added yet</p>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="neutral-row p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg neutral-soft-icon flex items-center justify-center">
                      <HabitIcon name={habit.icon} size={16} />
                    </div>
                    <span className="text-sm font-medium text-[#111827] dark:text-white">{habit.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteHabit(habit)}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </details>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Reminders</p>
            <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Nudges and permissions</h4>
          </div>
          <Bell size={20} className="text-brand-500 shrink-0" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="premium-profile-setting-chip">
            <span>Notifications</span>
            <strong className="capitalize">{profileNotificationLabel}</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Meal alerts</span>
            <strong>{profile.mealRemindersEnabled ? 'On' : 'Off'}</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Water cadence</span>
            <strong>{profile.waterReminderIntervalHours}h</strong>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="neutral-row rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-brand-500" />
              <div>
                <p className="font-semibold text-[#111827] dark:text-white">Meal reminders</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Breakfast, lunch, and dinner nudges while the app is open</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleMealReminders}
              className={clsx('w-full py-2.5 rounded-xl text-sm font-semibold', segmentedButtonStyles(profile.mealRemindersEnabled))}
            >
              {profile.mealRemindersEnabled ? 'Meal reminders on' : 'Meal reminders off'}
            </button>
          </div>

          <div className="neutral-row rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-brand-500" />
              <div>
                <p className="font-semibold text-[#111827] dark:text-white">Water reminders</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Gentle hydration nudges every few hours</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleWaterReminders}
              className={clsx('w-full py-2.5 rounded-xl text-sm font-semibold', segmentedButtonStyles(profile.waterRemindersEnabled))}
            >
              {profile.waterRemindersEnabled ? 'Water reminders on' : 'Water reminders off'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Water Reminder Interval (hours)</label>
            <input
              type="number"
              min="1"
              max="12"
              value={profile.waterReminderIntervalHours}
              onChange={(event) => onWaterReminderIntervalChange(event.target.value)}
              className="neutral-input w-full mt-1 p-3"
            />
          </div>

          <button
            type="button"
            onClick={onRequestNotificationPermission}
            className="neutral-secondary-btn px-4 py-3 text-sm font-semibold"
          >
            {profile.notificationPermission === 'granted' ? 'Notifications allowed' : 'Enable notifications'}
          </button>
        </div>

        <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          Browser notification status:
          <span className="ml-2 font-semibold text-[#111827] dark:text-white capitalize">{profileNotificationLabel}</span>
        </div>
      </div>
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Profile details</p>
            <h4 className="mt-2 font-bold text-[#111827] dark:text-white">Body numbers and personalization</h4>
          </div>
          <Scale size={20} className="text-brand-500 shrink-0" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="premium-profile-setting-chip">
            <span>Age</span>
            <strong>{profile.age} yrs</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Height</span>
            <strong>{profile.heightCm} cm</strong>
          </div>
          <div className="premium-profile-setting-chip">
            <span>Current weight</span>
            <strong>
              {profile.currentWeight}
              {profile.weightUnit}
            </strong>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(event) => onAgeChange(event.target.value)}
                className="neutral-input w-full mt-1 p-3"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Height (cm)</label>
              <input
                type="number"
                value={profile.heightCm}
                onChange={(event) => onHeightChange(event.target.value)}
                className="neutral-input w-full mt-1 p-3"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Current Weight ({profile.weightUnit})</label>
              <input
                type="number"
                value={profile.currentWeight}
                onChange={(event) => onCurrentWeightChange(event.target.value)}
                className="neutral-input w-full mt-1 p-3"
              />
            </div>
          </div>

          <div className="neutral-row rounded-2xl p-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Goal weight, calories, water, and macro targets now live in Progress.</p>
            <button
              type="button"
              onClick={onOpenProgress}
              className="neutral-secondary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <TrendingUp size={16} />
              Open goal setup
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Custom Wallpaper</label>
            <div className="mt-2 space-y-4">
              {profile.wallpaperUrl ? (
                <>
                  <div className="relative group rounded-2xl overflow-hidden aspect-video border border-slate-200 dark:border-[#3d516d]">
                    <img
                      src={wallpaperPreviewUrl}
                      alt="Custom Wallpaper"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-black/50 transition-colors">
                        <Camera size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={onWallpaperUpload} />
                      </label>
                      <button
                        type="button"
                        onClick={onRemoveWallpaper}
                        className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Opacity</label>
                        <span className="text-[10px] font-mono font-bold text-[#111827] dark:text-white">
                          {Math.round((profile.wallpaperOpacity || 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={profile.wallpaperOpacity || 1}
                        onChange={(event) => onWallpaperOpacityChange(event.target.value)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-[#2d3a4e] rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Blur</label>
                        <span className="text-[10px] font-mono font-bold text-[#111827] dark:text-white">{profile.wallpaperBlur || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={profile.wallpaperBlur || 0}
                        onChange={(event) => onWallpaperBlurChange(event.target.value)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-[#2d3a4e] rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-[#3d516d] rounded-2xl bg-slate-50 dark:bg-[#213149] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#30415b] transition-all group">
                  <Image className="text-slate-500 dark:text-slate-400 mb-2 group-hover:scale-110 transition-transform" size={32} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Background Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onWallpaperUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="neutral-primary-btn w-full py-4 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={20} />
          {syncButtonLabel}
        </motion.button>
      </div>

      <details className="glass-card p-6 space-y-5">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Advanced</p>
            <p className="mt-1 text-sm font-semibold text-[#111827] dark:text-white">Backup, diagnostics, and reset</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] bg-slate-200 text-slate-700 dark:bg-[#24364e] dark:text-slate-200">
            Technical
          </span>
        </summary>

        <div className="mt-5 space-y-5">
          <div>
            <h4 className="font-bold text-[#111827] dark:text-white">Backup & Restore</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Keep a portable copy of your meals, history, favorites, templates, and profile settings.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="neutral-secondary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export Backup
            </button>

            <button
              type="button"
              onClick={onImportBackupClick}
              className="neutral-secondary-btn w-full py-3 px-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Import Backup
            </button>
          </div>

          <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            Import replaces your current local app state. If you are signed in, food logs are also restored back into Firestore.
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="neutral-row rounded-2xl px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Events</p>
              <p className="mt-2 text-xl font-bold text-[#111827] dark:text-white">{telemetrySummary.events}</p>
            </div>
            <div className="neutral-row rounded-2xl px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Errors</p>
              <p className="mt-2 text-xl font-bold text-[#111827] dark:text-white">{telemetrySummary.errors}</p>
            </div>
            <div className="neutral-row rounded-2xl px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Telemetry</p>
              <p className="mt-2 text-xl font-bold text-[#111827] dark:text-white">{telemetrySummary.total}</p>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={onResetAllData} className="neutral-danger-btn w-full py-3">
            Reset All Data
          </motion.button>

          <input
            ref={importFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportBackup}
          />
        </div>
      </details>
    </section>
  );
}
