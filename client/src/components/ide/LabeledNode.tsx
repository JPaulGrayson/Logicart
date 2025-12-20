import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LabeledNode = ({ data, type }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const userLabel = data.userLabel as string | undefined;
  const codeLabel = data.label as string;
  const sourceSnippet = data.sourceSnippet as string | undefined;
  
  const displayLabel = userLabel || codeLabel;
  const showTooltip = userLabel && isHovered;
  // Show sourceSnippet if available, otherwise fall back to codeLabel
  const tooltipCode = sourceSnippet || codeLabel;
  
  const isInput = type === 'input';
  const isOutput = type === 'output';
  
  let bgClass = 'bg-card border-border';
  if (isInput) {
    bgClass = 'bg-primary text-primary-foreground border-primary';
  } else if (isOutput) {
    bgClass = 'bg-destructive/20 border-destructive/50';
  }
  
  const content = (
    <div 
      className={`px-4 py-3 rounded-lg border-2 shadow-sm hover:shadow-md transition-all min-w-[120px] text-center ${bgClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`node-${data.label}`}
    >
      <div className="text-xs font-mono leading-tight">
        {userLabel ? (
          <span className="font-medium text-foreground">{displayLabel}</span>
        ) : (
          <span className="text-muted-foreground">{displayLabel}</span>
        )}
      </div>
      
      {userLabel && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" title="Has user label" />
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-accent !w-2 !h-2" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-accent !w-2 !h-2" 
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

export default memo(LabeledNode);
