import { GoogleGenAI } from "@google/genai";
import { saveCachedFood } from "./cacheFood";

const allowInsecureClientScan =
  import.meta.env.DEV || import.meta.env.VITE_ALLOW_INSECURE_CLIENT_AI_SCAN === "true";
const apiKey = allowInsecureClientScan ? import.meta.env.VITE_GEMINI_API_KEY : "";
const aiScanModel = import.meta.env.VITE_GEMINI_IMAGE_MODEL || "gemini-2.5-flash";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const AI_SCAN_UNAVAILABLE_MESSAGE =
  "Photo scan is not configured for production yet. Add a secure scan endpoint or use search/manual entry for now.";
const AI_SCAN_FAILED_MESSAGE =
  "Photo scan could not identify this food reliably. Try search or enter nutrition manually.";

type FoodResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export const isAiFoodScanAvailable = () => Boolean(ai);

const isValidFoodResult = (value: unknown): value is FoodResult => {
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

const toStrictFoodResult = (value: unknown, fallbackName: string): FoodResult | null => {
  if (!isValidFoodResult(value)) {
    return null;
  }

  const candidate = value as FoodResult;

  return {
    name: candidate.name.trim() || fallbackName,
    calories: round1(candidate.calories),
    protein: round1(candidate.protein),
    carbs: round1(candidate.carbs),
    fat: round1(candidate.fat),
  };
};

export const analyzeFood = async (input: {
  base64: string;
  mimeType: string;
}): Promise<FoodResult> => {
  if (!ai) {
    throw new Error(AI_SCAN_UNAVAILABLE_MESSAGE);
  }

  try {
    const imagePart = {
      inlineData: {
        data: input.base64,
        mimeType: input.mimeType,
      },
    };

    const prompt = `
Identify the food in this image and return ONLY valid JSON:
{
  "name": "food name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}
Use a realistic single serving estimate.
`;

    const response = await ai.models.generateContent({
      model: aiScanModel,
      contents: [{ text: prompt }, imagePart],
    });

    const text = response.text?.trim() || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const result = toStrictFoodResult(parsed, "Food from image");

    if (!result) {
      throw new Error(AI_SCAN_FAILED_MESSAGE);
    }

    await saveCachedFood(result);
    return result;
  } catch (error) {
    console.error("Gemini image error:", error);
    if (
      error instanceof Error &&
      (error.message === AI_SCAN_UNAVAILABLE_MESSAGE || error.message === AI_SCAN_FAILED_MESSAGE)
    ) {
      throw error;
    }

    throw new Error(AI_SCAN_FAILED_MESSAGE);
  }
};
