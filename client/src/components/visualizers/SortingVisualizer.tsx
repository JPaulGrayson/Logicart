import React from 'react';
import { cn } from '@/lib/utils';

interface SortingVisualizerProps {
  array: number[];
  activeIndices?: number[];
  sortedIndices?: number[];
  swapIndices?: number[];
  pivotIndex?: number;
  className?: string;
}

export function SortingVisualizer({
  array,
  activeIndices = [],
  sortedIndices = [],
  swapIndices = [],
  pivotIndex,
  className
}: SortingVisualizerProps) {
  const maxValue = Math.max(...array, 1);
  
  const getBarColor = (index: number) => {
    if (sortedIndices.includes(index)) {
      return 'bg-emerald-500';
    }
    if (swapIndices.includes(index)) {
      return 'bg-red-500';
    }
    if (index === pivotIndex) {
      return 'bg-purple-500';
    }
    if (activeIndices.includes(index)) {
      return 'bg-yellow-500';
    }
    return 'bg-primary';
  };

  const maxBarHeight = 120;
  
  return (
    <div className={cn("flex items-end justify-center gap-1 w-full p-4 bg-card rounded-lg border border-border", className)} style={{ height: `${maxBarHeight + 40}px` }}>
      {array.map((value, index) => {
        const barHeight = Math.max((value / maxValue) * maxBarHeight, 8);
        return (
          <div
            key={index}
            id={`bar-${index}`}
            className={cn(
              "logigo-highlight-target flex-1 max-w-12 rounded-t transition-all duration-200 relative group",
              getBarColor(index)
            )}
            style={{ height: `${barHeight}px` }}
            data-testid={`bar-${index}`}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
