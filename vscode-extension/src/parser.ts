import * as acorn from 'acorn';
import dagre from 'dagre';

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision'; 
  data: { 
    label: string;
    sourceData?: SourceLocation;
  };
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
  className?: string;
  style?: { width: number; height: number };
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
    g.setNode(node.id, {
      width: isDecision ? 120 : 180,
      height: isDecision ? 120 : 60
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
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const nodeMap = new Map<string, string>();
    let nodeIdCounter = 0;

    const createNode = (stmt: any, label: string, type: FlowNode['type'] = 'default', className?: string, loc?: SourceLocation): FlowNode => {
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
        }
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

    const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none');
    nodes.push(startNode);
    
    let lastNodeId = startNode.id;

    // Track loop contexts for break/continue
    const loopStack: { 
      conditionId: string;  // Where continue goes (update for 'for', condition for others)
      exitId: string;       // Where break goes
      breakNodes: string[];  // Nodes to connect to loop exit
      continueNodes: string[];  // NEW: track all continue nodes
      type: 'loop' 
    }[] = [];

    // Helper to process a block of statements
    // Returns the ID of the last node in the block, or null if the block ends with control flow
    const processBlock = (statements: any[], parentId: string): string | null => {
      let currentParent: string | null = parentId;

      for (const stmt of statements) {
        // If currentParent is null, we've hit a break/continue/return, stop processing
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
          // Stop processing after return
          currentParent = null;
        } else if (stmt.type === 'BreakStatement') {
          const node = createNode(stmt, 'break', 'default', 'bg-yellow-500/20 border-yellow-500/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          
          // Save break node to connect to loop exit later
          if (loopStack.length > 0) {
            const currentLoop = loopStack[loopStack.length - 1];
            currentLoop.breakNodes.push(node.id);
          }
          
          // Stop processing this block
          currentParent = null;
        } else if (stmt.type === 'ContinueStatement') {
          const node = createNode(stmt, 'continue', 'default', 'bg-blue-500/20 border-blue-500/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          
          // Track this continue node in the current loop context
          if (loopStack.length > 0) {
            const currentLoop = loopStack[loopStack.length - 1];
            currentLoop.continueNodes.push(node.id);
          }
          
          currentParent = node.id;
          // Stop processing subsequent statements
          break;
        } else if (stmt.type === 'IfStatement') {
          const testLabel = stmt.test.type === 'BinaryExpression' ? 'condition' : 'check';
          const decisionNode = createNode(stmt, `if (${testLabel}) ?`, 'decision', undefined, loc);
          
          if (stmt.test.type === 'Identifier') {
            decisionNode.data.label = `${stmt.test.name}?`;
          }
          
          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));

          const trueBranchNodes: any[] = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          const trueEndId = processBlock(trueBranchNodes, decisionNode.id);
          
          const lastEdge = edges[edges.length - 1];
          if (lastEdge && lastEdge.source === decisionNode.id) {
             lastEdge.label = 'True';
             lastEdge.style = { stroke: '#22c55e' };
          }

          if (stmt.alternate) {
             const falseBranchNodes: any[] = stmt.alternate.type === 'BlockStatement' ? stmt.alternate.body : [stmt.alternate];
             const falseEndId = processBlock(falseBranchNodes, decisionNode.id);
             
             const lastEdgeFalse = edges[edges.length - 1];
             if (lastEdgeFalse && lastEdgeFalse.source === decisionNode.id) {
                lastEdgeFalse.label = 'False';
                lastEdgeFalse.style = { stroke: '#ef4444' };
             }
          }
          
          currentParent = decisionNode.id;
        } else if (stmt.type === 'WhileStatement') {
          // While loop: condition check -> body -> back to condition
          const loopCondition = createNode(stmt, 'while (...) ?', 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));
          
          // Create loop exit merge node
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          
          // Push loop context for break/continue handling
          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);
          
          // Loop body
          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);
          
          // Pop loop context
          loopStack.pop();
          
          // Label the entry edge
          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }
          
          // Back-edge from body to condition (if body doesn't end with break/return)
          if (bodyEndId !== null) {
            // Check if this is a continue node
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Connect all continue nodes to loop condition
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Add loop exit node and connect condition False path
          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });
          
          // Connect break statements to the loop exit
          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }
          
          currentParent = loopExit.id;
        } else if (stmt.type === 'ForStatement') {
          // For loop: init -> condition -> body -> update -> back to condition
          // Init statement
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
          
          // Condition check
          const loopCondition = createNode(stmt.test, 'for (...) ?', 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));
          
          // Create loop exit merge node
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          
          // Create update node if it exists (needed for continue semantics)
          let updateNode: FlowNode | null = null;
          if (stmt.update) {
            updateNode = createNode(stmt.update, 'update', 'default', undefined, stmt.update.loc);
            nodes.push(updateNode); // Add immediately so continue can target it
          }
          
          // Push loop context - conditionId points to update for continue semantics
          const loopContext = { 
            conditionId: updateNode ? updateNode.id : loopCondition.id, 
            exitId: loopExit.id, 
            breakNodes: [] as string[], 
            continueNodes: [] as string[], 
            type: 'loop' as const 
          };
          loopStack.push(loopContext);
          
          // Loop body
          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);
          
          // Pop loop context
          loopStack.pop();
          
          // Label the entry edge
          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }
          
          // Back-edge: update always loops to condition (or body directly if no update)
          if (updateNode) {
            // Update node always connects back to condition
            edges.push({
              ...createEdge(updateNode.id, loopCondition.id, 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
            
            // If body ended normally but we haven't connected it to update yet, add that edge
            // (This handles the case where body has statements after a conditional continue)
            if (bodyEndId !== null) {
              const hasEdgeToUpdate = edges.some(e => e.source === bodyEndId && e.target === updateNode.id);
              if (!hasEdgeToUpdate) {
                // Check if body ended with continue
                const bodyEndNode = nodes.find(n => n.id === bodyEndId);
                const isContinue = bodyEndNode?.data.label === 'continue';
                edges.push({
                  ...createEdge(bodyEndId, updateNode.id, isContinue ? 'Continue' : undefined),
                  ...(isContinue ? { style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' } } : {})
                });
              }
            }
          } else if (bodyEndId !== null) {
            // No update node, connect body directly back to condition
            // Check if this is a continue node
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Connect all continue nodes to update (or condition if no update)
          const continueTarget = updateNode ? updateNode.id : loopCondition.id;
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, continueTarget, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Add loop exit node and connect condition False path
          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });
          
          // Connect break statements to the loop exit
          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }
          
          currentParent = loopExit.id;
        } else if (stmt.type === 'DoWhileStatement') {
          // Do-while: body -> condition -> back to body (always executes once)
          // Create placeholder for condition
          const loopCondition = createNode(stmt, 'while (...) ?', 'decision', undefined, loc);
          
          // Create loop exit merge node
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          
          // Track body start for back-edge
          const bodyStartParent = currentParent;
          
          // Push loop context before processing body
          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);
          
          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, currentParent);
          
          // Pop loop context
          loopStack.pop();
          
          // Add condition after body
          nodes.push(loopCondition);
          if (bodyEndId !== null) {
            // Check if body ended with continue
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : undefined),
              ...(isContinue ? { style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' } } : {})
            });
          }
          
          // Connect all continue nodes to loop condition
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Back-edge to start of body
          const bodyStartNode = nodes.find(n => edges.some(e => e.source === bodyStartParent && e.target === n.id));
          if (bodyStartNode) {
            edges.push({
              ...createEdge(loopCondition.id, bodyStartNode.id, 'True'),
              animated: true,
              style: { stroke: 'hsl(142, 71%, 45%)', strokeDasharray: '5,5' }
            });
          }
          
          // Add loop exit node and connect condition False path
          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });
          
          // Connect break statements to the loop exit
          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }
          
          currentParent = loopExit.id;
        } else if (stmt.type === 'ForInStatement' || stmt.type === 'ForOfStatement') {
          // For-in/of loop
          const loopType = stmt.type === 'ForInStatement' ? 'for...in' : 'for...of';
          const loopCondition = createNode(stmt, `${loopType} ?`, 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));
          
          // Create loop exit merge node
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          
          // Push loop context
          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);
          
          // Loop body
          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);
          
          // Pop loop context
          loopStack.pop();
          
          // Label the entry edge
          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'Next';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }
          
          // Back-edge
          if (bodyEndId !== null) {
            // Check if this is a continue node
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Connect all continue nodes to loop condition
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }
          
          // Add loop exit node and connect condition False path
          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'Done'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });
          
          // Connect break statements to the loop exit
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
    
    // Remove invisible loop exit nodes and redirect their edges
    const exitNodes = nodes.filter(n => n.data.label === 'loop exit');
    for (const exitNode of exitNodes) {
      // Find edges pointing TO the exit node
      const incomingEdges = edges.filter(e => e.target === exitNode.id);
      // Find edges pointing FROM the exit node
      const outgoingEdges = edges.filter(e => e.source === exitNode.id);
      
      // Redirect incoming edges to the outgoing edge's target (if exists)
      if (outgoingEdges.length > 0) {
        const nextTarget = outgoingEdges[0].target;
        for (const inEdge of incomingEdges) {
          inEdge.target = nextTarget;
        }
      }
      
      // Remove the exit node and its outgoing edges
      const nodeIndex = nodes.indexOf(exitNode);
      if (nodeIndex > -1) nodes.splice(nodeIndex, 1);
      
      for (const outEdge of outgoingEdges) {
        const edgeIndex = edges.indexOf(outEdge);
        if (edgeIndex > -1) edges.splice(edgeIndex, 1);
      }
    }
    
    // Apply dagre layout for automatic positioning
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
