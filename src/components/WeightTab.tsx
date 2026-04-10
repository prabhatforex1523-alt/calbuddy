import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, Flame, Scale, Star, Target, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import type { ComponentType, Dispatch, SetStateAction } from 'react';

import type { Achievement, ActivityEntry, HealthData, OnboardingProfile, UserProfile, WeightEntry } from '../types';
import { AnimatedNumber } from './AnimatedNumber';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type ActionFeedback = {
  kind: 'food' | 'habit' | 'weight';
  message: string;
  token: number;
} | null;

type GoalFocusOption = {
  helper: string;
  icon: IconComponent;
  label: string;
  value: OnboardingProfile['primaryFocus'];
};

type AchievementSummary = {
  total: number;
  unlockedCount: number;
};

type WeeklyReview = {
  avgProtein: number;
  avgWater: number;
  goalHitDays: number;
  goalHitRate: number;
  trackedDays: number;
  workoutCount: number;
};

type HabitCompletionItem = {
  completed: boolean;
  id: string;
  name: string;
  streak: number;
};

type HistoryDatum = {
  calories: number;
  date: string;
  goal: number;
};

type ProteinHistoryDatum = {
  date: string;
  protein: number;
};

type WaterHistoryDatum = {
  date: string;
  goal: number;
  water: number;
};

type WeightHistoryDatum = {
  date: string;
  goal: number;
  weight: number;
};

type WeightTabProps = {
  achievements: Achievement[];
  achievementSummary: AchievementSummary;
  actionFeedback: ActionFeedback;
  autoMacroTargets: {
    carbs: number;
    fat: number;
    protein: number;
  };
  carbsGoal: number;
  chartAnimationEnabled: boolean;
  dailyActivity: ActivityEntry[];
  dailyProtein: number;
  fatGoal: number;
  goalFocusKey: OnboardingProfile['primaryFocus'];
  goalFocusLabel: string;
  goalFocusOptions: GoalFocusOption[];
  goalModeLabel: string;
  habitCompletion: HabitCompletionItem[];
  historyData: HistoryDatum[];
  isDarkMode: boolean;
  loggingStreak: number;
  onApplyAdaptiveRecommendation: () => void;
  onDeleteWeightEntry: (entryId: string) => void | Promise<void>;
  onGoalFocusChange: (nextFocus: OnboardingProfile['primaryFocus']) => void;
  onLogWeight: (weight: number) => void;
  onOpenAddActivity: () => void;
  onOpenAddHabit: () => void;
  onOpenGoalCenter: () => void;
  onToggleHabit: (habitId: string) => void;
  profile: UserProfile;
  progressAverageCalories: number;
  progressGoalGap: number;
  progressLatestWeightDelta: number | null;
  proteinGoal: number;
  proteinHistoryData: ProteinHistoryDatum[];
  recentWeightEntryId: string | null;
  remainingWater: number;
  segmentedButtonStyles: (active: boolean) => string;
  setData: Dispatch<SetStateAction<HealthData>>;
  waterHistoryData: WaterHistoryDatum[];
  weeklyReview: WeeklyReview;
  weightEntries: WeightEntry[];
  weightHistoryData: WeightHistoryDatum[];
};

