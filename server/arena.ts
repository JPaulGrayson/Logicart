import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { parseCodeToFlowchart, calculateSimilarityFromParsed, type ParseResult } from "./ai";

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
  return {
    openai: (req.headers["x-openai-key"] as string) || process.env.OPENAI_API_KEY,
    gemini: (req.headers["x-gemini-key"] as string) || process.env.GEMINI_API_KEY,
    anthropic: (req.headers["x-anthropic-key"] as string) || process.env.ANTHROPIC_API_KEY,
    xai: (req.headers["x-xai-key"] as string) || process.env.XAI_API_KEY,
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

export function registerArenaRoutes(app: Express) {
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
}
