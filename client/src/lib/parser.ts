import * as acorn from 'acorn';

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
  nodeMap: Map<string, string>; // Maps "line:column" to nodeId
}

// Simple recursive parser to convert AST to Flowchart
// This is a simplified "MVP" implementation. 
// A robust version would handle nested scopes, complex expressions, etc.
export function parseCodeToFlow(code: string): FlowData {
  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const nodeMap = new Map<string, string>();
    let nodeIdCounter = 0;
    let xPos = 250;
    let yPos = 50;
    const yGap = 100;

    const createNode = (stmt: any, label: string, type: FlowNode['type'] = 'default', x: number = xPos, y: number = yPos, className?: string, loc?: SourceLocation): FlowNode => {
      const id = `node-${nodeIdCounter++}`;
      const isDecision = type === 'decision';
      
      // Map the location to this node ID
      if (stmt?.loc) {
        const locKey = `${stmt.loc.start.line}:${stmt.loc.start.column}`;
        nodeMap.set(locKey, id);
      }
      
      return {
        id,
        type,
        data: { label, sourceData: loc },
        position: { x, y },
        className,
        // Explicit dimensions help MiniMap render correctly before measurement
        style: { 
          width: isDecision ? 100 : 150, 
          height: isDecision ? 100 : 40 
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
    const startNode = createNode(null, 'Start', 'input', 250, 0, 'bg-primary text-primary-foreground border-none');
    nodes.push(startNode);
    
    let lastNodeId = startNode.id;
    let currentY = 100;

    // Helper to process a block of statements
    // Returns the ID of the last node in the block
    const processBlock = (statements: any[], parentId: string, startY: number, offsetX: number = 0): string => {
      let currentParent = parentId;
      let localY = startY;

      for (const stmt of statements) {
        const loc: SourceLocation = stmt.loc;

        if (stmt.type === 'VariableDeclaration') {
          const decl = stmt.declarations[0];
          const label = `${stmt.kind} ${decl.id.name} = ...`;
          const node = createNode(stmt, label, 'default', 250 + offsetX, localY, undefined, loc);
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
          const node = createNode(stmt, label, 'default', 250 + offsetX, localY, undefined, loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
          localY += yGap;
        } else if (stmt.type === 'ReturnStatement') {
          const label = stmt.argument ? `return ...` : 'return';
          const node = createNode(stmt, label, 'output', 250 + offsetX, localY, 'bg-destructive/20 border-destructive/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
          localY += yGap;
        } else if (stmt.type === 'IfStatement') {
          // Decision Node
          const testLabel = stmt.test.type === 'BinaryExpression' ? 'condition' : 'check';
          const decisionNode = createNode(stmt, testLabel, 'decision', 250 + offsetX, localY, undefined, loc);
          
          // We store the full label in data for the tooltip/detail view later, but keep display short
          decisionNode.data.label = `if (${testLabel}) ?`;
          if (stmt.test.type === 'Identifier') decisionNode.data.label = `${stmt.test.name}?`;
          
          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));
          
          localY += yGap + 40; // More space for the diamond

          // True Branch (Consequent)
          // We'll put true branch to the left
          const trueBranchNodes: any[] = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          const trueEndId = processBlock(trueBranchNodes, decisionNode.id, localY, offsetX - 150);
          
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
          const mergeNode = createNode(null, 'End If', 'default', 250 + offsetX, localY + (yGap * (Math.max(trueBranchNodes.length, 1) + 1)), 'w-4 h-4 p-0 rounded-full bg-muted', undefined);
          
          // Connect branches to merge
          // This is getting complex for a recursive function.
          // Let's just return the latest nodes and let the outer loop continue.
          
          // Reset currentParent to the merge node (or just pick one for linear flow)
          // In a real CFG, we'd merge.
          currentParent = mergeNode.id; 
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

    return { nodes, edges, nodeMap };

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