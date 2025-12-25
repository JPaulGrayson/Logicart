import * as acorn from 'acorn';
import dagre from 'dagre';

import { SourceLocation } from './types';

export interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision' | 'container';
  data: {
    label: string;
    description?: string;
    sourceData?: SourceLocation;
    // Container-specific properties:
    children?: string[];      // IDs of child nodes inside this container
    collapsed?: boolean;      // UI state: is container collapsed?
  };
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
  className?: string;
  style?: { width: number; height: number };

  // Hierarchy properties (for child nodes):
  parentNode?: string;        // ID of parent container (React Flow uses this)
  extent?: 'parent';          // Keeps node inside parent bounds
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

function applyDagreLayout(nodes: FlowNode[], edges: FlowEdge[]): void {
  // Separate container nodes from regular nodes
  const containerNodes = nodes.filter(n => n.type === 'container');
  const regularNodes = nodes.filter(n => n.type !== 'container');

  // If no containers, layout all nodes together
  if (containerNodes.length === 0) {
    layoutNodesWithDagre(regularNodes, edges);
    return;
  }

  // Layout each container's children separately
  let containerXOffset = 0;
  const containerPadding = 40;
  const containerSpacing = 60;
  const headerHeight = 50;

  for (const container of containerNodes) {
    // Get children of this container
    const childNodes = regularNodes.filter(n => n.parentNode === container.id);
    const childIds = new Set(childNodes.map(n => n.id));

    // Get edges that connect children within this container
    const childEdges = edges.filter(e => childIds.has(e.source) && childIds.has(e.target));

    if (childNodes.length > 0) {
      // Layout children using dagre
      layoutNodesWithDagre(childNodes, childEdges);

      // Calculate bounds of children
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const child of childNodes) {
        const x = child.position.x;
        const y = child.position.y;
        const w = child.style?.width || 150;
        const h = child.style?.height || 40;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }

      // Offset children to fit inside container with padding
      const offsetX = containerXOffset + containerPadding - minX;
      const offsetY = containerPadding + headerHeight - minY;

      for (const child of childNodes) {
        child.position.x += offsetX;
        child.position.y += offsetY;
      }

      // Set container position and size
      const containerWidth = (maxX - minX) + containerPadding * 2;
      const containerHeight = (maxY - minY) + containerPadding * 2 + headerHeight;

      container.position = {
        x: containerXOffset,
        y: 0
      };
      container.style = {
        width: Math.max(containerWidth, 250),
        height: containerHeight
      };

      // Move offset for next container
      containerXOffset += Math.max(containerWidth, 250) + containerSpacing;
    } else {
      // Empty container
      container.position = { x: containerXOffset, y: 0 };
      container.style = { width: 250, height: 150 };
      containerXOffset += 250 + containerSpacing;
    }
  }

  // Handle orphan nodes (not in any container)
  const orphanNodes = regularNodes.filter(n => !n.parentNode);
  if (orphanNodes.length > 0) {
    const orphanEdges = edges.filter(e =>
      orphanNodes.some(n => n.id === e.source) &&
      orphanNodes.some(n => n.id === e.target)
    );
    layoutNodesWithDagre(orphanNodes, orphanEdges);

    // Offset orphans to appear after containers
    for (const node of orphanNodes) {
      node.position.x += containerXOffset;
    }
  }
}

