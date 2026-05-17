import { GoogleGenAI } from "@google/genai";

console.log("TEST SCRIPT API KEY:", process.env.GEMINI_API_KEY?.length, JSON.stringify(process.env.GEMINI_API_KEY));

const ai = new GoogleGenAI({});

async function test() {
  const contents = [
    { role: "user", parts: [{ text: "goal yearly Apply for Aus jobs create 15 subtask saying week 1 apply 10 jobs, week 2 apply 10 jobs .... like that" }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are an AI.",
        tools: [
          {
            functionDeclarations: [
              {
                name: "createGoal",
                description: "Test",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    subtasks: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          title: { type: "STRING" }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    });
    console.log(JSON.stringify(response.functionCalls, null, 2));
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}

test();
