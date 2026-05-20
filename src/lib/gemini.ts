export const callGeminiProxy = async (model: string, contents: any[], config?: any) => {
  const res = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, contents, config })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
    throw new Error(data?.error || `HTTP Error ${res.status}: ${text}`);
  }
  return res.json();
};

const getAI = () => {
  return {
    models: {
      generateContent: async (args: { model: string, contents: any[], config?: any }) => {
        return callGeminiProxy(args.model, args.contents, args.config);
      }
    }
  };
};

export const getBossStory = async (bossLevel: number, tasks: any[]) => {
  try {
    const ai = getAI();
    
    const taskNames = tasks.map((t: any) => t.title).join(", ");
    
    const prompt = `You are a creative game master for an RPG habit tracker (like Habitica).
The player has reached Boss Level ${bossLevel}.
The player's current overdue or most pending tasks are: ${taskNames || "General daily life tasks"}.

Generate a JSON object with:
1. bossName: A creative enemy name inspired by the player's pending tasks. Small length max 25 chars.
2. bossDescription: A 1-sentence epic description of the boss.
3. story: A 2-3 sentence engaging tavern story that the Innkeeper tells the player, warning them about this specific boss and mentioning their actual tasks!

JSON FORMAT STRICTLY.
Example:
{
  "bossName": "The Cleanliness Golem",
  "bossDescription": "A hulking mass of unwashed laundry and dirty dishes.",
  "story": "I saw it forming near the sink! It feeds on your ignored chores."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] } as any]
    });

    const text = response.text || "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
       return JSON.parse(match[0]);
    }
    throw new Error("Invalid output");
  } catch (err) {
    console.error("Failed to generate boss story", err);
    return {
      bossName: `Dragon (Lv.${bossLevel})`,
      bossDescription: "A monster shrouded in mystery.",
      story: "The storyteller is resting. Perhaps try again later!"
    };
  }
};

export const getAICoachInsight = async (userData: any) => {
  try {
    const ai = getAI();
    if (!ai) return "Keep pushing towards your goals. Every small step counts.";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
      return "System Uplink Exhausted. Please wait 60 seconds before requesting another insight.";
    }
    console.error("AI Coach Error:", error);
    return "Keep pushing towards your goals. Every small step counts.";
  }
};

export const getGoalBreakdown = async (goalTitle: string) => {
  try {
    const ai = getAI();
    if (!ai) return [];
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
      return ["Quota exceeded. Break this goal down manually for now.", "Try again in 60 seconds."];
    }
    console.error("Goal Breakdown Error:", error);
    return [];
  }
};

export const getReflectionInsight = async (reflectionText: string) => {
  try {
    const ai = getAI();
    if (!ai) return "Thank you for sharing your reflection.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
      return "System Uplink Exhausted. Keep going, try again later.";
    }
    console.error("Reflection Insight Error:", error);
    return "Reflecting is a key to growth.";
  }
};

const EPIC_QUOTES = [
  "Action generates motivation, not the other way around.",
  "Do not let your yesterday take up too much of your today.",
  "We are all going to die. But very few of us are actually going to live.",
  "You cannot find yourself until you are willing to lose yourself.",
  "The only way to figure out what you love is to do what you hate.",
  "Comfort is the enemy of progress. Seek discomfort.",
  "Failure is a punctuation mark, not a full stop.",
  "Your biggest regret will be the risks you didn't take.",
  "Overthinking is the art of creating problems that aren't even there.",
  "Stop waiting for the perfect moment. Take the moment and make it perfect.",
  "Consistency beats intensity. Do it every day.",
  "You are not your thoughts. You are the observer of your thoughts.",
  "If you want different results, do not do the same things.",
  "The most expensive thing you can buy is the opinion of other people.",
  "Anxiety is just excitement without the breath.",
  "Say no. It is a complete sentence.",
  "If it is not a 'hell yes', it is a 'no'.",
  "Don't optimize for wealth. Optimize for freedom.",
  "Success is a lousy teacher. It seduces smart people into thinking they can't lose.",
  "Your self-worth is not decided by your net worth.",
  "Respect is earned. Honesty is appreciated. Trust is gained. Loyalty is returned.",
  "The hardest thing in life is to know which bridge to cross and which to burn.",
];

export const getDailyMotivation = async (mood: string | null) => {
  try {
    // Generate a random index
    const randomIndex = Math.floor(Math.random() * EPIC_QUOTES.length);
    let selectedQuote = EPIC_QUOTES[randomIndex];

    // Try to get past quotes from local storage to avoid repeating recently (in the browser)
    try {
      const stored = localStorage.getItem('past_epic_quotes');
      const pastQuotes: string[] = stored ? JSON.parse(stored) : [];
      
      // If we've shown it recently, pick another one (try a few times)
      for (let i = 0; i < 10; i++) {
        const nextIndex = Math.floor(Math.random() * EPIC_QUOTES.length);
        if (!pastQuotes.includes(EPIC_QUOTES[nextIndex])) {
          selectedQuote = EPIC_QUOTES[nextIndex];
          break;
        }
      }
      
      // Add the new quote, keep the last 7
      pastQuotes.push(selectedQuote);
      if (pastQuotes.length > 7) {
        pastQuotes.shift(); // Remove oldest
      }
      localStorage.setItem('past_epic_quotes', JSON.stringify(pastQuotes));
    } catch(e) {} // ignore local storage errors

    return selectedQuote;
  } catch (error) {
    return "Action creates the motivation, not the other way around.";
  }
};

export const getTaskFocusAdvice = async (tasks: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return "Review your tasks and tackle the most urgent one.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: `
          Review these tasks. Give a short, punchy, 2-3 sentence recommendation on exactly what the user should focus on next to build momentum.
          Tasks: ${JSON.stringify(tasks)}
        `
        }]
      }]
    });
    
    return response.text?.trim() || "Identify the smallest step and take action.";
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
      return "System Uplink Exhausted. Wait 60 seconds.";
    }
    return "Identify the smallest step and take action.";
  }
};

export const getOverviewFocusAdvice = async (goals: any[], tasks: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return "Review your goals and tasks and tackle the most urgent ones to build momentum.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: `
          Review these goals and tasks. Give a short, punchy, 2-3 sentence recommendation on exactly what the user should focus on today to build momentum across their objectives.
          Goals: ${JSON.stringify(goals)}
          Tasks: ${JSON.stringify(tasks)}
        `
        }]
      }]
    });
    
    return response.text?.trim() || "Identify the smallest step and take action.";
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
      return "System Uplink Exhausted. Wait 60 seconds.";
    }
    return "Check your objectives and focus on high-priority items.";
  }
};

export const getGoalFocusAdvice = async (goals: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return "Review your goals and tackle the most urgent one.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: `
          Review these goals and their subtasks. Give a short, punchy, 2-3 sentence recommendation on exactly what the user should focus on next to build momentum.
          Goals: ${JSON.stringify(goals)}
        `
        }]
      }]
    });
    
    return response.text?.trim() || "Identify the smallest step and take action.";
  } catch (error) {
    return "Check your goals and focus on high-priority items.";
  }
};

export const getDeepAnalysis = async (userData: any) => {
  try {
    const ai = getAI();
    if (!ai) return "Analyze your data to see trends.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
      return "System Uplink Exhausted. Wait 60 seconds.";
    }
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
        },
        description: "Optional list of subtasks (or key results) required to achieve this goal. Each subtask can optionally have nested subtasks."
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
      subtasks: {
        type: "ARRAY",
        items: {
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
        },
        description: "Optional list of sub-steps to break down this task. Each subtask can optionally have nested subtasks.",
      }
    },
    required: ["title", "priority"],
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

export const createHabitDeclaration = {
  name: "createHabit",
  description: "Creates a new Habit, a recurring task that the user wants to perform.",
  parameters: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING", description: "The title/name of the habit." },
      frequency: { type: "STRING", description: "The frequency (e.g. 'daily', 'weekly'). Defaults to daily." }
    },
    required: ["title"]
  }
};

export const updateHabitDeclaration = {
  name: "updateHabit",
  description: "Updates an existing Habit. You must pass the habit's id.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING", description: "The id of the habit to update." },
      title: { type: "STRING", description: "The new title." },
      frequency: { type: "STRING", description: "The new frequency." }
    },
    required: ["id"]
  }
};

export const updateGoalDeclaration = {
  name: "updateGoal",
  description: "Updates a goal's properties or adds subtasks to it.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING", description: "The id of the goal." },
      title: { type: "STRING", description: "The new title." },
      priority: { type: "STRING", description: "The new priority (A, B, C, D)." },
      type: { type: "STRING", description: "The new type (yearly, monthly, weekly)." },
      subtasks: {
        type: "ARRAY",
        items: {
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
        },
        description: "List of new subtasks to add to this goal. Each subtask can optionally have nested subtasks.",
      }
    },
    required: ["id"]
  }
};

export const updateTaskDeclaration = {
  name: "updateTask",
  description: "Updates a task's properties or adds subtasks to it.",
  parameters: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING", description: "The id of the task." },
      title: { type: "STRING", description: "The new title." },
      priority: { type: "STRING", description: "The new priority (A, B, C)." },
      subtasks: {
        type: "ARRAY",
        items: {
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
        },
        description: "List of new subtasks to add to this task. Each subtask can optionally have nested subtasks.",
      }
    },
    required: ["id"]
  }
};

export const updateTaskSubtaskDeclaration = {
  name: "updateTaskSubtask",
  description: "Updates the title of a specific subtask within a task.",
  parameters: {
    type: "OBJECT",
    properties: {
      taskId: { type: "STRING", description: "The id of the parent task." },
      subtaskId: { type: "STRING", description: "The id of the subtask." },
      title: { type: "STRING", description: "The new title for the subtask." }
    },
    required: ["taskId", "subtaskId", "title"]
  }
};

export const deleteTaskSubtaskDeclaration = {
  name: "deleteTaskSubtask",
  description: "Deletes a specific subtask from a task.",
  parameters: {
    type: "OBJECT",
    properties: {
      taskId: { type: "STRING", description: "The id of the parent task." },
      subtaskId: { type: "STRING", description: "The id of the subtask to delete." }
    },
    required: ["taskId", "subtaskId"]
  }
};

export const updateGoalSubtaskDeclaration = {
  name: "updateGoalSubtask",
  description: "Updates the title of a specific subtask within a goal.",
  parameters: {
    type: "OBJECT",
    properties: {
      goalId: { type: "STRING", description: "The id of the parent goal." },
      subtaskId: { type: "STRING", description: "The id of the subtask." },
      title: { type: "STRING", description: "The new title for the subtask." }
    },
    required: ["goalId", "subtaskId", "title"]
  }
};

export const deleteGoalSubtaskDeclaration = {
  name: "deleteGoalSubtask",
  description: "Deletes a specific subtask from a goal.",
  parameters: {
    type: "OBJECT",
    properties: {
      goalId: { type: "STRING", description: "The id of the parent goal." },
      subtaskId: { type: "STRING", description: "The id of the subtask to delete." }
    },
    required: ["goalId", "subtaskId"]
  }
};

export const getTrojanChatResponse = async (
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  tasks: any[],
  goals: any[] = [],
  habits: any[] = []
): Promise<any> => {
  try {
    const ai = getAI();
    if (!ai) return { text: "API key is missing. Cannot initialize Trojan." };
    
    const contents = history.map(h => ({ role: h.role, parts: h.parts }));
    contents.push({ role: "user", parts: [{ text: message }] });

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents as any,
        config: {
          systemInstruction: `You are Trojan, an elite AI productivity personal assistant and performance coach. You help the user manage their tasks, goals (yearly/monthly/weekly), and Habits. Current tasks: ${JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed, subtasks: t.subtasks?.map((s:any) => ({ id: s.id, title: s.title, completed: s.completed })) }))) }. Current goals: ${JSON.stringify(goals.map((g: any) => ({ id: g.id, title: g.title, type: g.type, priority: g.priority, completed: g.completed, subtasks: g.subtasks?.map((s:any) => ({ id: s.id, title: s.title, completed: s.completed })) }))) }. Current Habits: ${JSON.stringify(habits.map((h: any) => ({ id: h.id, title: h.title }))) }. 

