import { GoogleGenAI, Modality } from "@google/genai";
import { config } from 'dotenv';
config();
async function test() {
  console.log('has_api_key?', !!process.env.GEMINI_API_KEY);
  // ...
  const ai = new GoogleGenAI();
}
test();
