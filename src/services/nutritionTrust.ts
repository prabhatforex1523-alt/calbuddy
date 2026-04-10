import type { FoodEntry, FoodSearchResult, FoodSource, NutritionTrustLevel } from "../types";

type TrustableFood = Pick<
  FoodEntry,
  "source" | "confidence" | "trustLevel" | "sourceDetail" | "verifiedSource" | "brandName" | "barcode"
> &
  Partial<Pick<FoodSearchResult, "name">>;

export const FOOD_SOURCE_LABELS: Record<FoodSource, string> = {
  local: "Regional library",
  usda: "USDA database",
  ai: "Gemini scan",
  manual: "Manual entry",
};

export const TRUST_LEVEL_LABELS: Record<NutritionTrustLevel, string> = {
  verified: "Verified",
  reference: "Reference",
  estimate: "Estimate",
  manual: "Manual",
};

export const getFoodSourceLabel = (source: FoodSource) => FOOD_SOURCE_LABELS[source];

export const inferTrustLevel = (input: {
  source: FoodSource;
  confidence?: number;
  trustLevel?: NutritionTrustLevel;
  verifiedSource?: boolean;
}): NutritionTrustLevel => {
  if (input.trustLevel) {
    return input.trustLevel;
  }

  if (input.verifiedSource) {
    return "verified";
  }

  if (input.source === "ai") {
    return "estimate";
  }

  if (input.source === "manual") {
    return "manual";
  }

  return "reference";
};

export const inferSourceDetail = (input: {
  source: FoodSource;
  sourceDetail?: string;
  brandName?: string;
  barcode?: string;
  confidence?: number;
}): string => {
  if (input.sourceDetail?.trim()) {
    return input.sourceDetail.trim();
  }

  switch (input.source) {
    case "local":
      return "Curated regional staples library";
    case "usda":
      if (input.barcode && input.brandName) {
        return `USDA barcode lookup | ${input.brandName}`;
      }

      if (input.barcode) {
        return "USDA barcode lookup";
      }

      return input.brandName ? `USDA branded entry | ${input.brandName}` : "USDA global reference database";
    case "ai":
      return input.confidence
        ? `Gemini image estimate | ${Math.round(input.confidence * 100)}% confidence`
        : "Gemini image estimate";
    case "manual":
    default:
      return "Manual nutrition entry";
  }
};

export const enrichFoodMetadata = <
  T extends {
    source: FoodSource;
    confidence?: number;
    trustLevel?: NutritionTrustLevel;
    sourceDetail?: string;
    verifiedSource?: boolean;
    brandName?: string;
    barcode?: string;
  },
>(
  item: T
): T => ({
  ...item,
  trustLevel: inferTrustLevel(item),
  verifiedSource: item.verifiedSource ?? item.source === "usda",
  sourceDetail: inferSourceDetail(item),
});

export const describeFoodTrust = (food: TrustableFood) => {
  const trustLevel = inferTrustLevel(food);

  return {
    sourceLabel: getFoodSourceLabel(food.source),
    trustLabel: TRUST_LEVEL_LABELS[trustLevel],
    sourceDetail: inferSourceDetail(food),
    trustLevel,
    brandLine: food.brandName
      ? food.barcode
        ? `${food.brandName} | ${food.barcode}`
        : food.brandName
      : food.barcode || "",
  };
};
