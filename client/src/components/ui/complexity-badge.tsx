import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity } from 'lucide-react';
import type { FlowNode, FlowEdge } from '@/lib/parser';

export interface ComplexityData {
  score: number;
  level: 'clean' | 'complex' | 'spaghetti';
  decisionNodes: number;
  totalNodes: number;
  totalEdges: number;
}

export function calculateComplexity(nodes: FlowNode[], edges: FlowEdge[]): ComplexityData {
  const decisionNodes = nodes.filter(n => n.type === 'decision').length;
  
  const score = decisionNodes + 1;
  
  let level: 'clean' | 'complex' | 'spaghetti';
  if (score <= 5) {
    level = 'clean';
  } else if (score <= 15) {
    level = 'complex';
  } else {
    level = 'spaghetti';
  }
  
  return {
    score,
    level,
    decisionNodes,
    totalNodes: nodes.length,
    totalEdges: edges.length
  };
}

interface ComplexityBadgeProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ComplexityBadge({ nodes, edges, showLabel = true, size = 'sm' }: ComplexityBadgeProps) {
  if (nodes.length === 0) return null;
  
  const complexity = calculateComplexity(nodes, edges);
  
  const colorClasses = {
    clean: 'bg-green-500/20 text-green-400 border-green-500/50',
    complex: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    spaghetti: 'bg-red-500/20 text-red-400 border-red-500/50'
  };
  
  const labels = {
    clean: 'Clean',
    complex: 'Complex',
    spaghetti: 'Spaghetti'
  };
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 h-5',
    md: 'text-xs px-2 py-1'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${colorClasses[complexity.level]} ${sizeClasses[size]} gap-1 cursor-help font-mono`}
            data-testid="badge-complexity"
          >
            <Activity className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>{complexity.score}</span>
            {showLabel && <span className="font-sans">• {labels[complexity.level]}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">Cyclomatic Complexity: {complexity.score}</div>
            <div className="text-muted-foreground">
              {complexity.decisionNodes} decision points (if/for/while)
            </div>
            <div className="text-muted-foreground">
              {complexity.totalNodes} nodes, {complexity.totalEdges} edges
            </div>
            <div className="border-t border-border pt-1 mt-1">
              <span className="text-green-400">1-5: Clean</span> • 
              <span className="text-yellow-400"> 6-15: Complex</span> • 
              <span className="text-red-400"> 15+: Spaghetti</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ArenaFlowNode {
  id: string;
  type: string;
  label: string;
  children: Array<{ targetId: string; condition?: string }>;
}

export function calculateComplexityFromArenaFlow(flow: ArenaFlowNode[]): number {
  const decisionNodes = flow.filter(n => n.type === 'DECISION' || n.type === 'LOOP').length;
  return decisionNodes + 1;
}

interface ComplexityScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function ComplexityScoreBadge({ score, size = 'sm' }: ComplexityScoreBadgeProps) {
  let level: 'clean' | 'complex' | 'spaghetti';
  if (score <= 5) {
    level = 'clean';
  } else if (score <= 15) {
    level = 'complex';
  } else {
    level = 'spaghetti';
  }
  
  const colorClasses = {
    clean: 'bg-green-500/20 text-green-400 border-green-500/50',
    complex: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    spaghetti: 'bg-red-500/20 text-red-400 border-red-500/50'
  };
  
  const labels = {
    clean: 'Clean',
    complex: 'Complex',
    spaghetti: 'Spaghetti'
  };
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1'
  };
  
  return (
    <Badge 
      variant="outline" 
      className={`${colorClasses[level]} ${sizeClasses[size]} gap-1 font-mono`}
      data-testid="badge-complexity-score"
    >
      <Activity className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{score}</span>
      <span className="font-sans">• {labels[level]}</span>
    </Badge>
  );
}
