import React, { useMemo } from 'react';
import { useNodes, Node } from '@xyflow/react';

interface FixedMiniMapProps {
  nodeColor?: (node: Node) => string;
}

/**
 * Fixed MiniMap that maintains constant scale regardless of main canvas zoom
 * Uses its own independent SVG viewBox instead of sharing viewport transform
 * MUST be rendered inside <ReactFlow> component to access node data
 */
export function FixedMiniMap({ nodeColor }: FixedMiniMapProps) {
  // Get nodes from React Flow context (must be inside ReactFlow component)
  const nodes = useNodes();
  
  // Calculate bounds of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    nodes.forEach(node => {
      const width = node.width || 150;
      const height = node.height || 40;
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });
    
    // Add padding
    const padding = 50;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [nodes]);
  
  const viewBoxWidth = bounds.maxX - bounds.minX;
  const viewBoxHeight = bounds.maxY - bounds.minY;
  
  const getNodeColor = (node: Node): string => {
    if (nodeColor) {
      return nodeColor(node);
    }
    
    if (node.type === 'input') return '#3b82f6';
    if (node.type === 'output') return '#ef4444';
    if (node.type === 'decision') return '#eab308';
    return '#64748b';
  };
  
  return (
    <div 
      className="absolute bottom-4 left-4 z-10 rounded border"
      style={{
        width: 200,
        height: 150,
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${bounds.minX} ${bounds.minY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={viewBoxWidth}
          height={viewBoxHeight}
          fill="transparent"
        />
        
        {/* Render nodes */}
        {nodes.map(node => {
          const width = node.width || 150;
          const height = node.height || 40;
          const color = getNodeColor(node);
          
          return (
            <rect
              key={node.id}
              x={node.position.x}
              y={node.position.y}
              width={width}
              height={height}
              fill={color}
              rx={4}
              ry={4}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}
