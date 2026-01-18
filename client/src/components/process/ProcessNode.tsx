/**
 * ProcessNode - BPMN shape renderer
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { ProcessNodeData, StepType } from '@/types/process';
import { cn } from '@/lib/utils';

const SHAPE_STYLES: Record<StepType, string> = {
  start: 'rounded-full bg-emerald-500/20 border-2 border-emerald-500',
  end: 'rounded-full bg-red-500/20 border-4 border-double border-red-500',
  task: 'rounded-lg bg-card border-2 border-border hover:border-primary/50',
  decision: 'rotate-45 bg-amber-500/20 border-2 border-amber-500',
  delay: 'rounded-lg bg-slate-500/20 border-2 border-dashed border-slate-500',
  subprocess: 'rounded-lg bg-purple-500/10 border-2 border-purple-500',
};

const ICON_MAP: Record<StepType, string> = {
  start: '▶',
  end: '⏹',
  task: '',
  decision: '◇',
  delay: '⏱',
  subprocess: '⊞',
};

interface ProcessNodeComponentProps {
  data: ProcessNodeData;
  selected?: boolean;
}

function ProcessNodeComponent({ data, selected }: ProcessNodeComponentProps) {
  const { step, role, isActive, isHighlighted } = data;
  const isCircle = step.type === 'start' || step.type === 'end';
  const isDiamond = step.type === 'decision';
  const baseSize = isCircle ? 'w-16 h-16' : isDiamond ? 'w-14 h-14' : 'w-44 h-14';
  
  return (
    <div className="relative">
      {step.type !== 'start' && (
        <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-2 !border-slate-600" />
      )}
      
      <div
        className={cn(
          'flex items-center justify-center transition-all duration-200',
          baseSize,
          SHAPE_STYLES[step.type],
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          isActive && 'ring-2 ring-green-500 ring-offset-2 ring-offset-background animate-pulse',
          isHighlighted && 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-background',
        )}
        style={{ boxShadow: isActive ? `0 0 20px ${role.color}40` : undefined }}
      >
        <div className={cn('flex flex-col items-center justify-center text-center px-2', isDiamond && '-rotate-45')}>
          {ICON_MAP[step.type] && (
            <span className={cn(
              'text-lg',
              step.type === 'start' && 'text-emerald-400',
              step.type === 'end' && 'text-red-400',
              step.type === 'delay' && 'text-slate-400',
              step.type === 'subprocess' && 'text-purple-400',
            )}>
              {ICON_MAP[step.type]}
            </span>
          )}
          {!isCircle && (
            <span className={cn('text-xs font-medium text-foreground truncate max-w-[160px]', isDiamond && 'text-[10px] max-w-[80px]')}>
              {step.name}
            </span>
          )}
        </div>
      </div>
      
      {isCircle && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] text-muted-foreground">{step.name}</span>
        </div>
      )}
      
      <div 
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
        style={{ backgroundColor: role.color }}
        title={role.name}
      />
      
      {step.type !== 'end' && (
        <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-2 !border-slate-600" />
      )}
      
      {isDiamond && (
        <>
          <Handle type="source" position={Position.Right} id="right" className="!bg-amber-400 !w-2 !h-2 !border-2 !border-amber-600" style={{ top: '50%' }} />
          <Handle type="source" position={Position.Left} id="left" className="!bg-amber-400 !w-2 !h-2 !border-2 !border-amber-600" style={{ top: '50%' }} />
        </>
      )}
    </div>
  );
}

export const ProcessNode = memo(ProcessNodeComponent);
