import { GoogleGenAI, Modality } from "@google/genai";
import { config } from 'dotenv';
config();
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: "Hello",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
        }
      }
    });
    console.log("SUCCESS Zephyr");
  } catch(e) {
    console.error("Zephyr Failed", e.message);
  }
}
test();
