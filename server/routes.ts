import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import OpenAI from "openai";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Checkpoint {
  id: string;
  label?: string;
  variables: Record<string, any>;
  line?: number;
  timestamp: number;
}

interface RemoteSession {
  id: string;
  name?: string;
  code?: string;
  checkpoints: Checkpoint[];
  sseClients: Response[];
  createdAt: Date;
  lastActivity: Date;
}

const remoteSessions = new Map<string, RemoteSession>();

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const MAX_SESSIONS = 100;
const MAX_QUEUE_DEPTH = 1000;

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of remoteSessions) {
    if (now - session.lastActivity.getTime() > SESSION_TIMEOUT_MS) {
      session.sseClients.forEach(client => client.end());
      remoteSessions.delete(id);
    }
  }
}

setInterval(cleanupExpiredSessions, 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve LogiGo demo files (must be before Vite middleware)
  app.use("/demo", express.static(path.join(__dirname, "..", "example")));
  app.use("/demo-src", express.static(path.join(__dirname, "..", "src")));
  
  // Serve the test page explicitly
  app.get("/test-antigravity.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "example", "test-antigravity.html"));
  });
  
  // Serve the extension files
  app.get("/extension.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "extension", "extension.html"));
  });

  app.get("/extension.json", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "extension", "extension.json"));
  });

  app.use("/extension-assets", (req, res, next) => {
    const assetPath = path.join(__dirname, "..", "dist", "extension", "assets", req.path);
    res.sendFile(assetPath);
  });

  // AI Code Rewriting Endpoint
  app.post("/api/rewrite-code", async (req, res) => {
    try {
      const { code, instructions, context } = req.body;
      
      if (!code || !instructions) {
        return res.status(400).json({ 
          message: "Missing required fields: code and instructions" 
        });
      }

      const openai = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      });

      const systemPrompt = `You are an expert JavaScript code assistant. Your task is to rewrite code based on user instructions.

Rules:
1. Only output the rewritten code, no explanations or markdown formatting
2. Preserve the overall structure and intent of the original code
3. Apply the requested changes precisely
4. Keep the code clean and well-formatted
5. If the instruction is unclear, make reasonable assumptions that improve the code`;

      const userPrompt = `${context ? context + "\n\n" : ""}Original code:
\`\`\`javascript
${code}
\`\`\`

Instructions: ${instructions}

Rewrite the code according to the instructions. Output only the new code, no explanations:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const rewrittenCode = response.choices[0]?.message?.content?.trim() || code;
      
      // Clean up any markdown code blocks if the model included them
      const cleanedCode = rewrittenCode
        .replace(/^```(?:javascript|js)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      res.json({ rewrittenCode: cleanedCode });
    } catch (error) {
      console.error("Code rewrite error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to rewrite code" 
      });
    }
  });

  // ============================================
  // Remote Mode API - Cross-Replit Communication
  // ============================================

  // CORS middleware for remote API endpoints
  app.use("/api/remote", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Create a new remote session
  app.post("/api/remote/session", (req, res) => {
    try {
      if (remoteSessions.size >= MAX_SESSIONS) {
        return res.status(503).json({ error: "Maximum sessions reached. Try again later." });
      }

      const { code, name } = req.body;
      const sessionId = crypto.randomUUID();
      
      const session: RemoteSession = {
        id: sessionId,
        name: name || "Remote Session",
        code: code || undefined,
        checkpoints: [],
        sseClients: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };

      remoteSessions.set(sessionId, session);

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'localhost:5000';
      const connectUrl = `${protocol}://${host}/remote/${sessionId}`;

      res.json({ 
        sessionId, 
        connectUrl,
        message: "Session created. Open connectUrl in LogiGo to view checkpoints."
      });
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Send a checkpoint to a session
  app.post("/api/remote/checkpoint", (req, res) => {
    try {
      const { sessionId, checkpoint } = req.body;

      if (!sessionId || !checkpoint) {
        return res.status(400).json({ error: "Missing sessionId or checkpoint" });
      }

      const session = remoteSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const checkpointData: Checkpoint = {
        id: checkpoint.id || `checkpoint-${session.checkpoints.length}`,
        label: checkpoint.label,
        variables: checkpoint.variables || {},
        line: checkpoint.line,
        timestamp: Date.now()
      };

      // Apply queue depth limit (drop oldest if exceeded)
      if (session.checkpoints.length >= MAX_QUEUE_DEPTH) {
        session.checkpoints.shift();
      }
      session.checkpoints.push(checkpointData);
      session.lastActivity = new Date();

      // Broadcast to all SSE clients
      const eventData = JSON.stringify(checkpointData);
      session.sseClients.forEach(client => {
        client.write(`event: checkpoint\ndata: ${eventData}\n\n`);
      });

      res.json({ success: true, checkpointCount: session.checkpoints.length });
    } catch (error) {
      console.error("Checkpoint error:", error);
      res.status(500).json({ error: "Failed to process checkpoint" });
    }
  });

  // End a session
  app.post("/api/remote/session/end", (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
      }

      const session = remoteSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Notify all clients session ended
      session.sseClients.forEach(client => {
        client.write(`event: session_end\ndata: {}\n\n`);
        client.end();
      });

      remoteSessions.delete(sessionId);

      res.json({ ended: true });
    } catch (error) {
      console.error("Session end error:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // SSE stream for real-time checkpoint updates
  app.get("/api/remote/stream/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = remoteSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    // Send initial session info
    res.write(`event: session_info\ndata: ${JSON.stringify({
      id: session.id,
      name: session.name,
      code: session.code,
      checkpointCount: session.checkpoints.length
    })}\n\n`);

    // Send existing checkpoints
    session.checkpoints.forEach(cp => {
      res.write(`event: checkpoint\ndata: ${JSON.stringify(cp)}\n\n`);
    });

    // Add client to session
    session.sseClients.push(res);

    // Remove client on disconnect
    req.on("close", () => {
      const index = session.sseClients.indexOf(res);
      if (index > -1) {
        session.sseClients.splice(index, 1);
      }
    });
  });

  // Register code for a session (for flowchart visualization)
  app.post("/api/remote/code", (req, res) => {
    try {
      const { sessionId, code } = req.body;

      if (!sessionId || !code) {
        return res.status(400).json({ error: "Missing sessionId or code" });
      }

      const session = remoteSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      session.code = code;
      session.lastActivity = new Date();

      // Notify SSE clients about the code update
      session.sseClients.forEach(client => {
        client.write(`event: code_update\ndata: ${JSON.stringify({ code })}\n\n`);
      });

      res.json({ success: true, message: "Code registered for flowchart visualization" });
    } catch (error) {
      console.error("Code registration error:", error);
      res.status(500).json({ error: "Failed to register code" });
    }
  });

  // Get session info (for debugging/testing)
  app.get("/api/remote/session/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = remoteSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      id: session.id,
      name: session.name,
      code: session.code,
      checkpointCount: session.checkpoints.length,
      viewerCount: session.sseClients.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    });
  });

  // ============================================
  // One-Line Bootstrap Script
  // ============================================
  
  // Serve the bootstrap script - auto-creates session and sets up checkpoint()
  app.get("/remote.js", (req, res) => {
    try {
      // Get the project name from query param or use default
      const projectName = req.query.project || req.query.name || "Remote App";
      // Get source code if provided (base64 encoded for URL safety)
      const encodedCode = req.query.code as string | undefined;
      const sourceCode = encodedCode ? Buffer.from(encodedCode, 'base64').toString('utf-8') : undefined;
      // Auto-open option (default: true for zero-click experience)
      const autoOpen = req.query.autoOpen !== 'false';
      
      // Create a new session
      if (remoteSessions.size >= MAX_SESSIONS) {
        res.status(503).type("application/javascript").send(
          `console.error("LogiGo: Maximum sessions reached. Try again later.");`
        );
        return;
      }

      const sessionId = crypto.randomUUID();
      const session: RemoteSession = {
        id: sessionId,
        name: String(projectName),
        code: sourceCode,
        checkpoints: [],
        sseClients: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      remoteSessions.set(sessionId, session);

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      const viewUrl = `${baseUrl}/remote/${sessionId}`;

      // Return the bootstrap script with session info baked in
      const script = `
// LogiGo Remote Mode - Auto-configured (Zero-Click Experience)
(function() {
  var LOGIGO_URL = "${baseUrl}";
  var SESSION_ID = "${sessionId}";
  var PROJECT_NAME = "${String(projectName).replace(/"/g, '\\"')}";
  var AUTO_OPEN = ${autoOpen};
  var hasOpenedLogigo = false;
  var checkpointCount = 0;
  
  console.log("🔗 LogiGo Remote Mode connected!");
  console.log("📊 View flowchart at: ${viewUrl}");
  ${sourceCode ? 'console.log("📝 Source code loaded for visualization");' : ''}
  
  // Auto-open LogiGo on first checkpoint
  function openLogigoIfNeeded() {
    if (AUTO_OPEN && !hasOpenedLogigo && checkpointCount === 1) {
      hasOpenedLogigo = true;
      window.open("${viewUrl}", "_blank", "noopener,noreferrer");
      console.log("🚀 LogiGo opened automatically!");
    }
  }
  
  // Create the checkpoint function
  window.checkpoint = function(id, variables, options) {
    variables = variables || {};
    options = options || {};
    checkpointCount++;
    
    // Auto-open LogiGo synchronously on first checkpoint (before async fetch)
    // This happens within the user gesture context to avoid popup blockers
    openLogigoIfNeeded();
    
    var data = {
      sessionId: SESSION_ID,
      checkpoint: {
        id: id,
        variables: variables,
        line: options.line,
        timestamp: Date.now()
      }
    };
    
    // Use fetch for cross-origin reliability
    var payload = JSON.stringify(data);
    fetch(LOGIGO_URL + "/api/remote/checkpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      mode: "cors"
    }).then(function(r) {
      if (!r.ok) console.warn("[LogiGo] Checkpoint failed:", r.status);
    }).catch(function(e) {
      console.warn("[LogiGo] Checkpoint error:", e.message);
    });
  };
  
  // Register code for flowchart visualization
  window.LogiGo = window.LogiGo || {};
  window.LogiGo.checkpoint = window.checkpoint;
  window.LogiGo.sessionId = SESSION_ID;
  window.LogiGo.viewUrl = "${viewUrl}";
  window.LogiGo.openNow = function() {
    if (!hasOpenedLogigo) {
      hasOpenedLogigo = true;
      window.open("${viewUrl}", "_blank", "noopener,noreferrer");
    }
  };
  
  window.LogiGo.registerCode = function(code) {
    fetch(LOGIGO_URL + "/api/remote/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID, code: code }),
      mode: "cors"
    }).then(function(r) {
      if (r.ok) {
        console.log("[LogiGo] Code registered for flowchart visualization");
      } else {
        console.warn("[LogiGo] Code registration failed:", r.status);
      }
    }).catch(function(e) {
      console.warn("[LogiGo] Code registration error:", e.message);
    });
  };
  
  // Show a persistent clickable badge (stays until closed)
  if (typeof document !== "undefined") {
    function showBadge() {
      if (document.getElementById("logigo-badge")) return;
      var badge = document.createElement("div");
      badge.id = "logigo-badge";
      badge.innerHTML = '<a href="${viewUrl}" target="_blank" style="color:#60a5fa;text-decoration:none;display:flex;align-items:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span style="border-bottom:1px solid #60a5fa;">View in LogiGo</span></a><button style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:0 0 0 10px;font-size:16px;line-height:1;" title="Close">&times;</button>';
      badge.style.cssText = "position:fixed;bottom:16px;right:16px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:12px 16px;border-radius:10px;font-size:14px;font-family:system-ui,-apple-system,sans-serif;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.5);border:1px solid #334155;display:flex;align-items:center;";
      badge.querySelector("button").onclick = function() { badge.remove(); };
      document.body.appendChild(badge);
    }
    if (document.body) {
      showBadge();
    } else {
      document.addEventListener("DOMContentLoaded", showBadge);
    }
  }
})();
`;

      res.type("application/javascript").send(script);
    } catch (error) {
      console.error("Bootstrap script error:", error);
      res.status(500).type("application/javascript").send(
        `console.error("LogiGo: Failed to initialize remote mode");`
      );
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