// Helper function to layout nodes with dagre
function layoutNodesWithDagre(nodes: FlowNode[], edges: FlowEdge[]): void {
  if (nodes.length === 0) return;

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 80,
    marginx: 20,
    marginy: 20
  });

  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const isDecision = node.type === 'decision';
    g.setNode(node.id, {
      width: isDecision ? 120 : 180,
      height: isDecision ? 120 : 60
    });
  });

  edges.forEach((edge) => {
    // Only add edge if both nodes are in this graph
    if (nodes.some(n => n.id === edge.source) && nodes.some(n => n.id === edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  nodes.forEach((node) => {
    const nodeWithPosition = g.node(node.id);
    if (nodeWithPosition) {
      const isDecision = node.type === 'decision';
      const width = isDecision ? 120 : 180;
      const height = isDecision ? 120 : 60;

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
    const comments: any[] = [];
    let ast;
    try {
      ast = acorn.parse(code, {
        ecmaVersion: 2020,
        locations: true,
        sourceType: 'module',
        onComment: comments
      });
    } catch {
      ast = acorn.parse(code, {
        ecmaVersion: 2020,
        locations: true,
        sourceType: 'script',
        onComment: comments
      });
    }

    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const nodeMap = new Map<string, string>();
    let nodeIdCounter = 0;
    let containerIdCounter = 0;

    const createNode = (stmt: any, label: string, type: FlowNode['type'] = 'default', className?: string, loc?: SourceLocation, parentNode?: string): FlowNode => {
      const id = `node-${nodeIdCounter++}`;
      const isDecision = type === 'decision';

      if (stmt?.loc) {
        const locKey = `${stmt.loc.start.line}:${stmt.loc.start.column}`;
        nodeMap.set(locKey, id);
      }

      return {
        id,
        type,
        data: { label, sourceData: loc },
        position: { x: 0, y: 0 },
        className,
        style: {
          width: isDecision ? 100 : 150,
          height: isDecision ? 100 : 40
        },
        parentNode,
        extent: parentNode ? 'parent' : undefined
      };
    };

    const createContainer = (label: string, loc?: SourceLocation): FlowNode => {
      const id = `container-${containerIdCounter++}`;
      return {
        id,
        type: 'container',
        data: { label, sourceData: loc, children: [], collapsed: false },
        position: { x: 0, y: 0 },
        style: { width: 400, height: 200 },
        className: 'bg-muted/10 border-dashed border-2'
      };
    };

    const createEdge = (source: string, target: string, label?: string, style?: any): FlowEdge => {
      return {
        id: `edge-${source}-${target}`,
        source,
        target,
        label,
        type: 'smoothstep',
        animated: true,
        style: style || {}
      };
    };

    // Track loop contexts for break/continue
    const loopStack: {
      conditionId: string;
      exitId: string;
      breakNodes: string[];
      continueNodes: string[];
      type: 'loop'
    }[] = [];

    // Helper to process a block of statements
    const processBlock = (statements: any[], parentId: string, containerId?: string): string | null => {
      let currentParent: string | null = parentId;

      for (const stmt of statements) {
        if (currentParent === null) break;

        const loc: SourceLocation = stmt.loc;

        if (stmt.type === 'VariableDeclaration') {
          const decl = stmt.declarations[0];
          const label = `${stmt.kind} ${decl.id.name} = ...`;
          const node = createNode(stmt, label, 'default', undefined, loc, containerId);
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
          const node = createNode(stmt, label, 'default', undefined, loc, containerId);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ReturnStatement') {
          const label = stmt.argument ? `return ...` : 'return';
          const node = createNode(stmt, label, 'output', 'bg-destructive/20 border-destructive/50', loc, containerId);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = null;
        } else if (stmt.type === 'BreakStatement') {
          const node = createNode(stmt, 'break', 'default', 'bg-yellow-500/20 border-yellow-500/50', loc, containerId);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          if (loopStack.length > 0) {
            loopStack[loopStack.length - 1].breakNodes.push(node.id);
          }
          currentParent = null;
        } else if (stmt.type === 'ContinueStatement') {
          const node = createNode(stmt, 'continue', 'default', 'bg-blue-500/20 border-blue-500/50', loc, containerId);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          if (loopStack.length > 0) {
            loopStack[loopStack.length - 1].continueNodes.push(node.id);
          }
          currentParent = node.id;
          break;
        } else if (stmt.type === 'IfStatement') {
          const testLabel = stmt.test.type === 'BinaryExpression' ? 'condition' : 'check';
          const decisionNode = createNode(stmt, `if (${testLabel}) ?`, 'decision', undefined, loc, containerId);

          if (stmt.test.type === 'Identifier') {
            decisionNode.data.label = `${stmt.test.name}?`;
          }

          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));

          const trueBranchNodes: any[] = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          const trueEndId = processBlock(trueBranchNodes, decisionNode.id, containerId);

          const lastEdge = edges[edges.length - 1];
          if (lastEdge && lastEdge.source === decisionNode.id) {
            lastEdge.label = 'True';
            lastEdge.style = { stroke: '#22c55e' };
          }

          if (stmt.alternate) {
            const falseBranchNodes: any[] = stmt.alternate.type === 'BlockStatement' ? stmt.alternate.body : [stmt.alternate];
            const falseEndId = processBlock(falseBranchNodes, decisionNode.id, containerId);

            const lastEdgeFalse = edges[edges.length - 1];
            if (lastEdgeFalse && lastEdgeFalse.source === decisionNode.id) {
              lastEdgeFalse.label = 'False';
              lastEdgeFalse.style = { stroke: '#ef4444' };
            }
          }

          currentParent = decisionNode.id;
        } else if (stmt.type === 'WhileStatement') {
          const loopCondition = createNode(stmt, 'while (...) ?', 'decision', undefined, loc, containerId);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));

          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0', undefined, containerId);
          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);

          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id, containerId);

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
            const initNode = createNode(stmt.init, initLabel, 'default', undefined, stmt.init.loc, containerId);
            nodes.push(initNode);
            edges.push(createEdge(currentParent, initNode.id));
            currentParent = initNode.id;
          }

          const loopCondition = createNode(stmt.test, 'for (...) ?', 'decision', undefined, loc, containerId);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));

          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0', undefined, containerId);

          let updateNode: FlowNode | null = null;
          if (stmt.update) {
            updateNode = createNode(stmt.update, 'update', 'default', undefined, stmt.update.loc, containerId);
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
          const bodyEndId = processBlock(bodyNodes, loopCondition.id, containerId);

          loopStack.pop();

          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }

          if (updateNode) {
            edges.push({
              ...createEdge(updateNode.id, loopCondition.id, 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });

            if (bodyEndId !== null) {
              const hasEdgeToUpdate = edges.some(e => e.source === bodyEndId && e.target === updateNode.id);
              if (!hasEdgeToUpdate) {
                const bodyEndNode = nodes.find(n => n.id === bodyEndId);
                const isContinue = bodyEndNode?.data.label === 'continue';
                edges.push({
                  ...createEdge(bodyEndId, updateNode.id, isContinue ? 'Continue' : undefined),
                  ...(isContinue ? { style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' } } : {})
                });
              }
            }
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
        } else if (stmt.type === 'FunctionDeclaration') {
          // When we encounter a function inside a section, process its body
          // to extract the control flow (if/else, loops, etc.)
          const funcBody = stmt.body?.body;
          if (funcBody && Array.isArray(funcBody)) {
            const result = processBlock(funcBody, currentParent, containerId);
            if (result !== null) {
              currentParent = result;
            }
          }
        }
      }
      return currentParent;
    };

    // @ts-ignore
    const body = ast.body;

    // Identify Sections based on comments
    const sections: { name: string; startLine: number; endLine: number }[] = [];
    let currentSection: { name: string; startLine: number } | null = null;

    for (const comment of comments) {
      const match = comment.value.match(/---\s*(.+?)\s*---/);
      if (match) {
        if (currentSection) {
          sections.push({ ...currentSection, endLine: comment.loc.start.line - 1 });
        }
        currentSection = { name: match[1], startLine: comment.loc.start.line };
      }
    }
    if (currentSection) {
      // @ts-ignore
      sections.push({ ...currentSection, endLine: ast.loc ? ast.loc.end.line : 99999 });
    }

    // If sections exist, use them as containers
    if (sections.length > 0) {
      for (const section of sections) {
        const container = createContainer(section.name);
        nodes.push(container);

        const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none', undefined, container.id);
        nodes.push(startNode);

        // Filter statements that belong to this section
        const sectionStatements = body.filter((stmt: any) =>
          stmt.loc.start.line >= section.startLine && stmt.loc.end.line <= section.endLine
        );

        processBlock(sectionStatements, startNode.id, container.id);
        container.data.children = nodes.filter(n => n.parentNode === container.id).map(n => n.id);
      }

      // Handle statements not in any section (Global)
      const orphanedStatements = body.filter((stmt: any) =>
        !sections.some(s => stmt.loc.start.line >= s.startLine && stmt.loc.end.line <= s.endLine)
      );

      if (orphanedStatements.length > 0) {
        const globalContainer = createContainer('Global');
        nodes.push(globalContainer);
        const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none', undefined, globalContainer.id);
        nodes.push(startNode);
        processBlock(orphanedStatements, startNode.id, globalContainer.id);
        globalContainer.data.children = nodes.filter(n => n.parentNode === globalContainer.id).map(n => n.id);
      }

    } else {
      // Fallback to Function-based containers if no sections
      const functions = body.filter((stmt: any) => stmt.type === 'FunctionDeclaration');
      const otherStatements = body.filter((stmt: any) => stmt.type !== 'FunctionDeclaration');

      if (functions.length > 0) {
        for (const func of functions) {
          const funcAny = func as any;
          const container = createContainer(funcAny.id?.name || 'Anonymous Function', funcAny.loc);
          nodes.push(container);

          const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none', undefined, container.id);
          nodes.push(startNode);

          // @ts-ignore
          processBlock(func.body.body, startNode.id, container.id);
          container.data.children = nodes.filter(n => n.parentNode === container.id).map(n => n.id);
        }

        if (otherStatements.length > 0) {
          const globalContainer = createContainer('Global Flow');
          nodes.push(globalContainer);
          const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none', undefined, globalContainer.id);
          nodes.push(startNode);
          processBlock(otherStatements, startNode.id, globalContainer.id);
          globalContainer.data.children = nodes.filter(n => n.parentNode === globalContainer.id).map(n => n.id);
        }
      } else {
        // No sections, no functions -> Single global flow in a container
        const globalContainer = createContainer('Global Flow');
        nodes.push(globalContainer);
        const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none', undefined, globalContainer.id);
        nodes.push(startNode);
        processBlock(body, startNode.id, globalContainer.id);
        globalContainer.data.children = nodes.filter(n => n.parentNode === globalContainer.id).map(n => n.id);
      }
    }

    // Remove invisible loop exit nodes and redirect their edges
    const exitNodes = nodes.filter(n => n.data.label === 'loop exit');
    for (const exitNode of exitNodes) {
      const incomingEdges = edges.filter(e => e.target === exitNode.id);
      const outgoingEdges = edges.filter(e => e.source === exitNode.id);

      if (outgoingEdges.length > 0) {
        const nextTarget = outgoingEdges[0].target;
        for (const inEdge of incomingEdges) inEdge.target = nextTarget;
      }

      const nodeIndex = nodes.indexOf(exitNode);
      if (nodeIndex > -1) nodes.splice(nodeIndex, 1);

      for (const outEdge of outgoingEdges) {
        const edgeIndex = edges.indexOf(outEdge);
        if (edgeIndex > -1) edges.splice(edgeIndex, 1);
      }
    }

    // Apply dagre layout (Note: Dagre doesn't support compound graphs natively well, 
    // so we might need to layout each container separately or use a different strategy.
    // For now, we'll just run it on the whole graph which might overlap containers, 
    // but the UI should handle parentNode positioning)
    applyDagreLayout(nodes, edges);

    return {
      nodes,
      edges,
      nodeMap
    };

  } catch (e) {
    console.error("Parse error", e);
    return {
      nodes: [
        { id: 'error', type: 'input', data: { label: 'Syntax Error' }, position: { x: 250, y: 50 }, className: 'bg-destructive text-destructive-foreground' }
      ],
      edges: [],
      nodeMap: new Map()
    };
  }
}
