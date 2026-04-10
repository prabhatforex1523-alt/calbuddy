import { format } from 'date-fns';
import {
  ArrowUpRight,
  Camera,
  Droplets,
  Flame,
  Moon as MoonIcon,
  Plus,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, type Transition } from 'motion/react';
import type { ComponentType } from 'react';

import type { DayQualityInsight } from '../services/mealQuality';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type SummaryCard = {
  accentClass: string;
  helper: string;
  highlight?: 'calories' | 'protein' | 'water';
  icon: IconComponent;
  label: string;
  progress: number;
  progressFill?: string;
  value: string;
};

type QuickActionCard = {
  description: string;
  icon: IconComponent;
  label: string;
  onClick: () => void;
};

type InsightHighlight = {
  detail: string;
  icon: IconComponent;
  label: string;
  title: string;
};

type MomentumMetric = {
  helper: string;
  label: string;
  value: string;
};

type AchievementSummary = {
  completionRate: number;
  nextLocked: {
    description: string;
    title: string;
  } | null;
  total: number;
  unlockedCount: number;
};

type FastingPlanSummary = {
  eatingHours: number;
  fastHours: number;
};

type FastingSummary = {
  detail: string;
  headline: string;
  status: string;
};

type TodayTabProps = {
  activeFastingPlan: FastingPlanSummary;
  aiFoodScanAvailable: boolean;
  achievementSummary: AchievementSummary;
  coachSuggestionCtaLabel?: string;
  dailyQualityInsight: DayQualityInsight;
  dayFoodCount: number;
  fastingIsActive: boolean;
  fastingProgressPercent: number;
  fastingSummary: FastingSummary;
  homeInsightHighlights: InsightHighlight[];
  homeMomentumMetrics: MomentumMetric[];
  isSelectedDateToday: boolean;
  loggingStreak: number;
  mobileCardTransition: Transition;
  mobileSyncBadge: {
    className: string;
    label: string;
  };
  netCarbsMode: boolean;
  onCoachSuggestionTap: () => void;
  onEndFast: () => void;
  onNextBestActionTap: () => void;
  onOpenAddFood: () => void;
  onOpenProfile: () => void;
  onOpenProgress: () => void;
  onOpenScan: () => void;
  onQuickPickShortcut: (name: string) => void;
  onQuickWaterBoost: () => void;
  onStartFast: () => void;
  progressHighlight: 'calories' | 'protein' | 'water' | null;
  selectedDashboardMetricLabels: string[];
  selectedDate: Date;
  timeSegment: string;
  todayQuickActionCards: QuickActionCard[];
  todaySuggestedShortcutNames: string[];
  todaySummaryCards: SummaryCard[];
  userFirstName: string;
};

