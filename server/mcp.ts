import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as acorn from "acorn";
import jsx from "acorn-jsx";
import crypto from "crypto";
import { exec } from "child_process";
import { platform } from "os";
import type { Request, Response } from "express";

function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd: string;
    const os = platform();
    if (os === 'darwin') {
      cmd = `open "${url}"`;
    } else if (os === 'win32') {
      cmd = `start "" "${url}"`;
    } else {
      cmd = `xdg-open "${url}"`;
    }
    exec(cmd, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

const acornJsx = acorn.Parser.extend(jsx());

interface FlowNode {
  id: string;
  type: string;
  label: string;
  snippet: string;
  line: number;
}

interface FlowEdge {
  source: string;
  target: string;
  condition?: string;
}

interface AnalysisResult {
  summary: {
    nodeCount: number;
    edgeCount: number;
    complexityScore: number;
    entryPoint: string | null;
    nodeTypes: Record<string, number>;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  flowDescription: string;
}

function analyzeCode(code: string): AnalysisResult {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let nodeCounter = 0;
  let complexityScore = 0;
  let entryPoint: string | null = null;
  const nodeTypes: Record<string, number> = {};
  
  const createNodeId = () => `n${nodeCounter++}`;
  
  const incrementType = (type: string) => {
    nodeTypes[type] = (nodeTypes[type] || 0) + 1;
  };

  try {
    const ast = acornJsx.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true,
    }) as any;

    function processNode(node: any, parentId: string | null = null): string | null {
      if (!node) return null;

      switch (node.type) {
        case 'FunctionDeclaration': {
          const name = node.id?.name || 'anonymous';
          if (!entryPoint) entryPoint = name;
          const id = createNodeId();
          nodes.push({
            id,
            type: 'function',
            label: `function ${name}()`,
            snippet: code.substring(node.start, Math.min(node.start + 50, node.end)) + '...',
            line: node.loc?.start?.line || 0,
          });
          incrementType('function');
          
          if (node.body?.body) {
            let prevId = id;
            for (const stmt of node.body.body) {
              const stmtId = processNode(stmt, prevId);
              if (stmtId) prevId = stmtId;
            }
          }
          return id;
        }

        case 'IfStatement': {
          complexityScore += 1;
          const id = createNodeId();
          const testCode = code.substring(node.test.start, node.test.end);
          nodes.push({
            id,
            type: 'decision',
            label: `if (${testCode.length > 30 ? testCode.substring(0, 30) + '...' : testCode})`,
            snippet: code.substring(node.start, Math.min(node.start + 60, node.end)),
            line: node.loc?.start?.line || 0,
          });
          incrementType('decision');

          if (parentId) {
            edges.push({ source: parentId, target: id });
          }

          const consequentId = processNode(node.consequent, id);
          if (consequentId) {
            edges.push({ source: id, target: consequentId, condition: 'true' });
          }

          if (node.alternate) {
            const alternateId = processNode(node.alternate, id);
            if (alternateId) {
              edges.push({ source: id, target: alternateId, condition: 'false' });
            }
          }
          return id;
        }

        case 'ForStatement':
        case 'WhileStatement':
        case 'DoWhileStatement': {
          complexityScore += 1;
          const id = createNodeId();
          const loopType = node.type.replace('Statement', '').toLowerCase();
          nodes.push({
            id,
            type: 'loop',
            label: `${loopType} loop`,
            snippet: code.substring(node.start, Math.min(node.start + 50, node.end)),
            line: node.loc?.start?.line || 0,
          });
          incrementType('loop');

          if (parentId) {
            edges.push({ source: parentId, target: id });
          }

          const bodyId = processNode(node.body, id);
          if (bodyId) {
            edges.push({ source: bodyId, target: id, condition: 'loop' });
          }
          return id;
        }

        case 'ReturnStatement': {
          const id = createNodeId();
          const returnValue = node.argument 
            ? code.substring(node.argument.start, node.argument.end)
            : 'void';
          nodes.push({
            id,
            type: 'output',
            label: `return ${returnValue.length > 20 ? returnValue.substring(0, 20) + '...' : returnValue}`,
            snippet: code.substring(node.start, node.end),
            line: node.loc?.start?.line || 0,
          });
          incrementType('output');

          if (parentId) {
            edges.push({ source: parentId, target: id });
          }
          return id;
        }

        case 'VariableDeclaration': {
          const id = createNodeId();
          const declarations = node.declarations.map((d: any) => d.id?.name || 'var').join(', ');
          nodes.push({
            id,
            type: 'process',
            label: `${node.kind} ${declarations}`,
            snippet: code.substring(node.start, Math.min(node.start + 50, node.end)),
            line: node.loc?.start?.line || 0,
          });
          incrementType('process');

          if (parentId) {
            edges.push({ source: parentId, target: id });
          }
          return id;
        }

        case 'ExpressionStatement': {
          const id = createNodeId();
          const exprCode = code.substring(node.start, node.end);
          nodes.push({
            id,
            type: 'process',
            label: exprCode.length > 40 ? exprCode.substring(0, 40) + '...' : exprCode,
            snippet: exprCode,
            line: node.loc?.start?.line || 0,
          });
          incrementType('process');

          if (parentId) {
            edges.push({ source: parentId, target: id });
          }
          return id;
        }

        case 'BlockStatement': {
          let prevId = parentId;
          for (const stmt of node.body) {
            const stmtId = processNode(stmt, prevId);
            if (stmtId) prevId = stmtId;
          }
          return prevId;
        }

        default:
          return null;
      }
    }

    for (const node of ast.body) {
      processNode(node, null);
    }

  } catch (error: any) {
    nodes.push({
      id: 'error',
      type: 'error',
      label: 'Parse Error',
      snippet: error.message,
      line: 0,
    });
  }

  const flowDescription = generateFlowDescription(nodes, edges, entryPoint);

  return {
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      complexityScore,
      entryPoint,
      nodeTypes,
    },
    nodes,
    edges,
    flowDescription,
  };
}

