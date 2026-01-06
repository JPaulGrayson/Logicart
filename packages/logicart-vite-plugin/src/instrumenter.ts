import * as acorn from 'acorn';
import MagicString from 'magic-string';
import { StructuralIdGenerator, generateFileChecksum } from './hash.js';
import { computeLayout } from './layout.js';
import type { FlowNode, FlowEdge, CheckpointMetadata, InstrumentResult } from './types.js';

interface ScopeFrame {
  variables: Set<string>;
  type: 'global' | 'function' | 'block';
  name: string;
}

interface VisitorState {
  filePath: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  checkpoints: Record<string, CheckpointMetadata>;
  functions: string[];
  currentFunction: string | null;
  edgeCounter: number;
  pendingConnections: Array<{ from: string; to: string; label?: string }>;
  lastNodeId: string | null;
  scopeStack: ScopeFrame[];
  idGenerator: StructuralIdGenerator;
}

function getCurrentScopeVariables(state: VisitorState): string[] {
  const allVars = new Set<string>();
  for (const frame of state.scopeStack) {
    for (const varName of frame.variables) {
      allVars.add(varName);
    }
  }
  return Array.from(allVars).slice(0, 10);
}

function pushScope(state: VisitorState, type: ScopeFrame['type'], name: string = ''): void {
  state.scopeStack.push({ variables: new Set(), type, name });
}

function getScopePath(state: VisitorState): string {
  return state.scopeStack.map(f => f.name || f.type).join('/');
}

function popScope(state: VisitorState): void {
  if (state.scopeStack.length > 1) {
    state.scopeStack.pop();
  }
}

function addToCurrentScope(state: VisitorState, varName: string): void {
  const currentFrame = state.scopeStack[state.scopeStack.length - 1];
  if (currentFrame) {
    currentFrame.variables.add(varName);
  }
}

type AcornNode = acorn.Node & {
  type: string;
  loc?: acorn.SourceLocation;
  body?: AcornNode | AcornNode[];
  id?: { name: string };
  params?: AcornNode[];
  test?: AcornNode;
  consequent?: AcornNode;
  alternate?: AcornNode;
  init?: AcornNode;
  update?: AcornNode;
  left?: AcornNode;
  right?: AcornNode;
  argument?: AcornNode;
  declarations?: Array<{ id: { name: string } }>;
  expression?: AcornNode;
  callee?: AcornNode;
  cases?: AcornNode[];
};

function getNodeLabel(node: AcornNode, code: string): string {
  if (!node.loc) return 'Unknown';
  
  const startOffset = (node as any).start || 0;
  const endOffset = (node as any).end || startOffset + 50;
  const snippet = code.substring(startOffset, Math.min(endOffset, startOffset + 60));
  const firstLine = snippet.split('\n')[0].trim();
  
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }
  return firstLine;
}

function extractTestCondition(test: AcornNode | undefined, code: string): string {
  if (!test || !test.loc) return 'condition';
  
  const start = (test as any).start || 0;
  const end = (test as any).end || start + 30;
  const condition = code.substring(start, end).trim();
  
  if (condition.length > 30) {
    return condition.substring(0, 27) + '...';
  }
  return condition;
}


function createFlowNode(
  id: string,
  type: FlowNode['type'],
  nodeType: FlowNode['data']['nodeType'],
  label: string,
  filePath: string,
  loc: acorn.SourceLocation,
  code?: string
): FlowNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      label,
      nodeType,
      sourceFile: filePath,
      sourceLine: loc.start.line,
      sourceColumn: loc.start.column,
      code
    }
  };
}

function addEdge(state: VisitorState, source: string, target: string, label?: string): void {
  state.edges.push({
    id: `edge_${state.edgeCounter++}`,
    source,
    target,
    type: 'smoothstep',
    label
  });
}

