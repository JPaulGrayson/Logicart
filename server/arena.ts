import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { parseCodeToFlowchart, calculateSimilarityFromParsed, type ParseResult } from "./ai";
import { storage } from "./storage";
import { insertArenaSessionSchema } from "@shared/schema";
import { requireHistoryFeature, verifyTokenPublic } from "./middleware";

interface ModelResult {
  model: string;
  provider: string;
  code: string;
  error?: string;
  latencyMs: number;
}

interface ArenaRequest {
  prompt: string;
}

interface APIKeys {
  openai?: string;
  gemini?: string;
  anthropic?: string;
  xai?: string;
}

function extractAPIKeys(req: Request): APIKeys {
  // Check if user has managed AI access (authenticated with managed_allowance > 0 or demo mode)
  const user = verifyTokenPublic(req);
  const hasManagedAI = user && (user.features?.managed_allowance ?? 0) > 0;
  
  // Only fall back to server-side keys if user has managed AI access
  return {
    openai: (req.headers["x-openai-key"] as string) || (hasManagedAI ? process.env.OPENAI_API_KEY : undefined),
    gemini: (req.headers["x-gemini-key"] as string) || (hasManagedAI ? process.env.GEMINI_API_KEY : undefined),
    anthropic: (req.headers["x-anthropic-key"] as string) || (hasManagedAI ? process.env.ANTHROPIC_API_KEY : undefined),
    xai: (req.headers["x-xai-key"] as string) || (hasManagedAI ? process.env.XAI_API_KEY : undefined),
  };
}

const CODE_GENERATION_SYSTEM_PROMPT = `You are a code generation assistant. Generate clean, working JavaScript code based on the user's request.
Rules:
1. Output ONLY the code - no explanations, no markdown, no code blocks
2. Use modern JavaScript (ES6+)
3. Include comments for complex logic
4. Make the code production-ready`;

const DEBUG_ANALYSIS_SYSTEM_PROMPT = `You are an expert debugging advisor. Analyze the problem described and provide clear, actionable debugging advice.

Your response should include:
1. **Root Cause Analysis**: What's likely causing this issue
2. **Key Investigation Points**: What to check first
3. **Suggested Fixes**: Concrete steps to resolve the problem
4. **Prevention Tips**: How to avoid this in the future

Be concise but thorough. Focus on practical solutions.
Format your response with clear sections using markdown headers.`;

const CHAIRMAN_CODE_VERDICT_PROMPT = `You are the Senior Chief Architect and Security Auditor for a high-stakes software project.
You have requested code implementations from 4 different AI contractors (Models).
Your job is to review their work, spot subtle flaws, and issue a final binding verdict.

CRITICAL: Do not just summarize. You must JUDGE.

Your Audit Priorities (in order):
1. SECURITY & CORRECTNESS: Look for race conditions, SQL injection, memory leaks, or logical traps.
2. SAFETY: Are exceptions handled? Is user input sanitized?
3. PERFORMANCE: Is the complexity O(n) or worse?
4. READABILITY: Is the code clean?

INSTRUCTIONS:
- Analyze the user's original request to understand the "Trap" (e.g., if they asked for money transfer, the trap is a Race Condition).
- Ruthlessly compare the 4 solutions.
- If a model misses a critical safety step (like database locking in a transaction), you must EXPLICITLY CALL IT OUT as a failure.
- Pick ONE winner.

FORMAT YOUR RESPONSE AS MARKDOWN:
### 🏆 The Verdict: [Model Name]
**Reason:** [1 sentence explaining why it is the safest/best].

### 🚨 Critical Warnings
- [Bullet point if any model failed a security check, e.g., "Model A failed to use row-locking, creating a race condition risk."]

### 🔍 Comparative Analysis
- **Model A:** [Brief critique]
- **Model B:** [Brief critique]
- **Model C:** [Brief critique]
- **Model D:** [Brief critique]`;

const CHAIRMAN_DEBUG_VERDICT_PROMPT = `You are the Chairman - a senior debugging expert synthesizing advice from multiple AI models. Analyze their debugging recommendations and provide a unified verdict.

Your verdict should include:
1. **Best Approach**: Which model's advice is most actionable (name the model)
2. **Consensus Points**: Where all models agree
3. **Unique Insights**: Valuable points that only one model caught
4. **Recommended Action Plan**: A prioritized list combining the best advice

Be decisive and practical. Developers need a clear path forward.
Format with markdown headers.`;

