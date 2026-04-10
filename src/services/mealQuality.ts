import type { FoodEntry, FoodSource, NutritionTrustLevel } from '../types';

export type DayQualityInsight = {
  badges: string[];
  detail: string;
  title: string;
  tone: 'attention' | 'calm' | 'good';
};

export type FoodReviewInsight = {
  detail: string;
  title: string;
  tone: 'manual' | 'review' | 'trusted';
};

const round = (value: number) => Math.round(value);

const getResolvedTrustLevel = (
  source: FoodSource,
  trustLevel?: NutritionTrustLevel,
  verifiedSource?: boolean
): NutritionTrustLevel => {
  if (trustLevel) {
    return trustLevel;
  }

  if (verifiedSource) {
    return 'verified';
  }

  if (source === 'ai') {
    return 'estimate';
  }

  if (source === 'manual') {
    return 'manual';
  }

  return 'reference';
};

const buildMacroContext = (input: {
  calories: number;
  carbs: number;
  fat: number;
  fiber?: number;
  protein: number;
}) => {
  if (input.calories <= 0 && input.protein <= 0 && input.carbs <= 0 && input.fat <= 0) {
    return 'Add calories and macros if you want a full manual entry, or use search for a faster lookup.';
  }

  const notes: string[] = [];

  if (input.protein >= 25) {
    notes.push('protein-forward');
  }

  if ((input.fiber || 0) >= 8) {
    notes.push('good fiber');
  }

  if (input.calories >= 650) {
    notes.push('larger meal');
  } else if (input.calories > 0 && input.calories <= 220) {
    notes.push('lighter item');
  }

  if (notes.length > 0) {
    return `This looks ${notes.join(', ')}.`;
  }

  return `About ${round(input.calories)} kcal with ${round(input.protein)}g protein, ${round(input.carbs)}g carbs, and ${round(input.fat)}g fat.`;
};

export const buildFoodReviewInsight = (input: {
  calories: number;
  carbs: number;
  confidence?: number;
  fat: number;
  fiber?: number;
  protein: number;
  source: FoodSource;
  trustLevel?: NutritionTrustLevel;
  verifiedSource?: boolean;
}): FoodReviewInsight => {
  const trustLevel = getResolvedTrustLevel(input.source, input.trustLevel, input.verifiedSource);
  const macroContext = buildMacroContext(input);

  if (trustLevel === 'estimate' || input.source === 'ai') {
    const confidenceNote =
      typeof input.confidence === 'number'
        ? ` Confidence looks about ${round(input.confidence * 100)}%, so portion and hidden oils still matter.`
        : '';

    return {
      title: 'AI estimate: review before you save',
      detail: `Photo scan is great for speed, but mixed dishes can shift quickly.${confidenceNote} ${macroContext}`,
      tone: 'review',
    };
  }

  if (trustLevel === 'manual' || input.source === 'manual') {
    return {
      title: 'Manual entry: keep it specific',
      detail: `Manual logging is fine when search, barcode, or scan is not enough. Add the clearest serving details you can. ${macroContext}`,
      tone: 'manual',
    };
  }

  return {
    title: 'Reference-backed nutrition',
    detail: `This result comes from the local library or a database lookup. Adjust the serving if your portion is different. ${macroContext}`,
    tone: 'trusted',
  };
};

export const buildDayQualityInsight = (input: {
  calorieGoal: number;
  consumed: number;
  entries: FoodEntry[];
  protein: number;
  proteinGoal: number;
  water: number;
  waterGoalMl: number;
}): DayQualityInsight => {
  if (input.entries.length === 0) {
    return {
      title: 'Today still needs its first meal',
      detail: 'Search a food or scan a meal once so the dashboard becomes useful instead of empty.',
      badges: ['0 meals logged', `${round(input.proteinGoal)}g protein target`, `${round(input.waterGoalMl)} ml water target`],
      tone: 'attention',
    };
  }

  const trustedEntries = input.entries.filter((entry) => {
    const resolvedTrustLevel = getResolvedTrustLevel(entry.source, entry.trustLevel, entry.verifiedSource);
    return resolvedTrustLevel === 'verified' || resolvedTrustLevel === 'reference';
  }).length;
  const proteinProgress = input.protein / Math.max(1, input.proteinGoal);
  const waterProgress = input.water / Math.max(1, input.waterGoalMl);
  const calorieProgress = input.consumed / Math.max(1, input.calorieGoal);
  const mealTypesLogged = new Set(input.entries.map((entry) => entry.mealType)).size;

  if (
    input.entries.length >= 3 &&
    mealTypesLogged >= 2 &&
    trustedEntries >= Math.max(1, Math.ceil(input.entries.length * 0.5)) &&
    proteinProgress >= 0.8 &&
    waterProgress >= 0.65
  ) {
    return {
      title: 'Strong coverage for today',
      detail: 'The dashboard has enough meal, protein, and hydration signal to feel genuinely useful.',
      badges: [
        `${input.entries.length} foods logged`,
        `${trustedEntries} reference-backed`,
        proteinProgress >= 1 ? 'protein target covered' : `${round(Math.max(0, input.proteinGoal - input.protein))}g protein left`,
      ],
      tone: 'good',
    };
  }

  if (input.entries.length >= 2 && (proteinProgress >= 0.5 || calorieProgress >= 0.45 || waterProgress >= 0.5)) {
    return {
      title: 'Good base, a few gaps left',
      detail: 'One more balanced meal or a cleaner water check-in would make today easier to trust.',
      badges: [
        `${input.entries.length} foods logged`,
        trustedEntries > 0 ? `${trustedEntries} reference-backed` : 'manual review likely',
        waterProgress >= 1 ? 'water target covered' : `${round(Math.max(0, input.waterGoalMl - input.water))} ml water left`,
      ],
      tone: 'calm',
    };
  }

  return {
    title: 'Today still needs a clearer picture',
    detail: 'Keep logging a bit more consistently so the guidance reflects what you actually ate.',
    badges: [
      `${input.entries.length} foods logged`,
      trustedEntries > 0 ? `${trustedEntries} reference-backed` : 'manual review likely',
      `${round(Math.max(0, input.proteinGoal - input.protein))}g protein left`,
    ],
    tone: 'attention',
  };
};
