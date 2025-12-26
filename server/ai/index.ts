import type { Express, Request, Response } from "express";
import { parseCodeToFlowchart, extractFunctionByName, type ParseResult, type FunctionInfo } from "./acorn-parser";
import type { GroundingContext } from "@shared/grounding-types";

export { parseCodeToFlowchart, type ParseResult } from "./acorn-parser";

export interface ParseRequest {
  code: string;
  functionName?: string;
}

export interface ParseResponse {
  success: boolean;
  flowchart?: ParseResult;
  error?: string;
}

export interface TraceRequest {
  code: string;
  functionName: string;
  inputs: Record<string, any>;
  maxSteps?: number;
}

export interface TraceStep {
  step: number;
  nodeId: string;
  label: string;
  line?: number;
  variables: Record<string, any>;
}

export interface TraceResponse {
  success: boolean;
  steps?: TraceStep[];
  result?: any;
  error?: string;
  pathSummary?: string;
  executedNodes?: string[];
  branchDecisions?: Array<{ nodeId: string; condition: string; result: boolean }>;
}

export interface SimilarRequest {
  targetCode: string;
  searchIn: Array<{ path: string; code: string }>;
  threshold?: number;
}

export interface SimilarMatch {
  path: string;
  functionName: string;
  similarity: number;
  matchType: 'structural' | 'functional';
  differences: string[];
  recommendation: string;
  sourceSnippet: string;
}

export interface SimilarResponse {
  success: boolean;
  matches?: SimilarMatch[];
  summary?: string;
  error?: string;
}

export interface ImpactRequest {
  targetFunction: string;
  codebase: Array<{ path: string; code: string }>;
}

export interface Caller {
  path: string;
  functionName: string;
  line: number;
  usageType: 'direct_call' | 'callback' | 'property_access';
}

