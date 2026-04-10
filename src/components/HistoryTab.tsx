import { format } from 'date-fns';
import {
  ArrowUpRight,
  Camera,
  Droplets,
  Flame,
  History,
  Minus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, type MotionProps } from 'motion/react';
import type { ComponentType, CSSProperties } from 'react';

import type { ActivityEntry, FoodEntry, HabitLog, MealType, WaterEntry, WeightEntry } from '../types';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type MealVisual = {
  accentClass: string;
  icon: IconComponent;
};

type MealSection = {
  entries: FoodEntry[];
  entryCount: number;
  meal: MealType;
  title: string;
  totalCalories: number;
  totalProtein: number;
};

type HabitHistoryEntry = HabitLog & {
  icon: string;
  name: string;
  type: 'habit';
};

type CombinedHistoryEntryView =
  | (FoodEntry & { type: 'food' })
  | (ActivityEntry & { type: 'activity' })
  | (WaterEntry & { type: 'water' })
  | (WeightEntry & { type: 'weight' })
  | HabitHistoryEntry;

type HistoryTabProps = {
  calorieProgressPercent: number;
  combinedHistory: CombinedHistoryEntryView[];
  dailyConsumed: number;
  dayFood: FoodEntry[];
  dayWater: WaterEntry[];
  filteredFoodCount: number;
  foodSearchQuery: string;
  formatFoodSourceLabel: (source: FoodEntry['source']) => string;
  formatMealLabel: (mealType: MealType) => string;
  getCombinedHistoryMetric: (entry: CombinedHistoryEntryView) => string;
  getCombinedHistoryTitle: (entry: CombinedHistoryEntryView) => string;
  isSelectedDateToday: boolean;
  listEntryMotionProps: MotionProps;
  mealSections: MealSection[];
  mealTypes: MealType[];
  mealVisuals: Record<MealType, MealVisual>;
  netCarbsMode: boolean;
  onChangeFoodSearchQuery: (value: string) => void;
  onDeleteCombinedHistoryEntry: (entry: CombinedHistoryEntryView) => void | Promise<void>;
  onDeleteFoodEntry: (entryId: string) => void | Promise<void>;
  onDeleteWaterEntry: (entryId: string) => void | Promise<void>;
  onEditCombinedHistoryEntry: (entry: CombinedHistoryEntryView) => void;
  onEditFoodEntry: (entry: FoodEntry) => void;
  onOpenFoodModalForMeal: (meal: MealType) => void;
  onOpenScanTab: () => void;
  onOpenSuggestedFoodModal: () => void;
  onOpenWaterModal: () => void;
  onQuickWaterChange: (amount: number) => void;
  onSaveMealTemplate: (meal: MealType) => void;
  onToggleFavoriteFoodEntry: (entry: FoodEntry) => void;
  progressHighlight: string | null;
  proteinGrams: number;
  proteinProgressPercent: number;
  remainingProtein: number;
  remainingWater: number;
  selectedDateLabel: string;
  visibleMealSectionCount: number;
  waterMl: number;
  waterProgressPercent: number;
  isFavoriteFoodEntry: (entry: FoodEntry) => boolean;
};

