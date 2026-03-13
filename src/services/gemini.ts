import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeFood = async (input: string | { base64: string, mimeType: string }, quantity?: number, unit?: string) => {
  const model = "gemini-3-flash-preview";
  
  const quantityContext = quantity && unit ? `\n\nQuantity: ${quantity} ${unit}` : '';
  const prompt = `Analyze this food and provide nutritional information. 
  If it's an image, identify the food. If it's text, use that description.${quantityContext}
  Return a JSON object with:
  {
    "name": "Food name",
    "calories": number,
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams)
  }
  Be as accurate as possible. Calculate the total nutritional value based on the provided quantity and unit if applicable. If multiple items are present, provide the total.`;

  const contents = typeof input === 'string' 
    ? input 
    : {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: input.base64,
              mimeType: input.mimeType
            }
          }
        ]
      };

  const response = await ai.models.generateContent({
    model,
    contents: typeof input === 'string' ? prompt + "\n\nInput: " + input : contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER }
        },
        required: ["name", "calories", "protein", "carbs", "fat"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