export function TodayTab({
  activeFastingPlan,
  aiFoodScanAvailable,
  achievementSummary,
  coachSuggestionCtaLabel,
  dailyQualityInsight,
  dayFoodCount,
  fastingIsActive,
  fastingProgressPercent,
  fastingSummary,
  homeInsightHighlights,
  homeMomentumMetrics,
  isSelectedDateToday,
  loggingStreak,
  mobileCardTransition,
  mobileSyncBadge,
  netCarbsMode,
  onCoachSuggestionTap,
  onEndFast,
  onNextBestActionTap,
  onOpenAddFood,
  onOpenProfile,
  onOpenProgress,
  onOpenScan,
  onQuickPickShortcut,
  onQuickWaterBoost,
  onStartFast,
  progressHighlight,
  selectedDashboardMetricLabels,
  selectedDate,
  timeSegment,
  todayQuickActionCards,
  todaySuggestedShortcutNames,
  todaySummaryCards,
  userFirstName,
}: TodayTabProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={mobileCardTransition}
      className="space-y-5"
    >
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-card premium-tab-hero p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="premium-home-chip premium-home-chip-muted">
                  {isSelectedDateToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
                </span>
                <span className={clsx('premium-home-chip', mobileSyncBadge.className)}>
                  {mobileSyncBadge.label}
                </span>
                <span className="premium-home-chip premium-home-chip-soft">
                  {loggingStreak} day streak
                </span>
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
                Home dashboard
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] dark:text-white sm:text-[2rem]">
                Good {timeSegment}
                {userFirstName ? `, ${userFirstName}` : ''}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                {isSelectedDateToday
                  ? 'Your meals, macros, and hydration are lined up in one cleaner snapshot.'
                  : `Snapshot for ${format(selectedDate, 'EEEE, MMM d')}.`}
              </p>
            </div>
            <div className="premium-home-focus-icon flex h-12 w-12 items-center justify-center rounded-2xl shrink-0">
              <Sparkles size={20} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
            {todaySummaryCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={`today-summary-${item.label}`}
                  className={clsx(
                    'premium-feature-tile rounded-[24px] px-4 py-4 space-y-3',
                    item.accentClass,
                    ((progressHighlight === 'calories' && item.highlight === 'calories') ||
                      (progressHighlight === 'protein' && item.highlight === 'protein') ||
                      (progressHighlight === 'water' && item.highlight === 'water')) &&
                      'premium-progress-highlight'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-black tracking-tight text-[#111827] dark:text-white">
                        {item.value}
                      </p>
                    </div>
                    <div className="premium-home-card-icon flex h-10 w-10 items-center justify-center rounded-2xl shrink-0">
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="premium-progress-track">
                    <div
                      className="premium-progress-fill"
                      style={{ width: `${item.progress}%`, background: item.progressFill }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.helper}</p>
                </div>
              );
            })}
          </div>

          <div className="neutral-row rounded-[22px] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  Dashboard focus
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827] dark:text-white">
                  {selectedDashboardMetricLabels.join(' | ')}
                  {netCarbsMode ? ' | Net carbs on' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenProfile}
                className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
              >
                <SettingsIcon size={14} />
                Customize
              </button>
            </div>
          </div>

          <div className="neutral-row rounded-[22px] px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
              Today quality
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111827] dark:text-white">
              {dailyQualityInsight.title}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {dailyQualityInsight.detail}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dailyQualityInsight.badges.map((badge) => (
                <span
                  key={`daily-quality-badge-${badge}`}
                  className={clsx(
                    'premium-home-chip text-[10px] font-semibold normal-case tracking-normal',
                    dailyQualityInsight.tone === 'good'
                      ? 'premium-home-chip-brand'
                      : dailyQualityInsight.tone === 'calm'
                        ? 'premium-home-chip-sky'
                        : 'premium-home-chip-muted'
                  )}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {dayFoodCount === 0 && (
            <div className="neutral-row rounded-[24px] px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
                    Best next step
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#111827] dark:text-white">
                    Start with one meal, one water check-in, or a quick scan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onOpenAddFood}
                    className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                  >
                    <Plus size={14} />
                    Add food
                  </button>
                  <button
                    type="button"
                    onClick={onOpenScan}
                    className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                  >
                    <Camera size={14} />
                    Scan
                  </button>
                  <button
                    type="button"
                    onClick={onQuickWaterBoost}
                    className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                  >
                    <Droplets size={14} />
                    Water
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-5 sm:p-6 space-y-5"
        >
          <div className="premium-section-heading">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Quick actions</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Fast ways to keep today moving without leaving the dashboard.
              </p>
            </div>
            <ArrowUpRight size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {todayQuickActionCards.map((card) => {
              const Icon = card.icon;
              const disabled = card.label === 'Scan meal' && !aiFoodScanAvailable;

              return (
                <motion.button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  disabled={disabled}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="premium-action-card neutral-row rounded-[24px] px-4 py-4 text-left disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="premium-home-card-icon flex h-11 w-11 items-center justify-center rounded-2xl shrink-0">
                      <Icon size={18} />
                    </div>
                    <ArrowUpRight size={16} className="text-brand-500 shrink-0" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#111827] dark:text-white">{card.label}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{card.description}</p>
                </motion.button>
              );
            })}
          </div>

          {todaySuggestedShortcutNames.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                Quick picks
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {todaySuggestedShortcutNames.map((item) => (
                  <button
                    key={`today-shortcut-live-${item}`}
                    type="button"
                    onClick={() => onQuickPickShortcut(item)}
                    className="premium-quick-chip neutral-secondary-btn rounded-full px-3 py-2 text-xs font-semibold"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="premium-card premium-fasting-card p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Fasting tracker</p>
                <h4 className="mt-1 font-bold text-[#111827] dark:text-white">{fastingSummary.headline}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{fastingSummary.detail}</p>
              </div>
              <div className="premium-home-card-icon flex h-11 w-11 items-center justify-center rounded-2xl shrink-0">
                <MoonIcon size={18} />
              </div>
            </div>

            <div className="premium-progress-track">
              <div
                className="premium-progress-fill"
                style={{ width: `${fastingProgressPercent}%`, background: 'linear-gradient(90deg, #111827, #22c55e)' }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-home-chip premium-home-chip-soft">{fastingSummary.status}</span>
              <span className="premium-home-chip premium-home-chip-muted">
                {activeFastingPlan.fastHours}h fast / {activeFastingPlan.eatingHours}h eat
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fastingIsActive ? onEndFast : onStartFast}
                className="neutral-primary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <MoonIcon size={16} />
                {fastingIsActive ? 'End fast' : 'Start fast'}
              </button>
              <button
                type="button"
                onClick={onOpenProfile}
                className="neutral-pill-btn rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Target size={14} />
                Change plan
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="premium-card p-4 sm:p-5 space-y-4">
          <div className="premium-section-heading">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
                Today guide
              </p>
              <h3 className="mt-1 font-bold text-[#111827] dark:text-white">
                One clear place for coaching and next steps
              </h3>
            </div>
            <ShieldCheck size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3">
            {homeInsightHighlights.map((item, index) => {
              const Icon = item.icon;
              const isPrimaryHighlight = index === 0;

              return (
                <div
                  key={`home-highlight-${item.label}-${item.title}`}
                  className={clsx(
                    'neutral-row rounded-[24px] px-4 py-4 transition-all duration-200 ease-out',
                    isPrimaryHighlight && 'border border-brand-500/15 bg-brand-50/70 dark:border-brand-500/20 dark:bg-brand-500/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'premium-home-card-icon flex h-11 w-11 items-center justify-center rounded-2xl shrink-0',
                        isPrimaryHighlight && 'bg-brand-500 text-white dark:bg-brand-500 dark:text-white'
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-base font-bold text-[#111827] dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onNextBestActionTap}
              className="neutral-primary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            >
              <Zap size={16} />
              Take next step
            </button>
            {coachSuggestionCtaLabel && (
              <button
                type="button"
                onClick={onCoachSuggestionTap}
                className="neutral-secondary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <ArrowUpRight size={16} />
                {coachSuggestionCtaLabel}
              </button>
            )}
          </div>
        </div>

        <div className="premium-card p-4 sm:p-5 space-y-4">
          <div className="premium-section-heading">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
                Momentum
              </p>
              <h3 className="mt-1 font-bold text-[#111827] dark:text-white">
                Useful signals without the clutter
              </h3>
            </div>
            <Flame size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {homeMomentumMetrics.map((metric) => (
              <div key={`home-momentum-${metric.label}`} className="neutral-row rounded-2xl px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{metric.value}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{metric.helper}</p>
              </div>
            ))}
          </div>

          {achievementSummary.total > 0 ? (
            <>
              <div className="neutral-row rounded-[24px] px-4 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
                      Next unlock
                    </p>
                    <p className="mt-2 text-base font-bold text-[#111827] dark:text-white">
                      {achievementSummary.nextLocked ? achievementSummary.nextLocked.title : 'All current milestones unlocked'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {achievementSummary.nextLocked
                        ? achievementSummary.nextLocked.description
                        : 'You have cleared the current milestone set. Keep logging to protect your weekly rhythm.'}
                    </p>
                  </div>
                  <div className="premium-home-card-icon flex h-10 w-10 items-center justify-center rounded-2xl shrink-0">
                    <Sparkles size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    <span>Milestone progress</span>
                    <span>{achievementSummary.unlockedCount}/{achievementSummary.total}</span>
                  </div>
                  <div className="premium-progress-track">
                    <div
                      className="premium-progress-fill"
                      style={{ width: `${achievementSummary.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenProgress}
                  className="neutral-secondary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <ArrowUpRight size={16} />
                  View progress
                </button>
                <button
                  type="button"
                  onClick={onOpenAddFood}
                  className="neutral-pill-btn rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <Plus size={14} />
                  Log next meal
                </button>
              </div>
            </>
          ) : (
            <div className="neutral-row rounded-[24px] px-4 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Keep logging meals, water, and movement to unlock tailored milestones here.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
