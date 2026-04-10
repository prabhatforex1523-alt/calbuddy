import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    start_exact = 8722  # line 8723 is index 8722
    end_exact = 9448    # line 9449 is index 9448

    if "onSubmit={handleAddFood}" in lines[start_exact] and "</form>" in lines[end_exact]:
        print("Lines match perfectly!")
    else:
        print("Line mismatch! Found:")
        print("Start:", lines[start_exact].strip())
        print("End:", lines[end_exact].strip())
        return

    new_form_content = """                  <form onSubmit={handleAddFood} className="space-y-5">
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          type="text"
                          value={foodSearchInput}
                          onChange={(e) => {
                            setActiveFoodLookupName(null);
                            setFoodSearchInput(e.target.value);
                            if (isLikelyBarcode(e.target.value)) {
                              setFoodBarcode(normalizeBarcode(e.target.value));
                            }
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          autoFocus={!editingFoodEntry}
                          placeholder="Search for food..."
                          className="w-full bg-slate-100 dark:bg-[#1e293b] text-[#111827] dark:text-white rounded-2xl pl-12 pr-4 py-3.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
                        />
                      </div>

                      {shouldShowBarcodeComposer && (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={foodBarcode}
                            onChange={(e) => {
                              setActiveFoodLookupName(null);
                              setFoodBarcode(normalizeBarcode(e.target.value));
                            }}
                            placeholder="Enter barcode"
                            className="neutral-input w-full px-4 py-3 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => void handleBarcodeLookup()}
                            disabled={isAnalyzing || !isLikelyBarcode(foodBarcode)}
                            className="bg-brand-500 text-white rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
                          />
                            Find
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-2">
                        {MEAL_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setMealType(type)}
                            className={cn(
                              "flex-1 py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border",
                              mealType === type
                                ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-500/20"
                                : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2a3649] hover:bg-slate-50 dark:hover:bg-[#182131]"
                            )}
                          >
                            {formatMealLabel(type)}
                          </button>
                        ))}
                      </div>

                      {!editingFoodEntry && (
                        <div className="flex items-center justify-center gap-6 pt-2 pb-1 opacity-50 hover:opacity-100 transition-opacity">
                          <button type="button" onClick={handleOpenCamera} disabled={isAnalyzing} className="flex items-center gap-1.5 text-slate-500 hover:text-[#111827] dark:hover:text-white transition-colors">
                            <Camera size={14} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Scan</span>
                          </button>
                          <button type="button" onClick={() => { setShowSuggestions(false); setShowBarcodeTool(true); }} className="flex items-center gap-1.5 text-slate-500 hover:text-[#111827] dark:hover:text-white transition-colors">
                            <Package size={14} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Barcode</span>
                          </button>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-slate-500 hover:text-[#111827] dark:hover:text-white transition-colors">
                            <Image size={14} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Photo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {showSuggestions && foodSearchInput.trim().length >= 2 && (
                      <div className="bg-slate-50 dark:bg-[#182131] rounded-2xl overflow-hidden mt-1">
                        {isFoodSearchLoading ? (
                          <div className="px-4 py-5 text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin text-brand-500" size={16} />
                            Searching...
                          </div>
                        ) : foodSearchResults.length > 0 ? (
                          <div className="py-2">
                            {foodSearchResults.map((item) => {
                              const trust = describeFoodTrust(item);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => void autofillFoodFromSelection(item)}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#22324a] transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-[#111827] dark:text-white truncate">{item.name}</p>
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        {formatCatalogFoodSummary(item)}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded shrink-0">
                                      {trust.sourceLabel}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center space-y-3 text-sm text-slate-500">
                            <p>No close match found.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAdvancedFoodTools(true);
                                setShowDescribeTool(true);
                                setShowSuggestions(false);
                              }}
                              className="text-brand-500 font-semibold"
                            >
                              Enter manually
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {shouldShowAddFoodShortcuts && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-[#2a3649]">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recent Foods</p>
                        <div className="grid gap-1">
                          {visibleRecentFoods.length > 0 ? (
                            visibleRecentFoods.slice(0, 5).map((food) => (
                              <button
                                key={`recent-food-${food.id}`}
                                type="button"
                                onClick={() => void quickAddFoodResult(food, mealType)}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#182131] transition-colors group"
                              >
                                <div className="flex flex-col items-start min-w-0 pr-2">
                                  <p className="truncate text-sm font-semibold text-[#111827] dark:text-white group-hover:text-brand-500 transition-colors w-full text-left">{food.name}</p>
                                  {(food.servingSize || food.brand) && (
                                     <p className="text-[11px] text-slate-500 truncate w-full text-left">
                                       {food.servingSize || 'Custom'} {food.brand ? `• ${food.brand}` : ''}
                                     </p>
                                  )}
                                </div>
                                <span className="shrink-0 text-sm font-medium text-slate-500">
                                  {formatNutritionValue(food.calories, 'calorie')} cal
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 py-2 pl-2">Your recent foods will appear here.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {shouldShowFoodReviewPanel && (
                      <div className="mt-4 pt-5 border-t border-slate-100 dark:border-[#2a3649] space-y-5">
                        <div className="flex flex-col gap-1">
                           <h3 className="text-lg font-bold text-[#111827] dark:text-white leading-tight">
                             {foodDraftName || (editingFoodEntry ? 'Edit Food' : 'Custom Entry')}
                           </h3>
                           <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                             <span>{foodServingSize || '1 serving'}</span>
                             {foodBrandName && <span>• {foodBrandName}</span>}
                             <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800", trustBadgeStyles(currentFoodTrust.trustLevel))}>
                               {currentFoodTrust.trustLabel}
                             </span>
                           </div>
                        </div>

                        {reviewNutritionChips.length > 0 && (
                          <div className="flex gap-2 w-full overflow-x-auto pb-1 hide-scrollbar">
                            {reviewNutritionChips.map((chip) => (
                              <div key={`review-chip-${chip.label}`} className="flex-1 min-w-[72px] bg-slate-50 dark:bg-[#182131] rounded-2xl p-3 text-center border border-slate-100 dark:border-[#2a3649]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{chip.label}</p>
                                <p className="text-sm font-bold text-[#111827] dark:text-white">{chip.value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-[1fr_1.5fr] gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={foodQuantity}
                              onChange={(e) => setFoodQuantity(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-[#182131] border border-slate-200 dark:border-[#2a3649] text-[#111827] dark:text-white rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">Unit</label>
                            <select
                              value={foodUnit}
                              onChange={(e) => setFoodUnit(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-[#182131] border border-slate-200 dark:border-[#2a3649] text-[#111827] dark:text-white rounded-xl px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center]"
                            >
                              <option value="serving">Serving(s)</option>
                              <option value="grams">Grams (g)</option>
                              <option value="oz">Ounces (oz)</option>
                              <option value="cups">Cup(s)</option>
                              <option value="tbsp">Tablespoon(s)</option>
                              <option value="tsp">Teaspoon(s)</option>
                              <option value="pieces">Piece(s)</option>
                              <option value="slices">Slice(s)</option>
                              <option value="ml">Milliliters (ml)</option>
                            </select>
                          </div>
                        </div>

                        {shouldShowManualNutritionFields && (
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cals</label>
                              <input type="number" value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)} className="w-full bg-slate-50 dark:bg-[#182131] text-[#111827] dark:text-white rounded-lg px-2 py-2 text-sm text-center border border-slate-200 dark:border-[#2a3649]" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pro (g)</label>
                              <input type="number" value={foodProtein} onChange={(e) => setFoodProtein(e.target.value)} className="w-full bg-slate-50 dark:bg-[#182131] text-[#111827] dark:text-white rounded-lg px-2 py-2 text-sm text-center border border-slate-200 dark:border-[#2a3649]" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Carb (g)</label>
                              <input type="number" value={foodCarbs} onChange={(e) => setFoodCarbs(e.target.value)} className="w-full bg-slate-50 dark:bg-[#182131] text-[#111827] dark:text-white rounded-lg px-2 py-2 text-sm text-center border border-slate-200 dark:border-[#2a3649]" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fat (g)</label>
                              <input type="number" value={foodFat} onChange={(e) => setFoodFat(e.target.value)} className="w-full bg-slate-50 dark:bg-[#182131] text-[#111827] dark:text-white rounded-lg px-2 py-2 text-sm text-center border border-slate-200 dark:border-[#2a3649]" />
                            </div>
                          </div>
                        )}
                        
                        {multiFoodPreview.length > 1 && (
                          <div className="bg-slate-50 dark:bg-[#182131] rounded-2xl p-3 border border-slate-100 dark:border-[#2a3649]">
                            <div className="flex flex-col gap-2">
                               <p className="text-xs font-semibold text-[#111827] dark:text-white">Adding {multiFoodPreview.length} separate items:</p>
                               {multiFoodPreview.map((item, index) => (
                                 <div key={`simple-prev-${index}`} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{item.foodName}</span>
                                    <span className="text-slate-500 whitespace-nowrap">{item.quantity} {item.unit}</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={saveCurrentFoodAsFavorite}
                            disabled={!foodDraftValue}
                            className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-slate-500 hover:text-[#111827] dark:hover:text-white transition-colors disabled:opacity-50"
                          >
                            <Star size={14} className={isCurrentFoodFavorited ? 'fill-brand-500 text-brand-500' : ''} />
                            {isCurrentFoodFavorited ? 'Saved as favorite' : 'Save as default'}
                          </button>

                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isAnalyzing || !foodDraftValue}
                            className="w-full bg-[#111827] dark:bg-brand-500 text-white dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            {editingFoodEntry
                              ? 'Update Entry'
                              : hasDraftNutrition || multiFoodPreview.length > 1
                                ? 'Save to Log'
                                : 'Look Up & Save'}
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </form>\n"""

    lines[start_exact:end_exact+1] = [new_form_content]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Successfully replaced block.")

process_file("c:/Users/prabh/Downloads/calbuddy-main/calbuddy-main/src/App.tsx")
