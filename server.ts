import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing for document payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.7-flash",
    });
  });

  // AI Chat & Document Analysis API endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const {
        messages,
        documentContext,
        task = "chat",
        targetLanguage,
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error:
            "GEMINI_API_KEY is not configured on the server. Please ensure the API key is provided.",
        });
      }

      let systemInstruction = `You are FreePDF AI Assistant, an expert document intelligence assistant.
Your goal is to provide precise, accurate, and structured insights from user-provided documents (PDFs, text extracts, scanned data).

Core Rules:
1. Always base your answers directly on the provided Document Context.
2. If the answer cannot be found in the document, explicitly note: "This information is not mentioned in the provided document."
3. Format output in clean, readable Markdown with bold headings, clean bullet points, numbered steps, and tables where suitable.
4. Maintain a professional, helpful, and concise tone.`;

      if (task === "summarize") {
        systemInstruction += `\nTask: Provide an executive summary of the document.
Structure:
- **Executive Summary** (2-3 concise sentences)
- **Key Findings & Core Points** (3-6 bullet points with details)
- **Important Takeaways / Next Steps**`;
      } else if (task === "action_items") {
        systemInstruction += `\nTask: Extract all action items, obligations, deliverables, tasks, and deadlines mentioned in the document as a clean markdown checklist.`;
      } else if (task === "key_points") {
        systemInstruction += `\nTask: Extract top key points, numbers, statistics, financial figures, dates, and metrics into clear bullet points.`;
      } else if (task === "explain_simple") {
        systemInstruction += `\nTask: Explain the content of the document in very simple terms (ELI5 - Explain Like I'm 5) for someone with no technical or legal background.`;
      } else if (task === "quiz") {
        systemInstruction += `\nTask: Generate a 5-question multiple choice & comprehension quiz based on the key concepts in this document, complete with answers and explanations hidden in spoiler/quote blocks.`;
      } else if (task === "translate" && targetLanguage) {
        systemInstruction += `\nTask: Translate the core summary and key insights of this document accurately into ${targetLanguage}.`;
      }

      // Build context string safely
      let contextText = "";
      if (documentContext && documentContext.text) {
        const truncatedText = documentContext.text.slice(0, 120000);
        contextText = `\n--- [DOCUMENT START: ${documentContext.filename || "Uploaded File"}] ---\n${truncatedText}\n--- [DOCUMENT END] ---\n\n`;
      }

      // Build user prompt
      let userQuery = "Please analyze and summarize this document.";
      if (messages && Array.isArray(messages) && messages.length > 0) {
        // Take recent conversation flow
        const lastMsg = messages[messages.length - 1];
        userQuery = lastMsg.content || userQuery;
      }

      const fullPrompt = `${contextText}User Request: ${userQuery}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const reply = response.text || "I was unable to generate a response from the document.";

      res.json({
        reply,
        model: "gemini-3.7-flash",
      });
    } catch (error: any) {
      console.error("Gemini Assistant Error:", error);
      res.status(500).json({
        error: error.message || "Failed to process document with Gemini AI.",
      });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FreePDF Tools Server running on http://localhost:${PORT}`);
  });
}

startServer();
