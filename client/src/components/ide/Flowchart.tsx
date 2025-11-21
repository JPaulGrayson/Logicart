import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ConnectionLineType, Node, Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode, FlowEdge } from '@/lib/parser';

interface FlowchartProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function Flowchart({ nodes: initialNodes, edges: initialEdges }: FlowchartProps) {
  // We use key to force re-render when nodes/edges change significantly from the parser
  // In a real app, we'd use useEffect to sync, but for MVP this ensures fresh layout
  const key = useMemo(() => JSON.stringify({ n: initialNodes.length, e: initialEdges.length }), [initialNodes, initialEdges]);

  // Cast our parser nodes to ReactFlow nodes since we know they are compatible at runtime
  // and we relaxed the type in parser.ts
  const nodes = initialNodes as unknown as Node[];
  const edges = initialEdges as unknown as Edge[];

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
          key={key}
          nodes={nodes}
          edges={edges}
          fitView
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.SmoothStep}
        >
          <Background color="var(--color-border)" gap={24} size={1} />
          <Controls className="bg-card border-border text-foreground" />
          <MiniMap 
            className="bg-card border border-border shadow-lg rounded-md overflow-hidden"
            nodeColor="#3b82f6" 
            maskColor="rgba(0, 0, 0, 0.3)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
