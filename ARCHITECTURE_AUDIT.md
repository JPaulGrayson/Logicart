# LogicArt Architecture Audit - Critical Files

This document contains the full source code of the critical LogicArt components for architectural review.

## Table of Contents
1. [Instrumentation Logic](#1-instrumentation-logic)
2. [Runtime Engine](#2-runtime-engine)
3. [Embed Component](#3-embed-component)
4. [Manifest Definition](#4-manifest-definition)
5. [Embed Types](#5-embed-types)

---

## 1. Instrumentation Logic

**File:** `packages/logicart-vite-plugin/src/instrumenter.ts`

```typescript
import * as acorn from 'acorn';
import MagicString from 'magic-string';
import { StructuralIdGenerator, generateFileChecksum } from './hash';
import { computeLayout } from './layout';
import type { FlowNode, FlowEdge, CheckpointMetadata, InstrumentResult } from './types';

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
    console.error(`[LogicArt] Parse error in ${filePath}:`, error);
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
      
      const checkpoint = `LogicArt.checkpoint('${nodeId}', { ${varsCapture} })`;
      
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
```

---

## 2. Runtime Engine

**File:** `packages/logicart-core/src/runtime.ts`

```typescript
import type { CheckpointData, RuntimeOptions, Breakpoint, LogicArtMessage } from './types';

const MAX_QUEUE_SIZE = 5000;

export class LogicArtRuntime {
  private queue: CheckpointData[] = [];
  private flushScheduled = false;
  private manifestHash: string;
  private breakpoints = new Map<string, Breakpoint>();
  private pausePromise: Promise<void> | null = null;
  private resumeCallback: (() => void) | null = null;
  private sessionId: string;
  private started = false;
  private queueOverflowWarned = false;

  constructor(options: RuntimeOptions = {}) {
    this.manifestHash = options.manifestHash || '';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    this.postMessage({
      source: 'LOGICART_CORE',
      type: 'LOGICART_SESSION_START',
      payload: {
        sessionId: this.sessionId,
        manifestHash: this.manifestHash,
        timestamp: Date.now()
      }
    });
  }

  end(): void {
    if (!this.started) return;
    
    this.flush();
    
    this.postMessage({
      source: 'LOGICART_CORE',
      type: 'LOGICART_SESSION_END',
      payload: {
        sessionId: this.sessionId,
        timestamp: Date.now()
      }
    });

    this.started = false;
  }

  checkpoint(id: string, variables?: Record<string, any>): void {
    if (!this.started) {
      this.start();
    }

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      if (!this.queueOverflowWarned) {
        console.warn(`[LogicArt] Checkpoint queue overflow (${MAX_QUEUE_SIZE} items). Dropping checkpoints to prevent browser crash. This may indicate an infinite loop.`);
        this.queueOverflowWarned = true;
      }
      return;
    }

    const data: CheckpointData = {
      id,
      variables: variables ? this.safeSerialize(variables) : {},
      timestamp: Date.now(),
      manifestVersion: this.manifestHash
    };

    this.queue.push(data);

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  async checkpointAsync(id: string, variables?: Record<string, any>): Promise<void> {
    this.checkpoint(id, variables);

    const bp = this.breakpoints.get(id);
    if (bp && bp.enabled) {
      if (!bp.condition || this.evaluateCondition(bp.condition, variables || {})) {
        await this.waitForResume();
      }
    }
  }

  setBreakpoint(id: string, enabled = true, condition?: string): void {
    this.breakpoints.set(id, { id, enabled, condition });
  }

  removeBreakpoint(id: string): void {
    this.breakpoints.delete(id);
  }

  clearBreakpoints(): void {
    this.breakpoints.clear();
  }

  resume(): void {
    if (this.resumeCallback) {
      this.resumeCallback();
      this.resumeCallback = null;
      this.pausePromise = null;
    }
  }

  private async waitForResume(): Promise<void> {
    if (this.pausePromise) return this.pausePromise;

    this.pausePromise = new Promise(resolve => {
      this.resumeCallback = resolve;
    });

    return this.pausePromise;
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      const fn = new Function(...Object.keys(variables), `return ${condition}`);
      return !!fn(...Object.values(variables));
    } catch {
      return true;
    }
  }

  private flush(): void {
    const batch = this.queue.splice(0);
    this.flushScheduled = false;
    this.queueOverflowWarned = false;

    batch.forEach(data => {
      this.postMessage({
        source: 'LOGICART_CORE',
        type: 'LOGICART_CHECKPOINT',
        payload: data
      });
    });
  }

  private postMessage(message: LogicArtMessage): void {
    if (typeof window !== 'undefined') {
      window.postMessage(message, '*');
    }
  }

  private safeSerialize(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      try {
        if (value === undefined) {
          result[key] = undefined;
        } else if (value === null) {
          result[key] = null;
        } else if (typeof value === 'function') {
          result[key] = '[Function]';
        } else if (typeof value === 'symbol') {
          result[key] = value.toString();
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            result[key] = value.slice(0, 100).map(v => 
              typeof v === 'object' ? '[Object]' : v
            );
          } else {
            result[key] = '[Object]';
          }
        } else {
          result[key] = value;
        }
      } catch {
        result[key] = '[Error serializing]';
      }
    }
    
    return result;
  }
}

let globalRuntime: LogicArtRuntime | null = null;

export function createRuntime(options?: RuntimeOptions): LogicArtRuntime {
  globalRuntime = new LogicArtRuntime(options);
  return globalRuntime;
}

export function checkpoint(id: string, variables?: Record<string, any>): void {
  if (!globalRuntime) {
    globalRuntime = new LogicArtRuntime();
  }
  globalRuntime.checkpoint(id, variables);
}

export async function checkpointAsync(id: string, variables?: Record<string, any>): Promise<void> {
  if (!globalRuntime) {
    globalRuntime = new LogicArtRuntime();
  }
  return globalRuntime.checkpointAsync(id, variables);
}

if (typeof window !== 'undefined') {
  (window as any).LogicArt = {
    checkpoint,
    checkpointAsync,
    createRuntime,
    _runtime: null as LogicArtRuntime | null,

    get runtime() {
      if (!this._runtime) {
        this._runtime = new LogicArtRuntime();
      }
      return this._runtime;
    },

    setBreakpoint(id: string, enabled?: boolean, condition?: string) {
      this.runtime.setBreakpoint(id, enabled, condition);
    },

    removeBreakpoint(id: string) {
      this.runtime.removeBreakpoint(id);
    },

    resume() {
      this.runtime.resume();
    }
  };
}

export default LogicArtRuntime;
```

---

## 3. Embed Component

**File:** `packages/logicart-embed/src/LogicArtEmbed.tsx`

```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, ReactFlowProvider, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as acorn from 'acorn';
import dagre from 'dagre';
import { LogicArtEmbedProps, EmbedState, LogicArtManifest, CheckpointPayload, FlowNode as ManifestFlowNode, FlowEdge as ManifestFlowEdge } from './types';

interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision';
  data: { label: string };
  position: { x: number; y: number };
  style?: Record<string, any>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

const ACTIVE_NODE_STYLE = {
  boxShadow: '0 0 0 3px #22c55e, 0 0 20px rgba(34, 197, 94, 0.4)',
  transition: 'box-shadow 0.2s ease'
};

function parseCode(code: string): { nodes: FlowNode[]; edges: FlowEdge[] } {
  try {
    let ast;
    try {
      ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'module' });
    } catch {
      ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'script' });
    }
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let nodeIdCounter = 0;

    const createNode = (label: string, type: FlowNode['type'] = 'default'): FlowNode => {
      const id = `node-${nodeIdCounter++}`;
      return {
        id,
        type,
        data: { label },
        position: { x: 0, y: 0 },
        style: { width: type === 'decision' ? 100 : 150, height: type === 'decision' ? 100 : 50 }
      };
    };

    const createEdge = (source: string, target: string, label?: string, style?: any): FlowEdge => ({
      id: `edge-${source}-${target}-${edges.length}`,
      source,
      target,
      label,
      type: 'smoothstep',
      animated: true,
      style
    });

    const startNode = createNode('Start', 'input');
    nodes.push(startNode);

    const processBlock = (statements: any[], parentId: string): string | null => {
      let currentParent: string | null = parentId;

      for (const stmt of statements) {
        if (currentParent === null) break;

        if (stmt.type === 'VariableDeclaration') {
          const decl = stmt.declarations[0];
          const label = `${stmt.kind} ${decl.id.name} = ...`;
          const node = createNode(label);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ExpressionStatement') {
          let label = 'Expression';
          if (stmt.expression.type === 'AssignmentExpression') {
            label = `${stmt.expression.left.name} = ...`;
          } else if (stmt.expression.type === 'CallExpression') {
            const callee = stmt.expression.callee;
            if (callee.type === 'Identifier') {
              label = `${callee.name}(...)`;
            } else if (callee.type === 'MemberExpression') {
              label = `${callee.object?.name || 'obj'}.${callee.property?.name || 'method'}(...)`;
            }
          }
          const node = createNode(label);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ReturnStatement') {
          const label = stmt.argument ? 'return ...' : 'return';
          const node = createNode(label, 'output');
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = null;
        } else if (stmt.type === 'IfStatement') {
          let testLabel = 'condition';
          if (stmt.test.type === 'BinaryExpression') {
            const left = stmt.test.left.name || stmt.test.left.value || 'expr';
            const op = stmt.test.operator;
            const right = stmt.test.right.name || stmt.test.right.value || 'expr';
            testLabel = `${left} ${op} ${right}`;
          } else if (stmt.test.type === 'Identifier') {
            testLabel = stmt.test.name;
          }
          const decisionNode = createNode(`if (${testLabel}) ?`, 'decision');
          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));

          const trueBranch = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          const trueEnd = processBlock(trueBranch, decisionNode.id);
          
          const lastTrueEdge = edges.find(e => e.source === decisionNode.id && !e.label);
          if (lastTrueEdge) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: '#22c55e' };
          }

          if (stmt.alternate) {
            const falseBranch = stmt.alternate.type === 'BlockStatement' ? stmt.alternate.body : [stmt.alternate];
            processBlock(falseBranch, decisionNode.id);
            
            const lastFalseEdge = edges.find(e => e.source === decisionNode.id && !e.label);
            if (lastFalseEdge) {
              lastFalseEdge.label = 'False';
              lastFalseEdge.style = { stroke: '#ef4444' };
            }
          }

          currentParent = decisionNode.id;
        } else if (stmt.type === 'ForStatement' || stmt.type === 'WhileStatement') {
          const loopLabel = stmt.type === 'ForStatement' ? 'for (...)' : 'while (...)';
          const loopNode = createNode(loopLabel, 'decision');
          nodes.push(loopNode);
          edges.push(createEdge(currentParent, loopNode.id));

          const body = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEnd = processBlock(body, loopNode.id);
          
          if (bodyEnd) {
            edges.push(createEdge(bodyEnd, loopNode.id, 'Loop', { stroke: '#3b82f6', strokeDasharray: '5,5' }));
          }

          currentParent = loopNode.id;
        } else if (stmt.type === 'FunctionDeclaration') {
          const fnName = stmt.id?.name || 'anonymous';
          const fnNode = createNode(`function ${fnName}()`, 'input');
          nodes.push(fnNode);
          edges.push(createEdge(currentParent, fnNode.id));
          
          if (stmt.body?.body) {
            processBlock(stmt.body.body, fnNode.id);
          }
          
          currentParent = fnNode.id;
        }
      }

      return currentParent;
    };

    if ((ast as any).body) {
      processBlock((ast as any).body, startNode.id);
    }

    applyLayout(nodes, edges);
    return { nodes, edges };
  } catch (error) {
    console.error('[LogicArt] Parse error:', error);
    return {
      nodes: [{ id: 'error', type: 'output' as const, data: { label: `Parse Error: ${(error as Error).message}` }, position: { x: 0, y: 0 } }],
      edges: []
    };
  }
}

function applyLayout(nodes: FlowNode[], edges: FlowEdge[]): void {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    const isDecision = node.type === 'decision';
    g.setNode(node.id, { width: isDecision ? 100 : 150, height: isDecision ? 100 : 50 });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach(node => {
    const pos = g.node(node.id);
    if (pos) {
      const isDecision = node.type === 'decision';
      const width = isDecision ? 100 : 150;
      const height = isDecision ? 100 : 50;
      node.position = { x: pos.x - width / 2, y: pos.y - height / 2 };
    }
  });
}

function convertManifestToFlowData(manifest: LogicArtManifest): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = manifest.nodes.map(n => ({
    id: n.id,
    type: (n.type === 'decision' ? 'decision' : n.type === 'input' ? 'input' : n.type === 'output' ? 'output' : 'default') as FlowNode['type'],
    data: { label: n.data.label },
    position: n.position,
    style: n.style
  }));

  const edges: FlowEdge[] = manifest.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: e.type || 'smoothstep',
    animated: e.animated,
    style: e.style
  }));

  return { nodes, edges };
}

const DecisionNode = ({ data }: { data: { label: string } }) => (
  <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    borderRadius: 8,
    transform: 'rotate(45deg)',
    fontSize: 9,
    fontWeight: 500,
    color: '#1f2937'
  }}>
    <div style={{ transform: 'rotate(-45deg)', textAlign: 'center', padding: 4, lineHeight: 1.2 }}>
      {data.label}
    </div>
  </div>
);

const nodeTypes = {
  decision: DecisionNode
};

function FlowchartPanel({ nodes, edges, activeNodeId, onNodeClick }: { 
  nodes: FlowNode[]; 
  edges: FlowEdge[];
  activeNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
}) {
  const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const styledNodes = nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        ...(node.id === activeNodeId ? ACTIVE_NODE_STYLE : {})
      }
    }));
    setNodes(styledNodes as Node[]);
    setEdges(edges as Edge[]);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [nodes, edges, activeNodeId, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodesState}
      edges={edgesState}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => onNodeClick?.(node.id)}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#374151" gap={20} size={1} />
      <Controls />
    </ReactFlow>
  );
}

export function LogicArtEmbed({
  code,
  manifestUrl,
  manifestHash,
  position = 'bottom-right',
  defaultOpen = true,
  defaultSize = { width: 400, height: 300 },
  showVariables = true,
  showHistory = false,
  theme = 'dark',
  onNodeClick,
  onCheckpoint,
  onManifestLoad,
  onReady,
  onError
}: LogicArtEmbedProps) {
  const [state, setState] = useState<EmbedState>({
    isOpen: defaultOpen,
    size: defaultSize,
    activeNodeId: null,
    variables: {},
    checkpointHistory: []
  });
  
  const [manifest, setManifest] = useState<LogicArtManifest | null>(null);
  const [manifestNodes, setManifestNodes] = useState<FlowNode[]>([]);
  const [manifestEdges, setManifestEdges] = useState<FlowEdge[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [sessionHash, setSessionHash] = useState<string | null>(null);

  const { nodes: parsedNodes, edges: parsedEdges } = useMemo(() => {
    if (code && !manifestUrl) {
      try {
        return parseCode(code);
      } catch (error) {
        onError?.(error as Error);
        return { nodes: [], edges: [] };
      }
    }
    return { nodes: [], edges: [] };
  }, [code, manifestUrl, onError]);

  const nodes = isLiveMode ? manifestNodes : parsedNodes;
  const edges = isLiveMode ? manifestEdges : parsedEdges;

  useEffect(() => {
    if (!manifestUrl) return;

    async function fetchManifest() {
      try {
        const response = await fetch(manifestUrl!);
        if (!response.ok) throw new Error(`Failed to fetch manifest: ${response.status}`);
        
        const data: LogicArtManifest = await response.json();
        
        if (manifestHash && data.hash !== manifestHash) {
          console.warn('[LogicArt] Manifest hash mismatch, may be stale');
        }
        
        setManifest(data);
        setSessionHash(data.hash);
        
        const { nodes, edges } = convertManifestToFlowData(data);
        setManifestNodes(nodes);
        setManifestEdges(edges);
        setIsLiveMode(true);
        
        onManifestLoad?.(data);
        console.log(`[LogicArt] Loaded manifest with ${nodes.length} nodes`);
      } catch (error) {
        console.error('[LogicArt] Failed to load manifest:', error);
        onError?.(error as Error);
      }
    }

    fetchManifest();
  }, [manifestUrl, manifestHash, onManifestLoad, onError]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'LOGICART_CORE') return;
      
      if (event.data.type === 'LOGICART_MANIFEST_READY') {
        const { manifestUrl: url, manifestHash: hash, sessionId } = event.data.payload;
        console.log(`[LogicArt] Session started: ${sessionId}`);
        setSessionHash(hash);
        
        if (!manifest && url) {
          fetch(url)
            .then(res => res.json())
            .then((data: LogicArtManifest) => {
              setManifest(data);
              const { nodes, edges } = convertManifestToFlowData(data);
              setManifestNodes(nodes);
              setManifestEdges(edges);
              setIsLiveMode(true);
              onManifestLoad?.(data);
            })
            .catch(err => console.error('[LogicArt] Failed to load manifest:', err));
        }
      }
      
      if (event.data.type === 'LOGICART_CHECKPOINT') {
        const payload = event.data.payload as CheckpointPayload;
        const { id, variables, timestamp, manifestVersion } = payload;
        
        if (sessionHash && manifestVersion && manifestVersion !== sessionHash) {
          console.warn('[LogicArt] Checkpoint from different session, ignoring');
          return;
        }
        
        setState(prev => ({
          ...prev,
          activeNodeId: id,
          variables: variables || {},
          checkpointHistory: [...prev.checkpointHistory, { id, timestamp, variables: variables || {} }]
        }));
        
        onCheckpoint?.(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [manifest, sessionHash, onCheckpoint, onManifestLoad]);

  useEffect(() => {
    if (nodes.length > 0) {
      onReady?.();
    }
  }, [nodes, onReady]);

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'top-left': { top: 16, left: 16 }
  };

  const modeLabel = isLiveMode ? 'LIVE' : 'STATIC';
  const modeColor = isLiveMode ? '#22c55e' : '#60a5fa';

  if (!state.isOpen) {
    return (
      <button
        onClick={() => setState(prev => ({ ...prev, isOpen: true }))}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        data-testid="logicart-toggle"
      >
        ◈
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: state.size.width,
        height: state.size.height,
        background: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
      data-testid="logicart-embed-panel"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: theme === 'dark' ? '#111827' : '#f3f4f6',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            color: theme === 'dark' ? '#60a5fa' : '#3b82f6', 
            fontWeight: 600, 
            fontSize: 12,
            fontFamily: 'system-ui, sans-serif'
          }}>
            LogicArt
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            color: modeColor,
            background: `${modeColor}20`,
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'system-ui, sans-serif'
          }}>
            {modeLabel}
          </span>
        </div>
        <button
          onClick={() => setState(prev => ({ ...prev, isOpen: false }))}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'transparent',
            border: 'none',
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            fontSize: 14
          }}
          data-testid="logicart-close"
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlowProvider>
          <FlowchartPanel 
            nodes={nodes} 
            edges={edges}
            activeNodeId={state.activeNodeId}
            onNodeClick={onNodeClick}
          />
        </ReactFlowProvider>
      </div>

      {showVariables && Object.keys(state.variables).length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            background: theme === 'dark' ? '#111827' : '#f3f4f6',
            borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            fontSize: 11,
            fontFamily: 'monospace',
            color: theme === 'dark' ? '#d1d5db' : '#374151',
            maxHeight: 80,
            overflow: 'auto'
          }}
        >
          {Object.entries(state.variables).map(([key, value]) => (
            <div key={key}>
              <span style={{ color: '#60a5fa' }}>{key}</span>: {JSON.stringify(value)}
            </div>
          ))}
        </div>
      )}

      {showHistory && state.checkpointHistory.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            background: theme === 'dark' ? '#0f172a' : '#f9fafb',
            borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            fontSize: 10,
            fontFamily: 'monospace',
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            maxHeight: 60,
            overflow: 'auto'
          }}
        >
          <div style={{ marginBottom: 4, fontWeight: 600, color: theme === 'dark' ? '#60a5fa' : '#3b82f6' }}>
            History ({state.checkpointHistory.length})
          </div>
          {state.checkpointHistory.slice(-5).map((cp, i) => (
            <div key={i} style={{ opacity: 0.7 + (i / 10) }}>
              {cp.id}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LogicArtEmbed;
```

---

## 4. Manifest Definition

**File:** `packages/logicart-vite-plugin/src/types.ts`

```typescript
export interface LogicArtManifest {
  version: '1.0';
  hash: string;
  generatedAt: number;
  
  files: {
    [path: string]: {
      checksum: string;
      functions: string[];
    }
  };
  
  nodes: FlowNode[];
  edges: FlowEdge[];
  
  checkpoints: {
    [nodeId: string]: CheckpointMetadata;
  };
  
  breakpointDefaults?: string[];
}

export interface FlowNode {
  id: string;
  type: 'default' | 'decision' | 'input' | 'output' | 'container';
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: 'statement' | 'decision' | 'loop' | 'function' | 'return';
    sourceFile: string;
    sourceLine: number;
    sourceColumn: number;
    code?: string;
  };
  style?: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'smoothstep' | 'straight' | 'step';
  label?: string;
  animated?: boolean;
}

export interface CheckpointMetadata {
  file: string;
  line: number;
  column: number;
  label: string;
  type: 'statement' | 'decision' | 'loop' | 'function' | 'return';
  parentFunction: string;
  capturedVariables: string[];
  isArrowImplicitReturn?: boolean;
  arrowBodyEnd?: number;
}

export interface LogicArtPluginOptions {
  include?: string[];
  exclude?: string[];
  manifestPath?: string;
  autoInstrument?: boolean;
  captureVariables?: boolean;
}

export interface InstrumentResult {
  code: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  checkpoints: Record<string, CheckpointMetadata>;
  functions: string[];
}
```

---

## 5. Embed Types

**File:** `packages/logicart-embed/src/types.ts`

```typescript
export interface LogicArtEmbedProps {
  code?: string;
  
  manifestUrl?: string;
  manifestHash?: string;
  
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  defaultOpen?: boolean;
  defaultSize?: { width: number; height: number };
  
  showVariables?: boolean;
  showControls?: boolean;
  showMinimap?: boolean;
  showHistory?: boolean;
  
  focusFile?: string;
  focusFunction?: string;
  
  theme?: 'dark' | 'light' | 'auto';
  
  onNodeClick?: (nodeId: string) => void;
  onCheckpoint?: (checkpoint: CheckpointPayload) => void;
  onManifestLoad?: (manifest: LogicArtManifest) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface CheckpointPayload {
  id: string;
  timestamp: number;
  variables: Record<string, any>;
  manifestVersion?: string;
}

export interface LogicArtManifest {
  version: '1.0';
  hash: string;
  generatedAt: number;
  
  files: {
    [path: string]: {
      checksum: string;
      functions: string[];
    }
  };
  
  nodes: FlowNode[];
  edges: FlowEdge[];
  
  checkpoints: {
    [nodeId: string]: CheckpointMetadata;
  };
}

export interface FlowNode {
  id: string;
  type: 'default' | 'decision' | 'input' | 'output' | 'container';
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType?: string;
    sourceFile?: string;
    sourceLine?: number;
    sourceColumn?: number;
  };
  style?: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface CheckpointMetadata {
  file: string;
  line: number;
  column: number;
  label: string;
  type: string;
  parentFunction: string;
  capturedVariables: string[];
}

export interface EmbedState {
  isOpen: boolean;
  size: { width: number; height: number };
  activeNodeId: string | null;
  variables: Record<string, any>;
  checkpointHistory: CheckpointEntry[];
}

export interface CheckpointEntry {
  id: string;
  timestamp: number;
  variables: Record<string, any>;
}
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
├─────────────────────────────────────────────────────────────────┤
│  Source Code                                                     │
│       │                                                          │
│       ▼                                                          │
│  instrumenter.ts (Acorn AST → FlowNodes/Edges + Checkpoints)    │
│       │                                                          │
│       ├──► Instrumented Code (with LogicArt.checkpoint calls)     │
│       │                                                          │
│       └──► Manifest JSON (nodes, edges, checkpoints, hash)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RUNTIME                                   │
├─────────────────────────────────────────────────────────────────┤
│  Instrumented Code Executes                                      │
│       │                                                          │
│       ▼                                                          │
│  runtime.ts (LogicArt.checkpoint → queue → window.postMessage)    │
│       │                                                          │
│       ▼                                                          │
│  LogicArtEmbed.tsx (listens for LOGICART_CHECKPOINT messages)       │
│       │                                                          │
│       ▼                                                          │
│  React Flow Visualization (highlights active node, shows vars)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notes

- **No separate `useCheckpoints.ts` hook exists** - checkpoint handling is inline in `LogicArtEmbed.tsx` via `useEffect` listening for `window.postMessage`.
- **Arrow function implicit returns** are handled specially with `isArrowImplicitReturn` flag and `arrowBodyEnd` to rewrite `=> expr` to `=> { checkpoint; return expr; }`.
- **Queue overflow protection** at 5000 items prevents browser crashes from infinite loops.
- **Structural node IDs** use scope path + node type + occurrence index for stability across code reformatting.
