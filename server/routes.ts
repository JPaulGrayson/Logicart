import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import OpenAI from "openai";
import crypto from "crypto";
import type { GroundingContext, GroundingNode, GroundingNodeType } from "@shared/grounding-types";
import type { ControlMessage, StudioToRemoteMessage, RemoteToStudioMessage } from "@shared/control-types";
import * as acorn from "acorn";
import { WebSocketServer, WebSocket } from "ws";

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
  studioWsClients: Set<WebSocket>;
  remoteWsClients: Set<WebSocket>;
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

// Helper: Parse JavaScript code to GroundingContext (server-side)
function parseCodeToGrounding(code: string): GroundingContext {
  interface SimpleNode {
    id: string;
    type: GroundingNodeType;
    label: string;
    snippet: string;
    line: number;
  }
  
  interface SimpleEdge {
    source: string;
    target: string;
    condition?: string;
  }
  
  const nodes: SimpleNode[] = [];
  const edges: SimpleEdge[] = [];
  let nodeCounter = 0;
  let complexityScore = 0;
  
  const createNodeId = () => `n${nodeCounter++}`;
  
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true
    });
    
    function processNode(node: any, parentId: string | null): string | null {
      if (!node) return null;
      
      switch (node.type) {
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression': {
          const id = createNodeId();
          const name = node.id?.name || 'anonymous';
          nodes.push({
            id,
            type: 'FUNCTION',
            label: `function ${name}`,
            snippet: code.slice(node.start, Math.min(node.start + 50, node.end)),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          
          if (node.body) {
            const bodyStatements = node.body.type === 'BlockStatement' ? node.body.body : [node.body];
            let lastId = id;
            for (const stmt of bodyStatements) {
              const stmtId = processNode(stmt, lastId);
              if (stmtId) lastId = stmtId;
            }
          }
          return id;
        }
        
        case 'IfStatement': {
          complexityScore++;
          const id = createNodeId();
          const testCode = code.slice(node.test.start, node.test.end);
          nodes.push({
            id,
            type: 'DECISION',
            label: `if (${testCode.slice(0, 30)})`,
            snippet: testCode.slice(0, 50),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          
          // Process consequent (true branch) with decision as parent
          // Then update the edge to add condition
          const edgeCountBefore = edges.length;
          const consequentId = processNode(node.consequent, id);
          // Add condition to the edge that was just created
          if (edges.length > edgeCountBefore) {
            const lastEdge = edges[edges.length - 1];
            if (lastEdge.source === id) {
              lastEdge.condition = 'true';
            }
          }
          
          // Process alternate (false branch)
          if (node.alternate) {
            const edgeCountBeforeAlt = edges.length;
            const alternateId = processNode(node.alternate, id);
            // Add condition to the edge that was just created
            if (edges.length > edgeCountBeforeAlt) {
              const lastEdge = edges[edges.length - 1];
              if (lastEdge.source === id) {
                lastEdge.condition = 'false';
              }
            }
          }
          return id;
        }
        
        case 'ForStatement':
        case 'WhileStatement':
        case 'ForOfStatement':
        case 'ForInStatement': {
          complexityScore++;
          const id = createNodeId();
          const loopType = node.type.replace('Statement', '').toLowerCase();
          nodes.push({
            id,
            type: 'LOOP',
            label: loopType,
            snippet: code.slice(node.start, Math.min(node.start + 50, node.end)),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          
          if (node.body) processNode(node.body, id);
          return id;
        }
        
        case 'SwitchStatement': {
          complexityScore++;
          const id = createNodeId();
          const discrim = code.slice(node.discriminant.start, node.discriminant.end);
          nodes.push({
            id,
            type: 'DECISION',
            label: `switch (${discrim.slice(0, 20)})`,
            snippet: discrim.slice(0, 50),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          return id;
        }
        
        case 'ReturnStatement': {
          const id = createNodeId();
          const retValue = node.argument ? code.slice(node.argument.start, node.argument.end) : 'void';
          nodes.push({
            id,
            type: 'ACTION',
            label: `return ${retValue.slice(0, 20)}`,
            snippet: retValue.slice(0, 50),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          return id;
        }
        
        case 'ExpressionStatement': {
          const id = createNodeId();
          const exprCode = code.slice(node.expression.start, node.expression.end);
          nodes.push({
            id,
            type: 'ACTION',
            label: exprCode.slice(0, 40),
            snippet: exprCode.slice(0, 50),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          return id;
        }
        
        case 'VariableDeclaration': {
          const id = createNodeId();
          const declCode = code.slice(node.start, node.end);
          nodes.push({
            id,
            type: 'ACTION',
            label: declCode.slice(0, 40),
            snippet: declCode.slice(0, 50),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          return id;
        }
        
        case 'BlockStatement': {
          let lastId = parentId;
          for (const stmt of node.body) {
            const stmtId = processNode(stmt, lastId);
            if (stmtId) lastId = stmtId;
          }
          return lastId;
        }
        
        default:
          return parentId;
      }
    }
    
    // Process all top-level statements
    const body = (ast as any).body;
    let lastId: string | null = null;
    for (const node of body) {
      const nodeId = processNode(node, lastId);
      if (nodeId) lastId = nodeId;
    }
    
  } catch (error) {
    console.error("Acorn parse error:", error);
  }
  
  // Build parent/children maps
  const parentMap = new Map<string, string[]>();
  const childrenMap = new Map<string, Array<{ targetId: string; condition?: string }>>();
  
  edges.forEach(edge => {
    if (!parentMap.has(edge.target)) parentMap.set(edge.target, []);
    parentMap.get(edge.target)!.push(edge.source);
    
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
    childrenMap.get(edge.source)!.push({ targetId: edge.target, condition: edge.condition });
  });
  
  const groundingNodes: GroundingNode[] = nodes.map(n => ({
    id: n.id,
    type: n.type,
    label: n.label,
    snippet: n.snippet,
    parents: parentMap.get(n.id) || [],
    children: childrenMap.get(n.id) || []
  }));
  
  return {
    summary: {
      entryPoint: nodes[0]?.id || 'unknown',
      nodeCount: nodes.length,
      complexityScore
    },
    flow: groundingNodes
  };
}

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
  // Grounding Layer API - AI Context Export
  // ============================================

  app.post("/api/export/grounding", (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Missing or invalid 'code' field" });
      }

      // Parse the code to extract flowchart structure
      const grounding = parseCodeToGrounding(code);
      
      res.json(grounding);
    } catch (error) {
      console.error("Grounding export error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate grounding context" 
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
        studioWsClients: new Set(),
        remoteWsClients: new Set(),
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
        studioWsClients: new Set(),
        remoteWsClients: new Set(),
        createdAt: new Date(),
        lastActivity: new Date()
      };
      remoteSessions.set(sessionId, session);

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      const viewUrl = `${baseUrl}/remote/${sessionId}`;
      const studioUrl = `${baseUrl}/?session=${sessionId}`;

      // Return the bootstrap script with session info baked in
      const script = `
// LogiGo Studio - Auto-configured (Zero-Click Experience)
(function() {
  var LOGIGO_URL = "${baseUrl}";
  var SESSION_ID = "${sessionId}";
  var PROJECT_NAME = "${String(projectName).replace(/"/g, '\\"')}";
  var AUTO_OPEN = ${autoOpen};
  var hasOpenedLogigo = false;
  var checkpointCount = 0;
  
  // Self-healing configuration
  var MAX_RETRIES = 3;
  var BASE_DELAY = 1000;
  var sessionExpired = false;
  var registeredCode = null;
  var connectionStatus = 'connected';
  
  console.log("🔗 LogiGo Studio connected!");
  console.log("📊 View flowchart at: ${studioUrl}");
  ${sourceCode ? 'console.log("📝 Source code loaded for visualization");' : ''}
  
  // Helper: sleep for exponential backoff
  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }
  
  // Helper: update connection status and badge
  function updateStatus(status) {
    connectionStatus = status;
    var badge = document.getElementById("logigo-badge");
    if (!badge) return;
    var statusDot = badge.querySelector(".logigo-status-dot");
    if (!statusDot) return;
    if (status === 'connected') {
      statusDot.style.background = '#22c55e';
      statusDot.title = 'Connected';
    } else if (status === 'reconnecting') {
      statusDot.style.background = '#f59e0b';
      statusDot.title = 'Reconnecting...';
    } else if (status === 'error') {
      statusDot.style.background = '#ef4444';
      statusDot.title = 'Connection error';
    }
  }
  
  // Helper: retry with exponential backoff
  async function fetchWithRetry(url, options, retries) {
    retries = retries === undefined ? MAX_RETRIES : retries;
    var lastError;
    for (var attempt = 0; attempt <= retries; attempt++) {
      try {
        var response = await fetch(url, options);
        if (response.ok) {
          updateStatus('connected');
          return response;
        }
        if (response.status === 404) {
          console.warn("[LogiGo] Session expired (404). Attempting renewal...");
          var renewed = await renewSession();
          if (renewed) {
            // Update the request body with the new session ID
            var parsed = JSON.parse(options.body);
            parsed.sessionId = SESSION_ID;
            options.body = JSON.stringify(parsed);
            attempt = -1; // Reset attempts after successful renewal
            continue;
          }
        }
        lastError = new Error("HTTP " + response.status);
      } catch (e) {
        lastError = e;
      }
      if (attempt < retries) {
        var delay = BASE_DELAY * Math.pow(2, attempt);
        updateStatus('reconnecting');
        console.log("[LogiGo] Retry " + (attempt + 1) + "/" + retries + " in " + delay + "ms...");
        await sleep(delay);
      }
    }
    updateStatus('error');
    throw lastError;
  }
  
  // Session renewal: create new session and migrate
  async function renewSession() {
    try {
      console.log("[LogiGo] Creating new session...");
      var response = await fetch(LOGIGO_URL + "/api/remote/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: PROJECT_NAME, code: registeredCode }),
        mode: "cors"
      });
      if (!response.ok) {
        console.error("[LogiGo] Session renewal failed:", response.status);
        return false;
      }
      var data = await response.json();
      var oldSessionId = SESSION_ID;
      SESSION_ID = data.sessionId;
      window.LogiGo.sessionId = SESSION_ID;
      window.LogiGo.viewUrl = data.studioUrl || (LOGIGO_URL + "/?session=" + SESSION_ID);
      window.LogiGo.studioUrl = data.studioUrl || (LOGIGO_URL + "/?session=" + SESSION_ID);
      console.log("✅ [LogiGo] Session renewed: " + oldSessionId.slice(0,8) + " → " + SESSION_ID.slice(0,8));
      console.log("📊 New Studio URL: " + window.LogiGo.studioUrl);
      updateStatus('connected');
      sessionExpired = false;
      return true;
    } catch (e) {
      console.error("[LogiGo] Session renewal error:", e.message);
      return false;
    }
  }
  
  // Auto-open LogiGo Studio on first checkpoint
  function openLogigoIfNeeded() {
    if (AUTO_OPEN && !hasOpenedLogigo && checkpointCount === 1) {
      hasOpenedLogigo = true;
      window.open(window.LogiGo.studioUrl, "_blank", "noopener,noreferrer");
      console.log("🚀 LogiGo Studio opened automatically!");
    }
  }
  
  // Create the checkpoint function with retry logic
  window.checkpoint = function(id, variables, options) {
    variables = variables || {};
    options = options || {};
    checkpointCount++;
    
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
    
    var payload = JSON.stringify(data);
    fetchWithRetry(LOGIGO_URL + "/api/remote/checkpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      mode: "cors"
    }).catch(function(e) {
      console.warn("[LogiGo] Checkpoint failed after retries:", e.message);
    });
  };
  
  // Register code for flowchart visualization
  window.LogiGo = window.LogiGo || {};
  window.LogiGo.checkpoint = window.checkpoint;
  window.LogiGo.sessionId = SESSION_ID;
  window.LogiGo.viewUrl = "${studioUrl}";
  window.LogiGo.studioUrl = "${studioUrl}";
  window.LogiGo.remoteUrl = "${viewUrl}";
  window.LogiGo.connectionStatus = function() { return connectionStatus; };
  window.LogiGo.renewSession = renewSession;
  window.LogiGo.openNow = function() {
    if (!hasOpenedLogigo) {
      hasOpenedLogigo = true;
      window.open(window.LogiGo.studioUrl, "_blank", "noopener,noreferrer");
    }
  };
  window.LogiGo.openStudio = function() {
    window.open(window.LogiGo.studioUrl, "_blank", "noopener,noreferrer");
  };
  window.LogiGo.openRemote = function() {
    window.open(window.LogiGo.remoteUrl, "_blank", "noopener,noreferrer");
  };
  
  window.LogiGo.registerCode = function(code) {
    registeredCode = code;
    fetchWithRetry(LOGIGO_URL + "/api/remote/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID, code: code }),
      mode: "cors"
    }).then(function(r) {
      console.log("[LogiGo] Code registered for flowchart visualization");
    }).catch(function(e) {
      console.warn("[LogiGo] Code registration failed after retries:", e.message);
    });
  };
  
  // ============================================
  // Visual Handshake - WebSocket Control Channel
  // ============================================
  
  var controlWs = null;
  var wsReconnectAttempts = 0;
  var wsMaxRetries = 5;
  var checkpointElements = {};
  
  function getWsUrl() {
    var wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    var wsHost = LOGIGO_URL.replace(/^https?:/, wsProtocol);
    return wsHost + "/api/remote/control/" + SESSION_ID + "?type=remote";
  }
  
  function connectControlChannel() {
    if (controlWs && controlWs.readyState === WebSocket.OPEN) return;
    
    try {
      controlWs = new WebSocket(getWsUrl());
      
      controlWs.onopen = function() {
        console.log("[LogiGo] Control channel connected");
        wsReconnectAttempts = 0;
      };
      
      controlWs.onmessage = function(event) {
        try {
          var msg = JSON.parse(event.data);
          if (msg.type === "HIGHLIGHT_ELEMENT") {
            highlightCheckpoint(msg.checkpointId, msg.nodeId);
          }
        } catch (e) {
          console.warn("[LogiGo] Invalid control message:", e.message);
        }
      };
      
      controlWs.onclose = function() {
        console.log("[LogiGo] Control channel disconnected");
        if (wsReconnectAttempts < wsMaxRetries) {
          wsReconnectAttempts++;
          var delay = BASE_DELAY * Math.pow(2, wsReconnectAttempts - 1);
          console.log("[LogiGo] Reconnecting control channel in " + delay + "ms...");
          setTimeout(connectControlChannel, delay);
        }
      };
      
      controlWs.onerror = function(e) {
        console.warn("[LogiGo] Control channel error");
      };
    } catch (e) {
      console.warn("[LogiGo] Failed to create WebSocket:", e.message);
    }
  }
  
  // Highlight Overlay Manager
  function createHighlightOverlay() {
    var overlay = document.getElementById("logigo-highlight-overlay");
    if (overlay) return overlay;
    
    overlay = document.createElement("div");
    overlay.id = "logigo-highlight-overlay";
    overlay.style.cssText = "position:fixed;pointer-events:none;z-index:99998;border:3px solid #3b82f6;border-radius:4px;box-shadow:0 0 20px rgba(59,130,246,0.5);transition:all 0.3s ease;opacity:0;";
    document.body.appendChild(overlay);
    return overlay;
  }
  
  function highlightCheckpoint(checkpointId, nodeId) {
    var element = checkpointElements[checkpointId];
    var overlay = createHighlightOverlay();
    
    if (element && element.getBoundingClientRect) {
      var rect = element.getBoundingClientRect();
      overlay.style.top = (rect.top - 4) + "px";
      overlay.style.left = (rect.left - 4) + "px";
      overlay.style.width = (rect.width + 8) + "px";
      overlay.style.height = (rect.height + 8) + "px";
      overlay.style.opacity = "1";
      
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      sendConfirmHighlight(checkpointId, true, getSelector(element));
    } else {
      showHighlightToast(checkpointId);
      sendConfirmHighlight(checkpointId, false);
    }
    
    setTimeout(function() {
      overlay.style.opacity = "0";
    }, 3000);
  }
  
  function showHighlightToast(checkpointId) {
    var existing = document.getElementById("logigo-toast");
    if (existing) existing.remove();
    
    var toast = document.createElement("div");
    toast.id = "logigo-toast";
    toast.textContent = "📍 Checkpoint: " + checkpointId;
    toast.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;z-index:99999;animation:logigo-fade-in 0.3s ease;";
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.remove(); }, 3000);
  }
  
  function getSelector(el) {
    if (!el) return "";
    if (el.id) return "#" + el.id;
    if (el.className) return "." + el.className.split(" ")[0];
    return el.tagName.toLowerCase();
  }
  
  function sendConfirmHighlight(checkpointId, success, selector) {
    if (controlWs && controlWs.readyState === WebSocket.OPEN) {
      controlWs.send(JSON.stringify({
        type: "CONFIRM_HIGHLIGHT",
        checkpointId: checkpointId,
        success: success,
        elementSelector: selector || ""
      }));
    }
  }
  
  // Track checkpoint element bindings
  window.LogiGo.bindElement = function(checkpointId, element) {
    checkpointElements[checkpointId] = element;
  };
  
  // Start control channel when document is ready
  if (typeof document !== "undefined") {
    if (document.readyState === "complete") {
      connectControlChannel();
    } else {
      window.addEventListener("load", connectControlChannel);
    }
  }
  
  // ============================================
  // Zero-Code Auto-Discovery & Function Wrapping
  // ============================================
  // NOTE: This feature works with traditional global scripts.
  // For ES module/Vite apps, use the logigo-vite-plugin for build-time instrumentation.
  
  var discoveredCode = [];
  var discoveredSrcSet = new Set();
  var wrappedFunctions = new Set();
  var autoDiscoveryEnabled = false; // Opt-in for security
  
  // Enable auto-discovery (opt-in for security - code will be sent to Studio)
  window.LogiGo.enableAutoDiscovery = function() {
    autoDiscoveryEnabled = true;
    console.log('[LogiGo] Auto-discovery enabled. Source code will be sent to Studio for visualization.');
    return window.LogiGo.autoDiscover();
  };
  
  // Auto-discover inline and external scripts
  function discoverScripts() {
    var scripts = document.querySelectorAll('script');
    var promises = [];
    
    scripts.forEach(function(script) {
      // Skip LogiGo's own script, external libraries, and already-discovered
      if (script.src && script.src.includes('remote.js')) return;
      if (script.src && (script.src.includes('node_modules') || script.src.includes('cdn') || script.src.includes('unpkg') || script.src.includes('jsdelivr'))) return;
      
      var srcKey = script.src || ('inline-' + script.textContent.slice(0, 50));
      if (discoveredSrcSet.has(srcKey)) return;
      discoveredSrcSet.add(srcKey);
      
      if (script.src && !script.src.includes('node_modules')) {
        // External script - fetch it
        promises.push(
          fetch(script.src)
            .then(function(r) { return r.ok ? r.text() : ''; })
            .then(function(code) {
              if (code && code.length > 10) {
                discoveredCode.push({ src: script.src, code: code });
              }
            })
            .catch(function() {})
        );
      } else if (script.textContent && script.textContent.trim().length > 10) {
        // Inline script
        discoveredCode.push({ src: 'inline', code: script.textContent });
      }
    });
    
    return Promise.all(promises);
  }
  
  // Simple function extractor using regex (for zero-dependency operation)
  function extractFunctions(code) {
    var functions = [];
    // Match: function name(...) { or const/let/var name = function(...) { or const/let/var name = (...) =>
    var fnRegex = /(?:function\\s+(\\w+)|(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>|async\\s+function|async\\s*\\([^)]*\\)\\s*=>))/g;
    var match;
    while ((match = fnRegex.exec(code)) !== null) {
      var name = match[1] || match[2];
      if (name && !wrappedFunctions.has(name)) {
        functions.push(name);
      }
    }
    return functions;
  }
  
  // Wrap global functions to auto-fire checkpoints
  function wrapGlobalFunctions() {
    var wrappedCount = 0;
    discoveredCode.forEach(function(item) {
      var fns = extractFunctions(item.code);
      fns.forEach(function(fnName) {
        if (typeof window[fnName] === 'function' && !wrappedFunctions.has(fnName)) {
          var original = window[fnName];
          wrappedFunctions.add(fnName);
          
          window[fnName] = function() {
            checkpoint(fnName + '-start', { args: Array.prototype.slice.call(arguments).slice(0, 3) });
            try {
              var result = original.apply(this, arguments);
              if (result && typeof result.then === 'function') {
                return result.then(function(r) {
                  checkpoint(fnName + '-end', { result: typeof r });
                  return r;
                }).catch(function(e) {
                  checkpoint(fnName + '-error', { error: e.message });
                  throw e;
                });
              }
              checkpoint(fnName + '-end', { result: typeof result });
              return result;
            } catch (e) {
              checkpoint(fnName + '-error', { error: e.message });
              throw e;
            }
          };
          wrappedCount++;
        }
      });
    });
    if (wrappedCount > 0) {
      console.log('[LogiGo] Auto-wrapped ' + wrappedCount + ' global function(s)');
    }
  }
  
  // Auto-register all discovered code with Studio
  function autoRegisterCode() {
    if (discoveredCode.length === 0) return;
    
    var combined = discoveredCode.map(function(item) {
      return '// Source: ' + item.src + '\\n' + item.code;
    }).join('\\n\\n');
    
    if (combined.length > 100) {
      window.LogiGo.registerCode(combined);
      console.log('[LogiGo] Registered ' + discoveredCode.length + ' script(s) for flowchart visualization');
    }
  }
  
  // Run auto-discovery (can be called manually)
  window.LogiGo.autoDiscover = function() {
    if (!autoDiscoveryEnabled) {
      console.log('[LogiGo] Auto-discovery is disabled. Call LogiGo.enableAutoDiscovery() to enable.');
      return Promise.resolve({ scriptsFound: 0, functionsWrapped: 0, enabled: false });
    }
    
    return discoverScripts().then(function() {
      autoRegisterCode();
      wrapGlobalFunctions();
      return { scriptsFound: discoveredCode.length, functionsWrapped: wrappedFunctions.size, enabled: true };
    });
  };
  
  // Show hint about auto-discovery in console
  console.log('[LogiGo] Tip: Call LogiGo.enableAutoDiscovery() to auto-wrap global functions (works with traditional scripts, not ES modules)');
  
  // Show a persistent clickable badge (stays until closed)
  if (typeof document !== "undefined") {
    function showBadge() {
      if (document.getElementById("logigo-badge")) return;
      var badge = document.createElement("div");
      badge.id = "logigo-badge";
      badge.innerHTML = '<span class="logigo-status-dot" style="width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:8px;" title="Connected"></span><a href="' + window.LogiGo.studioUrl + '" target="_blank" style="color:#60a5fa;text-decoration:none;display:flex;align-items:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span style="border-bottom:1px solid #60a5fa;">View in LogiGo</span></a><button style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:0 0 0 10px;font-size:16px;line-height:1;" title="Close">&times;</button>';
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

  // ============================================
  // WebSocket Control Channel for Visual Handshake
  // ============================================
  
  const wss = new WebSocketServer({ noServer: true });
  
  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const pathMatch = url.pathname.match(/^\/api\/remote\/control\/([^/]+)$/);
    
    if (!pathMatch) {
      socket.destroy();
      return;
    }
    
    const sessionId = pathMatch[1];
    const clientType = url.searchParams.get('type') || 'studio';
    const session = remoteSessions.get(sessionId);
    
    if (!session) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, sessionId, clientType, session);
    });
  });
  
  wss.on('connection', (ws: WebSocket, request: any, sessionId: string, clientType: string, session: RemoteSession) => {
    console.log(`[WS] ${clientType} connected to session ${sessionId.slice(0, 8)}`);
    
    if (clientType === 'studio') {
      session.studioWsClients.add(ws);
    } else {
      session.remoteWsClients.add(ws);
    }
    
    session.lastActivity = new Date();
    
    ws.on('message', (data) => {
      try {
        const message: ControlMessage = JSON.parse(data.toString());
        session.lastActivity = new Date();
        
        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          return;
        }
        
        if (message.type === 'HIGHLIGHT_ELEMENT' && clientType === 'studio') {
          session.remoteWsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(message));
            }
          });
        }
        
        if ((message.type === 'CONFIRM_HIGHLIGHT' || message.type === 'REMOTE_FOCUS') && clientType === 'remote') {
          session.studioWsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(message));
            }
          });
        }
      } catch (e) {
        console.error('[WS] Invalid message:', e);
      }
    });
    
    ws.on('close', () => {
      console.log(`[WS] ${clientType} disconnected from session ${sessionId.slice(0, 8)}`);
      if (clientType === 'studio') {
        session.studioWsClients.delete(ws);
      } else {
        session.remoteWsClients.delete(ws);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`[WS] Error in ${clientType}:`, error.message);
    });
  });

  return httpServer;
}
