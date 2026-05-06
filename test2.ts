import { GoogleGenAI } from "@google/genai";
import { createTaskDeclaration, createGoalDeclaration, toggleTaskDeclaration, deleteTaskDeclaration, toggleGoalDeclaration, deleteGoalDeclaration } from "./src/lib/gemini.js";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "create yearly task 1 learn python",
      config: {
        tools: [{ functionDeclarations: [createTaskDeclaration as any, createGoalDeclaration as any, toggleTaskDeclaration as any, deleteTaskDeclaration as any, toggleGoalDeclaration as any, deleteGoalDeclaration as any] }],
      }
    });
    console.log("Success:", response.text);
  } catch(e) {
    console.error("Error length:", e.message);
  }
}
test();