function generateFlowDescription(nodes: FlowNode[], edges: FlowEdge[], entryPoint: string | null): string {
  if (nodes.length === 0) {
    return "No code structure detected.";
  }

  const parts: string[] = [];
  
  if (entryPoint) {
    parts.push(`The code defines a function "${entryPoint}".`);
  }

  const decisions = nodes.filter(n => n.type === 'decision');
  const loops = nodes.filter(n => n.type === 'loop');
  const returns = nodes.filter(n => n.type === 'output');

  if (decisions.length > 0) {
    parts.push(`It contains ${decisions.length} conditional branch${decisions.length > 1 ? 'es' : ''} (if statements).`);
  }

  if (loops.length > 0) {
    parts.push(`It has ${loops.length} loop${loops.length > 1 ? 's' : ''}.`);
  }

  if (returns.length > 0) {
    parts.push(`There ${returns.length > 1 ? 'are' : 'is'} ${returns.length} return point${returns.length > 1 ? 's' : ''}.`);
  }

  return parts.join(' ') || "Simple linear code flow.";
}

function getComplexityExplanation(score: number): string {
  if (score === 0) return "Very simple - linear code with no branching.";
  if (score <= 2) return "Low complexity - a few conditional branches or loops.";
  if (score <= 5) return "Moderate complexity - multiple control flow paths.";
  if (score <= 10) return "High complexity - consider refactoring into smaller functions.";
  return "Very high complexity - strongly recommend breaking into smaller, testable units.";
}

interface DisplayPathInfo {
  pathId: string;
  nodeIds: string[];
  terminalNodeId: string;
  terminalLabel: string;
  line: number;
}

interface DisplayAuditFinding {
  type: 'duplicate_paths';
  severity: 'info' | 'warning' | 'critical';
  componentName: string;
  message: string;
  pathCount: number;
  paths: DisplayPathInfo[];
  suggestion: string;
}

interface DisplayAuditResult {
  summary: {
    totalNodes: number;
    displayNodes: number;
    uniqueComponents: string[];
    findingsCount: number;
    recommendation: string;
  };
  findings: DisplayAuditFinding[];
  parseError?: string;
}

