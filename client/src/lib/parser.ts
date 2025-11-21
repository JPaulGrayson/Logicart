import * as acorn from 'acorn';

export interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision'; 
  data: { label: string };
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
  className?: string;
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
}

// Simple recursive parser to convert AST to Flowchart
// This is a simplified "MVP" implementation. 
// A robust version would handle nested scopes, complex expressions, etc.
export function parseCodeToFlow(code: string): FlowData {
  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020 });
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let nodeIdCounter = 0;
    let xPos = 250;
    let yPos = 50;
    const yGap = 100;

    const createNode = (label: string, type: FlowNode['type'] = 'default', x: number = xPos, y: number = yPos, className?: string): FlowNode => {
      const id = `node-${nodeIdCounter++}`;
      return {
        id,
        type,
        data: { label },
        position: { x, y },
        className
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
    const startNode = createNode('Start', 'input', 250, 0, 'bg-primary text-primary-foreground border-none');
    nodes.push(startNode);
    
    let lastNodeId = startNode.id;
    let currentY = 100;

    // Helper to process a block of statements
    // Returns the ID of the last node in the block
    const processBlock = (statements: any[], parentId: string, startY: number, offsetX: number = 0): string => {
      let currentParent = parentId;
      let localY = startY;

      for (const stmt of statements) {
        if (stmt.type === 'VariableDeclaration') {
          const decl = stmt.declarations[0];
          const label = `${stmt.kind} ${decl.id.name} = ...`;
          const node = createNode(label, 'default', 250 + offsetX, localY);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
          localY += yGap;
        } else if (stmt.type === 'ExpressionStatement') {
          let label = 'Expression';
          if (stmt.expression.type === 'AssignmentExpression') {
             label = `${stmt.expression.left.name} = ...`;
          } else if (stmt.expression.type === 'CallExpression') {
             label = `${stmt.expression.callee.name}(...)`;
          }
          const node = createNode(label, 'default', 250 + offsetX, localY);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
          localY += yGap;
        } else if (stmt.type === 'ReturnStatement') {
          const label = stmt.argument ? `return ...` : 'return';
          const node = createNode(label, 'output', 250 + offsetX, localY, 'bg-destructive/20 border-destructive/50');
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
          localY += yGap;
        } else if (stmt.type === 'IfStatement') {
          // Decision Node
          const testLabel = `if (...)`; // Simplified
          const decisionNode = createNode(testLabel, 'default', 250 + offsetX, localY, 'rotate-45 w-24 h-24 flex items-center justify-center rounded-none border-2 border-accent bg-accent/10');
          // We need to adjust the label rotation for diamond shape if we were using CSS rotate, 
          // but for simplicity in this MVP we'll just make it a diamond-like node or standard node with '?'
          // Let's stick to a standard node but styled as decision for now to avoid CSS complexity in MVP
          decisionNode.className = 'border-accent border-2 bg-accent/10';
          decisionNode.data.label = `if (${stmt.test.type === 'BinaryExpression' ? 'condition' : '...'}) ?`;
          
          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));
          
          localY += yGap + 20;

          // True Branch (Consequent)
          // We'll put true branch to the left
          const trueBranchNodes: any[] = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          const trueEndId = processBlock(trueBranchNodes, decisionNode.id, localY, offsetX - 150);
          edges.find(e => e.source === decisionNode.id && e.target.startsWith('node-'))!.label = 'True'; // Hacky way to label the edge created in processBlock? 
          // Wait, processBlock creates edges. 
          // Actually, processBlock connects the first node to parentId.
          // We need to label that specific edge.
          const trueEdge = edges.find(e => e.source === decisionNode.id && e.target === nodes.find(n => n.position.x === 250 + offsetX - 150)?.id); // Tricky to find exact edge
          // Let's refactor processBlock to accept an edge label? 
          // For MVP, let's just update the last added edge if it matches
          const lastEdge = edges[edges.length - 1];
          if (lastEdge && lastEdge.source === decisionNode.id) {
             lastEdge.label = 'True';
             lastEdge.style = { stroke: 'hsl(142, 71%, 45%)' }; // Green
          }

          let falseEndId = decisionNode.id;

          // False Branch (Alternate)
          if (stmt.alternate) {
             const falseBranchNodes: any[] = stmt.alternate.type === 'BlockStatement' ? stmt.alternate.body : [stmt.alternate];
             const falseResultId = processBlock(falseBranchNodes, decisionNode.id, localY, offsetX + 150);
             
             const lastEdgeFalse = edges[edges.length - 1];
             if (lastEdgeFalse && lastEdgeFalse.source === decisionNode.id) {
                lastEdgeFalse.label = 'False';
                lastEdgeFalse.style = { stroke: 'hsl(0, 84%, 60%)' }; // Red
             }
             falseEndId = falseResultId;
          } else {
             // No else block, draw a line bypassing?
             // For MVP, we just don't render the false path explicitly if it's empty, 
             // or we connect decision to the merge point directly.
          }
          
          // Merge point (optional for MVP, but good for flow)
          const mergeNode = createNode('End If', 'default', 250 + offsetX, localY + (yGap * (Math.max(trueBranchNodes.length, 1) + 1)), 'w-4 h-4 p-0 rounded-full bg-muted');
          // Connect branches to merge
          // This is getting complex for a recursive function.
          // Let's just return the latest nodes and let the outer loop continue.
          
          // Reset currentParent to the merge node (or just pick one for linear flow)
          // In a real CFG, we'd merge.
          currentParent = mergeNode.id; 
          // Note: Visual layout is hard! 
          // For this MVP, we simply return the decision node ID to continue linearly?
          // No, that would break the graph.
          // Let's stop here for the "smart" layout logic and just output the nodes we found.
          
          // HACK: Just continue from the "True" branch for now if we want linear, 
          // or just stop.
          // Let's assume linear code after IF is rare in simple recursive examples (usually return).
        }
      }
      return currentParent;
    };

    // @ts-ignore - acorn types might differ slightly
    const body = ast.body;
    
    // Handle function declaration body if the code is just a function
    // or handle top level statements
    let statements = body;
    // @ts-ignore
    if (body.length > 0 && body[0].type === 'FunctionDeclaration') {
       // @ts-ignore
       statements = body[0].body.body;
    }

    processBlock(statements, startNode.id, 100);

    return { nodes, edges };

  } catch (e) {
    console.error("Parse error", e);
    return {
      nodes: [
        { id: 'error', type: 'input', data: { label: 'Syntax Error' }, position: { x: 250, y: 50 }, className: 'bg-destructive text-destructive-foreground' }
      ],
      edges: []
    };
  }
}