CRITICAL MISSION:
1. When asked what to do today, prioritize incomplete tasks and suggest an action plan.
2. If asked to analyze progress or results, evaluate completed vs incomplete items. Tell the user what they did well, what they did wrong (e.g., too many incomplete high-priority tasks), and how to improve. Motivate them aggressively but constructively.
3. Suggest habits or goals if the user asks for self-improvement ideas.
4. Maintain context across turns. If the user provided a title in a previous turn and now provides a missing priority (or vice versa), combine them and execute the tool. Do not ask for information the user has already provided. If all required details are present, execute the tool immediately.
5. NESTED SUBTASKS: You can create goals and tasks with subtasks, and those subtasks can have their own subtasks (multi-level nesting). When adding complex projects or goals, actively break them down into nested subtasks if appropriate.
6. APP CONTEXT: Tell the user about the 'Time Bank' system if they ask about app features. They earn value (Time Bank balance) by completing tasks and habits. The older 'Habitica Test' and 'Life is a Game' pages have been removed to focus entirely on the Time Bank.
7. To avoid RECITATION errors, do not copy large blocks of text from the user verbatim. Summarize and slightly rephrase.`,
          tools: [{ functionDeclarations: [createTaskDeclaration as any, createGoalDeclaration as any, createHabitDeclaration as any, toggleTaskDeclaration as any, deleteTaskDeclaration as any, toggleGoalDeclaration as any, deleteGoalDeclaration as any, updateTaskDeclaration as any, updateGoalDeclaration as any, updateHabitDeclaration as any, updateTaskSubtaskDeclaration as any, deleteTaskSubtaskDeclaration as any, updateGoalSubtaskDeclaration as any, deleteGoalSubtaskDeclaration as any] }],
          temperature: 0.4
        }
      });
    } catch (primaryError: any) {
      const primaryMsg = primaryError?.message || "";
      if (primaryMsg.includes("429") || primaryMsg.toLowerCase().includes("quota")) {
        // Fallback to gemini-2.5-flash
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents as any,
          config: {
            systemInstruction: `You are Trojan, an elite AI productivity personal assistant and performance coach. You help the user manage their tasks, goals (yearly/monthly/weekly), and Habits. Current tasks: ${JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed, subtasks: t.subtasks?.map((s:any) => ({ id: s.id, title: s.title, completed: s.completed })) }))) }. Current goals: ${JSON.stringify(goals.map((g: any) => ({ id: g.id, title: g.title, type: g.type, priority: g.priority, completed: g.completed, subtasks: g.subtasks?.map((s:any) => ({ id: s.id, title: s.title, completed: s.completed })) }))) }. Current Habits: ${JSON.stringify(habits.map((h: any) => ({ id: h.id, title: h.title }))) }. 