export function HistoryTab({
  calorieProgressPercent,
  combinedHistory,
  dailyConsumed,
  dayFood,
  dayWater,
  filteredFoodCount,
  foodSearchQuery,
  formatFoodSourceLabel,
  formatMealLabel,
  getCombinedHistoryMetric,
  getCombinedHistoryTitle,
  isSelectedDateToday,
  listEntryMotionProps,
  mealSections,
  mealTypes,
  mealVisuals,
  netCarbsMode,
  onChangeFoodSearchQuery,
  onDeleteCombinedHistoryEntry,
  onDeleteFoodEntry,
  onDeleteWaterEntry,
  onEditCombinedHistoryEntry,
  onEditFoodEntry,
  onOpenFoodModalForMeal,
  onOpenScanTab,
  onOpenSuggestedFoodModal,
  onOpenWaterModal,
  onQuickWaterChange,
  onSaveMealTemplate,
  onToggleFavoriteFoodEntry,
  progressHighlight,
  proteinGrams,
  proteinProgressPercent,
  remainingProtein,
  remainingWater,
  selectedDateLabel,
  visibleMealSectionCount,
  waterMl,
  waterProgressPercent,
  isFavoriteFoodEntry,
}: HistoryTabProps) {
  const visibleMealSections = mealSections.filter((section) => section.entryCount > 0 && (!foodSearchQuery || section.entries.length > 0));
  const sectionStyle = {
    '--card-bg': 'var(--card-bg-summary)',
    '--card-border': 'var(--card-border-summary)',
  } as CSSProperties;

  return (
    <section className="space-y-6 premium-tab-shell" style={sectionStyle}>
      <div className="glass-card premium-tab-hero p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
              {isSelectedDateToday ? 'Today log' : selectedDateLabel}
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-[#111827] dark:text-white">Your food log</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Meals are grouped clearly so it is easy to scan, edit, or delete what you already logged.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSuggestedFoodModal}
            className="neutral-primary-btn px-4 py-3 text-sm font-semibold shrink-0"
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              Add Food
            </span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="premium-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Calories</p>
                <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{Math.round(dailyConsumed)}</p>
              </div>
              <Flame size={20} className="text-[#22c55e]" />
            </div>
            <div className="premium-progress-track">
              <div className="premium-progress-fill" style={{ width: `${calorieProgressPercent}%` }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{dayFood.length} foods logged | {calorieProgressPercent}% of goal</p>
          </div>
          <div className="premium-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Protein</p>
                <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{Math.round(proteinGrams)}g</p>
              </div>
              <Utensils size={20} className="text-slate-400 dark:text-slate-300" />
            </div>
            <div className="premium-progress-track">
              <div className="premium-progress-fill" style={{ width: `${proteinProgressPercent}%` }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {remainingProtein <= 0 ? 'Protein goal met today' : `${Math.round(remainingProtein)}g left today`}
            </p>
          </div>
          <div className="premium-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Hydration</p>
                <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{Math.round(waterMl)} ml</p>
              </div>
              <Droplets size={20} className="text-sky-500" />
            </div>
            <div className="premium-progress-track">
              <div className="premium-progress-fill" style={{ width: `${waterProgressPercent}%` }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {remainingWater <= 0 ? 'Hydration goal met today' : `${Math.round(remainingWater)} ml left today`}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="premium-section-heading">
          <div>
            <h3 className="font-bold text-[#111827] dark:text-white">Meals</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Search your logged entries or open any meal to edit it.
            </p>
          </div>
          <History size={18} className="text-brand-500 shrink-0" />
        </div>

        {dayFood.length > 0 && (
          <div className="premium-food-search-shell">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search logged foods..."
                value={foodSearchQuery}
                onChange={(event) => onChangeFoodSearchQuery(event.target.value)}
                className="neutral-input w-full pl-10 pr-10 py-3 text-sm"
              />
              {foodSearchQuery && (
                <button
                  type="button"
                  onClick={() => onChangeFoodSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="premium-food-search-meta">
              <span>{filteredFoodCount} of {dayFood.length} entries showing</span>
              <span>{visibleMealSectionCount} meal section{visibleMealSectionCount === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}

        {dayFood.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mealTypes.map((meal) => {
              const section = mealSections.find((item) => item.meal === meal);
              if (!section || section.entryCount === 0) {
                return null;
              }

              const MealIcon = mealVisuals[meal].icon;

              return (
                <button
                  key={`meal-chip-${meal}`}
                  type="button"
                  onClick={() => onOpenFoodModalForMeal(meal)}
                  className="premium-log-meal-chip"
                >
                  <MealIcon size={14} />
                  {section.title}
                  <span className="premium-log-meal-chip-count">{section.entryCount}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-4">
          {dayFood.length === 0 ? (
            <div className="premium-empty-state neutral-row rounded-2xl">
              <Utensils className="mx-auto text-slate-500 dark:text-slate-400 mb-2" size={28} />
              <p className="text-sm text-slate-600 dark:text-slate-300">No food logged for this day yet.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pick a meal to start fast, or use scan if the photo is easier.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {mealTypes.map((meal) => (
                  <button
                    key={`empty-meal-${meal}`}
                    type="button"
                    onClick={() => onOpenFoodModalForMeal(meal)}
                    className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                  >
                    {formatMealLabel(meal)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onOpenSuggestedFoodModal}
                className="neutral-primary-btn mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <Plus size={16} />
                Add first food
              </button>
              <button
                type="button"
                onClick={onOpenScanTab}
                className="neutral-secondary-btn mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <Camera size={16} />
                Scan a photo instead
              </button>
            </div>
          ) : filteredFoodCount === 0 ? (
            <div className="premium-empty-state neutral-row rounded-2xl">
              <Search className="mx-auto text-slate-500 dark:text-slate-400 mb-2" size={28} />
              <p className="text-sm text-slate-600 dark:text-slate-300">No matches found for "{foodSearchQuery}".</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeFoodSearchQuery('')}
                  className="neutral-secondary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <X size={16} />
                  Clear search
                </button>
                <button
                  type="button"
                  onClick={onOpenSuggestedFoodModal}
                  className="neutral-pill-btn rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <Plus size={14} />
                  Add food
                </button>
              </div>
            </div>
          ) : (
            visibleMealSections.map((section) => {
              const mealVisual = mealVisuals[section.meal];
              const MealIcon = mealVisual.icon;

              return (
                <div key={section.meal} className={clsx("premium-log-meal-card neutral-row rounded-3xl px-4 py-4 sm:px-5 sm:py-5 space-y-3", mealVisual.accentClass)}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="premium-log-meal-icon">
                        <MealIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-[#111827] dark:text-white">{section.title}</h4>
                          <span className="premium-log-meal-chip-count">{section.entryCount}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {Math.round(section.totalCalories)} kcal total | {Math.round(section.totalProtein)}g protein
                        </p>
                      </div>
                    </div>
                    <div className="premium-log-meal-actions">
                      <button
                        type="button"
                        onClick={() => onOpenFoodModalForMeal(section.meal)}
                        className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => onSaveMealTemplate(section.meal)}
                        className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                      >
                        <Sparkles size={14} />
                        Template
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {section.entries.map((entry) => {
                      const isFavorite = isFavoriteFoodEntry(entry);

                      return (
                        <motion.div
                          {...listEntryMotionProps}
                          key={entry.id}
                          className="premium-food-row group"
                        >
                          <div className="premium-food-row-main">
                            <div className="premium-log-entry-icon">
                              <MealIcon size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[#111827] dark:text-white">
                                  {entry.quantity && entry.unit ? `${entry.quantity} ${entry.unit} ` : ''}{entry.name}
                                </p>
                                <span className="premium-food-calories">
                                  {Math.round(entry.calories || 0)} kcal
                                </span>
                              </div>
                              <div className="premium-food-detail-row">
                                <span className="premium-food-detail-chip">{entry.servingSize || '1 serving'}</span>
                                <span className="premium-food-detail-chip">{formatFoodSourceLabel(entry.source)}</span>
                                <span className="premium-food-time">{format(new Date(entry.timestamp), 'h:mm a')}</span>
                              </div>
                              <div className="premium-food-meta-row">
                                <span className="premium-food-macro">P {Math.round(entry.protein || 0)}g</span>
                                <span className="premium-food-macro">
                                  {netCarbsMode ? 'Net C' : 'C'} {Math.round(netCarbsMode ? Math.max(0, (entry.carbs || 0) - (entry.fiber || 0)) : (entry.carbs || 0))}g
                                </span>
                                <span className="premium-food-macro">F {Math.round(entry.fat || 0)}g</span>
                                {(entry.fiber || 0) > 0 && <span className="premium-food-macro">Fiber {Math.round(entry.fiber || 0)}g</span>}
                              </div>
                            </div>
                          </div>
                          <div className="premium-food-row-actions">
                            <button
                              type="button"
                              onClick={() => onToggleFavoriteFoodEntry(entry)}
                              className={clsx("premium-row-icon-btn", isFavorite && "premium-row-icon-btn-active")}
                              title={isFavorite ? 'Remove favorite' : 'Save favorite'}
                              aria-label={isFavorite ? `Remove ${entry.name} from favorites` : `Save ${entry.name} as favorite`}
                            >
                              <Star size={15} className={isFavorite ? 'fill-current' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditFoodEntry(entry)}
                              className="premium-row-icon-btn"
                              aria-label={`Edit ${entry.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteFoodEntry(entry.id)}
                              className="premium-row-icon-btn premium-row-icon-btn-danger"
                              aria-label={`Delete ${entry.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="premium-section-heading">
          <div>
            <h3 className="font-bold text-[#111827] dark:text-white">Water log</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Adjust hydration fast, or remove anything that looks wrong.
            </p>
          </div>
          <Droplets size={18} className="text-brand-500 shrink-0" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onQuickWaterChange(250)}
            className={clsx(
              "neutral-water-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold",
              progressHighlight === 'water' && "premium-progress-highlight"
            )}
          >
            <Plus size={14} />
            Add 250 ml
          </button>
          <button
            type="button"
            onClick={() => onQuickWaterChange(-250)}
            className="neutral-water-soft-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <Minus size={14} />
            Remove 250 ml
          </button>
          <button
            type="button"
            onClick={onOpenWaterModal}
            className="neutral-secondary-btn rounded-full px-4 py-2 text-sm font-semibold"
          >
            Custom amount
          </button>
        </div>

        {dayWater.length === 0 ? (
          <div className="premium-empty-state neutral-row rounded-2xl">
            <Droplets className="mx-auto mb-2 text-slate-500 dark:text-slate-400" size={24} />
            <p className="text-sm text-slate-600 dark:text-slate-300">No water logged for this day yet.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A quick 250 ml check-in keeps your daily picture complete.</p>
            <button
              type="button"
              onClick={() => onQuickWaterChange(250)}
              className="neutral-water-btn mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Plus size={14} />
              Add 250 ml
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dayWater.map((entry) => (
              <motion.div
                {...listEntryMotionProps}
                key={`log-water-${entry.id}`}
                className="premium-list-row neutral-row rounded-[22px] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{entry.amountMl} ml water</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {format(new Date(entry.timestamp), 'h:mm a')}
                      {(entry.caloriesConsumed || entry.caloriesBurned)
                        ? ` | ${entry.caloriesConsumed ? `+${entry.caloriesConsumed} kcal` : ''}${entry.caloriesConsumed && entry.caloriesBurned ? ' ' : ''}${entry.caloriesBurned ? `-${entry.caloriesBurned} kcal` : ''}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDeleteWaterEntry(entry.id)}
                    className="neutral-danger-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="premium-section-heading">
          <div>
            <h3 className="font-bold text-[#111827] dark:text-white">Recent activity</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Everything else you logged, in one clean timeline.
            </p>
          </div>
          <ArrowUpRight size={18} className="text-brand-500 shrink-0" />
        </div>

        {combinedHistory.length === 0 ? (
          <div className="premium-empty-state neutral-row rounded-2xl">
            <History className="mx-auto text-slate-500 dark:text-slate-400 mb-2" size={24} />
            <p className="text-sm text-slate-600 dark:text-slate-300">Nothing logged yet.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your meals, water, workouts, and habits will show up here as you go.</p>
            <button
              type="button"
              onClick={onOpenSuggestedFoodModal}
              className="neutral-primary-btn mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            >
              <Plus size={16} />
              Add first entry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {combinedHistory.slice(0, 8).map((entry) => (
              <div key={`log-history-${entry.type}-${entry.id}`} className="premium-list-row neutral-row rounded-[22px] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827] dark:text-white">
                    {getCombinedHistoryTitle(entry)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {getCombinedHistoryMetric(entry)}
                  </span>
                  {(entry.type === 'food' || entry.type === 'activity') && (
                    <button
                      type="button"
                      onClick={() => onEditCombinedHistoryEntry(entry)}
                      className="neutral-pill-btn rounded-full px-3 py-1.5 text-xs font-semibold"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void onDeleteCombinedHistoryEntry(entry)}
                    className="neutral-danger-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    <Trash2 size={14} />
                    {entry.type === 'habit' ? 'Remove' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        type="button"
        onClick={onOpenSuggestedFoodModal}
        className="premium-fab"
        aria-label="Add food"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </section>
  );
}