export function analyzeDisplayPaths(code: string): DisplayAuditResult {
  const analysisResult = analyzeCode(code);
  const { nodes, edges } = analysisResult;
  
  const hasParseError = nodes.some(n => n.type === 'error');
  if (hasParseError || nodes.length === 0) {
    const errorNode = nodes.find(n => n.type === 'error');
    return {
      summary: {
        totalNodes: 0,
        displayNodes: 0,
        uniqueComponents: [],
        findingsCount: 0,
        recommendation: 'Unable to analyze - code parsing failed',
      },
      findings: [],
      parseError: errorNode?.snippet || 'Failed to parse code',
    };
  }
  
  const displayPatterns = [
    /return\s*<(\w+)/,
    /return\s+(\w+)\s*\(/,
    /render(\w+)\s*\(/,
    /<(\w+)\s/,
  ];
  
  const displayNodes = nodes.filter(node => {
    const label = node.label || '';
    return displayPatterns.some(pattern => pattern.test(label));
  });
  
  const extractComponentName = (label: string): string | null => {
    for (const pattern of displayPatterns) {
      const match = label.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };
  
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  
  const adjacencyListReverse = new Map<string, { source: string; condition?: string }[]>();
  for (const edge of edges) {
    const sources = adjacencyListReverse.get(edge.target) || [];
    sources.push({ source: edge.source, condition: edge.condition });
    adjacencyListReverse.set(edge.target, sources);
  }
  
  type BranchSignature = { nodeId: string; outcome: string }[];
  
  const traceBranchSignatures = (targetId: string, maxDepth = 15): BranchSignature[] => {
    const signatures: BranchSignature[] = [];
    const seenSigs = new Set<string>();
    
    const dfs = (currentId: string, signature: BranchSignature, depth: number, visited: Set<string>) => {
      if (depth > maxDepth) return;
      if (visited.has(currentId)) return;
      
      const newVisited = new Set(visited);
      newVisited.add(currentId);
      
      const parents = adjacencyListReverse.get(currentId) || [];
      
      if (parents.length === 0) {
        const sigKey = signature.map(s => `${s.nodeId}:${s.outcome}`).join('|');
        if (!seenSigs.has(sigKey)) {
          seenSigs.add(sigKey);
          signatures.push([...signature]);
        }
        return;
      }
      
      for (const { source, condition } of parents) {
        const parentNode = nodeById.get(source);
        let newSignature = signature;
        
        if (parentNode?.type === 'decision' && condition) {
          newSignature = [{ nodeId: source, outcome: condition }, ...signature];
        }
        
        dfs(source, newSignature, depth + 1, newVisited);
      }
    };
    
    dfs(targetId, [], 0, new Set());
    return signatures;
  };
  
  const terminalsByComponent = new Map<string, { node: FlowNode; line: number }[]>();
  
  for (const displayNode of displayNodes) {
    const componentName = extractComponentName(displayNode.label);
    if (!componentName) continue;
    
    const existing = terminalsByComponent.get(componentName) || [];
    existing.push({ node: displayNode, line: displayNode.line });
    terminalsByComponent.set(componentName, existing);
  }
  
  const findings: DisplayAuditFinding[] = [];
  
  for (const [componentName, terminals] of terminalsByComponent.entries()) {
    const uniqueByLine = new Map<number, { node: FlowNode; signature: BranchSignature }>();
    
    for (const { node } of terminals) {
      if (!uniqueByLine.has(node.line)) {
        const signatures = traceBranchSignatures(node.id);
        const bestSig = signatures.reduce((a, b) => a.length >= b.length ? a : b, []);
        uniqueByLine.set(node.line, { node, signature: bestSig });
      }
    }
    
    const renderPointCount = uniqueByLine.size;
    const renderPoints: DisplayPathInfo[] = [];
    let counter = 0;
    
    for (const [line, { node, signature }] of uniqueByLine.entries()) {
      counter++;
      renderPoints.push({
        pathId: `p${counter}`,
        nodeIds: signature.map(s => s.nodeId),
        terminalNodeId: node.id,
        terminalLabel: node.label,
        line,
      });
    }
    
    if (renderPointCount > 2) {
      let severity: 'info' | 'warning' | 'critical';
      if (renderPointCount <= 3) {
        severity = 'info';
      } else if (renderPointCount <= 5) {
        severity = 'warning';
      } else {
        severity = 'critical';
      }
      
      findings.push({
        type: 'duplicate_paths',
        severity,
        componentName,
        message: `Found ${renderPointCount} different places that render "${componentName}"`,
        pathCount: renderPointCount,
        paths: renderPoints,
        suggestion: `Consider consolidating these ${renderPointCount} render points into a single function or shared component`,
      });
    }
  }
  
  const uniqueComponents = [...new Set(
    displayNodes
      .map(n => extractComponentName(n.label))
      .filter((c): c is string => c !== null)
  )];
  
  return {
    summary: {
      totalNodes: nodes.length,
      displayNodes: displayNodes.length,
      uniqueComponents,
      findingsCount: findings.length,
      recommendation: findings.length > 0
        ? 'Review and consolidate duplicate paths before adding new features'
        : 'No duplicate display paths detected - safe to proceed',
    },
    findings,
  };
}

export function createMCPServer() {
  const server = new Server(
    {
      name: "logigo-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "analyze_code",
          description: "Parse JavaScript/TypeScript code and return flowchart structure with nodes, edges, and complexity analysis. Use this to visualize code control flow.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to analyze",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "get_complexity",
          description: "Get a complexity score and explanation for JavaScript/TypeScript code. Helps identify code that may need refactoring.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to analyze for complexity",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "explain_flow",
          description: "Get a natural language explanation of how code flows, including branches, loops, and return points.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to explain",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "find_branches",
          description: "Find all conditional branches (if statements, ternaries) in the code and list their conditions.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to search for branches",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "count_paths",
          description: "Count the number of unique execution paths through the code. Useful for understanding test coverage needs.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to analyze for paths",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "display_audit",
          description: "Analyze code for redundant display logic and duplicate paths. Detects when multiple code branches lead to similar UI outputs (e.g., 3 different paths all rendering the same component). Use this before adding new features to prevent creating additional redundant paths.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to audit for duplicate display paths",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "visualize_flow",
          description: "Open the LogicArt visual flowchart in a browser window. Use this when working in a terminal-based environment (like Claude Code) to see the flowchart visually. The browser will open with an interactive flowchart of the code.",
          inputSchema: {
            type: "object" as const,
            properties: {
              code: {
                type: "string",
                description: "The JavaScript or TypeScript code to visualize as a flowchart",
              },
            },
            required: ["code"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args || typeof args.code !== 'string') {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "Missing required 'code' parameter" }),
          },
        ],
        isError: true,
      };
    }

    const code = args.code as string;

    switch (name) {
      case "analyze_code": {
        const result = analyzeCode(code);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_complexity": {
        const result = analyzeCode(code);
        const explanation = getComplexityExplanation(result.summary.complexityScore);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                complexityScore: result.summary.complexityScore,
                explanation,
                nodeTypes: result.summary.nodeTypes,
                recommendation: result.summary.complexityScore > 5 
                  ? "Consider breaking this code into smaller functions for better maintainability."
                  : "Complexity is manageable.",
              }, null, 2),
            },
          ],
        };
      }

      case "explain_flow": {
        const result = analyzeCode(code);
        return {
          content: [
            {
              type: "text" as const,
              text: result.flowDescription,
            },
          ],
        };
      }

      case "find_branches": {
        const result = analyzeCode(code);
        const branches = result.nodes
          .filter(n => n.type === 'decision')
          .map(n => ({
            line: n.line,
            condition: n.label,
            snippet: n.snippet,
          }));
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                branchCount: branches.length,
                branches,
              }, null, 2),
            },
          ],
        };
      }

      case "count_paths": {
        const result = analyzeCode(code);
        const decisions = result.nodes.filter(n => n.type === 'decision').length;
        const estimatedPaths = Math.pow(2, decisions);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                decisionPoints: decisions,
                estimatedPaths,
                note: estimatedPaths > 16 
                  ? "High path count - comprehensive testing may be challenging."
                  : "Path count is reasonable for thorough testing.",
              }, null, 2),
            },
          ],
        };
      }

      case "display_audit": {
        const result = analyzeDisplayPaths(code);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "visualize_flow": {
        const encodedCode = encodeURIComponent(code);
        const baseUrl = process.env.LOGICART_URL || "https://logic.art";
        const visualizerUrl = `${baseUrl}/?code=${encodedCode}&autorun=true`;
        
        return {
          content: [
            {
              type: "text" as const,
              text: `Open this URL to view the flowchart:\n\n${visualizerUrl}\n\nFeatures: Step-by-step execution, Variable tracking, Collapsible containers`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  });

  return server;
}

const activeSessions = new Map<string, SSEServerTransport>();

export async function handleMCPSSE(req: Request, res: Response) {
  const server = createMCPServer();
  const transport = new SSEServerTransport("/api/mcp/messages", res);
  
  const sessionId = crypto.randomUUID();
  activeSessions.set(sessionId, transport);
  
  res.on("close", () => {
    activeSessions.delete(sessionId);
  });

  await server.connect(transport);
}

export async function handleMCPMessage(req: Request, res: Response) {
  const sessionId = req.query.sessionId as string;
  const transport = activeSessions.get(sessionId);
  
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await transport.handlePostMessage(req, res);
}
