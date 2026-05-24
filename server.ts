import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import webpush from "web-push";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize VAPID Keys
  let vapidKeys: { publicKey: string; privateKey: string };
  const keysPath = path.join(process.cwd(), "vapid-keys.json");
  if (fs.existsSync(keysPath)) {
    vapidKeys = JSON.parse(fs.readFileSync(keysPath, "utf-8"));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(keysPath, JSON.stringify(vapidKeys), "utf-8");
  }

  webpush.setVapidDetails(
    "mailto:contact@driveproductivity.os",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  // Memory database with file fallback for subscriptions & scheduled reminders
  interface Reminder {
    id: string;
    title: string;
    body: string;
    time: string; // HH:MM
    scheduleType: string; // once, daily, weekly, specific_days
    days: number[]; // days of week (0 is Sunday, etc.)
    date?: string; // YYYY-MM-DD
  }

  interface UserSyncData {
    userId: string;
    timezoneOffset: number; // in minutes
    subscription: any;
    reminders: Reminder[];
    activeTimers?: ActiveTimer[];
    lastNotified?: Record<string, boolean>;
  }

  const remindersPath = path.join(process.cwd(), "push-reminders.json");
  let userSchedules: Record<string, UserSyncData> = {};

  if (fs.existsSync(remindersPath)) {
    try {
      userSchedules = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
    } catch (e) {
      userSchedules = {};
    }
  }

  function saveSchedules() {
    try {
      fs.writeFileSync(remindersPath, JSON.stringify(userSchedules, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save push reminders list:", e);
    }
  }

  console.log("BEFORE VITE:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0,5) : "undefined");
  
  app.get("/api/test-key", (req, res) => {
    res.json({ key: process.env.GEMINI_API_KEY });
  });

  app.get("/api/notifications/vapid-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post("/api/notifications/sync", (req, res) => {
    try {
      const { userId, timezoneOffset, subscription, reminders } = req.body;
      if (!userId || !subscription) {
        return res.status(400).json({ error: "Missing required fields userId and subscription" });
      }

      if (!userSchedules[userId]) {
        userSchedules[userId] = {
          userId,
          timezoneOffset: timezoneOffset || 0,
          subscription,
          reminders: [],
          lastNotified: {}
        };
      }

      userSchedules[userId].timezoneOffset = timezoneOffset !== undefined ? timezoneOffset : userSchedules[userId].timezoneOffset;
      userSchedules[userId].subscription = subscription;
      userSchedules[userId].reminders = reminders || [];
      if (!userSchedules[userId].lastNotified) {
        userSchedules[userId].lastNotified = {};
      }

      saveSchedules();
      res.json({ success: true, count: userSchedules[userId].reminders.length });
    } catch (error: any) {
      console.error("Error in notification sync:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications/test-push", async (req, res) => {
    try {
      const { userId, title, body } = req.body;
      const user = userSchedules[userId];
      if (!user || !user.subscription) {
        return res.status(404).json({ error: "No active push subscription found for this user." });
      }

      const payload = JSON.stringify({
        title: title || "⚡ Verification Push",
        body: body || "Your mobile notifications are now fully configured and linked to the cloud server!",
        icon: "/icon.svg"
      });

      await webpush.sendNotification(user.subscription, payload);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Test notification delivery failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Memory store for active countdown timers (Pomo and break timers)
  interface ActiveTimer {
    timerId: string;
    userId: string;
    title: string;
    body: string;
    targetTimeMs: number;
  }
  app.post("/api/notifications/schedule-timer", (req, res) => {
    try {
      const { timerId, userId, title, body, targetTimeMs } = req.body;
      if (!userId || !timerId || !targetTimeMs) {
        return res.status(400).json({ error: "Missing required fields: timerId, userId, targetTimeMs." });
      }
      
      if (!userSchedules[userId]) {
        return res.status(404).json({ error: "User has no push subscription" });
      }
      if (!userSchedules[userId].activeTimers) {
        userSchedules[userId].activeTimers = [];
      }
      
      let timers = userSchedules[userId].activeTimers!;
      timers = timers.filter(t => t.timerId !== timerId);
      timers.push({
        timerId,
        userId,
        title,
        body,
        targetTimeMs
      });
      userSchedules[userId].activeTimers = timers;
      saveSchedules();
      
      console.log(`[push-service] Scheduled background timer '${timerId}' for user ${userId} at ${new Date(targetTimeMs).toISOString()}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/notifications/cancel-timer", (req, res) => {
    try {
      const { timerId, userId } = req.body;
      if (!userId || !timerId) {
        return res.status(400).json({ error: "Missing timerId or userId." });
      }
      if (userSchedules[userId] && userSchedules[userId].activeTimers) {
         userSchedules[userId].activeTimers = userSchedules[userId].activeTimers!.filter(t => t.timerId !== timerId);
         saveSchedules();
      }
      console.log(`[push-service] Canceled background timer '${timerId}' for user ${userId}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      console.log("SERVER PROXY called. API Key loaded Length:", apiKey?.length, JSON.stringify(apiKey));
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return res.status(401).json({ error: "Missing or invalid GEMINI_API_KEY" });
      }
      const ai = new GoogleGenAI({});
      const { model, contents, config } = req.body;
      const response = await ai.models.generateContent({ model, contents, config });
      
      console.log("Raw Gemini response:", JSON.stringify(response, null, 2));
      
      let text = response.text || "";
      let functionCalls = response.functionCalls || [];
      
      // Safety/fallback check
      if (!text && (!functionCalls || functionCalls.length === 0)) {
         const candidate = (response as any).candidates?.[0];
         if (candidate) {
           const finishReason = candidate.finishReason;
           if (finishReason === "RECITATION") {
             text = "SYSTEM ALERT: The AI's response was blocked by Google's safety filters (Reason: RECITATION), which usually happens when the model tries to output text that is too similar to existing web content. Try asking the AI to summarize, rephrase, or break down the text differently.";
           } else if (finishReason === "SAFETY") {
             text = "SYSTEM ALERT: The AI's response was blocked by Google's safety filters. Please modify your prompt and try again.";
           } else {
             text = `[System Node] No text or function calls generated. Finish Reason: ${finishReason}`;
           }
         } else {
           text = "[System Node] Empty response object received from AI.";
         }
      }
      
      const payload = {
         text,
         functionCalls,
         isQuotaError: false
      };
      res.json(payload);
    } catch (error: any) {
      console.error("Gemini API Proxy Error:", error);
      const errMsg = error?.message || "";
      if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exhausted")) {
        res.json({ isQuotaError: true, text: "SYSTEM ALERT: Uplink quota exhausted (Rate limit reached). Please standby for 60 seconds before initiating the next command." });
      } else {
        res.status(500).json({ error: errMsg });
      }
    }
  });

  // Background loop for checking and delivery of scheduled push notifications & dynamic countdown timers
  setInterval(async () => {
    try {
      const now = Date.now();

      // 1. Process dynamic countdown timers first
      for (const userId of Object.keys(userSchedules)) {
        const user = userSchedules[userId];
        if (!user || (!user.activeTimers && !user.reminders)) continue;

        if (user.activeTimers && user.activeTimers.length > 0) {
          const timersToTrigger = user.activeTimers.filter(t => t.targetTimeMs <= now);
          if (timersToTrigger.length > 0) {
            user.activeTimers = user.activeTimers.filter(t => t.targetTimeMs > now);
            saveSchedules();

            for (const timer of timersToTrigger) {
              if (user.subscription) {
                console.log(`[push-service] Dynamic countdown timer '${timer.timerId}' matured. Sending Web Push to user ${timer.userId}`);
                const payload = JSON.stringify({
                  title: timer.title,
                  body: timer.body,
                  icon: "/icon.svg"
                });
                try {
                  await webpush.sendNotification(user.subscription, payload);
                } catch (err: any) {
                  console.error(`[push-service] Failed to send countdown timer push:`, err?.message);
                  if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`[push-service] Removing defunct subscription for ${timer.userId}`);
                    user.subscription = null;
                    saveSchedules();
                  }
                }
              }
            }
          }
        }
      }

      // 2. Process regular HH:MM scheduler calendars
      for (const userId of Object.keys(userSchedules)) {
        const user = userSchedules[userId];
        if (!user.subscription || !user.reminders || user.reminders.length === 0) continue;

        // Adjust UTC now to user's localized time based on their timezoneOffset (passed in minutes)
        const userLocalTime = new Date(now - (user.timezoneOffset * 60 * 1000));
        const hours = userLocalTime.getUTCHours().toString().padStart(2, '0');
        const minutes = userLocalTime.getUTCMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;
        const localDayOfWeek = userLocalTime.getUTCDay(); // 0-6 (0 is Sunday)

        // Local date formatted to prevent duplicate triggers on the same calendar date/time
        const localDateStr = `${userLocalTime.getUTCFullYear()}-${(userLocalTime.getUTCMonth() + 1).toString().padStart(2, '0')}-${userLocalTime.getUTCDate().toString().padStart(2, '0')}`;

        for (const reminder of user.reminders) {
          if (reminder.time === currentTimeStr) {
            const notifyKey = `${reminder.id}-${localDateStr}-${currentTimeStr}`;
            if (user.lastNotified?.[notifyKey]) continue;

            let shouldTrigger = false;
            if (reminder.scheduleType === 'once') {
              if (!reminder.date || reminder.date === localDateStr) {
                shouldTrigger = true;
              }
            } else if (reminder.scheduleType === 'daily') {
              shouldTrigger = true;
            } else if (reminder.scheduleType === 'weekly' || reminder.scheduleType === 'specific_days') {
              if (reminder.days && reminder.days.includes(localDayOfWeek)) {
                shouldTrigger = true;
              }
            }

            if (shouldTrigger) {
              console.log(`[push-service] Sending Web Push to user ${userId} for item ${reminder.id}`);
              const payload = JSON.stringify({
                title: reminder.title,
                body: reminder.body,
                icon: "/icon.svg"
              });

              if (!user.lastNotified) user.lastNotified = {};
              user.lastNotified[notifyKey] = true;
              saveSchedules();

              try {
                await webpush.sendNotification(user.subscription, payload);
              } catch (err: any) {
                console.error(`[push-service] Failed to deliver push to ${userId}:`, err?.message);
                if (err.statusCode === 410 || err.statusCode === 404) {
                  console.log(`[push-service] Removing defunct subscription for ${userId}`);
                  user.subscription = null;
                  saveSchedules();
                }
              }
            }
          }
        }
      }
    } catch (loopError) {
      console.error("[push-service] Error inside check loop:", loopError);
    }
  }, 5000); // Poll every 5 seconds for precision matching

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
