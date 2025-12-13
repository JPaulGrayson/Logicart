import React from 'react';
import { cn } from '@/lib/utils';

interface FibonacciVisualizerProps {
  sequence: number[];
  currentIndex: number | null;
  memoizedIndices: number[];
  computingN: number | null;
  callStack: number[];
  className?: string;
}

export function FibonacciVisualizer({
  sequence,
  currentIndex,
  memoizedIndices,
  computingN,
  callStack,
  className
}: FibonacciVisualizerProps) {
  const maxValue = Math.max(...sequence, 1);
  
  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-card rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Fibonacci Sequence
        </div>
        {computingN !== null && (
          <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-full">
            <span className="text-xs text-muted-foreground">Computing:</span>
            <span className="font-mono font-bold text-yellow-400">F({computingN})</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-center gap-1 h-20">
        {sequence.map((value, index) => {
          const heightPercent = Math.max((value / maxValue) * 100, 10);
          const isCurrent = currentIndex === index;
          const isMemoized = memoizedIndices.includes(index);
          
          return (
            <div
              key={index}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "w-6 rounded-t transition-all duration-200",
                  isCurrent && "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
                  isMemoized && !isCurrent && "bg-emerald-500",
                  !isCurrent && !isMemoized && "bg-primary/60"
                )}
                style={{ height: `${heightPercent}%` }}
                data-testid={`fib-bar-${index}`}
              />
              <div className="text-[9px] text-muted-foreground font-mono">{value}</div>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Index:</span>
        <div className="flex gap-1">
          {sequence.map((_, index) => (
            <div 
              key={index}
              className={cn(
                "w-6 text-center font-mono",
                currentIndex === index && "text-yellow-400 font-bold",
                memoizedIndices.includes(index) && currentIndex !== index && "text-emerald-400"
              )}
            >
              {index}
            </div>
          ))}
        </div>
      </div>
      
      {callStack.length > 0 && (
        <div className="border-t border-border pt-2">
          <div className="text-[10px] text-muted-foreground mb-1">Call Stack:</div>
          <div className="flex flex-wrap gap-1">
            {callStack.map((n, i) => (
              <div
                key={i}
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-mono",
                  i === callStack.length - 1 ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground"
                )}
              >
                F({n})
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Memoized</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Computing</span>
        </div>
      </div>
    </div>
  );
}
