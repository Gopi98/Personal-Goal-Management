import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getAICoachInsight = async (userData: any) => {
  try {
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

export const getDeepAnalysis = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
            Analyze this productivity data and provide a deep, 3-paragraph executive summary of strengths, weaknesses, and a strategic recommendation.
            Data: ${JSON.stringify(data)}
          `
        }]
      }]
    });
    return response.text?.trim() || "Analyze your data to see trends.";
  } catch (error) {
    return "Focus on the process, not just the result.";
  }
};

export const smartTaskPrioritization = async (tasks: any[]) => {
  try {
    const taskList = tasks.map(t =>`[${t.priority}] ${t.title} (${t.energy} energy)`).join('\n');
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