export function WeightTab({
  achievements,
  achievementSummary,
  actionFeedback,
  autoMacroTargets,
  carbsGoal,
  chartAnimationEnabled,
  dailyActivity,
  dailyProtein,
  fatGoal,
  goalFocusKey,
  goalFocusLabel,
  goalFocusOptions,
  goalModeLabel,
  habitCompletion,
  historyData,
  isDarkMode,
  loggingStreak,
  onApplyAdaptiveRecommendation,
  onDeleteWeightEntry,
  onGoalFocusChange,
  onLogWeight,
  onOpenAddActivity,
  onOpenAddHabit,
  onOpenGoalCenter,
  onToggleHabit,
  profile,
  progressAverageCalories,
  progressGoalGap,
  progressLatestWeightDelta,
  proteinGoal,
  proteinHistoryData,
  recentWeightEntryId,
  remainingWater,
  segmentedButtonStyles,
  setData,
  waterHistoryData,
  weeklyReview,
  weightEntries,
  weightHistoryData,
}: WeightTabProps) {
  return (
    <section className="space-y-6 premium-tab-shell">
      <div className="glass-card premium-tab-hero p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Progress</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-[#111827] dark:text-white">
              Goal progress in one clear story
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Goal progress comes first, then weight trend, then consistency so the rest of the app can stay simple.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="premium-home-chip premium-home-chip-brand">{goalFocusLabel}</span>
              <span className="premium-streak-pill rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                <Flame size={12} />
                {loggingStreak} day streak
              </span>
              <button
                type="button"
                onClick={onOpenGoalCenter}
                className="neutral-secondary-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <Target size={14} />
                Edit goals
              </button>
            </div>
          </div>
          <div className="premium-progress-focus-card shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Current weight
            </p>
            <p className="mt-2 text-3xl font-black text-[#111827] dark:text-white">
              <AnimatedNumber value={profile.currentWeight} />
              <span className="ml-1 text-base font-bold text-slate-500 dark:text-slate-300">{profile.weightUnit}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {progressGoalGap === 0 ? 'At goal weight' : `${progressGoalGap}${profile.weightUnit} away from goal`}
            </p>
            <div className="premium-progress-meta-row mt-4">
              <span className="premium-progress-meta-chip">Goal {profile.weightGoal}{profile.weightUnit}</span>
              <span className="premium-progress-meta-chip">
                {progressLatestWeightDelta === null
                  ? 'Need 2 weigh-ins'
                  : `${progressLatestWeightDelta > 0 ? '+' : ''}${progressLatestWeightDelta}${profile.weightUnit} vs last`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="premium-feature-tile premium-feature-tile-brand rounded-2xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Goal hit rate</p>
            <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{weeklyReview.goalHitRate}%</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{weeklyReview.goalHitDays} good days this week</p>
          </div>
          <div className="premium-feature-tile premium-feature-tile-amber rounded-2xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Logging streak</p>
            <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{loggingStreak} days</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{weeklyReview.trackedDays}/7 tracked this week</p>
          </div>
          <div className="premium-feature-tile premium-feature-tile-sky rounded-2xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Avg protein</p>
            <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{weeklyReview.avgProtein}g</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{weeklyReview.workoutCount} workouts logged</p>
          </div>
          <div className="premium-feature-tile premium-home-grid-card-water rounded-2xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Avg water</p>
            <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{weeklyReview.avgWater} ml</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{progressAverageCalories} avg kcal per day</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="glass-card premium-chart-card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Weight trend</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Your recent movement against your goal.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Goal {profile.weightGoal}{profile.weightUnit}
            </span>
          </div>
          <div className="premium-progress-meta-row mb-4">
            <span className="premium-progress-meta-chip">Current {profile.currentWeight}{profile.weightUnit}</span>
            <span className="premium-progress-meta-chip">
              {progressGoalGap === 0 ? 'At goal weight' : `${progressGoalGap}${profile.weightUnit} away`}
            </span>
            <span className="premium-progress-meta-chip">
              {weightEntries.length === 0
                ? 'Using current weight snapshot'
                : `${weightEntries.length} weigh-in${weightEntries.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <div className="premium-chart-stage h-64 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#2d3a4e' : '#e5e5e5'} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#a1a1aa' : '#6b7280', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  isAnimationActive={chartAnimationEnabled}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#2d3a4e' : '#e5e5e5'}`,
                    borderRadius: '12px',
                    boxShadow: '0 1px 2px rgba(15, 15, 15, 0.08)',
                    color: isDarkMode ? '#ffffff' : '#111827',
                  }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <ReferenceLine
                  y={profile.weightGoal}
                  stroke="#71717a"
                  strokeDasharray="3 3"
                  label={{ position: 'right', value: 'Goal', fill: isDarkMode ? '#a1a1aa' : '#6b7280', fontSize: 10, fontWeight: 700 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#22c55e"
                  strokeWidth={3}
                  isAnimationActive={chartAnimationEnabled}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4, stroke: isDarkMode ? '#1e293b' : '#ffffff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card premium-chart-card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Weekly calories</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">A quick view of how steady the week has been.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {historyData.reduce((sum, item) => sum + item.calories, 0)} total
            </span>
          </div>
          <div className="premium-progress-meta-row mb-4">
            <span className="premium-progress-meta-chip">{progressAverageCalories} avg kcal/day</span>
            <span className="premium-progress-meta-chip">{weeklyReview.trackedDays}/7 tracked days</span>
            <span className="premium-progress-meta-chip">{weeklyReview.goalHitRate}% hit rate</span>
          </div>
          <div className="premium-chart-stage h-64 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  isAnimationActive={chartAnimationEnabled}
                  cursor={{ fill: isDarkMode ? '#182131' : '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#2d3a4e' : '#e5e5e5'}`,
                    boxShadow: '0 1px 2px rgba(15, 15, 15, 0.08)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                  }}
                />
                <Bar dataKey="calories" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimationEnabled} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="glass-card premium-chart-card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Protein trend</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Daily protein against your recommended target.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Goal {proteinGoal}g
            </span>
          </div>
          <div className="premium-progress-meta-row mb-4">
            <span className="premium-progress-meta-chip">{weeklyReview.avgProtein}g weekly avg</span>
            <span className="premium-progress-meta-chip">
              {dailyProtein >= proteinGoal ? 'Goal met today' : `${Math.max(0, Math.round(proteinGoal - dailyProtein))}g left today`}
            </span>
          </div>
          <div className="premium-chart-stage h-60 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={proteinHistoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  isAnimationActive={chartAnimationEnabled}
                  cursor={{ fill: isDarkMode ? '#182131' : '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#2d3a4e' : '#e5e5e5'}`,
                    boxShadow: '0 1px 2px rgba(15, 15, 15, 0.08)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                  }}
                />
                <ReferenceLine y={proteinGoal} stroke={isDarkMode ? '#4ade80' : '#16a34a'} strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="protein"
                  stroke="#22c55e"
                  strokeWidth={3}
                  isAnimationActive={chartAnimationEnabled}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card premium-chart-card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Water intake</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Hydration consistency across the last seven days.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Goal {profile.dailyWaterGoalMl} ml
            </span>
          </div>
          <div className="premium-progress-meta-row mb-4">
            <span className="premium-progress-meta-chip">{weeklyReview.avgWater} ml weekly avg</span>
            <span className="premium-progress-meta-chip">
              {remainingWater <= 0 ? 'Goal met today' : `${Math.round(remainingWater)} ml left today`}
            </span>
          </div>
          <div className="premium-chart-stage h-60 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waterHistoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  isAnimationActive={chartAnimationEnabled}
                  contentStyle={{
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#2d3a4e' : '#e5e5e5'}`,
                    boxShadow: '0 1px 2px rgba(15, 15, 15, 0.08)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                  }}
                />
                <ReferenceLine y={profile.dailyWaterGoalMl} stroke={isDarkMode ? '#475569' : '#cbd5e1'} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="water" stroke="#0ea5e9" strokeWidth={3} isAnimationActive={chartAnimationEnabled} dot={{ fill: '#0ea5e9', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4">
          <div id="progress-goal-center" className="glass-card p-5 sm:p-6 space-y-4">
            <div className="premium-section-heading">
              <div>
                <h3 className="font-bold text-[#111827] dark:text-white">Goal center</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  This is the main place to change goals and targets for the whole app.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="premium-progress-meta-chip">{proteinGoal}g protein target</span>
                <Target size={18} className="text-brand-500 shrink-0" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Main goal</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">{goalFocusLabel}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{goalModeLabel} mode</p>
              </div>
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Goal weight</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">{profile.weightGoal}{profile.weightUnit}</p>
              </div>
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Calories</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">{profile.dailyCalorieGoal}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{profile.useAutoCalorieGoal ? 'Auto' : 'Manual'} mode</p>
              </div>
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Macros</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">{proteinGoal} / {carbsGoal} / {fatGoal}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{profile.useCustomMacroGoals ? 'Custom' : 'Auto'} targets</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">
                    Choose Your Main Goal
                  </label>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Change it here once. Home, Progress, and coaching all follow this setting.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {goalFocusOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = goalFocusKey === option.value;

                    return (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        key={`progress-goal-focus-${option.value}`}
                        type="button"
                        onClick={() => onGoalFocusChange(option.value)}
                        className={clsx(
                          'neutral-row rounded-[24px] px-4 py-4 text-left transition-all duration-200 ease-out',
                          isActive && 'border border-brand-500/20 bg-brand-50/70 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={clsx(
                              'premium-home-card-icon flex h-10 w-10 items-center justify-center rounded-2xl shrink-0',
                              isActive && 'bg-brand-500 text-white dark:bg-brand-500 dark:text-white'
                            )}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#111827] dark:text-white">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{option.helper}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                Goal editing now lives in Progress, so Profile stays focused on personal details and preferences.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">
                    Weight Goal ({profile.weightUnit})
                  </label>
                  <input
                    type="number"
                    value={profile.weightGoal}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, weightGoal: parseFloat(event.target.value) || 0 },
                      }))
                    }
                    className="neutral-input w-full p-3"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">
                    Daily Water Goal (ml)
                  </label>
                  <input
                    type="number"
                    value={profile.dailyWaterGoalMl}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, dailyWaterGoalMl: parseInt(event.target.value, 10) || 0 },
                      }))
                    }
                    className="neutral-input w-full p-3"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Calorie Goal Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Auto', value: true },
                    { label: 'Manual', value: false },
                  ] as const).map((option) => (
                    <button
                      key={`progress-calorie-mode-${option.label}`}
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            useAutoCalorieGoal: option.value,
                          },
                        }))
                      }
                      className={clsx('py-2.5 rounded-xl text-xs font-bold', segmentedButtonStyles(profile.useAutoCalorieGoal === option.value))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {!profile.useAutoCalorieGoal && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Daily Calorie Goal</label>
                  <input
                    type="number"
                    value={profile.dailyCalorieGoal}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, dailyCalorieGoal: parseInt(event.target.value, 10) || 0 },
                      }))
                    }
                    className="neutral-input w-full p-3"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Macro Goal Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Auto', value: false },
                    { label: 'Custom', value: true },
                  ] as const).map((option) => (
                    <button
                      key={`progress-macro-mode-${option.label}`}
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            useCustomMacroGoals: option.value,
                            customProteinGoal: prev.profile.customProteinGoal ?? autoMacroTargets.protein,
                            customCarbsGoal: prev.profile.customCarbsGoal ?? autoMacroTargets.carbs,
                            customFatGoal: prev.profile.customFatGoal ?? autoMacroTargets.fat,
                          },
                        }))
                      }
                      className={clsx('py-2.5 rounded-xl text-xs font-bold', segmentedButtonStyles(Boolean(profile.useCustomMacroGoals) === option.value))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {profile.useCustomMacroGoals ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Protein Goal (g)</label>
                    <input
                      type="number"
                      value={profile.customProteinGoal ?? proteinGoal}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, customProteinGoal: parseInt(event.target.value, 10) || 0 },
                        }))
                      }
                      className="neutral-input w-full p-3"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Carb Goal (g)</label>
                    <input
                      type="number"
                      value={profile.customCarbsGoal ?? carbsGoal}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, customCarbsGoal: parseInt(event.target.value, 10) || 0 },
                        }))
                      }
                      className="neutral-input w-full p-3"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2 block">Fat Goal (g)</label>
                    <input
                      type="number"
                      value={profile.customFatGoal ?? fatGoal}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, customFatGoal: parseInt(event.target.value, 10) || 0 },
                        }))
                      }
                      className="neutral-input w-full p-3"
                    />
                  </div>
                </div>
              ) : (
                <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  Auto targets: <span className="ml-2 font-semibold text-[#111827] dark:text-white">{autoMacroTargets.protein}P / {autoMacroTargets.carbs}C / {autoMacroTargets.fat}F</span>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onApplyAdaptiveRecommendation}
                  className="neutral-primary-btn flex-1 py-3 text-sm font-semibold"
                >
                  Use suggested goal
                </button>
                <div className="neutral-row rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 flex-1">
                  {profile.useCustomMacroGoals
                    ? 'Custom macro goals are active and update Home, Food Log, and Progress immediately.'
                    : 'Macro targets update automatically from your calories, goal type, and current weight.'}
                </div>
              </div>
            </div>
          </div>

          <div className={clsx('glass-card p-6 space-y-4', recentWeightEntryId && 'premium-weight-celebration')}>
            <div className="premium-section-heading">
              <div>
                <h3 className="font-bold text-[#111827] dark:text-white">Log weight</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Keep the trend fresh with a quick check-in.</p>
              </div>
              <Scale size={18} className="text-brand-500 shrink-0" />
            </div>
            <AnimatePresence initial={false}>
              {actionFeedback?.kind === 'weight' && (
                <motion.div
                  key={`weight-feedback-${actionFeedback.token}`}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="premium-feedback-chip premium-feedback-chip-success"
                >
                  <CheckCircle2 size={12} />
                  {actionFeedback.message}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Current</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">{profile.currentWeight}{profile.weightUnit}</p>
              </div>
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Goal</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">{profile.weightGoal}{profile.weightUnit}</p>
              </div>
              <div className="premium-progress-mini-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Change</p>
                <p className="mt-2 text-xl font-black text-[#111827] dark:text-white">
                  {progressLatestWeightDelta === null ? '--' : `${progressLatestWeightDelta > 0 ? '+' : ''}${progressLatestWeightDelta}${profile.weightUnit}`}
                </p>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.target as HTMLFormElement;
                const weight = parseFloat((form.elements.namedItem('weight') as HTMLInputElement).value);
                if (weight) {
                  onLogWeight(weight);
                  form.reset();
                }
              }}
              className="premium-progress-form-shell"
            >
              <input
                name="weight"
                type="number"
                step="0.1"
                required
                placeholder={`Weight in ${profile.weightUnit}`}
                className="neutral-input flex-1 p-3"
              />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="neutral-primary-btn px-6 py-3">
                Log
              </motion.button>
            </form>

            <div className="space-y-2">
              {[...weightEntries].reverse().slice(0, 3).map((entry) => (
                <div
                  key={`progress-weight-${entry.id}`}
                  className={clsx(
                    'premium-list-row neutral-row rounded-[22px] px-4 py-3 flex items-center justify-between gap-3',
                    recentWeightEntryId === entry.id && 'premium-success-highlight'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="premium-progress-list-icon">
                      <Scale size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827] dark:text-white">{entry.weight} {profile.weightUnit}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{format(new Date(entry.timestamp), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteWeightEntry(entry.id)}
                    className="neutral-danger-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 sm:p-6 space-y-4">
            <div className="premium-section-heading">
              <div>
                <h3 className="font-bold text-[#111827] dark:text-white">Habits</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Track the habits that support your food goals.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="premium-progress-meta-chip">{habitCompletion.filter((habit) => habit.completed).length}/{habitCompletion.length || 0} done</span>
                <CheckCircle2 size={18} className="text-brand-500 shrink-0" />
              </div>
            </div>
            <div className="space-y-2">
              {habitCompletion.slice(0, 3).map((habit) => (
                <button
                  key={`progress-habit-${habit.id}`}
                  type="button"
                  onClick={() => onToggleHabit(habit.id)}
                  className={clsx(
                    'premium-list-row neutral-row w-full rounded-[22px] px-4 py-3 text-left flex items-center justify-between gap-3',
                    habit.completed && 'premium-success-highlight'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{habit.name}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{habit.streak} day streak</p>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                      habit.completed
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-[#24364e] dark:text-slate-200'
                    )}
                  >
                    {habit.completed ? 'Done' : 'Open'}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" onClick={onOpenAddHabit} className="neutral-secondary-btn w-full py-3 text-sm font-semibold">
              Add habit
            </button>
          </div>

          <div className="glass-card p-5 sm:p-6 space-y-4">
            <div className="premium-section-heading">
              <div>
                <h3 className="font-bold text-[#111827] dark:text-white">Workouts</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Keep activity visible without giving it a full nav tab.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="premium-progress-meta-chip">{dailyActivity.length} today</span>
                <Flame size={18} className="text-brand-500 shrink-0" />
              </div>
            </div>
            {dailyActivity.length === 0 ? (
              <div className="premium-empty-state neutral-row rounded-2xl">
                <Flame className="mx-auto text-slate-500 dark:text-slate-400 mb-2" size={24} />
                <p className="text-sm text-slate-600 dark:text-slate-300">No workouts logged today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dailyActivity.slice(0, 3).map((activity) => (
                  <div key={`progress-activity-${activity.id}`} className="premium-list-row neutral-row rounded-[22px] px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] dark:text-white">{activity.name}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{activity.durationMinutes} mins | {activity.intensity}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">-{activity.caloriesBurned} kcal</span>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={onOpenAddActivity} className="neutral-primary-btn w-full py-3 text-sm font-semibold">
              Log workout
            </button>
          </div>

          {achievementSummary.total > 0 && (
            <div className="glass-card p-5 sm:p-6 space-y-4">
              <div className="premium-section-heading">
                <div>
                  <h3 className="font-bold text-[#111827] dark:text-white">Milestones</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Small wins that make progress feel rewarding.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="premium-progress-meta-chip">
                    {achievementSummary.unlockedCount}/{achievementSummary.total} unlocked
                  </span>
                  <Star size={18} className="text-brand-500 shrink-0" />
                </div>
              </div>

              <div className="space-y-2">
                {achievements.slice(0, 3).map((achievement) => (
                  <div
                    key={`progress-achievement-${achievement.id}`}
                    className={clsx(
                      'achievement-card',
                      achievement.unlocked ? 'achievement-card-unlocked' : 'achievement-card-locked'
                    )}
                  >
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{achievement.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{achievement.description}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {achievement.unlocked
                        ? `Unlocked ${achievement.unlockedAt ? format(new Date(achievement.unlockedAt), 'MMM d') : 'recently'}`
                        : 'In progress'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
