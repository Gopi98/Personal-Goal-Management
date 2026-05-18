import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const createTaskD = {
    name: "createTask",
    description: "Create a new task.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        priority: { type: "STRING", enum: ["A", "B", "C", "D"], description: "default C" },
        subtasks: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "priority"]
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [{ text: `Phase 1: Advanced Data Processing & Lakehouse Architecture
Task 1: Master Open Table Formats
...
Subtask: Practice translating technical architecture into clear, bottom-line business value for non-technical stakeholders.

I have given this prompt trojan ai failed to execute` }]
    }],
    config: {
      tools: [{ functionDeclarations: [createTaskD] }],
      temperature: 0.1,
      systemInstruction: "You are an assistant."
    }
  });
  console.log("Response text:", response.text);
  console.log("Response functionCalls length:", response.functionCalls ? response.functionCalls.length : 0);
  console.log("Raw response:", JSON.stringify(response, null, 2));
}
main().catch(console.error);
