import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      
      const payload = {
         text: response.text,
         functionCalls: response.functionCalls,
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
    console.log(`Server running on http://0.0.0.0:\${PORT}`);
  });
}

startServer();
