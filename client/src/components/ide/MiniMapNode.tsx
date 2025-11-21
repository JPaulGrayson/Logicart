import React from 'react';
import { MiniMapNodeProps } from '@xyflow/react';

export const MiniMapNode = ({ x, y, width, height, color, id }: MiniMapNodeProps) => {
  // We can try to infer type from ID or passed props, but MiniMapNodeProps is limited.
  // However, we can use the passed 'color' which we set in the parent to distinguish types if needed,
  // OR we can just render a generic shape.
  // But wait, we want diamonds for decisions. 
  
  // React Flow MiniMap passes the node instance data if we access it via store, but standard props are limited.
  // Let's stick to a simple rectangle for now to GUARANTEE visibility, 
  // but if we can pass the type via color, we can switch shapes.
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      rx={4}
      ry={4}
      stroke="transparent"
      strokeWidth={0}
    />
  );
};
