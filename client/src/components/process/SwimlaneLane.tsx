/**
 * SwimlaneLane - BPMN swimlane background renderer
 */

import React, { memo } from 'react';
import type { SwimlaneLaneData, RoleType } from '@/types/process';
import { cn } from '@/lib/utils';
import { User, Monitor, Bot, Building2 } from 'lucide-react';

const ROLE_ICONS: Record<RoleType, React.ReactNode> = {
  human: <User className="w-4 h-4" />,
  system: <Monitor className="w-4 h-4" />,
  ai: <Bot className="w-4 h-4" />,
  external: <Building2 className="w-4 h-4" />,
};

interface SwimlaneLaneProps {
  data: SwimlaneLaneData;
}

function SwimlaneLaneComponent({ data }: SwimlaneLaneProps) {
  const { role, width, height } = data;
  
  return (
    <div className="relative" style={{ width, height }}>
      <div 
        className={cn('absolute inset-0 rounded-lg', 'bg-gradient-to-b from-slate-800/40 to-slate-900/20', 'border border-slate-700/50')}
        style={{ borderTopColor: role.color, borderTopWidth: 3 }}
      />
      
      <div className={cn(
        'absolute top-0 left-0 right-0 h-12',
        'flex items-center justify-center gap-2',
        'bg-slate-800/60 backdrop-blur-sm',
        'border-b border-slate-700/50',
        'rounded-t-lg'
      )}>
        <div 
          className="flex items-center justify-center w-6 h-6 rounded-md"
          style={{ backgroundColor: `${role.color}20`, color: role.color }}
        >
          {ROLE_ICONS[role.type]}
        </div>
        <span className="text-sm font-semibold" style={{ color: role.color }}>
          {role.name}
        </span>
      </div>
      
      <div className="absolute inset-x-0 top-12 bottom-0 flex justify-center pointer-events-none">
        <div className="w-px h-full opacity-20" style={{ backgroundColor: role.color }} />
      </div>
    </div>
  );
}

export const SwimlaneLane = memo(SwimlaneLaneComponent);
