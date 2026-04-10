import type { FoodSearchResult } from "../types";
import { getCachedValue, setCachedValue } from "./cache";
import { enrichFoodMetadata } from "./nutritionTrust";

const buildImageFingerprint = (base64: string) => `scan_${base64.slice(0, 80)}`;
const allowInsecureClientScan =
  import.meta.env.DEV || import.meta.env.VITE_ALLOW_INSECURE_CLIENT_AI_SCAN === "true";
const secureScanEndpoint = import.meta.env.VITE_AI_SCAN_ENDPOINT?.trim() || "";

type RemoteFoodResult = {
  calories: number;
  carbs: number;
  fat: number;
  name: string;
  protein: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const isValidRemoteFoodResult = (value: unknown): value is RemoteFoodResult => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    ["calories", "protein", "carbs", "fat"].every((key) => {
      const current = candidate[key];
      return typeof current === "number" && Number.isFinite(current) && current >= 0;
    })
  );
};

const normalizeFoodResult = (result: RemoteFoodResult): FoodSearchResult =>
  enrichFoodMetadata({
    id: `scan-${Date.now()}`,
    name: result.name.trim(),
    servingSize: "1 serving",
    baseUnit: "serving",
    calories: round1(result.calories),
    protein: round1(result.protein),
    carbs: round1(result.carbs),
    fat: round1(result.fat),
    source: "ai",
    confidence: 0.78,
    trustLevel: "estimate",
    verifiedSource: false,
    sourceDetail: secureScanEndpoint ? "Secure AI scan endpoint" : "Gemini image estimate",
  });

export const isAiFoodScanAvailable = () =>
  Boolean(secureScanEndpoint || (allowInsecureClientScan && import.meta.env?.VITE_GEMINI_API_KEY));

const scanFoodViaSecureEndpoint = async (input: {
  base64: string;
  mimeType: string;
}): Promise<FoodSearchResult> => {
  const response = await fetch(secureScanEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Photo scan server could not analyze this image right now.");
  }

  const payload = (await response.json()) as unknown;
  if (!isValidRemoteFoodResult(payload)) {
    throw new Error("Photo scan server returned an invalid result.");
  }

  return normalizeFoodResult(payload);
};

export const scanFoodImage = async (input: {
  base64: string;
  mimeType: string;
}): Promise<FoodSearchResult> => {
  const cacheKey = buildImageFingerprint(input.base64);
  const cached = getCachedValue<FoodSearchResult>(cacheKey, 1000 * 60 * 60 * 12, "session");

  if (cached) {
    return cached;
  }

  const normalized = secureScanEndpoint
    ? await scanFoodViaSecureEndpoint(input)
    : await (async () => {
        const { analyzeFood } = await import("./gemini");
        const result = await analyzeFood(input);
        return normalizeFoodResult(result);
      })();

  setCachedValue(cacheKey, normalized, "session");
  return normalized;
};
