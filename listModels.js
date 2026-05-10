import { GoogleGenAI } from "@google/genai";

async function listModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.list();
  for await (const model of response) {
    console.log(model.name);
  }
}
listModels();
