import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export interface APIKeys {
  openai?: string;
  gemini?: string;
  anthropic?: string;
  xai?: string;
}

export interface ModelResult {
  model: string;
  provider: string;
  content: string;
  error?: string;
  latencyMs: number;
}

export type ChairmanModel = "openai" | "gemini" | "anthropic" | "xai";

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

async function generateWithOpenAI(prompt: string, systemPrompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return { model: "gpt-4o", provider: "OpenAI", content: "", error: "No API key configured", latencyMs: Date.now() - start };
  }
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 2048
    });
    const content = response.choices[0]?.message?.content || "";
    return { model: "gpt-4o", provider: "OpenAI", content: systemPrompt === CODE_GENERATION_SYSTEM_PROMPT ? extractCodeFromResponse(content) : content, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { model: "gpt-4o", provider: "OpenAI", content: "", error: error.message || "Failed to generate", latencyMs: Date.now() - start };
  }
}

async function generateWithGemini(prompt: string, systemPrompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return { model: "gemini-3-flash", provider: "Gemini", content: "", error: "No API key configured", latencyMs: Date.now() - start };
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: systemPrompt },
      contents: prompt
    });
    const content = response.text || "";
    return { model: "gemini-3-flash", provider: "Gemini", content: systemPrompt === CODE_GENERATION_SYSTEM_PROMPT ? extractCodeFromResponse(content) : content, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { model: "gemini-3-flash", provider: "Gemini", content: "", error: error.message || "Failed to generate", latencyMs: Date.now() - start };
  }
}

async function generateWithClaude(prompt: string, systemPrompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return { model: "claude-opus-4.5", provider: "Claude", content: "", error: "No API key configured", latencyMs: Date.now() - start };
  }
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }]
    });
    const textContent = response.content.find((c) => c.type === "text");
    const content = textContent?.text || "";
    return { model: "claude-opus-4.5", provider: "Claude", content: systemPrompt === CODE_GENERATION_SYSTEM_PROMPT ? extractCodeFromResponse(content) : content, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { model: "claude-opus-4.5", provider: "Claude", content: "", error: error.message || "Failed to generate", latencyMs: Date.now() - start };
  }
}

async function generateWithGrok(prompt: string, systemPrompt: string, apiKey?: string): Promise<ModelResult> {
  const start = Date.now();
  if (!apiKey) {
    return { model: "grok-4", provider: "Grok", content: "", error: "No API key configured", latencyMs: Date.now() - start };
  }
  try {
    const client = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey });
    const response = await client.chat.completions.create({
      model: "grok-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 2048
    });
    const content = response.choices[0]?.message?.content || "";
    return { model: "grok-4", provider: "Grok", content: systemPrompt === CODE_GENERATION_SYSTEM_PROMPT ? extractCodeFromResponse(content) : content, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { model: "grok-4", provider: "Grok", content: "", error: error.message || "Failed to generate", latencyMs: Date.now() - start };
  }
}

export async function askCouncil(
  prompt: string,
  mode: "code" | "debug",
  keys: APIKeys,
  chairman: ChairmanModel = "openai"
): Promise<{
  results: ModelResult[];
  verdict: { content: string; error?: string; latencyMs: number };
}> {
  const systemPrompt = mode === "code" ? CODE_GENERATION_SYSTEM_PROMPT : DEBUG_ANALYSIS_SYSTEM_PROMPT;

  const results = await Promise.all([
    generateWithOpenAI(prompt, systemPrompt, keys.openai),
    generateWithGemini(prompt, systemPrompt, keys.gemini),
    generateWithClaude(prompt, systemPrompt, keys.anthropic),
    generateWithGrok(prompt, systemPrompt, keys.xai)
  ]);

  const validResults = results.filter(r => r.content && !r.error);

  const verdictSystemPrompt = mode === "code" ? CHAIRMAN_CODE_VERDICT_PROMPT : CHAIRMAN_DEBUG_VERDICT_PROMPT;
  const resultsText = validResults
    .map(r => `## ${r.provider}'s Response:\n${r.content}`)
    .join("\n\n---\n\n");
  const verdictPrompt = `Original Request: ${prompt}\n\n${resultsText}`;

  const modelKeyMap: Record<ChairmanModel, string | undefined> = {
    openai: keys.openai,
    gemini: keys.gemini,
    anthropic: keys.anthropic,
    xai: keys.xai
  };

  const apiKey = modelKeyMap[chairman];
  let verdict: { content: string; error?: string; latencyMs: number };

  if (!apiKey) {
    verdict = { content: "", error: "No API key configured for chairman model", latencyMs: 0 };
  } else {
    const start = Date.now();
    try {
      let verdictContent = "";

      switch (chairman) {
        case "openai": {
          const client = new OpenAI({ apiKey });
          const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: verdictSystemPrompt },
              { role: "user", content: verdictPrompt }
            ],
            max_tokens: 2048
          });
          verdictContent = response.choices[0]?.message?.content || "";
          break;
        }
        case "gemini": {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            config: { systemInstruction: verdictSystemPrompt },
            contents: verdictPrompt
          });
          verdictContent = response.text || "";
          break;
        }
        case "anthropic": {
          const client = new Anthropic({ apiKey });
          const response = await client.messages.create({
            model: "claude-opus-4-5-20251101",
            max_tokens: 2048,
            system: verdictSystemPrompt,
            messages: [{ role: "user", content: verdictPrompt }]
          });
          const textContent = response.content.find((c) => c.type === "text");
          verdictContent = textContent?.text || "";
          break;
        }
        case "xai": {
          const client = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey });
          const response = await client.chat.completions.create({
            model: "grok-4",
            messages: [
              { role: "system", content: verdictSystemPrompt },
              { role: "user", content: verdictPrompt }
            ],
            max_tokens: 2048
          });
          verdictContent = response.choices[0]?.message?.content || "";
          break;
        }
      }

      verdict = { content: verdictContent, latencyMs: Date.now() - start };
    } catch (error: any) {
      verdict = { content: "", error: error.message || "Failed to generate verdict", latencyMs: Date.now() - start };
    }
  }

  return { results, verdict };
}