export function instrumentFile(code: string, filePath: string): InstrumentResult {
  const idGenerator = new StructuralIdGenerator(filePath);
  const state: VisitorState = {
    filePath,
    nodes: [],
    edges: [],
    checkpoints: {},
    functions: [],
    currentFunction: null,
    edgeCounter: 0,
    pendingConnections: [],
    lastNodeId: null,
    scopeStack: [{ variables: new Set(), type: 'global', name: 'global' }],
    idGenerator
  };
  
  let ast: acorn.Node;
  try {
    ast = acorn.parse(code, { 
      ecmaVersion: 2020, 
      sourceType: 'module',
      locations: true 
    });
  } catch (error) {
    console.error(`[LogiGo] Parse error in ${filePath}:`, error);
    return { code, nodes: [], edges: [], checkpoints: {}, functions: [] };
  }
  
  const startNodeId = 'start_' + state.idGenerator.generateNodeId('Program', getScopePath(state));
  state.nodes.push({
    id: startNodeId,
    type: 'input',
    position: { x: 0, y: 0 },
    data: {
      label: 'Start',
      nodeType: 'statement',
      sourceFile: filePath,
      sourceLine: 1,
      sourceColumn: 0
    }
  });
  state.lastNodeId = startNodeId;
  
  processNode(ast as AcornNode, state, code);
  
  const layoutedNodes = computeLayout(state.nodes, state.edges);
  
  const s = new MagicString(code);
  const { injections, arrowRewrites } = generateCheckpointInjections(state.checkpoints, code);
  
  arrowRewrites.sort((a, b) => b.bodyStart - a.bodyStart);
  arrowRewrites.forEach(({ bodyStart, bodyEnd, checkpoint }) => {
    const originalBody = code.slice(bodyStart, bodyEnd);
    const rewritten = `{ ${checkpoint}; return ${originalBody}; }`;
    s.overwrite(bodyStart, bodyEnd, rewritten);
  });
  
  injections.sort((a, b) => b.position - a.position);
  injections.forEach(({ position, injection }) => {
    s.appendLeft(position, injection);
  });
  
  return {
    code: s.toString(),
    nodes: layoutedNodes,
    edges: state.edges,
    checkpoints: state.checkpoints,
    functions: state.functions
  };
}

