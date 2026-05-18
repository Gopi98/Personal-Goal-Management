import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const createTaskD = {
    name: "createTask",
    description: "Create a new task.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" }
      },
      required: ["title"]
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [{ text: `Create a task called "Buy groceries"` }]
    }],
    config: {
      tools: [{ functionDeclarations: [createTaskD] }],
      temperature: 0.1
    }
  });

  console.log("Original function calls array:");
  console.log(response.functionCalls);

  console.log("JSON Stringified function calls:");
  console.log(JSON.stringify(response.functionCalls));
}

main().catch(console.error);
