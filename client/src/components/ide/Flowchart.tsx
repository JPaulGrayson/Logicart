import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, ConnectionLineType, Node, Edge, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode, FlowEdge } from '@/lib/parser';
import DecisionNode from './DecisionNode';
import ContainerNode from './ContainerNode';
import { FixedMiniMap } from './FixedMiniMap';

interface FlowchartProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  activeNodeId?: string | null;
  highlightedNodes?: Set<string>;
}

// Define nodeTypes outside the component to prevent re-creation on every render
const nodeTypes = {
  decision: DecisionNode,
  container: ContainerNode,
};

function FlowchartInner({ nodes: initialNodes, edges: initialEdges, onNodeClick, onNodeDoubleClick, activeNodeId, highlightedNodes }: FlowchartProps) {
  // Use React Flow's internal state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as unknown as Edge[]);
  const { fitView, getZoom, getNodes } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(1);
  
  // Determine view level based on zoom
  // Mile-high view: < 0.5 (50%)
  // 1000ft view: 0.5 - 0.75 (50-75%)
  // 100ft view: > 0.75 (75%)
  const getViewLevel = useCallback((zoom: number): 'mile-high' | '1000ft' | '100ft' => {
    if (zoom < 0.5) return 'mile-high';
    if (zoom < 0.75) return '1000ft';
    return '100ft';
  }, []);
  
  // Update zoom level using React Flow's viewport change events
  const handleViewportChange = useCallback(() => {
    const zoom = getZoom();
    setCurrentZoom(zoom);
  }, [getZoom]);

  // Sync props with internal state when they change (from parser)
  useEffect(() => {
    const viewLevel = getViewLevel(currentZoom);
    
    // Get current nodes to preserve collapse state
    const currentNodes = getNodes();
    const collapseStateMap = new Map<string, { collapsed: boolean; isChildOfCollapsed: boolean }>();
    
    // Build a map of current collapse states
    currentNodes.forEach(node => {
      collapseStateMap.set(node.id, {
        collapsed: node.data?.collapsed === true,
        isChildOfCollapsed: node.data?.isChildOfCollapsed === true
      });
    });
    
    const updatedNodes = initialNodes.map(node => {
      const isActive = node.id === activeNodeId;
      const isHighlighted = highlightedNodes && highlightedNodes.has(node.id);
      
      let className = node.className || '';
      
      if (isActive) {
        className = 'bg-green-500/20 border-green-500 border-2 shadow-lg shadow-green-500/50';
      } else if (isHighlighted) {
        className = 'bg-purple-500/20 border-purple-500 border-2 shadow-lg shadow-purple-500/50 ring-2 ring-purple-500/30';
      }
      
      // Determine node visibility based on zoom level AND manual collapse state
      const isContainer = node.type === 'container';
      
      // Preserve collapse state from current node state (if it exists)
      const preservedState = collapseStateMap.get(node.id);
      const isCollapsed = preservedState?.collapsed ?? (node.data?.collapsed === true);
      const isChildOfCollapsedContainer = preservedState?.isChildOfCollapsed ?? false;
      
      let zoomHidden = false;
      
      if (viewLevel === 'mile-high') {
        // Only show container nodes at mile-high view
        zoomHidden = !isContainer;
      } else if (viewLevel === '1000ft') {
        // At 1000ft, show all nodes
        zoomHidden = false;
      }
      // At 100ft (detailed view), show everything (zoomHidden = false)
      
      // Combine zoom-based hiding with manual collapse state
      const hidden = zoomHidden || isChildOfCollapsedContainer;
      
      return {
        ...node,
        className,
        hidden,
        data: {
          ...node.data,
          // Preserve collapse state from existing nodes
          collapsed: isCollapsed,
          isChildOfCollapsed: isChildOfCollapsedContainer
        }
      } as unknown as Node;
    });
    setNodes(updatedNodes);
    setEdges(initialEdges as unknown as Edge[]);
  }, [initialNodes, initialEdges, activeNodeId, highlightedNodes, currentZoom, getViewLevel, setNodes, setEdges, getNodes]);
  
  // Fit view only when graph topology changes (not on zoom)
  useEffect(() => {
    if (initialNodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 50);
    }
  }, [initialNodes.length, fitView]);

  return (
    <div className="h-full w-full bg-background flex flex-col">
       <div className="h-10 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur text-xs font-mono text-muted-foreground uppercase tracking-wider justify-between">
        <span>Control Flow Graph</span>
        <div className="flex items-center gap-4">
          <span className="text-xs">
            View: <span className="text-primary font-semibold">
              {currentZoom < 0.5 ? 'Mile-High' : currentZoom < 0.75 ? '1000ft' : '100ft Detail'}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span> Live
          </span>
        </div>
      </div>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => onNodeClick?.(node)}
          onNodeDoubleClick={(_, node) => onNodeDoubleClick?.(node)}
          onMove={handleViewportChange}
          onMoveEnd={handleViewportChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.SmoothStep}
        >
          <Background color="var(--color-border)" gap={24} size={1} />
          <Controls position="top-left" className="bg-card border-border text-foreground" />
          <FixedMiniMap 
            nodeColor={(n) => {
              if (n.type === 'input') return '#3b82f6';
              if (n.type === 'output') return '#ef4444';
              if (n.type === 'decision') return '#eab308';
              return '#64748b';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function Flowchart(props: FlowchartProps) {
  return (
    <ReactFlowProvider>
      <FlowchartInner {...props} />
    </ReactFlowProvider>
  );
}