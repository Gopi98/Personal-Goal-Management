import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function test() {
  const envKey = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8')).GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!envKey) {
     console.log("No key");
     return;
  }
  const ai = new GoogleGenAI({ apiKey: envKey });
  
  try {
     const res = await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: [{
            role: "user", parts: [{ text: "create a goal named 'investment with gemini' with subtasks 'check mf stock wk 1', 'check mf stock wk 2', up to wk 30" }]
         }]
     });
     console.log(JSON.stringify(res, null, 2));
  } catch(e) {
     console.error(e);
  }
}
test();