export interface ImpactResponse {
  success: boolean;
  callers?: Caller[];
  transitiveCallers?: Caller[];
  impactSummary?: {
    directCallers: number;
    transitiveCallers: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  safeChanges?: string[];
  riskyChanges?: string[];
  error?: string;
}

interface SimulatedTrace {
  steps: TraceStep[];
  pathSummary: string;
  executedNodes: string[];
  branchDecisions: Array<{ nodeId: string; condition: string; result: boolean }>;
}

interface ConditionEvalResult {
  result: boolean;
  confidence: 'high' | 'low' | 'unknown';
  reason: string;
}

function evaluateCondition(condition: string, variables: Record<string, any>): ConditionEvalResult {
  const simpleVarPattern = /if\s*\((\w+)\)\s*$/;
  const negationPattern = /if\s*\(!(\w+)\)\s*$/;
  const nullCheckPattern = /if\s*\((\w+)\s*(!==?|===?)\s*(null|undefined)\)/;
  const comparisonPattern = /if\s*\((\w+)\s*([<>=!]+)\s*(\d+)\)/;
  
  let match = condition.match(simpleVarPattern);
  if (match) {
    const varName = match[1];
    if (varName in variables) {
      return { result: Boolean(variables[varName]), confidence: 'high', reason: `Evaluated ${varName} as truthy/falsy` };
    }
    return { result: true, confidence: 'unknown', reason: `Variable ${varName} not in inputs, assuming true` };
  }
  
  match = condition.match(negationPattern);
  if (match) {
    const varName = match[1];
    if (varName in variables) {
      return { result: !Boolean(variables[varName]), confidence: 'high', reason: `Evaluated !${varName}` };
    }
    return { result: true, confidence: 'unknown', reason: `Variable ${varName} not in inputs, assuming true` };
  }
  
  match = condition.match(nullCheckPattern);
  if (match) {
    const [, varName, op] = match;
    if (varName in variables) {
      const val = variables[varName];
      const isNull = val === null || val === undefined;
      const result = op.includes('!') ? !isNull : isNull;
      return { result, confidence: 'high', reason: `Null check on ${varName}` };
    }
    return { result: true, confidence: 'unknown', reason: `Variable ${varName} not in inputs` };
  }
  
  match = condition.match(comparisonPattern);
  if (match) {
    const [, varName, op, numStr] = match;
    if (varName in variables && typeof variables[varName] === 'number') {
      const val = variables[varName];
      const num = parseInt(numStr, 10);
      let result = true;
      switch (op) {
        case '<': result = val < num; break;
        case '>': result = val > num; break;
        case '<=': result = val <= num; break;
        case '>=': result = val >= num; break;
        case '==': case '===': result = val === num; break;
        case '!=': case '!==': result = val !== num; break;
      }
      return { result, confidence: 'high', reason: `Comparison ${varName} ${op} ${num}` };
    }
    return { result: true, confidence: 'low', reason: `Could not evaluate comparison` };
  }
  
  return { result: true, confidence: 'unknown', reason: `Complex condition - cannot evaluate statically` };
}

interface SimulatedTraceResult extends SimulatedTrace {
  warnings: string[];
  confidence: 'high' | 'partial' | 'low';
}

function simulateTrace(flowchart: ParseResult, inputs: Record<string, any>, maxSteps: number): SimulatedTraceResult {
  const steps: TraceStep[] = [];
  const executedNodes: string[] = [];
  const branchDecisions: Array<{ nodeId: string; condition: string; result: boolean }> = [];
  const warnings: string[] = [];
  let stoppedAtUncertainty = false;
  
  const childMap = new Map<string, Array<{ targetId: string; condition?: string }>>();
  for (const node of flowchart.flow) {
    childMap.set(node.id, node.children);
  }
  
  let currentNodeId = flowchart.summary.entryPoint;
  let stepNum = 0;
  const visited = new Set<string>();
  
  while (currentNodeId && stepNum < maxSteps) {
    if (visited.has(currentNodeId)) {
      warnings.push(`Loop detected at ${currentNodeId} - trace incomplete`);
      stoppedAtUncertainty = true;
      break;
    }
    visited.add(currentNodeId);
    
    const node = flowchart.flow.find(n => n.id === currentNodeId);
    if (!node) break;
    
    steps.push({
      step: stepNum++,
      nodeId: node.id,
      label: node.label,
      variables: { ...inputs }
    });
    executedNodes.push(node.id);
    
    const children = childMap.get(node.id) || [];
    
    if (node.type === 'DECISION' && children.length > 1) {
      const evalResult = evaluateCondition(node.label, inputs);
      
      if (evalResult.confidence !== 'high') {
        warnings.push(`Trace stopped at ${node.id}: ${evalResult.reason}`);
        stoppedAtUncertainty = true;
        break;
      }
      
      branchDecisions.push({
        nodeId: node.id,
        condition: node.label,
        result: evalResult.result
      });
      
      const branch = children.find(c => 
        evalResult.result ? c.condition === 'true' : c.condition === 'false'
      ) || children[0];
      currentNodeId = branch?.targetId || '';
    } else if (node.type === 'LOOP') {
      warnings.push(`Trace stopped at loop ${node.id} - cannot simulate iterations`);
      stoppedAtUncertainty = true;
      break;
    } else if (children.length > 0) {
      currentNodeId = children[0].targetId;
    } else {
      break;
    }
  }
  
  const pathSummary = steps.map(s => s.label.slice(0, 25)).join(' → ');
  
  const confidence: 'high' | 'partial' | 'low' = stoppedAtUncertainty ? 'partial' : 'high';
  
  return {
    steps,
    pathSummary,
    executedNodes,
    branchDecisions,
    warnings,
    confidence
  };
}

export function registerAIRoutes(app: Express) {
  app.post("/api/ai/parse", (req: Request, res: Response) => {
    try {
      const { code, functionName } = req.body as ParseRequest;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: "Missing or invalid 'code' field" 
        });
      }
      
      let codeToAnalyze = code;
      
      if (functionName) {
        const extracted = extractFunctionByName(code, functionName);
        if (!extracted) {
          return res.status(404).json({
            success: false,
            error: `Function '${functionName}' not found in code`
          });
        }
        codeToAnalyze = extracted.code;
      }
      
      const flowchart = parseCodeToFlowchart(codeToAnalyze);
      
      res.json({ success: true, flowchart } as ParseResponse);
    } catch (error) {
      console.error("Parse API error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to parse code" 
      });
    }
  });

  app.post("/api/ai/trace", (req: Request, res: Response) => {
    try {
      const { code, functionName, inputs, maxSteps = 100 } = req.body as TraceRequest;
      
      if (!code || !functionName) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: code, functionName" 
        });
      }
      
      const extracted = extractFunctionByName(code, functionName);
      if (!extracted) {
        return res.status(404).json({
          success: false,
          error: `Function '${functionName}' not found in code`
        });
      }
      
      const flowchart = parseCodeToFlowchart(extracted.code);
      
      const trace = simulateTrace(flowchart, inputs, maxSteps);
      
      if (trace.confidence !== 'high') {
        return res.status(501).json({
          success: false,
          error: "Cannot trace this function - contains complex conditions or loops that require runtime execution",
          partialSteps: trace.steps,
          stoppedAt: trace.warnings[0] || "Unknown stopping point",
          note: "Static analysis cannot determine execution path. Use /api/ai/parse for flowchart structure instead."
        });
      }
      
      res.json({
        success: true,
        steps: trace.steps,
        pathSummary: trace.pathSummary,
        executedNodes: trace.executedNodes,
        branchDecisions: trace.branchDecisions,
        note: "Static trace - evaluated simple conditions only, no code execution"
      });
    } catch (error) {
      console.error("Trace API error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to trace code" 
      });
    }
  });

  app.post("/api/ai/similar", (req: Request, res: Response) => {
    try {
      const { targetCode, searchIn, threshold = 0.5 } = req.body as SimilarRequest;
      
      if (!targetCode || !searchIn || !Array.isArray(searchIn)) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: targetCode, searchIn" 
        });
      }
      
      const targetFlowchart = parseCodeToFlowchart(targetCode);
      const matches: SimilarMatch[] = [];
      
      for (const file of searchIn) {
        try {
          const fileFlowchart = parseCodeToFlowchart(file.code);
          
          for (const fn of fileFlowchart.functions) {
            const fnCode = extractFunctionByName(file.code, fn.name);
            if (!fnCode) continue;
            
            const fnFlowchart = parseCodeToFlowchart(fnCode.code);
            const similarity = calculateSimilarityFromParsed(targetFlowchart, fnFlowchart);
            
            if (similarity >= threshold) {
              const differences = findDifferences(targetFlowchart, fnFlowchart);
              matches.push({
                path: file.path,
                functionName: fn.name,
                similarity,
                matchType: similarity > 0.8 ? 'structural' : 'functional',
                differences,
                recommendation: similarity > 0.8 
                  ? `Consider reusing '${fn.name}' - very similar structure`
                  : `'${fn.name}' has similar patterns but different implementation`,
                sourceSnippet: fnCode.code.slice(0, 200)
              });
            }
          }
        } catch {
          continue;
        }
      }
      
      matches.sort((a, b) => b.similarity - a.similarity);
      
      const summary = matches.length > 0
        ? `Found ${matches.length} similar function(s). Best match: '${matches[0].functionName}' (${Math.round(matches[0].similarity * 100)}% similar)`
        : 'No similar functions found';
      
      res.json({ success: true, matches, summary } as SimilarResponse);
    } catch (error) {
      console.error("Similar API error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to find similar code" 
      });
    }
  });

  app.post("/api/ai/impact", (req: Request, res: Response) => {
    try {
      const { targetFunction, codebase } = req.body as ImpactRequest;
      
      if (!targetFunction || !codebase || !Array.isArray(codebase)) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: targetFunction, codebase" 
        });
      }
      
      const callers: Caller[] = [];
      
      for (const file of codebase) {
        try {
          const callLocations = findFunctionCalls(file.code, targetFunction);
          for (const loc of callLocations) {
            callers.push({
              path: file.path,
              functionName: loc.callerFunction || 'module',
              line: loc.line,
              usageType: loc.usageType
            });
          }
        } catch {
          continue;
        }
      }
      
      const directCount = callers.length;
      const riskLevel: 'low' | 'medium' | 'high' = 
        directCount === 0 ? 'low' :
        directCount <= 3 ? 'medium' : 'high';
      
      const recommendation = directCount === 0
        ? `'${targetFunction}' appears unused. Safe to modify or remove.`
        : `'${targetFunction}' is used in ${directCount} location(s). Changes may affect: ${callers.map(c => c.path).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`;
      
      res.json({
        success: true,
        callers,
        transitiveCallers: [],
        impactSummary: {
          directCallers: directCount,
          transitiveCallers: 0,
          riskLevel,
          recommendation
        },
        safeChanges: [
          'Adding new optional parameters',
          'Internal refactoring without API changes',
          'Adding error handling'
        ],
        riskyChanges: [
          'Changing return type',
          'Removing or reordering parameters',
          'Changing function name'
        ]
      } as ImpactResponse);
    } catch (error) {
      console.error("Impact API error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to analyze impact" 
      });
    }
  });
}

