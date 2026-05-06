import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not set.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getAICoachInsight = async (userData: any) => {
  try {
    const ai = getAI();
    if (!ai) return "Keep pushing towards your goals. Every small step counts.";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
          You are an expert personal performance coach. 
          Analyze the following user productivity data and provide ONE concise, powerful nudge (max 2 sentences).
          Data: ${JSON.stringify(userData)}
          
          Focus on:
          - Motivation if tasks are lagging.
          - Celebrating wins if goals are met.
          - Specific action for today.
        `
        }]
      }]
    });
    return response.text || "Keep pushing towards your goals. Every small step counts.";
  } catch (error) {
    console.error("AI Coach Error:", error);
    return "Keep pushing towards your goals. Every small step counts.";
  }
};

export const getGoalBreakdown = async (goalTitle: string) => {
  try {
    const ai = getAI();
    if (!ai) return [];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
          Break down this goal into 3-5 actionable subtasks. 
          Goal: "${goalTitle}"
          Format the response as a simple JSON array of strings.
        `
        }]
      }]
    });
    const text = response.text || "[]";
    const match = text.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch (error) {
    console.error("Goal Breakdown Error:", error);
    return [];
  }
};

export const getReflectionInsight = async (reflectionText: string) => {
  try {
    const ai = getAI();
    if (!ai) return "Thank you for sharing your reflection.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
          Analyze this user reflection and provide ONE short, supportive coaching insight (max 12 words).
          Reflection: "${reflectionText}"
        `
        }]
      }]
    });
    
    return response.text?.trim() || "Thank you for sharing your reflection.";
  } catch (error) {
    console.error("Reflection Insight Error:", error);
    return "Reflecting is a key to growth.";
  }
};

export const getDailyMotivation = async (mood: string | null) => {
  try {
    const ai = getAI();
    if (!ai) return "The best way to get started is to quit talking and begin doing.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
          Provide a short, powerful, technical-themed productivity quote or "Daily Proverb" (max 15 words) 
          tailored to a user who currently feels "${mood || 'ready to focus'}". 
          Examples: "Code is clean, mind is clear.", "Incremental progress outpaces stalled perfection."
        `
        }]
      }]
    });
    
    return response.text?.trim() || "The best way to get started is to quit talking and begin doing.";
  } catch (error) {
    return "Focus is the art of knowing what to ignore.";
  }
};

export const getDeepAnalysis = async (userData: any) => {
  try {
    const ai = getAI();
    if (!ai) return "Analyze your data to see trends.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
          Analyze this productivity data and provide a deep, 3-paragraph executive summary of strengths, weaknesses, and a strategic recommendation.
          Data: ${JSON.stringify(userData)}
        `
        }]
      }]
    });
    
    return response.text?.trim() || "Analyze your data to see trends.";
  } catch (error) {
    return "Focus on the process, not just the result.";
  }
};

export const createGoalDeclaration = {
  name: "createGoal",
  description: "Creates a new goal (yearly, monthly, or weekly). Use this when the user asks to set long-term objectives or weekly sprints.",
  parameters: {
    type: "OBJECT",
    properties: {
      title: {
        type: "STRING",
        description: "The title of the goal.",
      },
      type: {
        type: "STRING",
        description: "The timeframe of the goal. Allowed values are 'yearly', 'monthly', 'weekly'.",
      },
      priority: {
        type: "STRING",
        description: "The priority of the goal from 'A' to 'D' (A is highest, D is lowest).",
      },
      subtasks: {
        type: "ARRAY",
        items: {
          type: "STRING"
        },
        description: "Optional list of subtasks (or key results) required to achieve this goal."
      }
    },
    required: ["title", "type", "priority"]
  }
};

export const createTaskDeclaration = {
  name: "createTask",
  description: "Creates a new task in the user's task list. Use this when the user asks to add or plan something.",
  parameters: {
    type: "OBJECT",
    properties: {
      title: {
        type: "STRING",
        description: "The name of the task.",
      },
      priority: {
        type: "STRING",
        description: "Priority level: 'A' for highest/urgent, 'B' for important, 'C' for nice to have.",
      },
      energy: {
        type: "STRING",
        description: "Energy required: 'High', 'Medium', or 'Low'.",
      },
      subtasks: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Optional list of sub-steps to break down this task.",
      }
    },
    required: ["title", "priority", "energy"],
  },
};

export const toggleTaskDeclaration = {
  name: "toggleTask",
  description: "Marks an existing task as completed. The user gives you the task title. You must find its id from the context and pass it.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: {
        type: "STRING",
        description: "The id of the task to complete.",
      }
    },
    required: ["id"],
  },
};

export const deleteTaskDeclaration = {
  name: "deleteTask",
  description: "Deletes a task from the user's task list. The user gives you the task title. You must find its id from the context and pass it.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: {
        type: "STRING",
        description: "The id of the task to delete.",
      }
    },
    required: ["id"],
  },
};

export const toggleGoalDeclaration = {
  name: "toggleGoal",
  description: "Marks an existing goal as completed (or incomplete). The user gives you the goal title. You must find its id from the context and pass it.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: {
        type: "STRING",
        description: "The id of the goal to toggle.",
      }
    },
    required: ["id"],
  },
};

export const deleteGoalDeclaration = {
  name: "deleteGoal",
  description: "Deletes a goal from the user's goal list. The user gives you the goal title. You must find its id from the context and pass it.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: {
        type: "STRING",
        description: "The id of the goal to delete.",
      }
    },
    required: ["id"],
  },
};

export const getTrojanChatResponse = async (
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  tasks: any[],
  goals: any[] = []
): Promise<any> => {
  try {
    const ai = getAI();
    if (!ai) return { text: "API key is missing. Cannot initialize Trojan." };
    
    const contents = history.map(h => ({ role: h.role, parts: h.parts }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: `You are Trojan, an elite AI productivity agent. You help the user manage their tasks and goals (yearly/monthly/weekly). Be concise, militaristic, and professional. Current tasks: ${JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed }))) }. Current goals: ${JSON.stringify(goals.map((g: any) => ({ id: g.id, title: g.title, type: g.type, priority: g.priority, completed: g.completed }))) }. Use the tools to create, toggle (complete), or delete tasks/goals based on user request. Do not ask for confirmation if the user already gave you enough details.`,
        tools: [{ functionDeclarations: [createTaskDeclaration as any, createGoalDeclaration as any, toggleTaskDeclaration as any, deleteTaskDeclaration as any, toggleGoalDeclaration as any, deleteGoalDeclaration as any] }],
        temperature: 0.7
      }
    });

    return response;
  } catch (error) {
    console.error("Trojan Error:", error);
    return { text: "Error communicating with Trojan command." };
  }
};

export const smartTaskPrioritization = async (tasks: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return [];
    
    const taskList = tasks.map((t: any) =>`[${t.priority}] ${t.title} (${t.energy} energy)`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
          Analyze these daily tasks and return a JSON array of their titles in prioritized order (most impactful/urgent first).
          Consider priority (A is highest) and energy levels.
          Return ONLY the JSON array of strings.
          
          Tasks:
          ${taskList}
        `
        }]
      }]
    });
    
    const text = response.text?.trim() || "[]";
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as string[];
  } catch (error) {
    console.error("Prioritization Error:", error);
    return [];
  }
};
