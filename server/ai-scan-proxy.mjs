import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.GEMINI_API_KEY || "";
const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash";
const allowedOrigin = process.env.AI_SCAN_ALLOWED_ORIGIN || "*";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required to run the AI scan proxy.");
}

const ai = new GoogleGenAI({ apiKey });

app.use(express.json({ limit: "10mb" }));
app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
});

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/scan-food", async (request, response) => {
  const { base64, mimeType } = request.body || {};

  if (typeof base64 !== "string" || !base64.trim()) {
    response.status(400).json({ error: "Missing base64 image data." });
    return;
  }

  if (typeof mimeType !== "string" || !mimeType.trim()) {
    response.status(400).json({ error: "Missing image mime type." });
    return;
  }

  try {
    const result = await ai.models.generateContent({
      model,
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

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.name !== "string" ||
      !["calories", "protein", "carbs", "fat"].every((key) => {
        const current = parsed[key];
        return typeof current === "number" && Number.isFinite(current) && current >= 0;
      })
    ) {
      response.status(502).json({ error: "Model returned an invalid food result." });
      return;
    }

    response.json({
      name: parsed.name.trim(),
      calories: Math.round(parsed.calories * 10) / 10,
      protein: Math.round(parsed.protein * 10) / 10,
      carbs: Math.round(parsed.carbs * 10) / 10,
      fat: Math.round(parsed.fat * 10) / 10,
    });
  } catch (error) {
    console.error("AI scan proxy error:", error);
    response.status(502).json({ error: "Photo scan failed." });
  }
});

app.listen(port, () => {
  console.log(`AI scan proxy listening on http://localhost:${port}`);
});