export function calculateSimilarityFromParsed(a: ParseResult, b: ParseResult): number {
  const typeDistA = getTypeDistribution(a);
  const typeDistB = getTypeDistribution(b);
  const typeSimilarity = compareDist(typeDistA, typeDistB);
  
  const depthA = getMaxDepth(a);
  const depthB = getMaxDepth(b);
  const depthSimilarity = 1 - Math.abs(depthA - depthB) / Math.max(depthA, depthB, 1);
  
  const sizeRatio = Math.min(a.summary.nodeCount, b.summary.nodeCount) / 
                    Math.max(a.summary.nodeCount, b.summary.nodeCount, 1);
  
  return (typeSimilarity * 0.5) + (depthSimilarity * 0.3) + (sizeRatio * 0.2);
}

function getTypeDistribution(flowchart: ParseResult): Record<string, number> {
  const dist: Record<string, number> = { FUNCTION: 0, DECISION: 0, LOOP: 0, ACTION: 0 };
  for (const node of flowchart.flow) {
    dist[node.type] = (dist[node.type] || 0) + 1;
  }
  const total = flowchart.summary.nodeCount || 1;
  for (const key of Object.keys(dist)) {
    dist[key] = dist[key] / total;
  }
  return dist;
}

function compareDist(a: Record<string, number>, b: Record<string, number>): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let similarity = 0;
  for (const key of keys) {
    similarity += 1 - Math.abs((a[key] || 0) - (b[key] || 0));
  }
  return similarity / keys.size;
}

