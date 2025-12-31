import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import OpenAI from "openai";
import crypto from "crypto";
import fs from "fs";
import type { GroundingContext, GroundingNode, GroundingNodeType } from "@shared/grounding-types";
import type { ControlMessage, StudioToRemoteMessage, RemoteToStudioMessage } from "@shared/control-types";
import * as acorn from "acorn";
import { WebSocketServer, WebSocket } from "ws";
import { registerAIRoutes } from "./ai";
import { registerArenaRoutes } from "./arena";
import { handleMCPSSE, handleMCPMessage } from "./mcp";
import { shares, insertShareSchema } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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
  app.use("/test-app", express.static(path.join(__dirname, "..", "public", "test-app")));
  
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

  // Register AI Code Understanding APIs
  registerAIRoutes(app);
  
  // Register Model Arena routes
  registerArenaRoutes(app);

  // File Sync API - for bi-directional sync with Replit Agent
  const FLOWCHART_FILE_PATH = path.join(__dirname, "..", "data", "flowchart.json");
  const DATA_DIR = path.join(__dirname, "..", "data");

  // Ensure data directory exists on startup
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Get file modification status
  app.get("/api/file/status", (req, res) => {
    try {
      if (!fs.existsSync(FLOWCHART_FILE_PATH)) {
        return res.json({ lastModified: 0, exists: false });
      }
      const stats = fs.statSync(FLOWCHART_FILE_PATH);
      res.json({ lastModified: stats.mtimeMs, exists: true });
    } catch (error) {
      console.error("[File Sync] Status error:", error);
      res.status(500).json({ error: "Failed to get file status" });
    }
  });

  // Load flowchart from file
  app.get("/api/file/load", (req, res) => {
    try {
      if (!fs.existsSync(FLOWCHART_FILE_PATH)) {
        return res.json({ success: true, data: { nodes: [], edges: [], code: "" } });
      }
      const content = fs.readFileSync(FLOWCHART_FILE_PATH, "utf-8");
      const data = JSON.parse(content);
      res.json({ success: true, data });
    } catch (error) {
      console.error("[File Sync] Load error:", error);
      res.status(500).json({ error: "Failed to load flowchart" });
    }
  });

  // Save flowchart to file
  app.post("/api/file/save", express.json(), (req, res) => {
    try {
      const data = req.body;
      fs.writeFileSync(FLOWCHART_FILE_PATH, JSON.stringify(data, null, 2));
      res.json({ success: true, lastModified: Date.now() });
    } catch (error) {
      console.error("[File Sync] Save error:", error);
      res.status(500).json({ error: "Failed to save flowchart" });
    }
  });

  // Documentation API - serve markdown files from docs/
  const ALLOWED_DOCS = [
    'GETTING_STARTED.md',
    'INSTALLATION_GUIDE.md',
    'API_REFERENCE.md',
    'COMMON_PITFALLS.md',
    'QUICK_REFERENCE.md',
    'INTEGRATION_GUIDE.md',
    'VIBE_CODER_GUIDE.md'
  ];

  app.get("/api/docs", (req, res) => {
    res.json({
      docs: ALLOWED_DOCS.map(file => ({
        id: file.replace('.md', '').toLowerCase().replace(/_/g, '-'),
        name: file.replace('.md', '').replace(/_/g, ' '),
        file
      }))
    });
  });

  app.get("/api/docs/:file", async (req, res) => {
    try {
      const { file } = req.params;
      const filename = file.endsWith('.md') ? file : `${file}.md`;
      
      // Security: Only allow whitelisted files
      if (!ALLOWED_DOCS.includes(filename)) {
        return res.status(404).json({ error: "Documentation not found" });
      }
      
      const docPath = path.join(__dirname, "..", "docs", filename);
      const fs = await import('fs/promises');
      const content = await fs.readFile(docPath, 'utf-8');
      
      res.json({ 
        file: filename, 
        content,
        title: filename.replace('.md', '').replace(/_/g, ' ')
      });
    } catch (error) {
      console.error("[Docs] Error reading doc:", error);
      res.status(404).json({ error: "Documentation not found" });
    }
  });

  // Map URL slugs to documentation files
  const DOC_SLUGS: Record<string, string> = {
    'getting-started': 'GETTING_STARTED.md',
    'installation': 'INSTALLATION_GUIDE.md',
    'api-reference': 'API_REFERENCE.md',
    'common-pitfalls': 'COMMON_PITFALLS.md',
    'quick-reference': 'QUICK_REFERENCE.md',
    'integration': 'INTEGRATION_GUIDE.md',
    'vibe-coder-guide': 'VIBE_CODER_GUIDE.md'
  };

  // Serve documentation pages as styled HTML
  app.get("/docs/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const filename = DOC_SLUGS[slug];
      
      if (!filename) {
        return res.status(404).send("Documentation not found");
      }
      
      const docPath = path.join(__dirname, "..", "docs", filename);
      const fs = await import('fs/promises');
      const markdown = await fs.readFile(docPath, 'utf-8');
      const title = filename.replace('.md', '').replace(/_/g, ' ');
      
      // Convert markdown to simple HTML (basic conversion)
      const htmlContent = markdown
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 border-b pb-2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
        .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
        .replace(/\n\n/g, '</p><p class="my-3 text-gray-300">')
        .replace(/^\| .+$/gm, match => `<div class="font-mono text-sm bg-gray-800 p-2 rounded my-1">${match}</div>`);
      
      const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - LogiGo Documentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0a0a0a; color: #e5e5e5; }
    a { color: #60a5fa; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body class="min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <nav class="mb-8 flex items-center gap-4">
      <a href="/" class="text-blue-400 hover:underline">← Back to LogiGo</a>
      <span class="text-gray-600">|</span>
      <span class="text-gray-400">Documentation</span>
    </nav>
    <article class="prose prose-invert max-w-none">
      <p class="my-3 text-gray-300">${htmlContent}</p>
    </article>
    <footer class="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
      <p>LogiGo Studio - Code-to-Flowchart Visualization</p>
    </footer>
  </div>
</body>
</html>`;
      
      res.type('html').send(html);
    } catch (error) {
      console.error("[Docs] Error serving doc page:", error);
      res.status(404).send("Documentation not found");
    }
  });

  // MCP (Model Context Protocol) endpoints for agent integration
  app.get("/api/mcp/sse", async (req, res) => {
    try {
      await handleMCPSSE(req, res);
    } catch (error) {
      console.error("[MCP] SSE error:", error);
      res.status(500).json({ error: "MCP connection failed" });
    }
  });

  app.post("/api/mcp/messages", async (req, res) => {
    try {
      await handleMCPMessage(req, res);
    } catch (error) {
      console.error("[MCP] Message error:", error);
      res.status(500).json({ error: "MCP message handling failed" });
    }
  });

  // Share endpoints
  app.post("/api/share", async (req, res) => {
    try {
      const { code, title, description } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code is required" });
      }
      
      const id = crypto.randomBytes(4).toString('hex');
      
      await db.insert(shares).values({
        id,
        code,
        title: title || null,
        description: description || null,
      });
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const url = `${baseUrl}/s/${id}`;
      
      res.json({ id, url });
    } catch (error) {
      console.error("[Share] Error creating share:", error);
      res.status(500).json({ error: "Failed to create share" });
    }
  });

  app.get("/s/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.select().from(shares).where(eq(shares.id, id));
      
      if (result.length === 0) {
        return res.status(404).send("Share not found");
      }
      
      await db.update(shares)
        .set({ views: sql`${shares.views} + 1` })
        .where(eq(shares.id, id));
      
      const share = result[0];
      const encoded = Buffer.from(share.code).toString('base64');
      const titleParam = share.title ? `&title=${encodeURIComponent(share.title)}` : '';
      
      res.redirect(`/?code=${encodeURIComponent(encoded)}${titleParam}`);
    } catch (error) {
      console.error("[Share] Error fetching share:", error);
      res.status(500).send("Error loading share");
    }
  });

  app.get("/api/share/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.select().from(shares).where(eq(shares.id, id));
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Share not found" });
      }
      
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch share" });
    }
  });

  // Agent API - Programmatic code analysis
  app.post("/api/agent/analyze", async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code is required" });
      }
      
      const grounding = parseCodeToGrounding(code);
      
      res.json({
        summary: grounding.summary,
        flow: grounding.flow,
        nodes: grounding.flow.length,
        edges: grounding.flow.reduce((sum, node) => sum + node.children.length, 0),
        complexity: grounding.summary.complexityScore,
        language: language || 'javascript'
      });
    } catch (error) {
      console.error("[Agent API] Error analyzing code:", error);
      res.status(500).json({ error: "Failed to analyze code" });
    }
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
  // Runtime Instrumentation API (for Service Worker)
  // ============================================
  
  // Instrument code on-the-fly for zero-code ES module support
  app.post("/api/runtime/instrument", (req, res) => {
    try {
      const { code, filePath = 'module.js' } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code is required" });
      }
      
      // Lightweight regex-based instrumentation for runtime use
      // This injects checkpoints at function entries without full AST parsing
      let instrumented = code;
      let fnCount = 0;
      
      // Inject checkpoint at async function declarations
      instrumented = instrumented.replace(
        /^(\s*)(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{/gm,
        (match, indent, exp, async, name, params) => {
          fnCount++;
          const varsCapture = params.split(',').map((p: string) => p.trim().split(/[=:]/)[0].trim()).filter(Boolean).slice(0, 5);
          const varsObj = varsCapture.length > 0 ? `{ ${varsCapture.join(', ')} }` : '{}';
          return `${match}\n${indent}  window.LogiGo?.checkpoint?.('${name}-entry', ${varsObj});`;
        }
      );
      
      // Inject checkpoint at arrow functions assigned to const/let/var
      instrumented = instrumented.replace(
        /^(\s*)(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(([^)]*)\)\s*=>\s*\{/gm,
        (match, indent, exp, decl, name, async, params) => {
          fnCount++;
          const varsCapture = params.split(',').map((p: string) => p.trim().split(/[=:]/)[0].trim()).filter(Boolean).slice(0, 5);
          const varsObj = varsCapture.length > 0 ? `{ ${varsCapture.join(', ')} }` : '{}';
          return `${match}\n${indent}  window.LogiGo?.checkpoint?.('${name}-entry', ${varsObj});`;
        }
      );
      
      // Inject checkpoint at method definitions in classes
      instrumented = instrumented.replace(
        /^(\s*)(async\s+)?(\w+)\s*\(([^)]*)\)\s*\{(?!\s*window\.LogiGo)/gm,
        (match, indent, async, name, params) => {
          // Skip constructors and common lifecycle methods to reduce noise
          if (['constructor', 'render', 'componentDidMount', 'componentWillUnmount', 'useEffect'].includes(name)) {
            return match;
          }
          fnCount++;
          return `${match}\n${indent}  window.LogiGo?.checkpoint?.('${name}-entry', {});`;
        }
      );
      
      res.json({ 
        code: instrumented, 
        instrumented: fnCount > 0,
        functionCount: fnCount,
        filePath 
      });
    } catch (error) {
      console.error("Instrumentation error:", error);
      res.status(500).json({ error: "Failed to instrument code" });
    }
  });
  
  // Serve the Service Worker script for intercepting module requests
  app.get("/logigo-sw.js", (req, res) => {
    const logigoUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || 'localhost:5000'}`;
    
    const swScript = `
// LogiGo Service Worker - Zero-Code ES Module Instrumentation
// This intercepts module requests and instruments them on-the-fly

const LOGIGO_URL = '${logigoUrl}';
const CACHE_NAME = 'logigo-instrumented-v1';
const instrumentedCache = new Map();

// File extensions to instrument
const INSTRUMENTABLE = /\\.(js|jsx|ts|tsx|mjs)$/;
const SKIP_PATTERNS = [
  /node_modules/,
  /\\.vite/,
  /@vite/,
  /\\?v=/,  // Vite cache-busting
  /logigo/i,
  /react/i,
  /chunk-/,
  /vendor/
];

function shouldInstrument(url) {
  if (!INSTRUMENTABLE.test(url)) return false;
  return !SKIP_PATTERNS.some(p => p.test(url));
}

async function instrumentCode(code, filePath) {
  try {
    const response = await fetch(LOGIGO_URL + '/api/runtime/instrument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, filePath })
    });
    if (!response.ok) {
      console.warn('[LogiGo SW] Instrumentation failed:', response.status);
      return code;
    }
    const result = await response.json();
    if (result.instrumented) {
      console.log('[LogiGo SW] Instrumented', filePath, '(' + result.functionCount + ' functions)');
    }
    return result.code;
  } catch (e) {
    console.warn('[LogiGo SW] Instrumentation error:', e);
    return code;
  }
}

self.addEventListener('install', (event) => {
  console.log('[LogiGo SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[LogiGo SW] Activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Only intercept JS module requests
  if (!shouldInstrument(url)) {
    return;
  }
  
  // Check cache first
  if (instrumentedCache.has(url)) {
    event.respondWith(
      new Response(instrumentedCache.get(url), {
        headers: { 'Content-Type': 'application/javascript' }
      })
    );
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (!response.ok) return response;
        
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('javascript') && !contentType.includes('text/plain')) {
          return response;
        }
        
        const code = await response.text();
        const filePath = new URL(url).pathname;
        const instrumented = await instrumentCode(code, filePath);
        
        // Cache the instrumented code
        instrumentedCache.set(url, instrumented);
        
        return new Response(instrumented, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'application/javascript',
            'X-LogiGo-Instrumented': 'true'
          }
        });
      })
      .catch((e) => {
        console.warn('[LogiGo SW] Fetch error:', e);
        return fetch(event.request);
      })
  );
});
`;
    
    res.type("application/javascript").send(swScript);
  });

  // ============================================
  // Reverse Proxy - Zero-Code ES Module Instrumentation
  // ============================================
  // Usage: Visit https://logigo-url/proxy/https://your-app-url
  // This proxies the target app and instruments all JS on the fly
  
  app.get("/proxy/*", async (req, res) => {
    try {
      // Extract target URL from the path (Express uses params[0] for wildcards)
      const targetUrl = (req.params as Record<string, string>)[0];
      
      if (!targetUrl || !targetUrl.startsWith('http')) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head><title>LogiGo Proxy</title></head>
          <body style="font-family: system-ui; padding: 40px; background: #0f172a; color: white;">
            <h1>LogiGo Zero-Code Proxy</h1>
            <p>Enter your app URL to visualize it with automatic checkpoints:</p>
            <form onsubmit="window.location='/proxy/' + document.getElementById('url').value; return false;">
              <input id="url" type="text" placeholder="https://your-app.replit.app" 
                style="width: 400px; padding: 12px; font-size: 16px; border-radius: 8px; border: none;">
              <button type="submit" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 8px;">
                Open in LogiGo
              </button>
            </form>
            <p style="margin-top: 20px; color: #94a3b8;">
              Example: <code>/proxy/https://visionloop.replit.app</code>
            </p>
          </body>
          </html>
        `);
      }
      
      // Parse the target URL
      let parsedTarget: URL;
      try {
        parsedTarget = new URL(targetUrl);
      } catch (e) {
        return res.status(400).send("Invalid target URL");
      }
      
      // Security: Only allow specific domains to prevent SSRF
      const allowedDomains = [
        /\.replit\.app$/,
        /\.replit\.dev$/,
        /\.repl\.co$/,
        /^localhost(:\d+)?$/,
        /^127\.0\.0\.1(:\d+)?$/,
        /^example\.com$/,  // For testing
      ];
      const hostname = parsedTarget.hostname;
      const isAllowed = allowedDomains.some(pattern => pattern.test(hostname));
      
      if (!isAllowed) {
        return res.status(403).send(`
          <!DOCTYPE html>
          <html>
          <head><title>LogiGo Proxy - Domain Not Allowed</title></head>
          <body style="font-family: system-ui; padding: 40px; background: #0f172a; color: white;">
            <h1>Domain Not Allowed</h1>
            <p>For security, LogiGo proxy only works with Replit apps.</p>
            <p>Allowed domains: <code>.replit.app</code>, <code>.replit.dev</code>, <code>.repl.co</code></p>
            <p>Requested: <code>${hostname}</code></p>
            <a href="/proxy/" style="color: #3b82f6;">Try again</a>
          </body>
          </html>
        `);
      }
      
      // Construct the full URL with query string
      const fullUrl = req.originalUrl.replace(/^\/proxy\//, '');
      
      // Fetch from target
      const targetResponse = await fetch(fullUrl, {
        headers: {
          'User-Agent': req.headers['user-agent'] || 'LogiGo-Proxy/1.0',
          'Accept': req.headers['accept'] || '*/*',
          'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        },
        redirect: 'follow'
      });
      
      const contentType = targetResponse.headers.get('content-type') || '';
      const targetOrigin = parsedTarget.origin;
      const logigoProxyBase = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/proxy/${targetOrigin}`;
      
      // Handle different content types
      if (contentType.includes('text/html')) {
        let html = await targetResponse.text();
        
        // Rewrite URLs in HTML to go through proxy
        // Handle absolute URLs
        html = html.replace(/(href|src|action)=["'](https?:\/\/[^"']+)["']/gi, (match, attr, url) => {
          if (url.startsWith(targetOrigin)) {
            return `${attr}="${logigoProxyBase}${url.slice(targetOrigin.length)}"`;
          }
          return match;
        });
        
        // Handle root-relative URLs (but NOT protocol-relative //example.com)
        // Use negative lookahead to exclude // but allow / and /path
        html = html.replace(/(href|src|action)=["'](\/(?!\/)[^"']*)["']/gi, (match, attr, path) => {
          return `${attr}="${logigoProxyBase}${path}"`;
        });
        
        // Handle relative URLs (./path or just path) by adding a <base> tag
        // This ensures all relative URLs resolve correctly through the proxy
        const targetPath = parsedTarget.pathname;
        const basePath = targetPath.endsWith('/') ? targetPath : targetPath.substring(0, targetPath.lastIndexOf('/') + 1);
        const baseTag = `<base href="${logigoProxyBase}${basePath}">`;
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}`);
        } else if (html.includes('<head ')) {
          html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
        }
        
        // Inject a script to patch location.pathname for SPA routers
        // This makes client-side routers see '/' instead of '/proxy/https://...'
        // Instead of patching location (which doesn't work reliably),
        // inject a script that sets up a global hook for the router to use
        const virtualPath = parsedTarget.pathname || '/';
        const locationPatch = `<script>
(function() {
  // Store the real location for LogiGo's use
  window.__logigoRealLocation = {
    pathname: window.location.pathname,
    href: window.location.href,
    search: window.location.search,
    origin: window.location.origin
  };
  
  // The virtual path that SPAs should see
  window.__logigoVirtualPath = '${virtualPath}';
  window.__logigoTargetOrigin = '${targetOrigin}';
  window.__logigoProxyBase = '/proxy/${targetOrigin}';
  
  console.log('[LogiGo] Virtual path set to:', window.__logigoVirtualPath);
  
  // For wouter and similar routers, we need to intercept before they read location
  // Create a custom event that fires when our patched location is ready
  const originalPath = window.location.pathname;
  
  // Use history.replaceState to immediately change the visible URL to the target path
  // This makes the browser's location show the correct path
  try {
    // Replace the current history entry with the virtual path
    history.replaceState(
      { __logigo: true, originalPath: originalPath },
      '',
      '${virtualPath}${parsedTarget.search || ''}'
    );
    console.log('[LogiGo] History replaced! New pathname:', window.location.pathname);
  } catch(e) {
    console.warn('[LogiGo] History replace failed:', e);
  }
  
  // Also patch pushState/replaceState for future navigation
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  
  history.pushState = function(state, title, url) {
    // Store original for LogiGo tracking
    const fullUrl = window.__logigoProxyBase + (url && url.startsWith('/') ? url : '/' + (url || ''));
    console.log('[LogiGo] pushState intercepted:', url, '-> keeping as:', url);
    return origPush(state, title, url);
  };
  
  history.replaceState = function(state, title, url) {
    if (state && state.__logigo) {
      // This is our own call, let it through
      return origReplace(state, title, url);
    }
    console.log('[LogiGo] replaceState intercepted:', url);
    return origReplace(state, title, url);
  };
})();
</script>`;
        
        // Inject LogiGo remote.js script for checkpoint handling
        const logigoScript = `<script src="${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/remote.js?project=Proxy&autoOpen=true"></script>`;
        
        // Inject location patch FIRST (before any other scripts), then remote.js
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${locationPatch}`);
        } else if (html.includes('<head ')) {
          html = html.replace(/<head([^>]*)>/i, `<head$1>${locationPatch}`);
        }
        
        // Then add remote.js before </head>
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${logigoScript}</head>`);
        } else if (html.includes('<body')) {
          html = html.replace(/<body([^>]*)>/i, `<body$1>${logigoScript}`);
        } else {
          html = logigoScript + html;
        }
        
        // Add a floating indicator
        const indicator = `
          <div id="logigo-proxy-indicator" style="position:fixed;bottom:20px;left:20px;background:#3b82f6;color:white;padding:8px 16px;border-radius:8px;font-family:system-ui;font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
            🔍 Proxied by LogiGo
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;margin-left:8px;">✕</button>
          </div>
        `;
        html = html.replace('</body>', `${indicator}</body>`);
        
        res.type('text/html').send(html);
        
      } else if (contentType.includes('javascript') || /\.(js|jsx|mjs)$/.test(fullUrl)) {
        // JavaScript files - be very careful with instrumentation
        let code = await targetResponse.text();
        const originalCode = code;
        
        // Skip instrumentation for bundled/minified files (they break when modified)
        // Signs of bundled code: hash in filename, very long single lines, minified patterns
        const isBundled = /[-_][a-zA-Z0-9]{6,}\.(js|mjs)$/.test(fullUrl) || // hash in filename
                          code.split('\n').some(line => line.length > 1000) || // minified lines
                          /\)\{[a-z]\(/g.test(code.slice(0, 1000)); // minified function calls
        
        // Skip if it's a vendor/library file
        const skipPatterns = [/node_modules/, /vendor/, /react\./, /react-dom/, /chunk-/, /@vite/, /\.vite/, /scheduler/];
        const shouldSkip = skipPatterns.some(p => p.test(fullUrl)) || isBundled;
        
        // Detect app entry files for code registration (not just index/main)
        // Include: index.js, main.js, app.js, game.js, script.js, etc.
        // Exclude: vendor files, minified bundles, chunks
        const isAppCode = /\/(index|main|app|game|script|bundle)(-[a-zA-Z0-9]+)?\.js$/i.test(fullUrl) ||
                          (/\/[a-z][a-z0-9_-]*\.js$/i.test(fullUrl) && !isBundled && code.length < 50000);
        
        if (!shouldSkip && code.length < 500000) { // Skip very large files
          // Inject checkpoints into functions
          let fnCount = 0;
          const discoveredFunctions: string[] = [];
          
          // Helper to check if function name looks like user code (not minified)
          const isUserFunction = (name: string): boolean => {
            // Skip very short names (likely minified: a, b, Ym, gd, etc.)
            if (name.length < 4) return false;
            // Skip names that look minified (random mix of upper/lower with numbers)
            if (/^[a-z][A-Z][a-z0-9]*$/.test(name) && name.length < 6) return false;
            // Skip internal/library patterns
            if (/^_|^\$|^use[A-Z]|^React|^render|^mount|^unmount|^create[A-Z]|^set[A-Z]|^get[A-Z]|^on[A-Z]/.test(name)) return false;
            // Skip common minified patterns
            if (/^[A-Z][a-z]$|^[a-z][A-Z]$|^[A-Z]{2,3}$/.test(name)) return false;
            // Look for camelCase or snake_case with reasonable length (likely user code)
            if (/^[a-z][a-zA-Z0-9_]{4,}$/.test(name)) return true;
            // PascalCase components are OK if long enough
            if (/^[A-Z][a-zA-Z0-9]{5,}$/.test(name)) return true;
            return false;
          };
          
          // Named function declarations anywhere (not just line start)
          code = code.replace(
            /((?:export\s+)?(?:async\s+)?function\s+)(\w+)(\s*\([^)]*\)\s*\{)/g,
            (match, prefix, name, suffix) => {
              if (!isUserFunction(name)) return match;
              fnCount++;
              discoveredFunctions.push(name);
              return `${prefix}${name}${suffix}\n  window.LogiGo?.checkpoint?.('${name}', {});`;
            }
          );
          
          // Arrow functions with block body (const x = () => {)
          code = code.replace(
            /((?:export\s+)?(?:const|let|var)\s+)(\w+)(\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{)/g,
            (match, prefix, name, suffix) => {
              if (!isUserFunction(name)) return match;
              fnCount++;
              discoveredFunctions.push(name);
              return `${prefix}${name}${suffix}\n  window.LogiGo?.checkpoint?.('${name}', {});`;
            }
          );
          
          // Object method shorthand: { methodName() { } }
          code = code.replace(
            /([,{]\s*)(\w+)(\s*\([^)]*\)\s*\{)/g,
            (match, prefix, name, suffix) => {
              if (!isUserFunction(name)) return match;
              fnCount++;
              discoveredFunctions.push(name);
              return `${prefix}${name}${suffix}\n    window.LogiGo?.checkpoint?.('${name}', {});`;
            }
          );
          
          if (fnCount > 0) {
            res.set('X-LogiGo-Instrumented', String(fnCount));
            console.log(`[Proxy] Instrumented ${fnCount} functions in ${fullUrl}: ${discoveredFunctions.slice(0, 5).join(', ')}${discoveredFunctions.length > 5 ? '...' : ''}`);
          }
        }
        
        // For app code files, register the code for flowchart visualization (even if not instrumented)
        // Note: Vite bundles can be large (500KB+), so we accept up to 1MB and slice to 50KB for the flowchart
        if (isAppCode && originalCode.length > 500) {
          console.log(`[Proxy] Registering code from ${fullUrl} (${originalCode.length} bytes) for flowchart`);
          // Take a sample of the code for visualization (first 50KB)
          const codeForFlowchart = originalCode.slice(0, 50000);
          code += `\n;(function(){
  console.log('[LogiGo] Attempting to register code for flowchart...');
  function tryRegister() {
    if(window.LogiGo && window.LogiGo.registerCode){
      var appCode = ${JSON.stringify(codeForFlowchart)};
      window.LogiGo.registerCode(appCode);
      console.log('[LogiGo] Code registered for flowchart visualization');
    } else {
      console.log('[LogiGo] LogiGo not ready, retrying...');
      setTimeout(tryRegister, 500);
    }
  }
  setTimeout(tryRegister, 1000);
})();`;
        } else if (isAppCode) {
          console.log(`[Proxy] Skipping code registration: ${fullUrl} (${originalCode.length} bytes) - too small`);
        }
        
        res.type('application/javascript').send(code);
        
      } else if (contentType.includes('typescript') || /\.(ts|tsx)$/.test(fullUrl)) {
        // For TypeScript, we need the browser to handle it via Vite
        // Just pass through since Vite will transform it
        const code = await targetResponse.text();
        res.type(contentType || 'application/javascript').send(code);
        
      } else {
        // Pass through other content types
        const buffer = await targetResponse.arrayBuffer();
        res.type(contentType).send(Buffer.from(buffer));
      }
      
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>LogiGo Proxy Error</title></head>
        <body style="font-family: system-ui; padding: 40px; background: #0f172a; color: white;">
          <h1>Proxy Error</h1>
          <p>Could not fetch the target URL. Make sure it's accessible.</p>
          <p style="color: #f87171;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/proxy/" style="color: #3b82f6;">Try again</a>
        </body>
        </html>
      `);
    }
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
  
  // Create the checkpoint function with retry logic and breakpoint support
  window.checkpoint = async function(id, variables, options) {
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
    
    try {
      await fetchWithRetry(LOGIGO_URL + "/api/remote/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        mode: "cors"
      });
    } catch(e) {
      console.warn("[LogiGo] Checkpoint failed after retries:", e.message);
    }
    
    // Check if we should pause at this checkpoint
    var shouldPause = breakpoints.has(id) || isPaused || stepMode;
    
    if (shouldPause) {
      isPaused = true;
      stepMode = false;
      console.log("[LogiGo] ⏸️ Paused at checkpoint:", id);
      showBreakpointToast("Paused at: " + id, "#8b5cf6");
      
      // Notify Studio we're paused
      sendMessage({ type: "PAUSED_AT", checkpointId: id, variables: variables });
      
      // Wait for resume command from Studio
      await waitForResume();
    }
  };
  
  // Sync version for backwards compatibility
  window.checkpointSync = function(id, variables, options) {
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
  // Bidirectional Control Channel (WebSocket)
  // - Visual Handshake (highlight elements)
  // - Remote Breakpoints (pause/resume execution)
  // ============================================
  
  var controlWs = null;
  var wsReconnectAttempts = 0;
  var wsMaxRetries = 5;
  var checkpointElements = {};
  
  // Breakpoint state management
  var breakpoints = new Set();
  var isPaused = false;
  var pauseResolver = null;
  var stepMode = false;
  
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
        console.log("[LogiGo] Control channel connected (bidirectional)");
        wsReconnectAttempts = 0;
        // Notify Studio of current breakpoints
        sendMessage({ type: "BREAKPOINTS_UPDATED", breakpoints: Array.from(breakpoints) });
      };
      
      controlWs.onmessage = function(event) {
        try {
          var msg = JSON.parse(event.data);
          handleControlMessage(msg);
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
  
  function sendMessage(msg) {
    if (controlWs && controlWs.readyState === WebSocket.OPEN) {
      controlWs.send(JSON.stringify(msg));
    }
  }
  
  function handleControlMessage(msg) {
    switch (msg.type) {
      case "HIGHLIGHT_ELEMENT":
        highlightCheckpoint(msg.checkpointId, msg.nodeId);
        break;
        
      case "SET_BREAKPOINT":
        breakpoints.add(msg.checkpointId);
        console.log("[LogiGo] Breakpoint set:", msg.checkpointId);
        showBreakpointToast("Breakpoint set: " + msg.checkpointId, "#8b5cf6");
        sendMessage({ type: "BREAKPOINTS_UPDATED", breakpoints: Array.from(breakpoints) });
        break;
        
      case "REMOVE_BREAKPOINT":
        breakpoints.delete(msg.checkpointId);
        console.log("[LogiGo] Breakpoint removed:", msg.checkpointId);
        sendMessage({ type: "BREAKPOINTS_UPDATED", breakpoints: Array.from(breakpoints) });
        break;
        
      case "CLEAR_BREAKPOINTS":
        breakpoints.clear();
        console.log("[LogiGo] All breakpoints cleared");
        sendMessage({ type: "BREAKPOINTS_UPDATED", breakpoints: [] });
        break;
        
      case "PAUSE":
        isPaused = true;
        console.log("[LogiGo] Execution paused by Studio");
        showBreakpointToast("Execution paused", "#ef4444");
        break;
        
      case "RESUME":
        stepMode = false;
        resumeExecution();
        break;
        
      case "STEP":
        stepMode = true;
        resumeExecution();
        break;
        
      case "PING":
        sendMessage({ type: "PONG", timestamp: Date.now() });
        break;
    }
  }
  
  function resumeExecution() {
    if (pauseResolver) {
      console.log("[LogiGo] Resuming execution...");
      isPaused = false;
      var resolver = pauseResolver;
      pauseResolver = null;
      resolver();
      sendMessage({ type: "RESUMED" });
      hideBreakpointOverlay();
    }
  }
  
  function waitForResume() {
    return new Promise(function(resolve) {
      pauseResolver = resolve;
    });
  }
  
  function showBreakpointToast(message, color) {
    var existing = document.getElementById("logigo-breakpoint-toast");
    if (existing) existing.remove();
    
    var toast = document.createElement("div");
    toast.id = "logigo-breakpoint-toast";
    toast.innerHTML = "⏸️ " + message;
    toast.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:" + color + ";color:white;padding:16px 32px;border-radius:12px;font-family:system-ui,sans-serif;font-size:16px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);";
    document.body.appendChild(toast);
  }
  
  function hideBreakpointOverlay() {
    var toast = document.getElementById("logigo-breakpoint-toast");
    if (toast) toast.remove();
  }
  
  // Expose breakpoint controls
  window.LogiGo.breakpoints = breakpoints;
  window.LogiGo.isPaused = function() { return isPaused; };
  window.LogiGo.resume = resumeExecution;
  
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
  
  // Enable ES module instrumentation via Service Worker (for Vite/React apps)
  window.LogiGo.enableModuleInstrumentation = function() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[LogiGo] Service Workers not supported. Use the Vite plugin instead.');
      return Promise.resolve({ success: false, reason: 'not_supported' });
    }
    
    console.log('[LogiGo] Enabling ES module instrumentation via Service Worker...');
    console.log('[LogiGo] ⚠️ This will intercept and instrument your app\\'s JavaScript modules.');
    console.log('[LogiGo] ⚠️ Source code will be sent to LogiGo Studio for analysis.');
    
    return navigator.serviceWorker.register(LOGIGO_URL + '/logigo-sw.js', { scope: '/' })
      .then(function(registration) {
        console.log('✅ [LogiGo] Service Worker registered. Reload the page to start instrumentation.');
        console.log('[LogiGo] After reload, function calls will auto-fire checkpoints!');
        return { success: true, registration: registration };
      })
      .catch(function(error) {
        console.error('[LogiGo] Service Worker registration failed:', error);
        console.log('[LogiGo] Tip: Cross-origin service workers may be blocked. Try the Vite plugin instead.');
        return { success: false, error: error.message };
      });
  };
  
  // Disable module instrumentation
  window.LogiGo.disableModuleInstrumentation = function() {
    if (!('serviceWorker' in navigator)) {
      return Promise.resolve({ success: false });
    }
    
    return navigator.serviceWorker.getRegistrations()
      .then(function(registrations) {
        var logigoReg = registrations.find(function(r) {
          return r.active && r.active.scriptURL.includes('logigo-sw');
        });
        if (logigoReg) {
          return logigoReg.unregister().then(function() {
            console.log('[LogiGo] Service Worker unregistered. Reload to restore original modules.');
            return { success: true };
          });
        }
        return { success: false, reason: 'not_found' };
      });
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
  console.log('[LogiGo] 💡 For traditional scripts: LogiGo.enableAutoDiscovery()');
  console.log('[LogiGo] 💡 For Vite/React apps: LogiGo.enableModuleInstrumentation() then reload');
  
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
