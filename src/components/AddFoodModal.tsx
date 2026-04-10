import {
  Camera,
  CheckCircle2,
  History,
  Loader2,
  Package,
  Pencil,
  Search,
  Utensils,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import type { ChangeEventHandler, ComponentType, FormEventHandler, RefObject } from 'react';

import type { FoodEntry, FoodSearchResult, MealType } from '../types';

type ReviewChip = {
  label: string;
  value: string;
};

type FoodReviewInsight = {
  detail: string;
  title: string;
  tone: 'manual' | 'review' | 'trusted';
};

type FoodTrustSummary = {
  brandLine?: string;
  sourceDetail: string;
  sourceLabel: string;
  trustLabel: string;
};

type FooterHint = {
  detail: string;
  title: string;
};

type MealOption = {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: MealType;
};

type AddFoodModalProps = {
  aiFoodScanAvailable: boolean;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  currentFoodReviewInsight: FoodReviewInsight;
  currentFoodTrust: FoodTrustSummary;
  currentFoodTrustBadgeClassName: string;
  editingFoodEntry: FoodEntry | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  foodBarcode: string;
  foodCalories: string;
  foodCarbs: string;
  foodDraftName: string;
  foodDraftValue: string;
  foodFat: string;
  foodFiber: string;
  foodProtein: string;
  foodQuantity: string;
  foodSearchInput: string;
  foodSearchResults: FoodSearchResult[];
  foodServingSize: string;
  foodSodiumMg: string;
  foodSugar: string;
  foodUnit: string;
  formatCatalogFoodSummary: (item: FoodSearchResult) => string;
  formatNutritionValue: (value: number, kind?: 'macro' | 'calorie') => string;
  isAnalyzing: boolean;
  isFoodSearchLoading: boolean;
  isOpen: boolean;
  mealOptions: MealOption[];
  mealType: MealType;
  onBarcodeLookup: () => void;
  onClose: () => void;
  onFoodBarcodeChange: (value: string) => void;
  onFoodCaloriesChange: (value: string) => void;
  onFoodCarbsChange: (value: string) => void;
  onFoodQuantityChange: (value: string) => void;
  onFoodFatChange: (value: string) => void;
  onFoodFiberChange: (value: string) => void;
  onFoodProteinChange: (value: string) => void;
  onFoodSodiumMgChange: (value: string) => void;
  onFoodSugarChange: (value: string) => void;
  onFoodUnitChange: (value: string) => void;
  onImageUpload: ChangeEventHandler<HTMLInputElement>;
  onMealTypeChange: (mealType: MealType) => void;
  onOpenManualEntry: () => void;
  onRecentFoodSelect: (food: FoodSearchResult, mealType: MealType) => void | Promise<void>;
  onScanInstead: () => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSelectSearchResult: (item: FoodSearchResult) => void | Promise<void>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onToggleBarcodeComposer: () => void;
  onTriggerPhotoScan: () => void;
  onUseManualEntryFromEmpty: () => void;
  recentFoods: FoodSearchResult[];
  reviewNutritionChips: ReviewChip[];
  sheetTransition: Transition;
  shouldShowManualNutritionFields: boolean;
  shouldShowBarcodeComposer: boolean;
  shouldShowReviewPanel: boolean;
  showSuggestions: boolean;
  footerHint: FooterHint;
};

export function AddFoodModal({
  aiFoodScanAvailable,
  cameraInputRef,
  currentFoodReviewInsight,
  currentFoodTrust,
  currentFoodTrustBadgeClassName,
  editingFoodEntry,
  fileInputRef,
  foodBarcode,
  foodCalories,
  foodCarbs,
  foodDraftName,
  foodDraftValue,
  foodFat,
  foodFiber,
  foodProtein,
  foodQuantity,
  foodSearchInput,
  foodSearchResults,
  foodServingSize,
  foodSodiumMg,
  foodSugar,
  foodUnit,
  formatCatalogFoodSummary,
  formatNutritionValue,
  isAnalyzing,
  isFoodSearchLoading,
  isOpen,
  mealOptions,
  mealType,
  onBarcodeLookup,
  onClose,
  onFoodBarcodeChange,
  onFoodCaloriesChange,
  onFoodCarbsChange,
  onFoodQuantityChange,
  onFoodFatChange,
  onFoodFiberChange,
  onFoodProteinChange,
  onFoodSodiumMgChange,
  onFoodSugarChange,
  onFoodUnitChange,
  onImageUpload,
  onMealTypeChange,
  onOpenManualEntry,
  onRecentFoodSelect,
  onScanInstead,
  onSearchChange,
  onSearchFocus,
  onSelectSearchResult,
  onSubmit,
  onToggleBarcodeComposer,
  onTriggerPhotoScan,
  onUseManualEntryFromEmpty,
  recentFoods,
  reviewNutritionChips,
  sheetTransition,
  shouldShowManualNutritionFields,
  shouldShowBarcodeComposer,
  shouldShowReviewPanel,
  showSuggestions,
  footerHint,
}: AddFoodModalProps) {
  const shouldShowSearchSuggestions = showSuggestions && foodSearchInput.trim().length >= 2;
  const activeMealLabel = mealOptions.find((option) => option.value === mealType)?.label || 'Food';

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onImageUpload}
      />

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 neutral-overlay"
            />
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.985 }}
              transition={sheetTransition}
              className="relative w-full max-w-md neutral-sheet neutral-modal-sheet premium-sheet-shell rounded-t-3xl sm:rounded-3xl overflow-hidden"
            >
              <div className="premium-sheet-handle" />
              <div className="premium-sheet-body neutral-modal-body p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#111827] dark:text-white">{editingFoodEntry ? 'Edit food' : 'Log food'}</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Search first, then review the result before you save it.
                  </p>
                </div>
                <button type="button" onClick={onClose} className="neutral-icon-btn p-2">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isAnalyzing ? (
                      <Loader2 size={20} className="text-brand-500 animate-spin" />
                    ) : (
                      <Search size={20} className="text-slate-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={foodSearchInput}
                    onChange={(event) => onSearchChange(event.target.value)}
                    onFocus={onSearchFocus}
                    autoFocus={!editingFoodEntry}
                    placeholder="Search or type a food name..."
                    className="w-full bg-slate-50 dark:bg-[#1a2535] border-2 border-transparent focus:border-brand-500/40 text-[#111827] dark:text-white rounded-2xl pl-12 pr-4 py-3.5 text-base font-medium focus:outline-none transition-all placeholder:text-slate-400"
                  />
                  {foodSearchInput && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      <X size={14} className="text-slate-500 dark:text-slate-400" />
                    </button>
                  )}
                </div>

                {!editingFoodEntry && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onToggleBarcodeComposer}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        shouldShowBarcodeComposer
                          ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-500/20'
                          : 'bg-slate-50 dark:bg-[#1a2535] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2a3649] hover:bg-slate-100 dark:hover:bg-[#22324a]'
                      }`}
                    >
                      <Package size={14} />
                      Barcode
                    </button>
                    {aiFoodScanAvailable && (
                      <button
                        type="button"
                        onClick={onTriggerPhotoScan}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#1a2535] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a3649] hover:bg-slate-100 dark:hover:bg-[#22324a] transition-all"
                      >
                        <Camera size={14} />
                        Scan photo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenManualEntry}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#1a2535] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a3649] hover:bg-slate-100 dark:hover:bg-[#22324a] transition-all"
                    >
                      <Pencil size={14} />
                      Manual entry
                    </button>
                  </div>
                )}

                {shouldShowBarcodeComposer && (
                  <div className="neutral-row rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Barcode lookup</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Best for branded foods, supplements, and packaged snacks.</p>
                      </div>
                      <Package size={16} className="text-brand-500 shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={foodBarcode}
                        onChange={(event) => onFoodBarcodeChange(event.target.value)}
                        placeholder="Enter barcode digits"
                        className="neutral-input flex-1 p-3"
                      />
                      <button
                        type="button"
                        onClick={onBarcodeLookup}
                        disabled={isAnalyzing}
                        className="neutral-primary-btn px-4 py-3 text-sm font-semibold disabled:opacity-60"
                      >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : 'Lookup'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  {mealOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = mealType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onMealTypeChange(option.value)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-500/20 shadow-sm'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <Icon size={18} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {shouldShowSearchSuggestions && (
                  <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-700/30 overflow-hidden max-h-72 overflow-y-auto shadow-sm">
                    {isFoodSearchLoading ? (
                      <div className="px-4 py-6 text-sm text-slate-500 flex items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-brand-500" size={20} />
                        <span>Searching...</span>
                      </div>
                    ) : foodSearchResults.length > 0 ? (
                      <div className="py-1">
                        {foodSearchResults.map((item, index) => (
                          <button
                            key={`search-${item.id}`}
                            type="button"
                            onClick={() => void onSelectSearchResult(item)}
                            className={`w-full text-left px-4 py-3 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors border-b border-slate-50 dark:border-slate-700/20 last:border-0 ${
                              index === 0 ? 'pt-3' : ''
                            } ${index === foodSearchResults.length - 1 ? 'pb-3' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <Utensils size={16} className="text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#111827] dark:text-white truncate">{item.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{formatCatalogFoodSummary(item)}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatNutritionValue(item.calories, 'calorie')}</p>
                                <p className="text-[10px] text-slate-400">kcal</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Search size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500">No results for "{foodSearchInput}"</p>
                        <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={onUseManualEntryFromEmpty}
                            className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                          >
                            <Pencil size={14} />
                            Use manual entry
                          </button>
                          {aiFoodScanAvailable && (
                            <button
                              type="button"
                              onClick={onScanInstead}
                              className="neutral-pill-btn rounded-full px-3 py-2 text-xs font-semibold"
                            >
                              <Camera size={14} />
                              Scan instead
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!editingFoodEntry && foodSearchInput.trim().length < 2 && (
                  <div className="space-y-3">
                    {recentFoods.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 px-1">
                          <History size={14} className="text-slate-400" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Re-add</p>
                        </div>
                        <div className="space-y-1">
                          {recentFoods.map((food) => (
                            <button
                              key={`recent-food-${food.id}`}
                              type="button"
                              onClick={() => void onRecentFoodSelect(food, mealType)}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors border border-transparent hover:border-brand-100 dark:hover:border-brand-800/20"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <Utensils size={16} className="text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-semibold text-[#111827] dark:text-white truncate">{food.name}</p>
                                <p className="text-xs text-slate-400">
                                  {food.servingSize || 'Custom'} | {Math.round(food.protein)}P {Math.round(food.carbs)}C {Math.round(food.fat)}F
                                </p>
                              </div>
                              <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1">
                                <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatNutritionValue(food.calories, 'calorie')}</p>
                                <p className="text-[10px] text-slate-400">kcal</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 px-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-700/30">
                        <Utensils size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400">Your recent foods will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {shouldShowReviewPanel && (
                  <div className="pt-4 border-t border-slate-100 dark:border-[#2a3649] space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-[#111827] dark:text-white">
                        {foodDraftName || (editingFoodEntry ? 'Edit Food' : 'Custom Entry')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{foodServingSize || '1 serving'}</p>
                    </div>

                    {reviewNutritionChips.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {reviewNutritionChips.map((chip) => (
                          <div key={`review-chip-${chip.label}`} className="bg-slate-50 dark:bg-[#182131] rounded-xl px-3 py-2 text-center border border-slate-100 dark:border-[#2a3649]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{chip.label}</p>
                            <p className="text-sm font-bold text-[#111827] dark:text-white mt-0.5">{chip.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`rounded-2xl border px-4 py-4 ${
                        currentFoodReviewInsight.tone === 'trusted'
                          ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                          : currentFoodReviewInsight.tone === 'review'
                            ? 'border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10'
                            : 'border-slate-200 bg-slate-50/90 dark:border-[#2a3649] dark:bg-[#182131]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${currentFoodTrustBadgeClassName}`}>
                          {currentFoodTrust.trustLabel}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                          {currentFoodTrust.sourceLabel}
                        </span>
                        {currentFoodTrust.brandLine && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {currentFoodTrust.brandLine}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#111827] dark:text-white">
                        {currentFoodReviewInsight.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {currentFoodReviewInsight.detail}
                      </p>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {currentFoodTrust.sourceDetail}
                      </p>
                    </div>

                    <div className="grid grid-cols-[1fr_1.5fr] gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Amount</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={foodQuantity}
                          onChange={(event) => onFoodQuantityChange(event.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#182131] border border-slate-200 dark:border-[#2a3649] text-[#111827] dark:text-white rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Unit</label>
                        <select
                          value={foodUnit}
                          onChange={(event) => onFoodUnitChange(event.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#182131] border border-slate-200 dark:border-[#2a3649] text-[#111827] dark:text-white rounded-xl px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="serving">Serving(s)</option>
                          <option value="grams">Grams (g)</option>
                          <option value="oz">Ounces (oz)</option>
                          <option value="cups">Cup(s)</option>
                          <option value="tbsp">Tablespoon(s)</option>
                          <option value="tsp">Teaspoon(s)</option>
                          <option value="pieces">Piece(s)</option>
                          <option value="slices">Slice(s)</option>
                        </select>
                      </div>
                    </div>

                    {shouldShowManualNutritionFields && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Adjust nutrition
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Correct the serving or edit macros if the lookup is close but not exact.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Calories
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="decimal"
                              value={foodCalories}
                              onChange={(event) => onFoodCaloriesChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Protein (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              inputMode="decimal"
                              value={foodProtein}
                              onChange={(event) => onFoodProteinChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Carbs (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              inputMode="decimal"
                              value={foodCarbs}
                              onChange={(event) => onFoodCarbsChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Fat (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              inputMode="decimal"
                              value={foodFat}
                              onChange={(event) => onFoodFatChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Fiber (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              inputMode="decimal"
                              value={foodFiber}
                              onChange={(event) => onFoodFiberChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Sugar (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              inputMode="decimal"
                              value={foodSugar}
                              onChange={(event) => onFoodSugarChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                              Sodium (mg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={foodSodiumMg}
                              onChange={(event) => onFoodSodiumMgChange(event.target.value)}
                              className="neutral-input w-full p-3 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-[#2a3649] dark:bg-[#182131]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {footerHint.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {footerHint.detail}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isAnalyzing || !foodDraftValue}
                      className="w-full bg-[#111827] dark:bg-brand-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      {editingFoodEntry ? `Update ${activeMealLabel}` : `Save to ${activeMealLabel}`}
                    </motion.button>
                  </div>
                )}
              </form>

            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
