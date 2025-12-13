import React from 'react';
import { cn } from '@/lib/utils';

interface CalculatorVisualizerProps {
  expression: string;
  num1: string;
  num2: string;
  operator: string;
  result: string | number;
  currentStep: 'parse' | 'calculate' | 'result' | null;
  className?: string;
}

export function CalculatorVisualizer({
  expression,
  num1,
  num2,
  operator,
  result,
  currentStep,
  className
}: CalculatorVisualizerProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-card rounded-lg border border-border", className)}>
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">Expression</div>
        <div 
          className={cn(
            "font-mono text-xl p-3 bg-muted rounded-lg border-2 transition-all",
            currentStep === 'parse' ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "border-transparent"
          )}
          data-testid="calculator-expression"
        >
          {expression || '...'}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2">
        <div 
          className={cn(
            "flex-1 text-center p-2 rounded-lg border-2 transition-all",
            currentStep === 'parse' ? "border-blue-500 bg-blue-500/10" : "border-border bg-muted/50"
          )}
          data-testid="calculator-num1"
        >
          <div className="text-[10px] text-muted-foreground">num1</div>
          <div className="font-mono text-lg">{num1 || '-'}</div>
        </div>
        
        <div 
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-lg transition-all",
            currentStep === 'parse' ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-border bg-muted/50"
          )}
          data-testid="calculator-operator"
        >
          {operator || '?'}
        </div>
        
        <div 
          className={cn(
            "flex-1 text-center p-2 rounded-lg border-2 transition-all",
            currentStep === 'parse' ? "border-blue-500 bg-blue-500/10" : "border-border bg-muted/50"
          )}
          data-testid="calculator-num2"
        >
          <div className="text-[10px] text-muted-foreground">num2</div>
          <div className="font-mono text-lg">{num2 || '-'}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="w-8 h-0.5 bg-muted-foreground/30" />
        <div className="mx-2 text-muted-foreground">=</div>
        <div className="w-8 h-0.5 bg-muted-foreground/30" />
      </div>
      
      <div 
        className={cn(
          "text-center p-3 rounded-lg border-2 transition-all",
          currentStep === 'result' ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "border-border bg-muted/50"
        )}
        data-testid="calculator-result"
      >
        <div className="text-[10px] text-muted-foreground">Result</div>
        <div className={cn(
          "font-mono text-2xl font-bold",
          currentStep === 'result' ? "text-emerald-400" : ""
        )}>
          {result !== '' ? result : '?'}
        </div>
      </div>
    </div>
  );
}
