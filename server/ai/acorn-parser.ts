import * as acorn from "acorn";
import type { GroundingContext, GroundingNode, GroundingNodeType } from "@shared/grounding-types";

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

export interface ParseResult extends GroundingContext {
  functions: FunctionInfo[];
  metadata: {
    totalLines: number;
    decisionCount: number;
    loopCount: number;
    functionCount: number;
  };
}

export interface FunctionInfo {
  name: string;
  params: string[];
  startLine: number;
  endLine: number;
  nodeId: string;
  isAsync: boolean;
  isArrow: boolean;
}

export function parseCodeToFlowchart(code: string): ParseResult {
  const nodes: SimpleNode[] = [];
  const edges: SimpleEdge[] = [];
  const functions: FunctionInfo[] = [];
  let nodeCounter = 0;
  let decisionCount = 0;
  let loopCount = 0;
  
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
          const params = (node.params || []).map((p: any) => {
            if (p.type === 'Identifier') return p.name;
            if (p.type === 'AssignmentPattern' && p.left?.name) return p.left.name;
            return '...';
          });
          const isAsync = node.async || false;
          const isArrow = node.type === 'ArrowFunctionExpression';
          
          nodes.push({
            id,
            type: 'FUNCTION',
            label: `function ${name}(${params.join(', ')})`,
            snippet: code.slice(node.start, Math.min(node.start + 80, node.end)),
            line: node.loc?.start?.line || 0
          });
          
          functions.push({
            name,
            params,
            startLine: node.loc?.start?.line || 0,
            endLine: node.loc?.end?.line || 0,
            nodeId: id,
            isAsync,
            isArrow
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
          decisionCount++;
          const id = createNodeId();
          const testCode = code.slice(node.test.start, node.test.end);
          nodes.push({
            id,
            type: 'DECISION',
            label: `if (${testCode.slice(0, 40)})`,
            snippet: testCode.slice(0, 80),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          
          const edgeCountBefore = edges.length;
          processNode(node.consequent, id);
          if (edges.length > edgeCountBefore) {
            const lastEdge = edges[edges.length - 1];
            if (lastEdge.source === id) lastEdge.condition = 'true';
          }
          
          if (node.alternate) {
            const edgeCountBeforeAlt = edges.length;
            processNode(node.alternate, id);
            if (edges.length > edgeCountBeforeAlt) {
              const lastEdge = edges[edges.length - 1];
              if (lastEdge.source === id) lastEdge.condition = 'false';
            }
          }
          return id;
        }
        
        case 'ForStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ForOfStatement':
        case 'ForInStatement': {
          loopCount++;
          const id = createNodeId();
          const loopType = node.type.replace('Statement', '').toLowerCase();
          nodes.push({
            id,
            type: 'LOOP',
            label: loopType,
            snippet: code.slice(node.start, Math.min(node.start + 80, node.end)),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          if (node.body) processNode(node.body, id);
          return id;
        }
        
        case 'SwitchStatement': {
          decisionCount++;
          const id = createNodeId();
          const discrim = code.slice(node.discriminant.start, node.discriminant.end);
          nodes.push({
            id,
            type: 'DECISION',
            label: `switch (${discrim.slice(0, 30)})`,
            snippet: discrim.slice(0, 80),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          
          for (const caseNode of node.cases || []) {
            const caseId = createNodeId();
            const caseLabel = caseNode.test 
              ? `case ${code.slice(caseNode.test.start, caseNode.test.end).slice(0, 20)}`
              : 'default';
            nodes.push({
              id: caseId,
              type: 'ACTION',
              label: caseLabel,
              snippet: caseLabel,
              line: caseNode.loc?.start?.line || 0
            });
            edges.push({ source: id, target: caseId, condition: caseLabel });
            
            let lastCaseId = caseId;
            for (const stmt of caseNode.consequent || []) {
              const stmtId = processNode(stmt, lastCaseId);
              if (stmtId) lastCaseId = stmtId;
            }
          }
          return id;
        }
        
        case 'TryStatement': {
          const id = createNodeId();
          nodes.push({
            id,
            type: 'ACTION',
            label: 'try',
            snippet: 'try { ... }',
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          
          if (node.block) processNode(node.block, id);
          
          if (node.handler) {
            const catchId = createNodeId();
            const param = node.handler.param?.name || 'error';
            nodes.push({
              id: catchId,
              type: 'ACTION',
              label: `catch (${param})`,
              snippet: `catch (${param}) { ... }`,
              line: node.handler.loc?.start?.line || 0
            });
            edges.push({ source: id, target: catchId, condition: 'error' });
            if (node.handler.body) processNode(node.handler.body, catchId);
          }
          
          if (node.finalizer) {
            const finallyId = createNodeId();
            nodes.push({
              id: finallyId,
              type: 'ACTION',
              label: 'finally',
              snippet: 'finally { ... }',
              line: node.finalizer.loc?.start?.line || 0
            });
            edges.push({ source: id, target: finallyId, condition: 'finally' });
            processNode(node.finalizer, finallyId);
          }
          return id;
        }
        
        case 'ReturnStatement': {
          const id = createNodeId();
          const retValue = node.argument ? code.slice(node.argument.start, node.argument.end) : 'void';
          nodes.push({
            id,
            type: 'ACTION',
            label: `return ${retValue.slice(0, 30)}`,
            snippet: retValue.slice(0, 80),
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          return id;
        }
        
        case 'ThrowStatement': {
          const id = createNodeId();
          const throwValue = node.argument ? code.slice(node.argument.start, node.argument.end) : '';
          nodes.push({
            id,
            type: 'ACTION',
            label: `throw ${throwValue.slice(0, 30)}`,
            snippet: throwValue.slice(0, 80),
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
            label: exprCode.slice(0, 50),
            snippet: exprCode.slice(0, 80),
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
            label: declCode.slice(0, 50),
            snippet: declCode.slice(0, 80),
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
        
        case 'BreakStatement':
        case 'ContinueStatement': {
          const id = createNodeId();
          nodes.push({
            id,
            type: 'ACTION',
            label: node.type === 'BreakStatement' ? 'break' : 'continue',
            snippet: node.type === 'BreakStatement' ? 'break' : 'continue',
            line: node.loc?.start?.line || 0
          });
          if (parentId) edges.push({ source: parentId, target: id });
          return id;
        }
        
        default:
          return parentId;
      }
    }
    
    const body = (ast as any).body;
    let lastId: string | null = null;
    for (const node of body) {
      const nodeId = processNode(node, lastId);
      if (nodeId) lastId = nodeId;
    }
    
  } catch (error) {
    console.error("Acorn parse error:", error);
    throw error;
  }
  
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
  
  const totalLines = code.split('\n').length;
  
  return {
    summary: {
      entryPoint: nodes[0]?.id || 'unknown',
      nodeCount: nodes.length,
      complexityScore: decisionCount + loopCount
    },
    flow: groundingNodes,
    functions,
    metadata: {
      totalLines,
      decisionCount,
      loopCount,
      functionCount: functions.length
    }
  };
}

export function extractFunctionByName(code: string, functionName: string): { code: string; startLine: number; endLine: number } | null {
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true
    });
    
    function findFunction(node: any): any {
      if (!node) return null;
      
      if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.id?.name === functionName) {
        return node;
      }
      
      if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.id?.name === functionName && 
              (decl.init?.type === 'ArrowFunctionExpression' || decl.init?.type === 'FunctionExpression')) {
            return { ...decl.init, id: { name: functionName }, loc: node.loc, start: node.start, end: node.end };
          }
        }
      }
      
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'type') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object') {
              const result = findFunction(item);
              if (result) return result;
            }
          }
        } else if (child && typeof child === 'object') {
          const result = findFunction(child);
          if (result) return result;
        }
      }
      return null;
    }
    
    const fn = findFunction(ast);
    if (fn) {
      return {
        code: code.slice(fn.start, fn.end),
        startLine: fn.loc?.start?.line || 0,
        endLine: fn.loc?.end?.line || 0
      };
    }
    return null;
  } catch {
    return null;
  }
}
