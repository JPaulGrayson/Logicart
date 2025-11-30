import React, { useMemo, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ReactFlow, Background, Controls, ConnectionLineType, Node, Edge, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode, FlowEdge } from '@/lib/parser';
import DecisionNode from './DecisionNode';
import ContainerNode from './ContainerNode';
import { FixedMiniMap } from './FixedMiniMap';
import { Button } from '@/components/ui/button';
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import type { RuntimeState } from '@shared/reporter-api';

interface FlowchartProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  activeNodeId?: string | null;
  highlightedNodes?: Set<string>;
  runtimeState?: RuntimeState;
}

// Define nodeTypes outside the component to prevent re-creation on every render
const nodeTypes = {
  decision: DecisionNode,
  container: ContainerNode,
};

function FlowchartInner({ nodes: initialNodes, edges: initialEdges, onNodeClick, onNodeDoubleClick, activeNodeId, highlightedNodes, runtimeState }: FlowchartProps) {
  // Use React Flow's internal state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as unknown as Edge[]);
  const { fitView, getZoom, getNodes, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(1);
  
  // Minimum zoom threshold for readability (70% ensures nodes remain readable)
  const MIN_READABLE_ZOOM = 0.7;
  
  // Clamp zoom to minimum readable level while preserving center position
  const clampToMinZoom = useCallback(() => {
    const currentZoomLevel = getZoom();
    if (currentZoomLevel < MIN_READABLE_ZOOM) {
      const viewport = getViewport();
      setViewport({ 
        x: viewport.x, 
        y: viewport.y, 
        zoom: MIN_READABLE_ZOOM 
      }, { duration: 200 });
    }
  }, [getZoom, getViewport, setViewport]);
  
  // Auto-fit with minimum zoom threshold for readability
  // React Flow's fitView doesn't respect minZoom, so we clamp after
  const handleAutoFit = useCallback(() => {
    fitView({ 
      padding: 0.2, 
      duration: 400
    });
    // After fitView animation completes, clamp to minimum zoom if needed
    setTimeout(() => {
      clampToMinZoom();
    }, 420); // Slightly after fitView duration
  }, [fitView, clampToMinZoom]);
  
  // Zoom in by 20%
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);
  
  // Zoom out by 20%
  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);
  
  // Determine view level based on zoom
  // Mile-high view: < 0.7 (70%) - zoomed out view showing only containers
  // 1000ft view: 0.7 - 1.3 (70-130%) - medium zoom showing all nodes
  // 100ft view: > 1.3 (130%) - zoomed in detailed view
  const getViewLevel = useCallback((zoom: number): 'mile-high' | '1000ft' | '100ft' => {
    if (zoom < 0.7) return 'mile-high';
    if (zoom < 1.3) return '1000ft';
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
        className = 'active-node ring-4 ring-green-500 ring-offset-2 ring-offset-background';
      } else if (isHighlighted) {
        className = 'highlighted-node ring-2 ring-purple-500 ring-offset-1 ring-offset-background';
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
  // Ensures minimum readable zoom after fitView completes
  useEffect(() => {
    if (initialNodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
        // Clamp to minimum zoom after fitView animation
        setTimeout(() => {
          clampToMinZoom();
        }, 420);
      }, 50);
    }
  }, [initialNodes.length, fitView, clampToMinZoom]);

  return (
    <div className="h-full w-full bg-background relative">
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
        {/* Removed Controls component - zoom controls available via mouse/keyboard */}
        <FixedMiniMap 
          nodeColor={(n) => {
            if (n.type === 'input') return '#3b82f6';
            if (n.type === 'output') return '#ef4444';
            if (n.type === 'decision') return '#eab308';
            return '#64748b';
          }}
        />
      </ReactFlow>
      
      {/* Floating Status Pill - Top Right */}
      <div 
        className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-card/95 backdrop-blur border border-border rounded-full shadow-lg text-[10px] z-20"
        data-testid="status-pill"
      >
        <span>
          <span className="text-muted-foreground">View:</span>{' '}
          <span className="text-primary font-semibold">
            {currentZoom < 0.7 ? 'Mile-High' : currentZoom < 1.3 ? '1000ft' : '100ft'}
          </span>
          <span className="ml-1 text-muted-foreground">
            ({Math.round(currentZoom * 100)}%)
          </span>
        </span>
        <span className="w-px h-3 bg-border" />
        <span className="flex items-center gap-1">
          {runtimeState?.mode === 'live' ? (
            <>
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-green-500 font-semibold">Live Mode</span>
              <span className="text-muted-foreground/60">
                ({runtimeState.checkpointCount} checkpoints)
              </span>
            </>
          ) : (
            <>
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              <span className="text-blue-500">Static Mode</span>
            </>
          )}
        </span>
      </div>
      
      {/* Zoom Controls - Bottom Right */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 z-20">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleAutoFit()}
          className="h-7 w-7 p-0 bg-card/95 backdrop-blur shadow-md"
          title="Auto-fit to view (ensures minimum readable zoom)"
          data-testid="button-auto-fit"
        >
          <Maximize className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          className="h-7 w-7 p-0 bg-card/95 backdrop-blur shadow-md"
          title="Zoom in"
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          className="h-7 w-7 p-0 bg-card/95 backdrop-blur shadow-md"
          title="Zoom out"
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
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