function processNode(node: AcornNode, state: VisitorState, code: string): string | null {
  if (!node || !node.loc) return null;
  
  switch (node.type) {
    case 'Program': {
      const body = Array.isArray(node.body) ? node.body : [node.body];
      let lastId = state.lastNodeId;
      
      for (const stmt of body) {
        if (stmt) {
          const prevLast = state.lastNodeId;
          const stmtId = processNode(stmt as AcornNode, state, code);
          if (stmtId && prevLast && prevLast !== stmtId) {
            const existingEdge = state.edges.find(e => e.source === prevLast && e.target === stmtId);
            if (!existingEdge) {
              addEdge(state, prevLast, stmtId);
            }
          }
          if (stmtId) {
            lastId = stmtId;
            state.lastNodeId = stmtId;
          }
        }
      }
      return lastId;
    }
    
    case 'BlockStatement': {
      pushScope(state, 'block');
      
      const body = Array.isArray(node.body) ? node.body : [node.body];
      let lastId = state.lastNodeId;
      
      for (const stmt of body) {
        if (stmt) {
          const prevLast = state.lastNodeId;
          const stmtId = processNode(stmt as AcornNode, state, code);
          if (stmtId && prevLast && prevLast !== stmtId) {
            const existingEdge = state.edges.find(e => e.source === prevLast && e.target === stmtId);
            if (!existingEdge) {
              addEdge(state, prevLast, stmtId);
            }
          }
          if (stmtId) {
            lastId = stmtId;
            state.lastNodeId = stmtId;
          }
        }
      }
      
      popScope(state);
      return lastId;
    }
    
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': {
      const fnName = node.id?.name || 'anonymous';
      const nodeId = state.idGenerator.generateNodeId(node.type, getScopePath(state), fnName);
      
      if (node.type === 'FunctionDeclaration') {
        state.functions.push(fnName);
      }
      
      const params = (node.params || []).map((p: any) => p.name || 'param').join(', ');
      const label = `function ${fnName}(${params})`;
      
      state.nodes.push(createFlowNode(nodeId, 'input', 'function', label, state.filePath, node.loc));
      
      state.checkpoints[nodeId] = {
        file: state.filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        label: fnName,
        type: 'function',
        parentFunction: state.currentFunction || 'global',
        capturedVariables: getCurrentScopeVariables(state)
      };
      
      if (state.lastNodeId) {
        addEdge(state, state.lastNodeId, nodeId);
      }
      
      const prevFunction = state.currentFunction;
      const prevLastNode = state.lastNodeId;
      state.currentFunction = fnName;
      state.lastNodeId = nodeId;
      
      pushScope(state, 'function', fnName);
      (node.params || []).forEach((p: any) => {
        if (p.name) addToCurrentScope(state, p.name);
      });
      
      if (node.body) {
        const body = node.body as AcornNode;
        if (node.type === 'ArrowFunctionExpression' && body.type !== 'BlockStatement') {
          const returnNodeId = state.idGenerator.generateNodeId('ReturnStatement', getScopePath(state));
          const label = 'return ...';
          
          state.nodes.push(createFlowNode(returnNodeId, 'output', 'return', label, state.filePath, body.loc!));
          
          state.checkpoints[returnNodeId] = {
            file: state.filePath,
            line: body.loc!.start.line,
            column: body.loc!.start.column,
            label,
            type: 'return',
            parentFunction: state.currentFunction || 'global',
            capturedVariables: getCurrentScopeVariables(state),
            isArrowImplicitReturn: true,
            arrowBodyEnd: (body as any).end
          };
          
          if (state.lastNodeId) {
            addEdge(state, state.lastNodeId, returnNodeId);
          }
          state.lastNodeId = returnNodeId;
        } else {
          processNode(body, state, code);
        }
      }
      
      popScope(state);
      state.currentFunction = prevFunction;
      state.lastNodeId = prevLastNode;
      
      return nodeId;
    }
    
    case 'IfStatement': {
      const nodeId = state.idGenerator.generateNodeId('IfStatement', getScopePath(state));
      const condition = extractTestCondition(node.test, code);
      const label = `if (${condition})`;
      
      state.nodes.push(createFlowNode(nodeId, 'decision', 'decision', label, state.filePath, node.loc));
      
      state.checkpoints[nodeId] = {
        file: state.filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        label: condition,
        type: 'decision',
        parentFunction: state.currentFunction || 'global',
        capturedVariables: getCurrentScopeVariables(state)
      };
      
      const prevLastNode = state.lastNodeId;
      state.lastNodeId = nodeId;
      
      if (node.consequent) {
        const trueId = processNode(node.consequent as AcornNode, state, code);
        if (trueId) {
          addEdge(state, nodeId, trueId, 'true');
        }
      }
      
      if (node.alternate) {
        state.lastNodeId = nodeId;
        const falseId = processNode(node.alternate as AcornNode, state, code);
        if (falseId) {
          addEdge(state, nodeId, falseId, 'false');
        }
      }
      
      return nodeId;
    }
    
    case 'ForStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForOfStatement':
    case 'ForInStatement': {
      const nodeId = state.idGenerator.generateNodeId(node.type, getScopePath(state));
      const condition = extractTestCondition(node.test, code);
      const loopType = node.type.replace('Statement', '').toLowerCase();
      const label = `${loopType} (${condition})`;
      
      state.nodes.push(createFlowNode(nodeId, 'decision', 'loop', label, state.filePath, node.loc));
      
      state.checkpoints[nodeId] = {
        file: state.filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        label,
        type: 'loop',
        parentFunction: state.currentFunction || 'global',
        capturedVariables: getCurrentScopeVariables(state)
      };
      
      state.lastNodeId = nodeId;
      
      if (node.body) {
        const bodyId = processNode(node.body as AcornNode, state, code);
        if (bodyId) {
          addEdge(state, nodeId, bodyId, 'loop');
          addEdge(state, state.lastNodeId!, nodeId, 'continue');
        }
      }
      
      return nodeId;
    }
    
    case 'ReturnStatement': {
      const nodeId = state.idGenerator.generateNodeId('ReturnStatement', getScopePath(state));
      const hasArg = !!node.argument;
      const label = hasArg ? 'return ...' : 'return';
      
      state.nodes.push(createFlowNode(nodeId, 'output', 'return', label, state.filePath, node.loc));
      
      state.checkpoints[nodeId] = {
        file: state.filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        label,
        type: 'return',
        parentFunction: state.currentFunction || 'global',
        capturedVariables: getCurrentScopeVariables(state)
      };
      
      state.lastNodeId = nodeId;
      return nodeId;
    }
    
    case 'VariableDeclaration': {
      const nodeId = state.idGenerator.generateNodeId('VariableDeclaration', getScopePath(state));
      const varNames = (node.declarations || []).map((d: any) => d.id?.name || 'var');
      const label = `${(node as any).kind || 'let'} ${varNames.join(', ')}`;
      
      varNames.forEach(name => {
        if (name && name !== 'var') addToCurrentScope(state, name);
      });
      
      state.nodes.push(createFlowNode(nodeId, 'default', 'statement', label, state.filePath, node.loc));
      
      state.checkpoints[nodeId] = {
        file: state.filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        label,
        type: 'statement',
        parentFunction: state.currentFunction || 'global',
        capturedVariables: getCurrentScopeVariables(state)
      };
      
      state.lastNodeId = nodeId;
      return nodeId;
    }
    
    case 'ExpressionStatement': {
      const nodeId = state.idGenerator.generateNodeId('ExpressionStatement', getScopePath(state));
      const label = getNodeLabel(node, code);
      
      state.nodes.push(createFlowNode(nodeId, 'default', 'statement', label, state.filePath, node.loc));
      
      state.checkpoints[nodeId] = {
        file: state.filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        label,
        type: 'statement',
        parentFunction: state.currentFunction || 'global',
        capturedVariables: getCurrentScopeVariables(state)
      };
      
      state.lastNodeId = nodeId;
      return nodeId;
    }
    
    default:
      return null;
  }
}

