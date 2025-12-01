/**
 * Parser module - re-exports from @logigo/bridge
 * 
 * This module now uses the shared bridge package for parsing,
 * ensuring consistency across Replit, VS Code, and Antigravity IDEs.
 */

// Re-export types and functions from bridge
// Note: In production, this would be: import { ... } from '@logigo/bridge';
// For now, we import directly from the bridge source in docs/bridge

import * as acorn from 'acorn';
import dagre from 'dagre';

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision' | 'container'; 
  data: { 
    label: string;
    description?: string;
    sourceData?: SourceLocation;
    children?: string[];
    collapsed?: boolean;
    zoomLevel?: 'mile-high' | '1000ft' | '100ft';
    isChildOfCollapsed?: boolean;
  };
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
  className?: string;
  style?: { width: number; height: number };
  parentNode?: string;
  extent?: 'parent';
  hidden?: boolean;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: 'smoothstep' | 'default';
  style?: any;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeMap: Map<string, string>;
}

// Section detection for container nodes
interface CodeSection {
  name: string;
  startLine: number;
  endLine: number;
}

function detectSections(code: string, ast?: any): CodeSection[] {
  const lines = code.split('\n');
  const sections: CodeSection[] = [];
  const sectionPattern = /^\/\/\s*---\s*(.+?)\s*---/;
  
  let currentSection: CodeSection | null = null;
  
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = line.match(sectionPattern);
    
    if (match) {
      if (currentSection) {
        currentSection.endLine = index;
        sections.push(currentSection);
      }
      
      currentSection = {
        name: match[1].trim(),
        startLine: index + 2,
        endLine: lines.length
      };
    }
  }
  
  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }
  
  // If no explicit markers found, auto-detect function declarations
  if (sections.length === 0 && ast && ast.body) {
    const functionDeclarations: CodeSection[] = [];
    
    ast.body.forEach((node: any) => {
      if (node.type === 'FunctionDeclaration' && node.id && node.loc) {
        functionDeclarations.push({
          name: node.id.name,
          startLine: node.loc.start.line,
          endLine: node.loc.end.line
        });
      }
    });
    
    if (functionDeclarations.length > 0) {
      return functionDeclarations;
    }
  }
  
  return sections;
}

// Apply dagre layout algorithm to automatically position nodes
function applyDagreLayout(nodes: FlowNode[], edges: FlowEdge[]): void {
  const g = new dagre.graphlib.Graph();
  
  g.setGraph({ 
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 100,
    marginx: 50,
    marginy: 50
  });
  
  g.setDefaultEdgeLabel(() => ({}));
  
  nodes.forEach((node) => {
    const isDecision = node.type === 'decision';
    const isContainer = node.type === 'container';
    g.setNode(node.id, {
      width: isContainer ? 400 : (isDecision ? 120 : 180),
      height: isContainer ? 200 : (isDecision ? 120 : 60)
    });
  });
  
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(g);
  
  nodes.forEach((node) => {
    const nodeWithPosition = g.node(node.id);
    if (nodeWithPosition) {
      const isDecision = node.type === 'decision';
      const isContainer = node.type === 'container';
      const width = isContainer ? 400 : (isDecision ? 120 : 180);
      const height = isContainer ? 200 : (isDecision ? 120 : 60);
      
      node.position = {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      };
      
      node.style = {
        width,
        height
      };
    }
  });
}

