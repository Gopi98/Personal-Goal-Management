import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  console.log("BEFORE VITE:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0,5) : "undefined");
  
  app.get("/api/test-key", (req, res) => {
    res.json({ key: process.env.GEMINI_API_KEY });
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
