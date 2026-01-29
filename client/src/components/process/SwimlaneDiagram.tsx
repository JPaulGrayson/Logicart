/**
 * SwimlaneDiagram - Main BPMN swimlane renderer
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ProcessNode } from './ProcessNode';
import { SwimlaneLane } from './SwimlaneLane';
import { layoutProcess } from '@/lib/process/layoutEngine';
import type { ProcessMap } from '@/types/process';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Image as ImageIcon, FileCode } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';

const nodeTypes = {
  processNode: ProcessNode,
  swimlane: SwimlaneLane,
};

interface SwimlaneDiagramProps {
  processMap: ProcessMap;
  onStepClick?: (stepId: string) => void;
  onStepDoubleClick?: (stepId: string) => void;
  className?: string;
}

function SwimlaneDiagramInner({ processMap, onStepClick, onStepDoubleClick, className }: SwimlaneDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  
  useEffect(() => {
    const { nodes: layoutNodes, edges: layoutEdges } = layoutProcess(processMap);
    setNodes(layoutNodes as Node[]);
    setEdges(layoutEdges as Edge[]);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
  }, [processMap, setNodes, setEdges, fitView]);
  
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode' && onStepClick) onStepClick(node.id);
  }, [onStepClick]);
  
  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode' && onStepDoubleClick) onStepDoubleClick(node.id);
  }, [onStepDoubleClick]);
  
  const handleExportPng = useCallback(async () => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { backgroundColor: '#0f172a', quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${processMap.name.replace(/\s+/g, '-').toLowerCase()}-process.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  }, [processMap.name]);
  
  const handleExportSvg = useCallback(async () => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (!element) return;
    try {
      const dataUrl = await toSvg(element, { backgroundColor: '#0f172a' });
      const link = document.createElement('a');
      link.download = `${processMap.name.replace(/\s+/g, '-').toLowerCase()}-process.svg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  }, [processMap.name]);
  
  const minimapNodeColor = useCallback((node: Node) => {
    if (node.type === 'swimlane') return (node.data as any)?.role?.color || '#475569';
    return '#00d9ff';
  }, []);
  
  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--color-border)" gap={24} size={1} />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="!bg-slate-900/80 !border-slate-700"
          style={{ width: 120, height: 80 }}
        />
      </ReactFlow>
      
      {/* Process title */}
      <div className="absolute top-4 left-4 z-10">
        <div className="px-3 py-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg">
          <h2 className="text-sm font-semibold text-foreground">{processMap.name}</h2>
          {processMap.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{processMap.description}</p>
          )}
        </div>
      </div>
      
      {/* Export toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg">
          <Button variant="ghost" size="sm" onClick={handleExportPng} className="h-7 px-2 text-xs" title="Export as PNG">
            <ImageIcon className="w-3.5 h-3.5 mr-1" />PNG
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportSvg} className="h-7 px-2 text-xs" title="Export as SVG">
            <FileCode className="w-3.5 h-3.5 mr-1" />SVG
          </Button>
        </div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1">
        <div className="flex items-center gap-1 px-1 py-1 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg">
          <Button variant="ghost" size="sm" onClick={() => fitView({ padding: 0.2, duration: 300 })} className="h-7 w-7 p-0" title="Fit to view">
            <Maximize className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoomIn({ duration: 200 })} className="h-7 w-7 p-0" title="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoomOut({ duration: 200 })} className="h-7 w-7 p-0" title="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="px-3 py-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg">
          <div className="text-[10px] text-muted-foreground mb-1.5">BPMN Shapes</div>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500" />
              <span>Start</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500/30 border-2 border-double border-red-500" />
              <span>End</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-card border border-border" />
              <span>Task</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rotate-45 bg-amber-500/30 border border-amber-500" />
              <span>Decision</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SwimlaneDiagram(props: SwimlaneDiagramProps) {
  return (
    <ReactFlowProvider>
      <SwimlaneDiagramInner {...props} />
    </ReactFlowProvider>
  );
}
