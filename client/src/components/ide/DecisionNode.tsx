import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const DecisionNode = ({ data }: NodeProps) => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* The Diamond Shape */}
      <div className="absolute inset-0 bg-card border-2 border-accent rotate-45 rounded-sm shadow-sm hover:shadow-md transition-shadow bg-accent/5" />
      
      {/* The Content (Stays Horizontal) */}
      <div className="relative z-10 text-xs font-mono text-center p-2 pointer-events-none font-medium text-accent-foreground/90">
        {data.label as string}
      </div>

      {/* Handles - adjusted for the diamond shape */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-accent !w-3 !h-3 !-mt-3" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        className="!bg-green-500 !w-3 !h-3 !-mb-3" 
      />
       <Handle 
        type="source" 
        position={Position.Right} 
        id="false"
        className="!bg-red-500 !w-3 !h-3 !-mr-3" 
      />
    </div>
  );
};

export default memo(DecisionNode);
