import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ConnectionLineType, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode, FlowEdge } from '@/lib/parser';
import DecisionNode from './DecisionNode';
import { MiniMapNode } from './MiniMapNode';

interface FlowchartProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodeClick?: (node: Node) => void;
}

// Define nodeTypes outside the component to prevent re-creation on every render
const nodeTypes = {
  decision: DecisionNode,
};

export function Flowchart({ nodes: initialNodes, edges: initialEdges, onNodeClick }: FlowchartProps) {
  // Use React Flow's internal state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as unknown as Edge[]);

  // Sync props with internal state when they change (from parser)
  useEffect(() => {
    setNodes(initialNodes as unknown as Node[]);
    setEdges(initialEdges as unknown as Edge[]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="h-full w-full bg-background flex flex-col">
       <div className="h-10 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur text-xs font-mono text-muted-foreground uppercase tracking-wider justify-between">
        <span>Control Flow Graph</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span> Live
        </span>
      </div>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => onNodeClick?.(node)}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.SmoothStep}
        >
          <Background color="var(--color-border)" gap={24} size={1} />
          <Controls position="top-left" className="bg-card border-border text-foreground" />
          <MiniMap 
            position="bottom-left"
            style={{ height: 150, width: 200, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            nodeComponent={MiniMapNode}
            nodeColor={(n) => {
              if (n.type === 'input') return '#3b82f6';
              if (n.type === 'output') return '#ef4444';
              if (n.type === 'decision') return '#eab308';
              return '#64748b';
            }}
            maskColor="rgba(0, 0, 0, 0.3)"
            zoomable
            pannable
          />
        </ReactFlow>
      </div>
    </div>
  );
}