function getMaxDepth(flowchart: ParseResult): number {
  if (flowchart.flow.length === 0) return 0;
  
  const childMap = new Map<string, string[]>();
  for (const node of flowchart.flow) {
    childMap.set(node.id, node.children.map(c => c.targetId));
  }
  
  function dfs(nodeId: string, visited: Set<string>): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const children = childMap.get(nodeId) || [];
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map(c => dfs(c, visited)));
  }
  
  const entryNode = flowchart.summary.entryPoint;
  return dfs(entryNode, new Set());
}

function findDifferences(a: ParseResult, b: ParseResult): string[] {
  const diffs: string[] = [];
  
  if (a.metadata.decisionCount !== b.metadata.decisionCount) {
    diffs.push(`Different decision count (${a.metadata.decisionCount} vs ${b.metadata.decisionCount})`);
  }
  if (a.metadata.loopCount !== b.metadata.loopCount) {
    diffs.push(`Different loop count (${a.metadata.loopCount} vs ${b.metadata.loopCount})`);
  }
  if (Math.abs(a.summary.nodeCount - b.summary.nodeCount) > 2) {
    diffs.push(`Significantly different complexity`);
  }
  
  return diffs;
}

interface CallLocation {
  line: number;
  callerFunction?: string;
  usageType: 'direct_call' | 'callback' | 'property_access';
}

function findFunctionCalls(code: string, functionName: string): CallLocation[] {
  const locations: CallLocation[] = [];
  const lines = code.split('\n');
  
  const callRegex = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
  const callbackRegex = new RegExp(`[,\\(\\[]\\s*${functionName}\\s*[,\\)\\]]`, 'g');
  
  let currentFunction: string | undefined;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const fnMatch = line.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()/);
    if (fnMatch) {
      currentFunction = fnMatch[1] || fnMatch[2];
    }
    
    let match;
    while ((match = callRegex.exec(line)) !== null) {
      locations.push({
        line: i + 1,
        callerFunction: currentFunction,
        usageType: 'direct_call'
      });
    }
    
    while ((match = callbackRegex.exec(line)) !== null) {
      locations.push({
        line: i + 1,
        callerFunction: currentFunction,
        usageType: 'callback'
      });
    }
  }
  
  return locations;
}
