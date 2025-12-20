import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DecisionNode = ({ data }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const userLabel = data.userLabel as string | undefined;
  const codeLabel = data.label as string;
  const sourceSnippet = data.sourceSnippet as string | undefined;
  const displayLabel = userLabel || codeLabel;
  const showTooltip = userLabel && isHovered;
  // Show sourceSnippet if available, otherwise fall back to codeLabel
  const tooltipCode = sourceSnippet || codeLabel;
  
  const content = (
    <div 
      className="relative w-24 h-24 flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* The Diamond Shape */}
      <div className="absolute inset-0 bg-card border-2 border-accent rotate-45 rounded-sm shadow-sm hover:shadow-md transition-shadow bg-accent/5" />
      
      {/* User label indicator dot */}
      {userLabel && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full z-20" title="Has user label" />
      )}
      
      {/* The Content (Stays Horizontal) */}
      <div className="relative z-10 text-xs font-mono text-center p-2 pointer-events-none font-medium text-accent-foreground/90">
        {userLabel ? (
          <span className="font-medium">{displayLabel}</span>
        ) : (
          displayLabel
        )}
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
  
  if (userLabel) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip open={showTooltip || false}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="max-w-sm bg-card border border-border shadow-lg"
          >
            <div className="text-xs">
              <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide">Code:</div>
              <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px] block whitespace-pre-wrap">
                {tooltipCode}
              </code>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return content;
};

export default memo(DecisionNode);