export function parseCodeToFlow(code: string): FlowData {
  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const nodeMap = new Map<string, string>();
    let nodeIdCounter = 0;

    // Detect sections from comment markers (or auto-detect functions)
    const sections = detectSections(code, ast);
    const containerNodes: Map<string, FlowNode> = new Map();
    
    // Create container nodes for each section
    if (sections.length > 0) {
      sections.forEach(section => {
        const containerId = `container-${nodeIdCounter++}`;
        const containerNode: FlowNode = {
          id: containerId,
          type: 'container',
          data: { 
            label: section.name,
            children: [],
            collapsed: false
          },
          position: { x: 0, y: 0 },
          style: { width: 400, height: 200 }
        };
        nodes.push(containerNode);
        containerNodes.set(`${section.startLine}-${section.endLine}`, containerNode);
      });
    } else {
      // Fallback: Create a default "Global Flow" container
      const globalContainerId = `container-${nodeIdCounter++}`;
      const globalContainer: FlowNode = {
        id: globalContainerId,
        type: 'container',
        data: { 
          label: 'Global Flow',
          children: [],
          collapsed: false
        },
        position: { x: 0, y: 0 },
        style: { width: 400, height: 200 }
      };
      nodes.push(globalContainer);
      containerNodes.set('global', globalContainer);
    }

    const createNode = (stmt: any, label: string, type: FlowNode['type'] = 'default', className?: string, loc?: SourceLocation): FlowNode => {
      const id = `node-${nodeIdCounter++}`;
      const isDecision = type === 'decision';
      
      if (stmt?.loc) {
        const locKey = `${stmt.loc.start.line}:${stmt.loc.start.column}`;
        nodeMap.set(locKey, id);
      }
      
      // Determine if this node belongs to a section/container
      let parentNode: string | undefined;
      if (sections.length > 0 && stmt?.loc) {
        const nodeLine = stmt.loc.start.line;
        for (const section of sections) {
          if (nodeLine >= section.startLine && nodeLine <= section.endLine) {
            const containerKey = `${section.startLine}-${section.endLine}`;
            const container = containerNodes.get(containerKey);
            if (container) {
              parentNode = container.id;
              if (!container.data.children) {
                container.data.children = [];
              }
              container.data.children.push(id);
            }
            break;
          }
        }
      } else if (sections.length === 0) {
        const globalContainer = containerNodes.get('global');
        if (globalContainer) {
          parentNode = globalContainer.id;
          if (!globalContainer.data.children) {
            globalContainer.data.children = [];
          }
          globalContainer.data.children.push(id);
        }
      }
      
      return {
        id,
        type,
        data: { label, sourceData: loc },
        position: { x: 0, y: 0 },
        className,
        parentNode,
        style: { 
          width: isDecision ? 120 : 180, 
          height: isDecision ? 120 : 60 
        }
      };
    };

    const createEdge = (source: string, target: string, label?: string): FlowEdge => {
      return {
        id: `edge-${source}-${target}`,
        source,
        target,
        label,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--color-muted-foreground)' }
      };
    };

    // Start Node
    const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none');
    nodes.push(startNode);
    
    // Track loop contexts for break/continue
    const loopStack: { 
      conditionId: string;
      exitId: string;
      breakNodes: string[];
      continueNodes: string[];
      type: 'loop' 
    }[] = [];

    const processBlock = (statements: any[], parentId: string): string | null => {
      let currentParent: string | null = parentId;

      for (const stmt of statements) {
        if (currentParent === null) break;
        
        const loc: SourceLocation = stmt.loc;

        if (stmt.type === 'VariableDeclaration') {
          const decl = stmt.declarations[0];
          const label = `${stmt.kind} ${decl.id.name} = ...`;
          const node = createNode(stmt, label, 'default', undefined, loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ExpressionStatement') {
          let label = 'Expression';
          if (stmt.expression.type === 'AssignmentExpression') {
             label = `${stmt.expression.left.name} = ...`;
          } else if (stmt.expression.type === 'CallExpression') {
             label = `${stmt.expression.callee.name}(...)`;
          }
          const node = createNode(stmt, label, 'default', undefined, loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ReturnStatement') {
          const label = stmt.argument ? `return ...` : 'return';
          const node = createNode(stmt, label, 'output', 'bg-destructive/20 border-destructive/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = null;
        } else if (stmt.type === 'BreakStatement') {
          const node = createNode(stmt, 'break', 'default', 'bg-yellow-500/20 border-yellow-500/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          
          if (loopStack.length > 0) {
            const currentLoop = loopStack[loopStack.length - 1];
            currentLoop.breakNodes.push(node.id);
          }
          
          currentParent = null;
        } else if (stmt.type === 'ContinueStatement') {
          const node = createNode(stmt, 'continue', 'default', 'bg-blue-500/20 border-blue-500/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          
          if (loopStack.length > 0) {
            const currentLoop = loopStack[loopStack.length - 1];
            currentLoop.continueNodes.push(node.id);
          }
          
          currentParent = node.id;
          break;
        } else if (stmt.type === 'IfStatement') {
          const testLabel = stmt.test.type === 'BinaryExpression' ? 'condition' : 'check';
          const decisionNode = createNode(stmt, testLabel, 'decision', undefined, loc);
          
          decisionNode.data.label = `if (${testLabel}) ?`;
          if (stmt.test.type === 'Identifier') decisionNode.data.label = `${stmt.test.name}?`;
          
          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));

          const trueBranchNodes: any[] = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          processBlock(trueBranchNodes, decisionNode.id);
          
          const lastEdge = edges[edges.length - 1];
          if (lastEdge && lastEdge.source === decisionNode.id) {
             lastEdge.label = 'True';
             lastEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }

          if (stmt.alternate) {
             const falseBranchNodes: any[] = stmt.alternate.type === 'BlockStatement' ? stmt.alternate.body : [stmt.alternate];
             processBlock(falseBranchNodes, decisionNode.id);
             
             const lastEdgeFalse = edges[edges.length - 1];
             if (lastEdgeFalse && lastEdgeFalse.source === decisionNode.id) {
                lastEdgeFalse.label = 'False';
                lastEdgeFalse.style = { stroke: 'hsl(0, 84%, 60%)' };
             }
          }
          
          currentParent = decisionNode.id; 
        } else if (stmt.type === 'WhileStatement') {
          const loopCondition = createNode(stmt, 'while (...) ?', 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));
          
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          
          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);
          
          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);
          
          loopStack.pop();
          
          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }
          
          if (bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });
          
          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }
          
          currentParent = loopExit.id;
        } else if (stmt.type === 'ForStatement') {
          if (stmt.init) {
            let initLabel = 'for init';
            if (stmt.init.type === 'VariableDeclaration') {
              const decl = stmt.init.declarations[0];
              initLabel = `${stmt.init.kind} ${decl.id.name} = ...`;
            }
            const initNode = createNode(stmt.init, initLabel, 'default', undefined, stmt.init.loc);
            nodes.push(initNode);
            edges.push(createEdge(currentParent, initNode.id));
            currentParent = initNode.id;
          }
          
          const loopCondition = createNode(stmt.test, 'for (...) ?', 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));
          
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          
          let updateNode: FlowNode | null = null;
          if (stmt.update) {
            updateNode = createNode(stmt.update, 'update', 'default', undefined, stmt.update.loc);
            nodes.push(updateNode);
          }
          
          const loopContext = { 
            conditionId: updateNode ? updateNode.id : loopCondition.id, 
            exitId: loopExit.id, 
            breakNodes: [] as string[], 
            continueNodes: [] as string[], 
            type: 'loop' as const 
          };
          loopStack.push(loopContext);
          
          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);
          
          if (updateNode && bodyNodes.length === 0) {
            edges.push(createEdge(loopCondition.id, updateNode.id, 'True'));
          }
          
          loopStack.pop();
          
          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }
          
          if (updateNode && bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            edges.push({
              ...createEdge(bodyEndId, updateNode.id, isContinue ? 'Continue' : undefined),
              ...(isContinue ? { style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' } } : {})
            });
          }
          
          if (updateNode) {
            edges.push({
              ...createEdge(updateNode.id, loopCondition.id, 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          } else if (bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          const continueTarget = updateNode ? updateNode.id : loopCondition.id;
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, continueTarget, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });
          
          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }
          
          currentParent = loopExit.id;
        }
      }
      return currentParent;
    };

    // @ts-ignore
    const body = ast.body;
    let statements = body;

    // @ts-ignore
    if (body.length > 0 && body[0].type === 'FunctionDeclaration') {
      // @ts-ignore
      statements = body[0].body.body;
    }

    processBlock(statements, startNode.id);

    // Remove invisible loop exit nodes
    const exitNodes = nodes.filter(n => n.data.label === 'loop exit');
    for (const exitNode of exitNodes) {
      const incomingEdges = edges.filter(e => e.target === exitNode.id);
      const outgoingEdges = edges.filter(e => e.source === exitNode.id);

      if (outgoingEdges.length > 0) {
        const nextTarget = outgoingEdges[0].target;
        for (const inEdge of incomingEdges) {
          inEdge.target = nextTarget;
        }
      }

      const nodeIndex = nodes.indexOf(exitNode);
      if (nodeIndex > -1) nodes.splice(nodeIndex, 1);

      for (const outEdge of outgoingEdges) {
        const edgeIndex = edges.indexOf(outEdge);
        if (edgeIndex > -1) edges.splice(edgeIndex, 1);
      }
    }

    applyDagreLayout(nodes, edges);

    return { nodes, edges, nodeMap };

  } catch (e) {
    console.error('Parse error:', e);
    return {
      nodes: [{
        id: 'error',
        type: 'default',
        data: { label: `Parse Error: ${e instanceof Error ? e.message : 'Unknown error'}` },
        position: { x: 250, y: 100 },
        className: 'bg-destructive/20 border-destructive',
        style: { width: 200, height: 60 }
      }],
      edges: [],
      nodeMap: new Map()
    };
  }
}