interface CheckpointInjection {
  position: number;
  injection: string;
}

interface ArrowRewrite {
  bodyStart: number;
  bodyEnd: number;
  checkpoint: string;
}

function generateCheckpointInjections(
  checkpoints: Record<string, CheckpointMetadata>,
  code: string
): { injections: CheckpointInjection[]; arrowRewrites: ArrowRewrite[] } {
  const lines = code.split('\n');
  const lineOffsets: number[] = [];
  let offset = 0;
  
  for (const line of lines) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  }
  
  const injections: CheckpointInjection[] = [];
  const arrowRewrites: ArrowRewrite[] = [];
  
  for (const [nodeId, meta] of Object.entries(checkpoints)) {
    const lineIndex = meta.line - 1;
    if (lineIndex >= 0 && lineIndex < lineOffsets.length) {
      const position = lineOffsets[lineIndex] + meta.column;
      
      const varsCapture = meta.capturedVariables
        .slice(0, 5)
        .map(v => `${v}: typeof ${v} !== 'undefined' ? ${v} : undefined`)
        .join(', ');
      
      const checkpoint = `LogiGo.checkpoint('${nodeId}', { ${varsCapture} })`;
      
      if (meta.isArrowImplicitReturn && meta.arrowBodyEnd !== undefined) {
        arrowRewrites.push({
          bodyStart: position,
          bodyEnd: meta.arrowBodyEnd,
          checkpoint
        });
      } else {
        injections.push({ position, injection: checkpoint + '; ' });
      }
    }
  }
  
  return { injections, arrowRewrites };
}
