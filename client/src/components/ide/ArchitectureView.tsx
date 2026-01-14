import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Box, ArrowRight, Layers, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ArchitectureComponent {
  id: string;
  label: string;
  filePath: string;
  type: 'function' | 'class' | 'arrow';
  exports: boolean;
  lineCount: number;
  code: string;
}

export interface ArchitectureConnection {
  source: string;
  target: string;
}

interface ArchitectureViewProps {
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
  onComponentClick?: (component: ArchitectureComponent) => void;
  onClose?: () => void;
}

// Custom component node
function ComponentNode({ data }: { data: ArchitectureComponent & { onClick?: () => void } }) {
  const getTypeColor = () => {
    switch (data.type) {
      case 'class': return 'bg-purple-500/20 border-purple-500/50';
      case 'function': return 'bg-blue-500/20 border-blue-500/50';
      case 'arrow': return 'bg-green-500/20 border-green-500/50';
      default: return 'bg-muted border-border';
    }
  };

  const getTypeIcon = () => {
    switch (data.type) {
      case 'class': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'function': return <Box className="w-4 h-4 text-blue-400" />;
      case 'arrow': return <ArrowRight className="w-4 h-4 text-green-400" />;
      default: return <Code2 className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${getTypeColor()}`}
      onClick={data.onClick}
      data-testid={`component-node-${data.id}`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        {getTypeIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
        {data.exports && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary">export</span>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
        {data.filePath}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {data.lineCount} lines
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary" />
    </div>
  );
}

const nodeTypes = {
  component: ComponentNode,
};

// Apply dagre layout
function applyLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 40,
      },
    };
  });
}

function ArchitectureViewInner({ components, connections, onComponentClick, onClose }: ArchitectureViewProps) {
  const { fitView } = useReactFlow();
  
  // Create a map for quick component lookup
  const componentMap = useMemo(() => {
    const map = new Map<string, ArchitectureComponent>();
    components.forEach(comp => map.set(comp.id, comp));
    return map;
  }, [components]);
  
  // Handle node click via React Flow's onNodeClick
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const component = componentMap.get(node.id);
    if (component && onComponentClick) {
      onComponentClick(component);
    }
  }, [componentMap, onComponentClick]);
  
  // Convert to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    return components.map((comp) => ({
      id: comp.id,
      type: 'component',
      position: { x: 0, y: 0 },
      data: {
        ...comp,
      },
    }));
  }, [components]);

  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((conn, idx) => ({
      id: `edge-${idx}`,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--color-muted-foreground)', strokeWidth: 2 },
    }));
  }, [connections]);

  // Apply layout
  const layoutedNodes = useMemo(() => {
    return applyLayout(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Fit view on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <div className="w-full h-full bg-background" data-testid="architecture-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Background color="var(--color-muted)" gap={20} />
        <Controls className="!bg-card !border-border" />
        <MiniMap 
          className="!bg-card !border-border"
          nodeColor={(node) => {
            const type = (node.data as any)?.type;
            switch (type) {
              case 'class': return '#a855f7';
              case 'function': return '#3b82f6';
              case 'arrow': return '#22c55e';
              default: return '#6b7280';
            }
          }}
        />
        
        {/* Header panel */}
        <Panel position="top-left" className="!m-2">
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span className="font-semibold">Architecture View</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {components.length} components · {connections.length} connections
            </div>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                data-testid="button-close-architecture"
              >
                Back to Flowchart
              </Button>
            )}
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left" className="!m-2">
          <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-card border border-border text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Function</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Arrow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Class</span>
            </div>
          </div>
        </Panel>

        {/* Click hint */}
        <Panel position="bottom-right" className="!m-2">
          <div className="px-3 py-2 rounded-lg bg-card border border-border text-xs text-muted-foreground">
            Click a component to view its flowchart
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function ArchitectureView(props: ArchitectureViewProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureViewInner {...props} />
    </ReactFlowProvider>
  );
}