function extractCodeFromResponse(text: string): string {
  const codeBlockMatch = text.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  const genericMatch = text.match(/```\n?([\s\S]*?)```/);
  if (genericMatch) {
    return genericMatch[1].trim();
  }
  return text.trim();
}

async function generateWithOpenAI(prompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "gpt-4o",
      provider: "OpenAI",
      code: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: CODE_GENERATION_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      max_tokens: 2048
    });
    const code = extractCodeFromResponse(response.choices[0]?.message?.content || "");
    return {
      model: "gpt-4o",
      provider: "OpenAI",
      code,
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "gpt-4o",
      provider: "OpenAI",
      code: "",
      error: error.message || "Failed to generate",
      latencyMs: Date.now() - start
    };
  }
}

async function generateWithGemini(prompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "gemini-3-flash",
      provider: "Gemini",
      code: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: CODE_GENERATION_SYSTEM_PROMPT
      },
      contents: prompt
    });
    const code = extractCodeFromResponse(response.text || "");
    return {
      model: "gemini-3-flash",
      provider: "Gemini",
      code,
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "gemini-3-flash",
      provider: "Gemini",
      code: "",
      error: error.message || "Failed to generate",
      latencyMs: Date.now() - start
    };
  }
}

async function generateWithClaude(prompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "claude-opus-4.5",
      provider: "Claude",
      code: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2048,
      system: CODE_GENERATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    });
    const textContent = response.content.find((c) => c.type === "text");
    const code = extractCodeFromResponse(textContent?.text || "");
    return {
      model: "claude-opus-4.5",
      provider: "Claude",
      code,
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "claude-opus-4.5",
      provider: "Claude",
      code: "",
      error: error.message || "Failed to generate",
      latencyMs: Date.now() - start
    };
  }
}

async function generateWithGrok(prompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "grok-4",
      provider: "Grok",
      code: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const client = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey
    });
    const response = await client.chat.completions.create({
      model: "grok-4",
      messages: [
        { role: "system", content: CODE_GENERATION_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      max_tokens: 2048
    });
    const code = extractCodeFromResponse(response.choices[0]?.message?.content || "");
    return {
      model: "grok-4",
      provider: "Grok",
      code,
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "grok-4",
      provider: "Grok",
      code: "",
      error: error.message || "Failed to generate",
      latencyMs: Date.now() - start
    };
  }
}

interface DebugResult {
  model: string;
  provider: string;
  analysis: string;
  error?: string;
  latencyMs: number;
}

async function debugWithOpenAI(prompt: string, apiKey?: string): Promise<DebugResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "gpt-4o",
      provider: "OpenAI",
      analysis: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: DEBUG_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      max_tokens: 2048
    });
    return {
      model: "gpt-4o",
      provider: "OpenAI",
      analysis: response.choices[0]?.message?.content || "",
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "gpt-4o",
      provider: "OpenAI",
      analysis: "",
      error: error.message || "Failed to analyze",
      latencyMs: Date.now() - start
    };
  }
}

async function debugWithGemini(prompt: string, apiKey?: string): Promise<DebugResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "gemini-3-flash",
      provider: "Gemini",
      analysis: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: DEBUG_ANALYSIS_SYSTEM_PROMPT
      },
      contents: prompt
    });
    return {
      model: "gemini-3-flash",
      provider: "Gemini",
      analysis: response.text || "",
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "gemini-3-flash",
      provider: "Gemini",
      analysis: "",
      error: error.message || "Failed to analyze",
      latencyMs: Date.now() - start
    };
  }
}

async function debugWithClaude(prompt: string, apiKey?: string): Promise<DebugResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "claude-opus-4.5",
      provider: "Claude",
      analysis: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2048,
      system: DEBUG_ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    });
    const textContent = response.content.find((c) => c.type === "text");
    return {
      model: "claude-opus-4.5",
      provider: "Claude",
      analysis: textContent?.text || "",
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "claude-opus-4.5",
      provider: "Claude",
      analysis: "",
      error: error.message || "Failed to analyze",
      latencyMs: Date.now() - start
    };
  }
}

