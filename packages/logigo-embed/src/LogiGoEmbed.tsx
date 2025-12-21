import React, { useState, useEffect, useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, ReactFlowProvider, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as acorn from 'acorn';
import dagre from 'dagre';
import { LogiGoEmbedProps, EmbedState } from './types';

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
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
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
    console.error('[LogiGo] Parse error:', error);
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

export function LogiGoEmbed({
  code,
  position = 'bottom-right',
  defaultOpen = true,
  defaultSize = { width: 400, height: 300 },
  showVariables = true,
  theme = 'dark',
  onNodeClick,
  onReady,
  onError
}: LogiGoEmbedProps) {
  const [state, setState] = useState<EmbedState>({
    isOpen: defaultOpen,
    size: defaultSize,
    activeNodeId: null,
    variables: {},
    checkpointHistory: []
  });

  const { nodes, edges } = useMemo(() => {
    try {
      return parseCode(code);
    } catch (error) {
      onError?.(error as Error);
      return { nodes: [], edges: [] };
    }
  }, [code, onError]);

  useEffect(() => {
    if (nodes.length > 0) {
      onReady?.();
    }
  }, [nodes, onReady]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'LOGIGO_CORE') return;
      
      if (event.data.type === 'LOGIGO_CHECKPOINT') {
        const { id, variables, timestamp } = event.data.payload;
        setState(prev => ({
          ...prev,
          activeNodeId: id,
          variables: variables || {},
          checkpointHistory: [...prev.checkpointHistory, { id, timestamp, variables: variables || {} }]
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const nodeCount = nodes.length;
  const hasParseError = nodes.length === 1 && nodes[0]?.id === 'error';

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'top-left': { top: 16, left: 16 }
  };

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
        data-testid="logigo-toggle"
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
      data-testid="logigo-embed-panel"
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
        <span style={{ 
          color: theme === 'dark' ? '#60a5fa' : '#3b82f6', 
          fontWeight: 600, 
          fontSize: 12,
          fontFamily: 'system-ui, sans-serif'
        }}>
          LogiGo
        </span>
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
          data-testid="logigo-close"
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
    </div>
  );
}

export default LogiGoEmbed;
