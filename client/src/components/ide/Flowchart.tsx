import React, { useMemo, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ReactFlow, Background, Controls, ConnectionLineType, Node, Edge, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider, useOnViewportChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode, FlowEdge } from '@/lib/parser';
import DecisionNode from './DecisionNode';
import ContainerNode from './ContainerNode';
import LabeledNode from './LabeledNode';
import { Button } from '@/components/ui/button';
import { Maximize, ZoomIn, ZoomOut, Home, ChevronRight } from 'lucide-react';
import type { RuntimeState } from '@shared/reporter-api';

// Zoom preset definitions
const ZOOM_PRESETS = [
  { name: '25%', zoom: 0.25, icon: '🔭' },
  { name: '50%', zoom: 0.5, icon: '🏢' },
  { name: '100%', zoom: 1.0, icon: '🔍' },
  { name: 'Fit', zoom: -1, icon: '📐' },
] as const;

interface FlowchartProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  onBreakpointToggle?: (nodeId: string) => void;
  activeNodeId?: string | null;
  highlightedNodes?: Set<string>;
  breakpoints?: Set<string>;
  runtimeState?: RuntimeState;
}

// Define nodeTypes outside the component to prevent re-creation on every render
const nodeTypes = {
  decision: DecisionNode,
  container: ContainerNode,
  default: LabeledNode,
  input: LabeledNode,
  output: LabeledNode,
};

function FlowchartInner({ nodes: initialNodes, edges: initialEdges, onNodeClick, onNodeDoubleClick, onBreakpointToggle, activeNodeId, highlightedNodes, breakpoints, runtimeState }: FlowchartProps) {
  // Use React Flow's internal state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as unknown as Edge[]);
  const { fitView, getZoom, getNodes, zoomIn, zoomOut, zoomTo } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(1);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; label: string }>>([{ id: 'root', label: 'Global' }]);
  
  // Apply zoom preset (-1 means fitView)
  const applyZoomPreset = useCallback((zoomLevel: number) => {
    if (zoomLevel === -1) {
      fitView({ padding: 0.3, duration: 300 });
    } else {
      zoomTo(zoomLevel, { duration: 300 });
    }
  }, [zoomTo, fitView]);
  
  // Auto-fit view with padding - no zoom restrictions so users can zoom freely
  const handleAutoFit = useCallback(() => {
    fitView({ 
      padding: 0.3, 
      duration: 400
    });
  }, [fitView]);
  
  // Zoom in by 20%
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);
  
  // Zoom out by 20%
  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);
  
  // Determine current zoom level name for highlighting active preset button
  const getActiveZoomPreset = useCallback((zoom: number): string => {
    if (Math.abs(zoom - 0.25) < 0.1) return '25%';
    if (Math.abs(zoom - 0.5) < 0.1) return '50%';
    if (Math.abs(zoom - 1.0) < 0.1) return '100%';
    return '';
  }, []);
  
  // Track zoom level using React Flow's viewport change hook for reliable updates
  useOnViewportChange({
    onChange: ({ zoom }) => setCurrentZoom(zoom),
  });

  // Sync props with internal state when they change (from parser)
  useEffect(() => {
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
      const hasBreakpoint = breakpoints && breakpoints.has(node.id);
      
      // Preserve existing className (including diff styling) and add state classes
      let className = node.className || '';
      
      if (isActive) {
        className += ' active-node ring-4 ring-green-500 ring-offset-2 ring-offset-background';
      } else if (isHighlighted) {
        className += ' highlighted-node ring-2 ring-purple-500 ring-offset-1 ring-offset-background';
      }
      
      if (hasBreakpoint) {
        className += ' breakpoint-node';
      }
      
      // Preserve collapse state from current node state (if it exists)
      const preservedState = collapseStateMap.get(node.id);
      const isCollapsed = preservedState?.collapsed ?? (node.data?.collapsed === true);
      const isChildOfCollapsedContainer = preservedState?.isChildOfCollapsed ?? false;
      
      // Only hide nodes that are children of collapsed containers
      // Nodes remain visible at all zoom levels (outline mode handled via CSS)
      const hidden = isChildOfCollapsedContainer;
      
      return {
        ...node,
        className: className.trim(),
        style: node.style, // Preserve diff styling
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
  }, [initialNodes, initialEdges, activeNodeId, highlightedNodes, breakpoints, setNodes, setEdges, getNodes]);
  
  // Fit view and center when graph topology changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.3, duration: 400 });
      }, 50);
    }
  }, [initialNodes.length, fitView]);

  return (
    <div className="h-full w-full bg-background relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeClick?.(node)}
        onNodeDoubleClick={(_, node) => onNodeDoubleClick?.(node)}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          onBreakpointToggle?.(node.id);
        }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Background color="var(--color-border)" gap={24} size={1} />
        {/* MiniMap removed - users can zoom out with mouse/keyboard for overview */}
      </ReactFlow>
      
      {/* Breadcrumb Navigation - Top Left */}
      <div 
        className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-card/95 backdrop-blur border border-border rounded-md shadow-lg text-[10px] z-20"
        data-testid="breadcrumb-nav"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setBreadcrumbs([{ id: 'root', label: 'Global' }]);
            handleAutoFit();
          }}
          className="h-5 w-5 p-0"
          title="Go to root"
          data-testid="button-breadcrumb-home"
        >
          <Home className="w-3 h-3" />
        </Button>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            <button
              onClick={() => setBreadcrumbs(breadcrumbs.slice(0, idx + 1))}
              className={`px-1.5 py-0.5 rounded text-[10px] hover:bg-accent transition-colors ${
                idx === breadcrumbs.length - 1 ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
              data-testid={`breadcrumb-${crumb.id}`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      
      {/* Floating Status Pill - Top Right */}
      <div 
        className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-card/95 backdrop-blur border border-border rounded-full shadow-lg text-[10px] z-20"
        data-testid="status-pill"
      >
        <span>
          <span className="text-muted-foreground">View:</span>{' '}
          <span className="text-primary font-semibold">
            {currentZoom < 0.4 ? 'Mile-High' : currentZoom < 1.0 ? '1000ft' : '100ft'}
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
        {/* Zoom Presets */}
        <div className="flex items-center gap-0.5 mr-1 px-1 py-0.5 bg-card/95 backdrop-blur border border-border rounded-md shadow-md">
          {ZOOM_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="ghost"
              size="sm"
              onClick={() => applyZoomPreset(preset.zoom)}
              className={`h-6 px-2 text-[10px] ${
                getActiveZoomPreset(currentZoom) === preset.name 
                  ? 'bg-primary/20 text-primary' 
                  : ''
              }`}
              title={preset.zoom === -1 ? 'Fit to view' : `Zoom to ${preset.name}`}
              data-testid={`button-zoom-preset-${preset.name.toLowerCase()}`}
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.name}
            </Button>
          ))}
        </div>
        
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