async function debugWithGrok(prompt: string, apiKey?: string): Promise<DebugResult> {
  const start = Date.now();
  if (!apiKey) {
    return {
      model: "grok-4",
      provider: "Grok",
      analysis: "",
      error: "No API key configured",
      latencyMs: Date.now() - start
    };
  }
  try {
    const client = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey
    });
    const response = await client.chat.completions.create({
      model: "grok-4",
      messages: [
        { role: "system", content: DEBUG_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      max_tokens: 2048
    });
    return {
      model: "grok-4",
      provider: "Grok",
      analysis: response.choices[0]?.message?.content || "",
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    return {
      model: "grok-4",
      provider: "Grok",
      analysis: "",
      error: error.message || "Failed to analyze",
      latencyMs: Date.now() - start
    };
  }
}

type ChairmanModel = "openai" | "gemini" | "anthropic" | "xai";

interface VerdictRequest {
  mode: "code" | "debug";
  chairman: ChairmanModel;
  originalPrompt: string;
  results: Array<{ provider: string; content: string }>;
}

async function generateVerdict(
  request: VerdictRequest,
  keys: APIKeys
): Promise<{ verdict: string; error?: string; latencyMs: number }> {
  const start = Date.now();
  const systemPrompt = request.mode === "code" 
    ? CHAIRMAN_CODE_VERDICT_PROMPT 
    : CHAIRMAN_DEBUG_VERDICT_PROMPT;

  const resultsText = request.results
    .map(r => `## ${r.provider}'s Response:\n${r.content}`)
    .join("\n\n---\n\n");

  const userPrompt = `Original Request: ${request.originalPrompt}\n\n${resultsText}`;

  const modelKeyMap: Record<ChairmanModel, string | undefined> = {
    openai: keys.openai,
    gemini: keys.gemini,
    anthropic: keys.anthropic,
    xai: keys.xai
  };

  const apiKey = modelKeyMap[request.chairman];
  if (!apiKey) {
    return { verdict: "", error: "No API key configured for chairman model", latencyMs: Date.now() - start };
  }

  try {
    let verdict = "";

    switch (request.chairman) {
      case "openai": {
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 2048
        });
        verdict = response.choices[0]?.message?.content || "";
        break;
      }
      case "gemini": {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          config: { systemInstruction: systemPrompt },
          contents: userPrompt
        });
        verdict = response.text || "";
        break;
      }
      case "anthropic": {
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
          model: "claude-opus-4-5-20251101",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        });
        const textContent = response.content.find((c) => c.type === "text");
        verdict = textContent?.text || "";
        break;
      }
      case "xai": {
        const client = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey });
        const response = await client.chat.completions.create({
          model: "grok-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 2048
        });
        verdict = response.choices[0]?.message?.content || "";
        break;
      }
    }

    return { verdict, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { verdict: "", error: error.message || "Failed to generate verdict", latencyMs: Date.now() - start };
  }
}

