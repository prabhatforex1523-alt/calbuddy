import { GoogleGenAI } from "@google/genai";
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";

const REGION = "us-central1";
const DEFAULT_MODEL = "gemini-2.5-flash";

const round1 = (value) => Math.round(value * 10) / 10;

const setCorsHeaders = (request, response) => {
  response.set("Access-Control-Allow-Origin", request.get("origin") || "*");
  response.set("Vary", "Origin");
  response.set("Access-Control-Allow-Headers", "Content-Type");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
};

const isValidFoodResult = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    ["calories", "protein", "carbs", "fat"].every((key) => {
      const current = candidate[key];
      return typeof current === "number" && Number.isFinite(current) && current >= 0;
    })
  );
};

const normalizeFoodResult = (value) => ({
  name: value.name.trim(),
  calories: round1(value.calories),
  protein: round1(value.protein),
  carbs: round1(value.carbs),
  fat: round1(value.fat),
});

export const aiScanFood = onRequest(
  {
    region: REGION,
    secrets: ["GEMINI_API_KEY"],
    timeoutSeconds: 60,
    invoker: "public",
    memory: "256MiB",
  },
  async (request, response) => {
    setCorsHeaders(request, response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed." });
      return;
    }

    const { base64, mimeType } = request.body || {};

    if (typeof base64 !== "string" || !base64.trim()) {
      response.status(400).json({ error: "Missing base64 image data." });
      return;
    }

    if (typeof mimeType !== "string" || !mimeType.trim()) {
      response.status(400).json({ error: "Missing image mime type." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured for aiScanFood.");
      response.status(500).json({ error: "Photo scan is not configured yet." });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL,
        contents: [
          {
            text: `
Identify the food in this image and return ONLY valid JSON:
{
  "name": "food name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}
Use a realistic single serving estimate.
            `.trim(),
          },
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
        ],
      });

      const rawText = result.text?.trim() || "";
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!isValidFoodResult(parsed)) {
        response.status(502).json({ error: "Model returned an invalid food result." });
        return;
      }

      response.status(200).json(normalizeFoodResult(parsed));
    } catch (error) {
      logger.error("AI scan failed.", error);
      response.status(502).json({ error: "Photo scan failed." });
    }
  }
);