CRITICAL MISSION:
1. When asked what to do today, prioritize incomplete tasks and suggest an action plan.
2. If asked to analyze progress or results, evaluate completed vs incomplete items. Tell the user what they did well, what they did wrong (e.g., too many incomplete high-priority tasks), and how to improve. Motivate them aggressively but constructively.
3. Suggest habits or goals if the user asks for self-improvement ideas.
4. Maintain context across turns. If the user provided a title in a previous turn and now provides a missing priority (or vice versa), combine them and execute the tool. Do not ask for information the user has already provided. If all required details are present, execute the tool immediately.
5. NESTED SUBTASKS: You can create goals and tasks with subtasks, and those subtasks can have their own subtasks (multi-level nesting). When adding complex projects or goals, actively break them down into nested subtasks if appropriate.
6. APP CONTEXT: Tell the user about the 'Time Bank' system if they ask about app features. They earn value (Time Bank balance) by completing tasks and habits. The older 'Habitica Test' and 'Life is a Game' pages have been removed to focus entirely on the Time Bank.
7. To avoid RECITATION errors, do not copy large blocks of text from the user verbatim. Summarize and slightly rephrase.`,
            tools: [{ functionDeclarations: [createTaskDeclaration as any, createGoalDeclaration as any, createHabitDeclaration as any, toggleTaskDeclaration as any, deleteTaskDeclaration as any, toggleGoalDeclaration as any, deleteGoalDeclaration as any, updateTaskDeclaration as any, updateGoalDeclaration as any, updateHabitDeclaration as any, updateTaskSubtaskDeclaration as any, deleteTaskSubtaskDeclaration as any, updateGoalSubtaskDeclaration as any, deleteGoalSubtaskDeclaration as any] }],
            temperature: 0.4
          }
        });
      } else {
        throw primaryError;
      }
    }

    console.log("Gemini Response:", JSON.stringify(response, null, 2));

    return response;
  } catch (error: any) {
    console.error("Trojan Error:", error);
    const errMsg = (error?.message || "").toLowerCase();
    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("exhausted")) {
      return { text: "SYSTEM ALERT: Uplink quota exhausted (Rate limit reached). Please standby for 60 seconds before initiating the next command.", isQuotaError: true };
    }
    if (errMsg.includes("503") || errMsg.includes("overloaded") || errMsg.includes("high demand") || errMsg.includes("unavailable")) {
      return { text: "SYSTEM ALERT: Trojan uplink is currently experiencing high demand. The network is temporarily unavailable. Please standby and try again shortly." };
    }
    return { text: `COMMAND FAILED: Error communicating with Trojan: ${error?.message || "Unknown error"}` };
  }
};

export const smartTaskPrioritization = async (tasks: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return [];
    
    const taskList = tasks.map((t: any) =>`[${t.priority}] ${t.title}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: `
          Analyze these daily tasks and return a JSON array of their titles in prioritized order (most impactful/urgent first).
          Consider priority (A is highest).
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