export function registerArenaRoutes(app: Express) {
  app.post("/api/arena/verdict", async (req: Request, res: Response) => {
    try {
      const keys = extractAPIKeys(req);
      const { mode, chairman, originalPrompt, results } = req.body as VerdictRequest;

      if (!mode || !chairman || !originalPrompt || !results) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields"
        });
      }

      const validChairmen: ChairmanModel[] = ["openai", "gemini", "anthropic", "xai"];
      if (!validChairmen.includes(chairman)) {
        return res.status(400).json({
          success: false,
          error: "Invalid chairman model"
        });
      }

      const verdictResult = await generateVerdict({ mode, chairman, originalPrompt, results }, keys);

      res.json({
        success: !verdictResult.error,
        verdict: verdictResult.verdict,
        error: verdictResult.error,
        latencyMs: verdictResult.latencyMs,
        chairman
      });
    } catch (error: any) {
      console.error("Verdict API error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error"
      });
    }
  });


  app.post("/api/arena/debug", async (req: Request, res: Response) => {
    try {
      const keys = extractAPIKeys(req);
      const { problem, errorLogs, codeSnippet } = req.body;
      
      if (!problem || typeof problem !== "string") {
        return res.status(400).json({
          success: false,
          error: "Missing problem description"
        });
      }

      const fullPrompt = `## Problem Description
${problem}

${errorLogs ? `## Error Logs
\`\`\`
${errorLogs}
\`\`\`` : ""}

${codeSnippet ? `## Relevant Code
\`\`\`javascript
${codeSnippet}
\`\`\`` : ""}

Please analyze this issue and provide debugging advice.`;

      const results = await Promise.all([
        debugWithOpenAI(fullPrompt, keys.openai),
        debugWithGemini(fullPrompt, keys.gemini),
        debugWithClaude(fullPrompt, keys.anthropic),
        debugWithGrok(fullPrompt, keys.xai)
      ]);

      res.json({
        success: true,
        results
      });
    } catch (error: any) {
      console.error("Debug Arena API error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error"
      });
    }
  });

  app.post("/api/arena/generate", async (req: Request, res: Response) => {
    try {
      const keys = extractAPIKeys(req);
      const { prompt } = req.body as ArenaRequest;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          success: false,
          error: "Missing or invalid prompt"
        });
      }

      const results = await Promise.all([
        generateWithOpenAI(prompt, keys.openai),
        generateWithGemini(prompt, keys.gemini),
        generateWithClaude(prompt, keys.anthropic),
        generateWithGrok(prompt, keys.xai)
      ]);

      const validResults = results.filter(r => r.code && !r.error);
      
      const parsedCodes: Map<string, ParseResult> = new Map();
      const flowcharts: Record<string, ParseResult> = {};
      
      for (const result of validResults) {
        try {
          const parsed = parseCodeToFlowchart(result.code);
          parsedCodes.set(result.provider, parsed);
          flowcharts[result.provider] = parsed;
        } catch {}
      }
      
      let comparison;
      if (validResults.length >= 2) {
        const similarityMatrix: Array<{ model1: string; model2: string; similarity: number }> = [];
        const complexityScores: Array<{ model: string; complexity: number; nodeCount: number }> = [];
        
        for (const result of validResults) {
          const parsed = parsedCodes.get(result.provider);
          if (parsed) {
            complexityScores.push({
              model: result.provider,
              complexity: parsed.summary.complexityScore,
              nodeCount: parsed.summary.nodeCount
            });
          } else {
            complexityScores.push({
              model: result.provider,
              complexity: 0,
              nodeCount: 0
            });
          }
        }

        for (let i = 0; i < validResults.length; i++) {
          for (let j = i + 1; j < validResults.length; j++) {
            try {
              const parsedA = parsedCodes.get(validResults[i].provider);
              const parsedB = parsedCodes.get(validResults[j].provider);
              const sim = parsedA && parsedB 
                ? calculateSimilarityFromParsed(parsedA, parsedB)
                : 0;
              similarityMatrix.push({
                model1: validResults[i].provider,
                model2: validResults[j].provider,
                similarity: sim
              });
            } catch {
              similarityMatrix.push({
                model1: validResults[i].provider,
                model2: validResults[j].provider,
                similarity: 0
              });
            }
          }
        }

        comparison = { similarityMatrix, complexityScores };
      }

      res.json({
        success: true,
        results,
        flowcharts,
        comparison
      });
    } catch (error: any) {
      console.error("Arena API error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error"
      });
    }
  });

  app.post("/api/arena/sessions", requireHistoryFeature, async (req: Request, res: Response) => {
    try {
      const parseResult = insertArenaSessionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid session data"
        });
      }

      const session = await storage.createArenaSession(parseResult.data);
      res.json({ success: true, session });
    } catch (error: any) {
      console.error("Save session error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to save session"
      });
    }
  });

  app.get("/api/arena/sessions", requireHistoryFeature, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const sessions = await storage.getArenaSessions(limit);
      res.json({ success: true, sessions });
    } catch (error: any) {
      console.error("Get sessions error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch sessions"
      });
    }
  });

  app.get("/api/arena/sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.getArenaSession(req.params.id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found"
        });
      }
      res.json({ success: true, session });
    } catch (error: any) {
      console.error("Get session error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch session"
      });
    }
  });

  app.delete("/api/arena/sessions/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteArenaSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Session not found"
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete session error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete session"
      });
    }
  });
}
