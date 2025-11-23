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

    const processBlock = (statements: any[], parentId: string): string => {
      let currentParent = parentId;

      for (const stmt of statements) {
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
          currentParent = node.id;
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
